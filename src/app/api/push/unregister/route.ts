import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { player_id } = await req.json() as { player_id: string }
    if (!player_id?.trim()) return NextResponse.json({ error: 'player_id required' }, { status: 400 })

    const admin = createServiceClient()
    await admin.from('push_subscriptions')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('player_id', player_id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[push/unregister]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
