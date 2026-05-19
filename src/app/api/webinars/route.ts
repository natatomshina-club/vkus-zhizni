import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getEffectiveMonths, getStatusLabel, getWebinarQuota, getWebinarState } from '@/lib/webinars'
import type { WebinarRow, WebinarAccess, WebinarSelection } from '@/types/webinars'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()

  const [webinarsRes, memberRes, accessRes, selectionsRes] = await Promise.all([
    admin
      .from('webinars')
      .select('id,slug,title,short_desc,full_desc,price,emoji,color_from,color_to,video_id,sort_order,is_published,content_type,created_at')
      .eq('is_published', true)
      .order('sort_order', { ascending: true }),
    admin
      .from('members')
      .select('created_at, subscription_started_at, subscription_plan')
      .eq('id', user.id)
      .single(),
    admin
      .from('webinar_access')
      .select('id,member_id,webinar_id,granted_by,granted_at')
      .eq('member_id', user.id),
    admin
      .from('webinar_selections')
      .select('id,member_id,webinar_id,status,is_paid,selected_at')
      .eq('member_id', user.id),
  ])

  const webinars = (webinarsRes.data ?? []) as WebinarRow[]
  const createdAt = memberRes.data?.subscription_started_at ?? memberRes.data?.created_at ?? new Date().toISOString()
  const subscription_plan = memberRes.data?.subscription_plan ?? null
  const access = (accessRes.data ?? []) as WebinarAccess[]
  const selections = (selectionsRes.data ?? []) as WebinarSelection[]

  const months = getEffectiveMonths(createdAt, subscription_plan)
  const quota = getWebinarQuota(months)
  const quotaUsed = selections.filter(s => s.status === 'granted' && s.is_paid === false).length
  const quotaLeft = quota === 999 ? 999 : Math.max(0, quota - quotaUsed)

const webinarsWithState = webinars.map(w => ({
    ...w,
    state: getWebinarState(w, months, access, selections),
  }))

  return NextResponse.json({
    webinars: webinarsWithState,
    quota_total: quota === 999 ? 'all' : quota,
    quota_used: quotaUsed,
    quota_left: quotaLeft === 999 ? 'all' : quotaLeft,
    months_in_club: months,
    status_label: getStatusLabel(months),
  })
}
