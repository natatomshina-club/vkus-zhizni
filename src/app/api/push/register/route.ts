import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('[push/register] called')

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  console.log('[push/register] user:', user?.email, 'authError:', authError?.message)

  if (!user) {
    console.log('[push/register] no user, returning 401')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { player_id } = await req.json() as { player_id: string }
  console.log('[push/register] player_id:', player_id)

  if (!player_id?.trim()) {
    return NextResponse.json({ error: 'player_id required' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { data: member, error: memberError } = await admin
    .from('members')
    .select('id')
    .eq('email', user.email)
    .single()

  console.log('[push/register] member:', member?.id, 'memberError:', memberError?.message)

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  const { error: upsertError } = await admin
    .from('push_subscriptions')
    .upsert({
      member_id: member.id,
      player_id,
      platform: 'web',
      active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'player_id' })

  console.log('[push/register] upsert error:', upsertError?.message)

  return NextResponse.json({ ok: true })
}
