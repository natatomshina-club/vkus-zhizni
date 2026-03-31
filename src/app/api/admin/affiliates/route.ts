import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createServiceClient()
  const { data: member } = await admin.from('members').select('role').eq('email', user.email).single()
  return member?.role === 'admin' ? admin : null
}

export async function GET() {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [affiliatesRes, clicksRes, membersRes] = await Promise.all([
    admin
      .from('affiliates')
      .select('id, name, email, ref_code, status, total_earned, total_paid, created_at, promo_text, payment_details')
      .order('created_at', { ascending: false }),
    admin
      .from('affiliate_clicks')
      .select('affiliate_id, id'),
    admin
      .from('members')
      .select('referred_by')
      .not('referred_by', 'is', null),
  ])

  const affiliates = affiliatesRes.data ?? []
  const clicks = clicksRes.data ?? []
  const members = membersRes.data ?? []

  // Aggregate per affiliate
  const clickCount: Record<string, number> = {}
  const memberCount: Record<string, number> = {}
  clicks.forEach(c => { clickCount[c.affiliate_id] = (clickCount[c.affiliate_id] ?? 0) + 1 })
  members.forEach(m => { if (m.referred_by) memberCount[m.referred_by] = (memberCount[m.referred_by] ?? 0) + 1 })

  const result = affiliates.map(a => ({
    ...a,
    clicks: clickCount[a.id] ?? 0,
    members: memberCount[a.id] ?? 0,
  }))

  return NextResponse.json({ affiliates: result })
}
