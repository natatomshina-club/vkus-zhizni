import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, status: 401, msg: 'Unauthorized' }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { ok: false, status: 403, msg: 'Forbidden' }
  return { ok: true, status: 200, msg: '' }
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.msg }, { status: auth.status })

  const body = await req.json() as { title?: string; description?: string; slug?: string; sort_order?: number }
  const title = body.title?.trim()
  const slug = body.slug?.trim()
  if (!title || !slug) return NextResponse.json({ error: 'title and slug required' }, { status: 400 })

  const admin = createServiceClient()
  const { data: existing } = await admin.from('intro_courses').select('id').order('sort_order').limit(1000)
  const nextOrder = (existing?.length ?? 0) + 1

  const { data, error } = await admin
    .from('intro_courses')
    .insert({ title, slug, description: body.description?.trim() || null, sort_order: body.sort_order ?? nextOrder })
    .select('id, slug, title, description, sort_order')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ course: { ...data, intro_lessons: [] } })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const admin = createServiceClient()

    const { data: courses, error: cErr } = await admin
      .from('intro_courses').select('id, slug, title, description, sort_order').order('sort_order')
    if (cErr) return NextResponse.json({ error: `courses: ${cErr.message}`, courses: [] })

    const { data: lessons, error: lErr } = await admin
      .from('intro_lessons').select('id, course_id, sort_order, title, lesson_type, video_url, bonus_video_url, text_content, is_visible').order('sort_order')
    if (lErr) return NextResponse.json({ error: `lessons: ${lErr.message}`, courses: [] })

    const { data: materials, error: mErr } = await admin
      .from('intro_lesson_materials').select('id, lesson_id, title, url, sort_order').order('sort_order')
    if (mErr) return NextResponse.json({ error: `materials: ${mErr.message}`, courses: [] })

    const result = (courses ?? []).map(c => ({
      ...c,
      intro_lessons: (lessons ?? [])
        .filter(l => l.course_id === c.id)
        .map(l => ({
          ...l,
          intro_lesson_materials: (materials ?? []).filter(m => m.lesson_id === l.id),
        })),
    }))

    return NextResponse.json({ courses: result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e)
    return NextResponse.json({ error: msg, courses: [] })
  }
}
