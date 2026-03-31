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

  const now = new Date().toISOString()

  const [readyRes, approvedRes] = await Promise.all([
    // Pending commissions where 14-day hold has passed — ready to approve
    admin
      .from('affiliate_commissions')
      .select(`
        id, affiliate_id, member_id, payment_amount, commission_amount,
        type, status, created_at, approve_after,
        affiliates!affiliate_id(name, email, ref_code)
      `)
      .eq('status', 'pending')
      .lte('approve_after', now)
      .order('created_at', { ascending: false }),

    // Approved — ready to pay out
    admin
      .from('affiliate_commissions')
      .select(`
        id, affiliate_id, member_id, payment_amount, commission_amount,
        type, status, created_at, approve_after,
        affiliates!affiliate_id(name, email, ref_code)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
  ])

  // Collect all member_ids to resolve emails
  const allCommissions = [...(readyRes.data ?? []), ...(approvedRes.data ?? [])]
  const memberIds = [...new Set(allCommissions.map(c => c.member_id).filter(Boolean))]

  let memberEmailMap: Record<string, string> = {}
  if (memberIds.length > 0) {
    const { data: members } = await admin
      .from('members')
      .select('id, email')
      .in('id', memberIds)
    memberEmailMap = Object.fromEntries((members ?? []).map(m => [m.id, m.email]))
  }

  const enriched = (arr: typeof allCommissions) =>
    arr.map(c => ({ ...c, member_email: memberEmailMap[c.member_id] ?? null }))

  const totalDebt = (approvedRes.data ?? [])
    .reduce((s, c) => s + (c.commission_amount ?? 0), 0)

  return NextResponse.json({
    pending_ready: enriched(readyRes.data ?? []),
    approved: enriched(approvedRes.data ?? []),
    total_debt: totalDebt,
  })
}
