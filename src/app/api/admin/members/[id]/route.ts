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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id } = await params
  const admin = createServiceClient()

  const { data, error: dbErr } = await admin
    .from('members')
    .select('id, email, full_name, avatar_url, role, subscription_status, tariff, subscription_ends_at, is_blocked, blocked_at, blocked_reason, created_at, weight, height, age, birth_date, admin_note, is_manual_subscription')
    .eq('id', id)
    .single()

  if (dbErr) return NextResponse.json({ error: 'Участница не найдена' }, { status: 404 })
  return NextResponse.json({ member: data })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })

  const admin = createServiceClient()

  // Prevent blocking another admin
  const { data: target } = await admin.from('members').select('role').eq('id', id).single()
  if (target?.role === 'admin' && body.is_blocked === true) {
    return NextResponse.json({ error: 'Нельзя заблокировать администратора' }, { status: 403 })
  }

  const updates: Record<string, unknown> = {}

  if (body.tariff !== undefined) updates.tariff = body.tariff
  if (body.subscription_ends_at !== undefined) updates.subscription_ends_at = body.subscription_ends_at

  // Manual renewal: extend from current end date or today
  if (body.extend_days !== undefined) {
    const days = Number(body.extend_days)
    if (!isNaN(days) && days > 0) {
      const { data: cur } = await admin.from('members').select('subscription_ends_at').eq('id', id).single()
      const base = cur?.subscription_ends_at && new Date(cur.subscription_ends_at) > new Date()
        ? new Date(cur.subscription_ends_at)
        : new Date()
      base.setDate(base.getDate() + days)
      updates.subscription_ends_at = base.toISOString()
      updates.subscription_status = 'active'
      if (body.tariff !== undefined) updates.tariff = body.tariff
    }
  }

  if (body.is_blocked === true) {
    updates.is_blocked = true
    updates.subscription_status = 'blocked'
    updates.blocked_at = new Date().toISOString()
    if (body.blocked_reason !== undefined) updates.blocked_reason = body.blocked_reason
  } else if (body.is_blocked === false) {
    updates.is_blocked = false
    updates.subscription_status = 'active'
    updates.blocked_at = null
    updates.blocked_reason = null
  } else if (body.subscription_status !== undefined) {
    updates.subscription_status = body.subscription_status
  }

  const { data, error: upErr } = await admin
    .from('members')
    .update(updates)
    .eq('id', id)
    .select('id, email, full_name, subscription_status, tariff, subscription_ends_at, is_blocked, blocked_at, blocked_reason, admin_note, is_manual_subscription')
    .single()

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  return NextResponse.json({ member: data })
}
