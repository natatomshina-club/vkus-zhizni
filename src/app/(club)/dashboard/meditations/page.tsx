import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import MeditationsClient from './MeditationsClient'

export default async function MeditationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const admin = createServiceClient()

  const { data: courses } = await admin
    .from('meditation_courses')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })

  const courseIds = (courses ?? []).map(c => c.id)

  const { data: meditations } = courseIds.length
    ? await admin
        .from('meditations')
        .select('id, course_id, title, description, duration_seconds, audio_url, emoji, sort_order, is_visible, play_count')
        .in('course_id', courseIds)
        .eq('is_visible', true)
        .order('sort_order', { ascending: true })
    : { data: [] }

  // Load user's progress for all meditations
  const medIds = (meditations ?? []).map(m => m.id)
  const { data: progress } = medIds.length
    ? await admin
        .from('meditation_progress')
        .select('meditation_id, last_position_seconds, completed')
        .eq('member_id', user.id)
        .in('meditation_id', medIds)
    : { data: [] }

  const medsMap: Record<string, unknown[]> = {}
  for (const m of (meditations ?? [])) {
    const med = m as { course_id: string }
    if (!medsMap[med.course_id]) medsMap[med.course_id] = []
    medsMap[med.course_id].push(m)
  }

  const coursesWithMeds = (courses ?? []).map(c => ({
    ...c,
    meditations: medsMap[c.id] ?? [],
  }))

  const progressMap: Record<string, { last_position_seconds: number; completed: boolean }> = {}
  for (const p of (progress ?? [])) {
    const pr = p as { meditation_id: string; last_position_seconds: number; completed: boolean }
    progressMap[pr.meditation_id] = {
      last_position_seconds: pr.last_position_seconds ?? 0,
      completed: pr.completed ?? false,
    }
  }

  return (
    <MeditationsClient
      courses={coursesWithMeds}
      initialProgress={progressMap}
    />
  )
}
