import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getPartnerFromCookies } from '@/lib/partner-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const partner = await getPartnerFromCookies()
  if (!partner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  const [affiliateRes, clicksRes, membersRes, commissionsRes] = await Promise.all([
    supabase
      .from('affiliates')
      .select('ref_code, total_earned, payment_details')
      .eq('id', partner.affiliate_id)
      .single(),

    supabase
      .from('affiliate_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', partner.affiliate_id),

    supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', partner.affiliate_id),

    supabase
      .from('affiliate_commissions')
      .select('id, payment_amount, commission_amount, type, status, created_at, approve_after, member_id')
      .eq('affiliate_id', partner.affiliate_id)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const affiliate = affiliateRes.data
  if (!affiliate) return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })

  const rawCommissions = commissionsRes.data ?? []

  // Fetch member emails separately (no FK — can't use embedded resource)
  const memberIds = [...new Set(rawCommissions.map(c => c.member_id).filter(Boolean))]
  let emailMap: Record<string, string> = {}
  if (memberIds.length > 0) {
    const { data: memberRows } = await supabase
      .from('members')
      .select('id, email')
      .in('id', memberIds)
    for (const row of memberRows ?? []) emailMap[row.id] = row.email
  }

  const commissions = rawCommissions.map(c => ({
    ...c,
    members: c.member_id ? { email: emailMap[c.member_id] ?? null } : null,
  }))

  // Paid-out sum
  const paid = commissions
    .filter(c => c.status === 'paid')
    .reduce((s, c) => s + (c.commission_amount ?? 0), 0)

  // Approved but not yet paid (pending payout)
  const pendingPayout = commissions
    .filter(c => c.status === 'approved')
    .reduce((s, c) => s + (c.commission_amount ?? 0), 0)

  // Total payments volume
  const totalPayments = commissions
    .filter(c => c.status !== 'rejected')
    .reduce((s, c) => s + (c.payment_amount ?? 0), 0)

  return NextResponse.json({
    ref_code: affiliate.ref_code,
    payment_details: affiliate.payment_details ?? '',
    stats: {
      clicks: clicksRes.count ?? 0,
      members: membersRes.count ?? 0,
      total_payments: totalPayments,
      total_earned: affiliate.total_earned ?? 0,
      pending_payout: pendingPayout,
    },
    commissions,
  })
}
