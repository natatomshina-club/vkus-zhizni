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

export async function GET() {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const admin = createServiceClient()
  const { data, error: dbErr } = await admin
    .from('results_stories')
    .select('id, slug, name, tag_label, published, order_index, created_at')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ stories: data ?? [] })
}

export async function POST(req: Request) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => null)
  if (!body?.name?.trim() || !body?.slug?.trim()) {
    return NextResponse.json({ error: 'name и slug обязательны' }, { status: 400 })
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(body.slug)) {
    return NextResponse.json({ error: 'Неверный формат slug: только строчные латинские буквы, цифры, дефисы' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { data, error: dbErr } = await admin
    .from('results_stories')
    .insert({
      slug: body.slug,
      name: body.name,
      age: body.age ? Number(body.age) : null,
      age_label: body.age_label || null,
      tag_label: body.tag_label || null,
      tag_filter: Array.isArray(body.tag_filter) ? body.tag_filter : [],
      before_kg: body.before_kg ? Number(body.before_kg) : null,
      after_kg: body.after_kg ? Number(body.after_kg) : null,
      metric_main: body.metric_main || null,
      metric_label: body.metric_label || null,
      summary_quote: body.summary_quote || null,
      check_items: Array.isArray(body.check_items) ? body.check_items : [],
      content_html: body.content_html || null,
      content_source: body.content_source || null,
      seo_title: body.seo_title || null,
      seo_description: body.seo_description || null,
      order_index: Number(body.order_index) || 0,
      published: body.published ?? false,
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ story: data })
}
