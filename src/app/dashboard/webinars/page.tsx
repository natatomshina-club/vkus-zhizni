import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getMonthsInClub, getStatusLabel, getWebinarQuota, getWebinarState } from '@/lib/webinars'
import type { WebinarRow, WebinarAccess, WebinarSelection } from '@/types/webinars'
import WebinarsClient from './WebinarsClient'

const THRESHOLDS = [3, 6, 9, 12]

const STATUS_NOTIFY_TEXT: Record<number, (label: string, quota: number) => string> = {
  3: (label, q) =>
    `🎉 Поздравляю! Ты достигла статуса "${label}"!\nТебе теперь доступны вебинары бесплатно. Заходи в раздел «Вебинары», выбирай ${q} любых — и я открою тебе доступ 💚`,
  6: (label, q) =>
    `🎉 Поздравляю! Ты достигла статуса "${label}"!\nТебе теперь доступны вебинары бесплатно. Заходи в раздел «Вебинары», выбирай ${q} любых — и я открою тебе доступ 💚`,
  9: (label, q) =>
    `🎉 Поздравляю! Ты достигла статуса "${label}"!\nТебе теперь доступны вебинары бесплатно. Заходи в раздел «Вебинары», выбирай ${q} любых — и я открою тебе доступ 💚`,
  12: () =>
    `💎 Поздравляю! Ты достигла статуса "Бриллиант"!\nТебе доступны все вебинары и курсы бесплатно. Заходи выбирай — доступ откроется автоматически 🎉`,
}

export default async function WebinarsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const admin = createServiceClient()

  const [webinarsRes, memberRes, accessRes, selectionsRes] = await Promise.all([
    admin
      .from('webinars')
      .select('id,slug,title,short_desc,full_desc,price,emoji,color_from,color_to,video_id,sort_order,is_published,content_type,created_at')
      .eq('is_published', true)
      .order('sort_order', { ascending: true }),
    admin
      .from('members')
      .select('created_at, last_status_notified_months')
      .eq('id', user.id)
      .single(),
    admin
      .from('webinar_access')
      .select('id,member_id,webinar_id,granted_by,granted_at')
      .eq('member_id', user.id),
    admin
      .from('webinar_selections')
      .select('id,member_id,webinar_id,status,selected_at')
      .eq('member_id', user.id),
  ])

  const webinars = (webinarsRes.data ?? []) as WebinarRow[]
  const member = memberRes.data
  const createdAt = member?.created_at ?? new Date().toISOString()
  const access = (accessRes.data ?? []) as WebinarAccess[]
  const selections = (selectionsRes.data ?? []) as WebinarSelection[]

  const months = getMonthsInClub(createdAt)
  const quota = getWebinarQuota(months)
  const quotaUsed = selections.filter(s => s.status === 'pending' || s.status === 'granted').length
  const quotaLeft = quota === Infinity ? Infinity : Math.max(0, quota - quotaUsed)

  const webinarsWithState = webinars.map(w => ({
    ...w,
    state: getWebinarState(w, months, access, selections),
  }))

  // ── Status-up notification ─────────────────────────────────────────────────
  const lastNotified = member?.last_status_notified_months ?? 0
  const crossedThreshold = THRESHOLDS.filter(t => months >= t && lastNotified < t).pop()

  if (crossedThreshold !== undefined) {
    const label = getStatusLabel(months).replace(/^[^ ]+ /, '') // strip emoji for text
    const labelFull = getStatusLabel(months)
    const notifyQuota = getWebinarQuota(crossedThreshold)
    const text = STATUS_NOTIFY_TEXT[crossedThreshold]?.(labelFull, notifyQuota === Infinity ? 0 : notifyQuota) ?? ''

    // Find admin id
    const { data: adminMember } = await admin
      .from('members')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (adminMember && text) {
      await Promise.all([
        admin.from('private_messages').insert({
          member_id: user.id,
          text,
          from_admin: true,
          is_read: false,
        }),
        admin.from('members').update({ last_status_notified_months: months }).eq('id', user.id),
      ])
    }
  }

  return (
    <WebinarsClient
      webinars={webinarsWithState}
      quotaTotal={quota === Infinity ? null : quota}
      quotaUsed={quotaUsed}
      quotaLeft={quotaLeft === Infinity ? null : quotaLeft}
      monthsInClub={months}
      statusLabel={getStatusLabel(months)}
    />
  )
}
