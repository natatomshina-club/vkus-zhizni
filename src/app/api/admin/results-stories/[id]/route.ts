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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id } = await params
  const admin = createServiceClient()
  const { data, error: dbErr } = await admin
    .from('results_stories')
    .select('*')
    .eq('id', id)
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 404 })
  return NextResponse.json({ story: data })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  if (body.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(body.slug)) {
    return NextResponse.json({ error: 'Неверный формат slug' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { data, error: dbErr } = await admin
    .from('results_stories')
    .update({
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
    .eq('id', id)
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ story: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id } = await params
  const admin = createServiceClient()
  const { error: dbErr } = await admin
    .from('results_stories')
    .delete()
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
