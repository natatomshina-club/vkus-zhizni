import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const admin = createServiceClient()
  const { data: member } = await admin.from('members').select('role').eq('email', user.email!).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id } = await params
  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const file = formData.get('file') as File | null
  const type = formData.get('type') as string | null // 'before' | 'after'

  if (!file || !type || !['before', 'after'].includes(type)) {
    return NextResponse.json({ error: 'file and type (before|after) required' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${id}/${type}.${ext}`
  const buffer = await file.arrayBuffer()

  const admin = createServiceClient()
  const { error: upErr } = await admin.storage
    .from('results-photos')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: { publicUrl: rawUrl } } = admin.storage.from('results-photos').getPublicUrl(path)
  const publicUrl = `${rawUrl}?v=${Date.now()}`

  const field = type === 'before' ? 'photo_before_url' : 'photo_after_url'
  await admin.from('results_stories').update({ [field]: publicUrl }).eq('id', id)

  return NextResponse.json({ url: publicUrl })
}
