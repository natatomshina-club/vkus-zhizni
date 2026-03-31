import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => ({}))
  const admin = createServiceClient()

  const updates: Record<string, unknown> = {}
  for (const f of ['title', 'description', 'emoji', 'sort_order', 'is_visible', 'audio_url', 'duration_seconds']) {
    if (f in body) updates[f] = body[f]
  }

  const { data, error: upErr } = await admin
    .from('meditations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  return NextResponse.json({ meditation: data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const admin = createServiceClient()
  const { error: delErr } = await admin.from('meditations').delete().eq('id', id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
