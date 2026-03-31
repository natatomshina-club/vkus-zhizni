import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  let formData: FormData | null = null
  try {
    formData = await req.formData()
  } catch (err) {
    console.error('[meditation upload] formData parse error:', err)
    return NextResponse.json({ error: `Не удалось прочитать файл: ${err instanceof Error ? err.message : String(err)}` }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Файл не передан' }, { status: 400 })

  console.log('[meditation upload] file:', file.name, file.type, file.size, 'bytes')

  const admin = createServiceClient()

  // Get meditation to find course_id
  const { data: meditation, error: medErr } = await admin
    .from('meditations')
    .select('course_id')
    .eq('id', id)
    .single()

  if (medErr || !meditation) {
    console.error('[meditation upload] meditation not found:', id, medErr)
    return NextResponse.json({ error: 'Медитация не найдена' }, { status: 404 })
  }

  const lowerName = file.name.toLowerCase()
  const ext = lowerName.endsWith('.m4a') ? 'm4a' : 'mp3'
  const mimeType = ext === 'm4a' ? 'audio/mp4' : 'audio/mpeg'
  const filePath = `${meditation.course_id}/${id}.${ext}`

  console.log('[meditation upload] uploading to bucket meditations:', filePath, mimeType)

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadErr } = await admin.storage
    .from('meditations')
    .upload(filePath, buffer, { contentType: mimeType, upsert: true })

  if (uploadErr) {
    console.error('[meditation upload] storage error:', JSON.stringify(uploadErr))
    return NextResponse.json({
      error: `Storage: ${uploadErr.message}${uploadErr.cause ? ` (${String(uploadErr.cause)})` : ''}`,
    }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('meditations').getPublicUrl(filePath)

  const { error: updateErr } = await admin
    .from('meditations')
    .update({ audio_url: publicUrl })
    .eq('id', id)

  if (updateErr) {
    console.error('[meditation upload] DB update error:', updateErr)
    // File uploaded OK — return URL even if DB update failed
    return NextResponse.json({ url: publicUrl, warning: 'Файл загружен, но ошибка при сохранении URL: ' + updateErr.message })
  }

  console.log('[meditation upload] success:', publicUrl)
  return NextResponse.json({ url: publicUrl })
}
