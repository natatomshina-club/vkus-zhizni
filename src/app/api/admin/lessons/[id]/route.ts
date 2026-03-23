import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { extractKinescopeId } from '@/lib/kinescope'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order
  if (body.video_url !== undefined) {
    updates.video_id = body.video_url ? extractKinescopeId(body.video_url) : null
  }

  const admin = createServiceClient()
  const { data, error: upErr } = await admin
    .from('webinar_lessons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  return NextResponse.json({ lesson: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id } = await params
  const admin = createServiceClient()

  // Materials will cascade-delete if FK is set; otherwise delete manually
  await admin.from('webinar_materials').delete().eq('lesson_id', id)
  const { error: delErr } = await admin.from('webinar_lessons').delete().eq('id', id)

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
