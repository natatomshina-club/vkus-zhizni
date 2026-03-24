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

// GET — list all announcements (admin)
export async function GET() {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const admin = createServiceClient()
  const { data } = await admin
    .from('announcements')
    .select('id, text, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ announcements: data ?? [] })
}

// POST — create new announcement (deactivates old ones)
export async function POST(req: Request) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => null)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  if (!text) return NextResponse.json({ error: 'text обязателен' }, { status: 400 })
  if (text.length > 2000) return NextResponse.json({ error: 'max 2000 символов' }, { status: 400 })

  const admin = createServiceClient()

  // Deactivate previous if replacing
  if (body?.replace_previous) {
    await admin.from('announcements').update({ is_active: false }).eq('is_active', true)
  }

  const { data, error: insErr } = await admin
    .from('announcements')
    .insert({ text, is_active: true })
    .select('id, text, is_active, created_at')
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  return NextResponse.json({ announcement: data }, { status: 201 })
}

// DELETE — remove announcement by id (?id=...)
export async function DELETE(req: Request) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })

  const admin = createServiceClient()
  const { error: delErr } = await admin.from('announcements').delete().eq('id', id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// PATCH — toggle is_active
export async function PATCH(req: Request) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : null
  if (!id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })

  const admin = createServiceClient()
  const { data, error: upErr } = await admin
    .from('announcements')
    .update({ is_active: body.is_active })
    .eq('id', id)
    .select('id, is_active')
    .single()

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  return NextResponse.json({ announcement: data })
}
