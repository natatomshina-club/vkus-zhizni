import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MONTH_MS = 30 * 24 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

const THRESHOLDS: { months: number; key: string; label: string; text: string }[] = [
  {
    months: 3,
    key: 'level_3',
    label: '⭐ Вошла во вкус',
    text: '⭐ Вы достигли уровня «Вошла во вкус»! Теперь вам доступны 2 вебинара на выбор.',
  },
  {
    months: 6,
    key: 'level_6',
    label: '🔥 Уже своя',
    text: '🔥 Вы достигли уровня «Уже своя»! Теперь вам доступны 5 вебинаров на выбор.',
  },
  {
    months: 9,
    key: 'level_9',
    label: '💚 Легенда',
    text: '💚 Вы достигли уровня «Легенда»! Теперь вам доступны 7 вебинаров и курсов.',
  },
  {
    months: 12,
    key: 'level_12',
    label: '💎 Бриллиант',
    text: '💎 Поздравляем! Вы достигли уровня «Бриллиант»! Все вебинары и курсы теперь ваши 🎉',
  },
]

export async function GET(req: Request) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()

  // Load all active members with subscription start date
  const { data: members, error } = await admin
    .from('members')
    .select('id, created_at, subscription_started_at, subscription_plan')
    .in('subscription_status', ['trial', 'active'])

  if (error || !members) {
    return NextResponse.json({ error: error?.message ?? 'no data' }, { status: 500 })
  }

  let notified = 0
  const nowMs = Date.now()

  for (const member of members) {
    const startDate = member.subscription_started_at ?? member.created_at
    const startMs = new Date(startDate).getTime()
    const bonus = (member.subscription_plan === 'halfyear' || member.subscription_plan === 'Полгода') ? 6 : 0

    const currentMonths = Math.floor((nowMs - startMs) / MONTH_MS) + bonus
    const yesterdayMonths = Math.floor((nowMs - DAY_MS - startMs) / MONTH_MS) + bonus

    for (const threshold of THRESHOLDS) {
      if (currentMonths >= threshold.months && yesterdayMonths < threshold.months) {
        // Check deduplication
        const { data: existing } = await admin
          .from('notifications')
          .select('id')
          .eq('member_id', member.id)
          .eq('type', 'level_up')
          .eq('type_extra', threshold.key)
          .maybeSingle()

        if (!existing) {
          await admin.from('notifications').insert({
            member_id: member.id,
            type: 'level_up',
            type_extra: threshold.key,
            text: threshold.text,
            link: '/dashboard/webinars',
            is_read: false,
          })
          notified++
        }
      }
    }
  }

  return NextResponse.json({ ok: true, checked: members.length, notified })
}
