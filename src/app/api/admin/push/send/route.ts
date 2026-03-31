import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()
    const { data: member } = await admin.from('members').select('role').eq('email', user.email).single()
    if (member?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { title, body, segment } = await req.json() as {
      title: string
      body: string
      segment?: 'trial' | 'active' | 'expired' | null
    }
    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'title and body required' }, { status: 400 })
    }

    // Collect player_ids
    let playerIds: string[] = []

    if (segment) {
      const { data: members } = await admin.from('members').select('id').eq('subscription_status', segment)
      const ids = (members ?? []).map(m => m.id)
      if (ids.length === 0) return NextResponse.json({ sent: 0 })
      const { data: subs } = await admin.from('push_subscriptions').select('player_id').eq('active', true).in('member_id', ids)
      playerIds = (subs ?? []).map(s => s.player_id)
    } else {
      const { data: subs } = await admin.from('push_subscriptions').select('player_id').eq('active', true)
      playerIds = (subs ?? []).map(s => s.player_id)
    }

    if (playerIds.length === 0) return NextResponse.json({ sent: 0 })

    const appId = process.env.ONESIGNAL_APP_ID
    const restKey = process.env.ONESIGNAL_REST_API_KEY

    if (!appId || !restKey) {
      return NextResponse.json({ error: 'OneSignal not configured' }, { status: 500 })
    }

    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${restKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        include_player_ids: playerIds,
        headings: { en: title, ru: title },
        contents: { en: body, ru: body },
        url: 'https://nata-tomshina.ru/dashboard',
      }),
    })

    const result = await res.json() as { id?: string; errors?: string[] }
    return NextResponse.json({ sent: playerIds.length, id: result.id, errors: result.errors })
  } catch (e) {
    console.error('[admin/push/send]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
