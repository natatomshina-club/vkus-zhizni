import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

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
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id: webinarId } = await params
  const admin = createServiceClient()

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Файл обязателен' }, { status: 400 })
  if (!file.name.endsWith('.html')) return NextResponse.json({ error: 'Только .html файлы' }, { status: 400 })

  const storagePath = `${webinarId}/presentation.html`
  const bytes = await file.arrayBuffer()

  const { error: uploadErr } = await admin.storage
    .from('webinar-materials')
    .upload(storagePath, bytes, { contentType: 'text/html; charset=utf-8', upsert: true })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('webinar-materials').getPublicUrl(storagePath)

  const { error: updateErr } = await admin
    .from('webinars')
    .update({ html_url: publicUrl })
    .eq('id', webinarId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ html_url: publicUrl })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id: webinarId } = await params
  const admin = createServiceClient()

  await admin.storage.from('webinar-materials').remove([`${webinarId}/presentation.html`])

  const { error: updateErr } = await admin
    .from('webinars')
    .update({ html_url: null })
    .eq('id', webinarId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
