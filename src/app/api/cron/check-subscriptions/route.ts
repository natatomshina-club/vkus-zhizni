import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()

  // Find members whose subscription has expired but status not yet updated
  const { data: expired, error } = await admin
    .from('members')
    .select('id, email, full_name, name')
    .lt('subscription_ends_at', new Date().toISOString())
    .in('subscription_status', ['active', 'trial'])

  if (error) {
    console.error('[check-subscriptions] DB error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!expired || expired.length === 0) {
    return NextResponse.json({ ok: true, expired: 0 })
  }

  const ids = expired.map(m => m.id)

  // Mark all as expired in one query
  await admin
    .from('members')
    .update({ subscription_status: 'expired' })
    .in('id', ids)

  // TODO: заменить на нормальную churn-серию писем, когда будет готова.
  // Пока email-отправка отключена — только помечаем статус.
  // При включении добавить флаг expired_notified_at чтобы не спамить повторно.

  return NextResponse.json({ ok: true, expired: ids.length, emailed: 0 })
}
