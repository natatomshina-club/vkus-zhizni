import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return null
  return user
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const falKey = process.env.FAL_KEY
  if (!falKey) return NextResponse.json({ error: 'FAL_KEY не настроен' }, { status: 500 })

  const body = await request.json() as { prompt_en?: string; position?: string; slug?: string; alt?: string }
  if (!body.prompt_en || !body.position || !body.slug) {
    return NextResponse.json({ error: 'prompt_en, position, slug обязательны' }, { status: 400 })
  }

  // Generate via fal.ai
  const falRes = await fetch('https://fal.run/fal-ai/nano-banana-2', {
    method: 'POST',
    headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: body.prompt_en,
      image_size: body.position === 'cover' ? 'square_hd' : 'landscape_16_9',
      num_images: 1,
    }),
  })

  if (!falRes.ok) {
    const text = await falRes.text()
    console.error('[generate-image] fal.ai error:', falRes.status, text)
    return NextResponse.json({ error: `fal.ai ошибка: ${falRes.status}` }, { status: 500 })
  }

  const falData = await falRes.json() as { images?: Array<{ url: string }> }
  const imageUrl = falData.images?.[0]?.url
  if (!imageUrl) return NextResponse.json({ error: 'fal.ai не вернул изображение' }, { status: 500 })

  // Download and re-upload to Supabase Storage
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) return NextResponse.json({ error: 'Не удалось скачать изображение' }, { status: 500 })
  const imgBuffer = await imgRes.arrayBuffer()

  const supabase = createServiceClient()
  // Add timestamp to path so the URL changes (cache busting)
  const ts = Date.now()
  const storagePath = `blog/${body.slug}/${body.position}-${ts}.jpg`
  const { error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(storagePath, imgBuffer, { contentType: 'image/jpeg', upsert: false })

  if (uploadError) {
    console.error('[generate-image] Storage upload error:', uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: publicUrlData } = supabase.storage.from('blog-images').getPublicUrl(storagePath)
  return NextResponse.json({ url: publicUrlData.publicUrl })
}
