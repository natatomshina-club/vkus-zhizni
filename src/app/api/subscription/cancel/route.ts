import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()

    const { data: member, error: memberErr } = await admin
      .from('members')
      .select('id, subscription_plan, subscription_status')
      .eq('email', user.email)
      .single()

    if (memberErr || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (member.subscription_status !== 'trial') {
      return NextResponse.json({ error: 'Only trial subscriptions can be cancelled here' }, { status: 400 })
    }

    // Update subscription_status to expired
    const { error: updateErr } = await admin
      .from('members')
      .update({ subscription_status: 'expired' })
      .eq('id', member.id)

    if (updateErr) {
      console.error('[subscription/cancel] update error:', updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Record in cancellations table
    const { error: cancelErr } = await admin
      .from('cancellations')
      .insert({
        member_id: member.id,
        email: user.email,
        plan: member.subscription_plan ?? 'trial',
      })

    if (cancelErr) {
      console.error('[subscription/cancel] cancellations insert error:', cancelErr)
      // Non-fatal — subscription is already cancelled
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[subscription/cancel]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
