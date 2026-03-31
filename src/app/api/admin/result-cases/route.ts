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

export async function GET() {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const admin = createServiceClient()
  const { data, error: dbErr } = await admin
    .from('result_cases')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ cases: data ?? [] })
}

export async function POST(req: Request) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => null)
  if (!body?.name) return NextResponse.json({ error: 'name обязателен' }, { status: 400 })

  const admin = createServiceClient()
  const { data, error: dbErr } = await admin
    .from('result_cases')
    .insert({
      name: body.name,
      tag_badge: body.tag_badge ?? null,
      kg: body.kg ?? null,
      kg_color: body.kg_color ?? '#2E7D50',
      kg_period: body.kg_period ?? null,
      stripe: body.stripe ?? '#4CAF78',
      before_text: body.before_text ?? null,
      after_text: body.after_text ?? null,
      quote: body.quote ?? null,
      extras: body.extras ?? [],
      tags: body.tags ?? [],
      video_url: body.video_url ?? null,
      is_published: body.is_published ?? false,
      featured: body.featured ?? false,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ case: data })
}
