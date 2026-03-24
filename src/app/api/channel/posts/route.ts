import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const STORAGE_BUCKET = 'channel-media'
const ALLOWED_CHANNELS = ['boltalka', 'plates', 'faq', 'direct']
const MARATHON_RE = /^marathon-[a-z0-9-]+$/

function isValidChannel(ch: string): boolean {
  return ALLOWED_CHANNELS.includes(ch) || MARATHON_RE.test(ch)
}

// ── GET /api/channel/posts?channel=X&cursor=ISO&after=ISO&limit=20 ──────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()

    const params = request.nextUrl.searchParams
    const channel = params.get('channel') ?? ''
    const cursor  = params.get('cursor')   // fetch older posts (created_at < cursor)
    const after   = params.get('after')    // fetch newer posts (created_at > after, for polling)
    const limit   = Math.min(50, Math.max(1, parseInt(params.get('limit') ?? '20')))

    if (!isValidChannel(channel)) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
    }

    // Marathon channel: trial users get 403
    if (MARATHON_RE.test(channel)) {
      const { data: member } = await supabase
        .from('members').select('status').eq('id', user.id).single()
      if (member?.status === 'trial') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    let query = admin
      .from('channel_posts')
      .select('id, member_id, channel, text, media_url, media_expires_at, meal_tag, is_ai_reply, is_pinned, parent_id, likes_count, expires_at, created_at, member:members(name, full_name, role, avatar_url)')
      .eq('channel', channel)
      .is('parent_id', null)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())

    if (after) {
      // Polling: newer posts
      query = query.gt('created_at', after).order('is_pinned', { ascending: false }).order('created_at', { ascending: false })
    } else if (cursor) {
      // Load more: older posts
      query = query.lt('created_at', cursor).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(limit + 1)
    } else {
      // Initial load
      query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(limit + 1)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('[channel/posts GET]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const items = posts ?? []
    const hasMore = !after && items.length > limit
    const sliced = hasMore ? items.slice(0, limit) : items
    const postIds = sliced.map(p => p.id)

    // Liked by me + comments count (parallel)
    const [{ data: userLikes }, { data: commentRows }] = await Promise.all([
      admin.from('channel_likes').select('post_id').in('post_id', postIds).eq('member_id', user.id),
      admin.from('channel_posts').select('parent_id').in('parent_id', postIds),
    ])

    const likedSet = new Set((userLikes ?? []).map(l => l.post_id))
    const commentMap = new Map<string, number>()
    for (const r of commentRows ?? []) {
      if (r.parent_id) commentMap.set(r.parent_id, (commentMap.get(r.parent_id) ?? 0) + 1)
    }

    const enriched = sliced.map(p => ({
      ...p,
      liked_by_me: likedSet.has(p.id),
      comments_count: commentMap.get(p.id) ?? 0,
    }))

    return NextResponse.json({ posts: enriched, hasMore })
  } catch (e) {
    console.error('[channel/posts GET]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// ── POST /api/channel/posts ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as {
      channel?: string
      text?: string
      media_url?: string
      meal_tag?: string
      parent_id?: string
    }

    // ── Validate channel ──
    const channel = (body.channel ?? '').trim()
    if (!isValidChannel(channel)) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
    }

    // Marathon channel: trial users forbidden
    if (MARATHON_RE.test(channel)) {
      const { data: member } = await supabase
        .from('members').select('status').eq('id', user.id).single()
      if (member?.status === 'trial') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // ── Validate text ──
    const text = body.text?.trim() ?? null
    if (text && text.length > 1000) {
      return NextResponse.json({ error: 'Text too long (max 1000)' }, { status: 400 })
    }

    // ── Validate media_url domain ──
    // Coerce empty string to null — empty string would fail DB constraints
    const media_url = body.media_url?.trim() || null
    if (media_url) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
      if (!media_url.startsWith(supabaseUrl)) {
        return NextResponse.json({ error: 'Invalid media domain' }, { status: 400 })
      }
    }

    if (!text && !media_url) {
      return NextResponse.json({ error: 'Text or media required' }, { status: 400 })
    }

    // ── Validate meal_tag ──
    const meal_tag = body.meal_tag ?? null
    if (meal_tag && !['breakfast', 'lunch', 'snack'].includes(meal_tag)) {
      return NextResponse.json({ error: 'Invalid meal_tag' }, { status: 400 })
    }

    // ── Validate parent_id ──
    const parent_id = body.parent_id ?? null
    if (parent_id) {
      const { data: parent } = await supabase
        .from('channel_posts').select('id').eq('id', parent_id).maybeSingle()
      if (!parent) return NextResponse.json({ error: 'Parent post not found' }, { status: 400 })
    }

    // ── Compute server-side expiry ──
    const now = new Date()
    let expires_at: string | null = null
    let media_expires_at: string | null = null

    if (['boltalka', 'plates'].includes(channel)) {
      const exp = new Date(now)
      exp.setDate(exp.getDate() + 30)
      expires_at = exp.toISOString()
    } else if (MARATHON_RE.test(channel)) {
      // Extract marathon id and get ends_at from DB
      const marathonId = channel.replace('marathon-', '')
      const { data: marathon } = await supabase
        .from('marathons').select('ends_at').eq('id', marathonId).maybeSingle()
      if (marathon?.ends_at) {
        const exp = new Date(marathon.ends_at)
        exp.setDate(exp.getDate() + 5)
        expires_at = exp.toISOString()
      }
    }

    // Any channel: media expires after 72h (cron cleans up storage, post text survives)
    if (media_url) {
      const exp = new Date(now)
      exp.setHours(exp.getHours() + 72)
      media_expires_at = exp.toISOString()
    }

    const { data, error } = await supabase
      .from('channel_posts')
      .insert({
        member_id: user.id,   // never from body
        channel,
        text: text || null,
        media_url,
        media_expires_at,
        meal_tag: channel === 'plates' ? meal_tag : null,
        parent_id,
        expires_at,
        is_pinned: false,
        is_ai_reply: false,
      })
      .select('id, member_id, channel, text, media_url, media_expires_at, meal_tag, is_ai_reply, is_pinned, parent_id, likes_count, expires_at, created_at')
      .single()

    if (error) {
      console.error('[channel/posts POST]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ...data, liked_by_me: false, comments_count: 0, member: null }, { status: 201 })
  } catch (e) {
    console.error('[channel/posts POST]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
