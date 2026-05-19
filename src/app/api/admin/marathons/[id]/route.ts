import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin' && member?.role !== 'curator') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const admin = createServiceClient()
  const { data, error: dbErr } = await admin
    .from('marathons')
    .select('*')
    .eq('id', id)
    .single()

  if (dbErr || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ marathon: data })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => ({}))
  const admin = createServiceClient()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const fields = [
    'title', 'description', 'starts_at', 'ends_at', 'duration_days', 'status',
    'month_label', 'chat_channel_slug', 'ration_pdf_url', 'ration_html', 'shopping_list',
    'shopping_list_pdf_url',
    'announce_title', 'announce_features', 'announce_prepare_text', 'emoji', 'is_active', 'next_date',
  ]
  for (const f of fields) {
    if (f in body) updates[f] = body[f]
  }
  if ('status' in body) {
    updates.is_active = body.status === 'active'
  }

  const { data, error: upErr } = await admin
    .from('marathons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  return NextResponse.json({ marathon: data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const admin = createServiceClient()
  const { error: delErr } = await admin.from('marathons').delete().eq('id', id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
