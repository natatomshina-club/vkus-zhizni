import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { extractKinescopeId } from '@/lib/kinescope'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, status: 401 as const, msg: 'Unauthorized' }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { ok: false, status: 403 as const, msg: 'Forbidden' }
  return { ok: true, status: 200 as const, msg: '' }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.msg }, { status: auth.status })

  const { id: course_id } = await params
  const body = await req.json() as {
    title?: string
    lesson_type?: string
    video_url?: string
    text_content?: string
    sort_order?: number
  }

  const title = body.title?.trim()
  const lesson_type = body.lesson_type === 'text' ? 'text' : 'video'
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const admin = createServiceClient()

  // Auto sort_order: max existing + 1
  const { data: existing } = await admin
    .from('intro_lessons').select('sort_order').eq('course_id', course_id).order('sort_order', { ascending: false }).limit(1)
  const nextOrder = body.sort_order ?? ((existing?.[0]?.sort_order ?? 0) + 1)

  const insert: Record<string, unknown> = {
    course_id,
    title,
    lesson_type,
    sort_order: nextOrder,
    is_visible: true,
  }

  if (lesson_type === 'video' && body.video_url) {
    const vid = extractKinescopeId(body.video_url)
    insert.video_url = vid ? `https://kinescope.io/${vid}` : body.video_url
  }
  if (lesson_type === 'text' && body.text_content) {
    insert.text_content = body.text_content.trim()
  }

  const { data, error } = await admin
    .from('intro_lessons')
    .insert(insert)
    .select('id, course_id, sort_order, title, lesson_type, video_url, bonus_video_url, text_content, is_visible')
    .single()

  if (error) {
    console.error('[intro-courses/lessons POST]', JSON.stringify(error))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ lesson: { ...data, intro_lesson_materials: [] } })
}
