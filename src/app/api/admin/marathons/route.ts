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

export async function GET(req: Request) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status') ?? 'all'

  const admin = createServiceClient()
  let query = admin.from('marathons').select('*').order('starts_at', { ascending: false })
  if (statusFilter !== 'all') query = query.eq('status', statusFilter)

  const { data, error: dbErr } = await query
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ marathons: data ?? [] })
}

export async function POST(req: Request) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  if (!title) return NextResponse.json({ error: 'title обязателен' }, { status: 400 })

  const slug = title.toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    + '-' + Date.now()

  const admin = createServiceClient()
  const { data, error: insErr } = await admin
    .from('marathons')
    .insert({
      title,
      slug,
      description: body?.description ?? null,
      starts_at: body?.starts_at ?? null,
      ends_at: body?.ends_at ?? null,
      duration_days: body?.duration_days ?? 10,
      status: body?.status ?? 'planned',
      next_date: body?.next_date ?? null,
      month_label: body?.month_label ?? null,
      chat_channel_slug: body?.chat_channel_slug ?? null,
      emoji: body?.emoji ?? '🔥',
      announce_title: body?.announce_title ?? null,
      announce_features: body?.announce_features ?? null,
      announce_prepare_text: body?.announce_prepare_text ?? null,
      shopping_list: body?.shopping_list ?? null,
      is_active: body?.status === 'active',
    })
    .select()
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  return NextResponse.json({ marathon: data }, { status: 201 })
}
