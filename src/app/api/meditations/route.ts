import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()

  const { data: courses, error } = await admin
    .from('meditation_courses')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!courses || courses.length === 0) return NextResponse.json({ courses: [] })

  const courseIds = courses.map(c => c.id)

  const { data: meditations } = await admin
    .from('meditations')
    .select('id, course_id, title, description, duration_seconds, audio_url, emoji, sort_order, is_visible, play_count')
    .in('course_id', courseIds)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })

  const medsMap: Record<string, unknown[]> = {}
  for (const m of (meditations ?? [])) {
    const med = m as { course_id: string }
    if (!medsMap[med.course_id]) medsMap[med.course_id] = []
    medsMap[med.course_id].push(m)
  }

  const result = courses.map(c => ({
    ...c,
    meditations: medsMap[c.id] ?? [],
  }))

  return NextResponse.json({ courses: result })
}
