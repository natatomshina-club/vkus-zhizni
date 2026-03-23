import { createServiceClient } from '@/lib/supabase/server'
import WebinarsAdminClient from './WebinarsAdminClient'

export default async function AdminWebinarsPage() {
  const admin = createServiceClient()

  const [webinarsRes, selectionsRes] = await Promise.all([
    admin
      .from('webinars')
      .select('id,slug,title,short_desc,full_desc,price,emoji,color_from,color_to,video_id,sort_order,is_published,content_type,created_at')
      .order('sort_order', { ascending: true }),
    admin
      .from('webinar_selections')
      .select('id,member_id,webinar_id,status,selected_at')
      .eq('status', 'pending')
      .order('selected_at', { ascending: true }),
  ])

  const webinarIds = (webinarsRes.data ?? []).map(w => w.id)
  const selMemberIds = [...new Set((selectionsRes.data ?? []).map(s => s.member_id))]
  const selWebinarIds = [...new Set((selectionsRes.data ?? []).map(s => s.webinar_id))]

  const [lessonsRes, pendingCountRes, selMembersRes, selWebinarsRes] = await Promise.all([
    webinarIds.length
      ? admin.from('webinar_lessons').select('webinar_id').in('webinar_id', webinarIds)
      : Promise.resolve({ data: [] }),
    webinarIds.length
      ? admin.from('webinar_selections').select('webinar_id').in('webinar_id', webinarIds).eq('status', 'pending')
      : Promise.resolve({ data: [] }),
    selMemberIds.length
      ? admin.from('members').select('id,full_name,email').in('id', selMemberIds)
      : Promise.resolve({ data: [] }),
    selWebinarIds.length
      ? admin.from('webinars').select('id,title,emoji').in('id', selWebinarIds)
      : Promise.resolve({ data: [] }),
  ])

  const lessonCounts: Record<string, number> = {}
  const pendingCounts: Record<string, number> = {}
  for (const l of (lessonsRes.data ?? [])) lessonCounts[l.webinar_id] = (lessonCounts[l.webinar_id] ?? 0) + 1
  for (const s of (pendingCountRes.data ?? [])) pendingCounts[s.webinar_id] = (pendingCounts[s.webinar_id] ?? 0) + 1

  const webinars = (webinarsRes.data ?? []).map(w => ({
    ...w,
    lessons_count: lessonCounts[w.id] ?? 0,
    pending_count: pendingCounts[w.id] ?? 0,
  }))

  const membersMap = Object.fromEntries((selMembersRes.data ?? []).map(m => [m.id, m]))
  const webinarsMap = Object.fromEntries((selWebinarsRes.data ?? []).map(w => [w.id, w]))

  const selections = (selectionsRes.data ?? []).map(s => ({
    ...s,
    member: membersMap[s.member_id] ?? null,
    webinar: webinarsMap[s.webinar_id] ?? null,
  }))

  return <WebinarsAdminClient initialWebinars={webinars} initialSelections={selections} />
}
