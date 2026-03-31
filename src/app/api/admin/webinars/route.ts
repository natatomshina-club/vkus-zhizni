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

export async function GET() {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const admin = createServiceClient()

  const { data: webinars } = await admin
    .from('webinars')
    .select('id,slug,title,short_desc,full_desc,price,emoji,color_from,color_to,video_id,sort_order,is_published,content_type,created_at')
    .order('sort_order', { ascending: true })

  if (!webinars) return NextResponse.json({ webinars: [] })

  // Count lessons and pending selections per webinar
  const ids = webinars.map(w => w.id)

  const [lessonsRes, pendingRes] = await Promise.all([
    admin.from('webinar_lessons').select('webinar_id').in('webinar_id', ids),
    admin.from('webinar_selections').select('webinar_id').in('webinar_id', ids).eq('status', 'pending'),
  ])

  const lessonCounts: Record<string, number> = {}
  const pendingCounts: Record<string, number> = {}

  for (const l of lessonsRes.data ?? []) {
    lessonCounts[l.webinar_id] = (lessonCounts[l.webinar_id] ?? 0) + 1
  }
  for (const s of pendingRes.data ?? []) {
    pendingCounts[s.webinar_id] = (pendingCounts[s.webinar_id] ?? 0) + 1
  }

  const result = webinars.map(w => ({
    ...w,
    lessons_count: lessonCounts[w.id] ?? 0,
    pending_count: pendingCounts[w.id] ?? 0,
  }))

  return NextResponse.json({ webinars: result })
}

export async function POST(req: Request) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => null)
  if (!body?.title) return NextResponse.json({ error: 'title обязателен' }, { status: 400 })

  const admin = createServiceClient()

  const slug = (body.slug as string | undefined)?.trim() ||
    body.title.toLowerCase()
      .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()

  const { data, error: insErr } = await admin
    .from('webinars')
    .insert({
      slug,
      title: body.title,
      short_desc: body.short_desc ?? '',
      full_desc: body.full_desc ?? '',
      price: body.price ?? 0,
      emoji: body.emoji ?? '📹',
      color_from: body.color_from ?? '#7C5CFC',
      color_to: body.color_to ?? '#5B3FA8',
      is_published: body.is_published ?? false,
      sort_order: body.sort_order ?? 0,
      content_type: body.content_type ?? 'webinar',
    })
    .select()
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  return NextResponse.json({ webinar: { ...data, lessons_count: 0, pending_count: 0 } }, { status: 201 })
}
