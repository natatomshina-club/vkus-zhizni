import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
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

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const title = (formData.get('title') as string | null)?.trim() ?? ''

  if (!file) return NextResponse.json({ error: 'Файл обязателен' }, { status: 400 })
  if (!title) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 })

  const admin = createServiceClient()
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const storagePath = `${webinarId}/general/${fileName}`

  const bytes = await file.arrayBuffer()
  const { error: uploadErr } = await admin.storage
    .from('webinar-materials')
    .upload(storagePath, bytes, { contentType: file.type, upsert: false })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('webinar-materials').getPublicUrl(storagePath)

  const { data: material, error: insErr } = await admin
    .from('webinar_materials')
    .insert({
      webinar_id: webinarId,
      lesson_id: null,
      type: 'pdf',
      title,
      url: publicUrl,
      sort_order: 0,
    })
    .select()
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  return NextResponse.json({ material }, { status: 201 })
}
