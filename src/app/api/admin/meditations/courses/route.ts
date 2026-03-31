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
  const { data: courses, error: dbErr } = await admin
    .from('meditation_courses')
    .select('*')
    .order('sort_order', { ascending: true })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  // Count meditations per course
  const courseIds = (courses ?? []).map(c => c.id)
  const { data: counts } = courseIds.length
    ? await admin.from('meditations').select('course_id').in('course_id', courseIds)
    : { data: [] }

  const countMap: Record<string, number> = {}
  for (const m of (counts ?? [])) {
    const med = m as { course_id: string }
    countMap[med.course_id] = (countMap[med.course_id] ?? 0) + 1
  }

  const result = (courses ?? []).map(c => ({ ...c, meditation_count: countMap[c.id] ?? 0 }))
  return NextResponse.json({ courses: result })
}

export async function POST(req: Request) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => ({}))
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const slug = typeof body?.slug === 'string' ? body.slug.trim() : ''
  if (!title) return NextResponse.json({ error: 'title обязателен' }, { status: 400 })

  const admin = createServiceClient()
  const { data, error: insErr } = await admin
    .from('meditation_courses')
    .insert({
      slug: slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `course-${Date.now()}`,
      title,
      description: body.description ?? null,
      emoji: body.emoji ?? '🧘',
      gradient_from: body.gradient_from ?? '#7C5CFC',
      gradient_to: body.gradient_to ?? '#9B7CFF',
      sort_order: body.sort_order ?? 0,
      is_visible: body.is_visible ?? true,
    })
    .select()
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  return NextResponse.json({ course: data }, { status: 201 })
}
