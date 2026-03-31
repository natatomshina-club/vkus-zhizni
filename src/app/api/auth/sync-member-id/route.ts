import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/sync-member-id
 *
 * Called after successful OTP login.
 * If members.id != auth.users.id for this email — syncs via sync_member_id RPC.
 * Requires the following SQL function to be created in Supabase:
 *
 * CREATE OR REPLACE FUNCTION sync_member_id(old_id uuid, new_id uuid, member_email text)
 * RETURNS void AS $$
 * BEGIN
 *   UPDATE payment_logs     SET member_id = new_id WHERE member_id = old_id;
 *   UPDATE private_messages SET member_id = new_id WHERE member_id = old_id;
 *   UPDATE channel_posts    SET member_id = new_id WHERE member_id = old_id;
 *   UPDATE diary_entries    SET member_id = new_id WHERE member_id = old_id;
 *   UPDATE measurements     SET member_id = new_id WHERE member_id = old_id;
 *   UPDATE wins             SET member_id = new_id WHERE member_id = old_id;
 *   UPDATE members SET id = new_id WHERE id = old_id;
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()

    // Get members.id for this email
    const { data: member } = await admin
      .from('members')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!member) {
      console.log('sync-member-id: no member found for', user.email)
      return NextResponse.json({ ok: true, synced: false, reason: 'no_member' })
    }

    if (member.id === user.id) {
      // Already in sync
      return NextResponse.json({ ok: true, synced: false, reason: 'already_synced' })
    }

    console.log(`sync-member-id: syncing ${member.id} → ${user.id} for ${user.email}`)

    // Call RPC to cascade-update all member_id references
    const { error: rpcError } = await admin.rpc('sync_member_id', {
      old_id: member.id,
      new_id: user.id,
      member_email: user.email,
    })

    if (rpcError) {
      console.warn('sync-member-id RPC error (function may not exist yet):', rpcError.message)
      return NextResponse.json({ ok: true, synced: false, reason: 'rpc_missing' })
    }

    console.log('sync-member-id: sync complete')
    return NextResponse.json({ ok: true, synced: true })
  } catch (e) {
    console.error('sync-member-id error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
