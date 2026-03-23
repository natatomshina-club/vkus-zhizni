import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const admin = createServiceClient()

  // Get webinar
  const { data: webinar } = await admin
    .from('webinars')
    .select('id')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!webinar) return NextResponse.json({ error: 'Не найден' }, { status: 404 })

  // Check access
  const { data: access } = await admin
    .from('webinar_access')
    .select('id')
    .eq('member_id', user.id)
    .eq('webinar_id', webinar.id)
    .maybeSingle()

  if (!access) return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })

  const [lessonsRes, materialsRes] = await Promise.all([
    admin
      .from('webinar_lessons')
      .select('id,webinar_id,title,video_id,sort_order')
      .eq('webinar_id', webinar.id)
      .order('sort_order', { ascending: true }),
    admin
      .from('webinar_materials')
      .select('id,webinar_id,lesson_id,type,title,url,content,sort_order')
      .eq('webinar_id', webinar.id)
      .order('sort_order', { ascending: true }),
  ])

  return NextResponse.json({
    lessons: lessonsRes.data ?? [],
    materials: materialsRes.data ?? [],
  })
}
