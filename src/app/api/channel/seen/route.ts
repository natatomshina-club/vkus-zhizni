import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { channel } = await request.json() as { channel?: string }
    if (!channel) return NextResponse.json({ error: 'channel required' }, { status: 400 })

    const admin = createServiceClient()
    const { error } = await admin
      .from('channel_last_seen')
      .upsert(
        { member_id: user.id, channel, last_seen_at: new Date().toISOString() },
        { onConflict: 'member_id,channel' }
      )

    if (error) {
      console.error('[channel/seen POST]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[channel/seen POST]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
