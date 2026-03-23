import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { extractKinescopeId } from '@/lib/kinescope'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id } = await params
  const admin = createServiceClient()

  const [lessonsRes, materialsRes] = await Promise.all([
    admin.from('webinar_lessons').select('*').eq('webinar_id', id).order('sort_order', { ascending: true }),
    admin.from('webinar_materials').select('*').eq('webinar_id', id).order('sort_order', { ascending: true }),
  ])

  const lessons = (lessonsRes.data ?? []).map(lesson => ({
    ...lesson,
    materials: (materialsRes.data ?? []).filter(m => m.lesson_id === lesson.id),
  }))

  const generalMaterials = (materialsRes.data ?? []).filter(m => m.lesson_id === null)

  return NextResponse.json({ lessons, general_materials: generalMaterials })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id: webinarId } = await params
  const body = await req.json().catch(() => null)
  if (!body || !body.title?.trim()) {
    return NextResponse.json({ error: 'Название обязательно' }, { status: 400 })
  }

  const videoId = body.video_url ? extractKinescopeId(body.video_url) : null

  const admin = createServiceClient()
  const { data, error: insErr } = await admin
    .from('webinar_lessons')
    .insert({
      webinar_id: webinarId,
      title: body.title.trim(),
      video_id: videoId,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  return NextResponse.json({ lesson: { ...data, materials: [] } }, { status: 201 })
}
