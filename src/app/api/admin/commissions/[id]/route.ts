import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createServiceClient()
  const { data: member } = await admin.from('members').select('role').eq('email', user.email).single()
  return member?.role === 'admin' ? admin : null
}

// PATCH /api/admin/commissions/[id]
// body: { action: 'approve' | 'paid' }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { action } = await req.json() as { action: 'approve' | 'paid' }

  if (action === 'approve') {
    const { error } = await admin
      .from('affiliate_commissions')
      .update({ status: 'approved' })
      .eq('id', id)
      .eq('status', 'pending')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'paid') {
    // Get commission details to update affiliate total_paid
    const { data: commission, error: fetchErr } = await admin
      .from('affiliate_commissions')
      .select('affiliate_id, commission_amount')
      .eq('id', id)
      .eq('status', 'approved')
      .single()

    if (fetchErr || !commission) {
      return NextResponse.json({ error: 'Commission not found or not approved' }, { status: 404 })
    }

    // Mark as paid
    const { error: updateErr } = await admin
      .from('affiliate_commissions')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    // Increment total_paid on affiliate
    const { data: aff } = await admin
      .from('affiliates')
      .select('total_paid')
      .eq('id', commission.affiliate_id)
      .single()

    await admin
      .from('affiliates')
      .update({ total_paid: ((aff?.total_paid ?? 0) as number) + (commission.commission_amount ?? 0) })
      .eq('id', commission.affiliate_id)

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
