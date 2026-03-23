import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function GET() {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const admin = createServiceClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [total, trial, active, cancelled, blocked, newToday, newWeek] = await Promise.all([
    admin.from('members').select('id', { count: 'exact', head: true }),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('subscription_status', 'trial'),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('subscription_status', 'cancelled'),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('subscription_status', 'blocked'),
    admin.from('members').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
    admin.from('members').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
  ])

  return NextResponse.json({
    total: total.count ?? 0,
    trial: trial.count ?? 0,
    active: active.count ?? 0,
    cancelled: cancelled.count ?? 0,
    blocked: blocked.count ?? 0,
    new_today: newToday.count ?? 0,
    new_week: newWeek.count ?? 0,
  })
}
