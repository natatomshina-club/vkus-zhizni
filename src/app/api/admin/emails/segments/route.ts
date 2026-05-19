import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const { data: member } = await admin.from('members').select('role').eq('email', user.email).single()
  if (member?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [trialActive, monthlyActive, halfyearActive, expiredTrial, expiredOther, cancelled] = await Promise.all([
    admin.from('members').select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'trial'),
    admin.from('members').select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'active').in('tariff', ['month', 'monthly']),
    admin.from('members').select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'active').eq('tariff', 'halfyear'),
    admin.from('members').select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'expired').in('tariff', ['trial', 'Пробный']),
    admin.from('members').select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'expired').in('tariff', ['month', 'monthly', 'halfyear']),
    admin.from('members').select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'cancelled'),
  ])

  return NextResponse.json({
    segments: [
      { value: 'trial',        label: 'Триал',            count: trialActive.count   ?? 0, icon: '🌱' },
      { value: 'monthly',      label: 'Месяц',            count: monthlyActive.count ?? 0, icon: '💜' },
      { value: 'halfyear',     label: 'Полгода',          count: halfyearActive.count ?? 0, icon: '💎' },
      { value: 'expired_trial',label: 'Бывшие триалки',   count: expiredTrial.count  ?? 0, icon: '🔄' },
      { value: 'expired',      label: 'Истёкшие',         count: expiredOther.count  ?? 0, icon: '😴' },
      { value: 'cancelled',    label: 'Заблокированные',  count: cancelled.count     ?? 0, icon: '⛔' },
    ],
  })
}
