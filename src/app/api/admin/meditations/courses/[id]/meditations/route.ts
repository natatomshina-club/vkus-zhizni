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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const admin = createServiceClient()
  const { data, error: dbErr } = await admin
    .from('meditations')
    .select('*')
    .eq('course_id', id)
    .order('sort_order', { ascending: true })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ meditations: data ?? [] })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => ({}))
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  if (!title) return NextResponse.json({ error: 'title обязателен' }, { status: 400 })

  const admin = createServiceClient()
  const { data, error: insErr } = await admin
    .from('meditations')
    .insert({
      course_id: id,
      title,
      description: body.description ?? null,
      emoji: body.emoji ?? '🧘',
      sort_order: body.sort_order ?? 0,
      is_visible: body.is_visible ?? true,
      play_count: 0,
      audio_url: null,
      duration_seconds: null,
    })
    .select()
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  return NextResponse.json({ meditation: data }, { status: 201 })
}
