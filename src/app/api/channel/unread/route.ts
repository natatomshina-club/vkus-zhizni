import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()

    // Get member id and subscription_started_at for cutoff
    const { data: member } = await admin
      .from('members')
      .select('id, subscription_started_at')
      .eq('email', user.email!)
      .single()

    // Get last_seen_at per channel for this user
    const { data: seenRows } = await admin
      .from('channel_last_seen')
      .select('channel, last_seen_at')
      .eq('member_id', member?.id ?? user.id)

    const seenMap: Record<string, string> = {}
    for (const row of seenRows ?? []) {
      seenMap[row.channel] = row.last_seen_at
    }

    // Get top-level posts since member joined (never count history before subscription)
    let postsQuery = admin
      .from('channel_posts')
      .select('channel, created_at')
      .is('parent_id', null)

    if (member?.subscription_started_at) {
      postsQuery = postsQuery.gte('created_at', member.subscription_started_at)
    }

    const { data: posts } = await postsQuery

    // Count unread per channel
    const counts: Record<string, number> = {}
    for (const post of posts ?? []) {
      const lastSeen = seenMap[post.channel]
      if (!lastSeen || post.created_at > lastSeen) {
        counts[post.channel] = (counts[post.channel] ?? 0) + 1
      }
    }

    return NextResponse.json({ counts })
  } catch (e) {
    console.error('[channel/unread GET]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
