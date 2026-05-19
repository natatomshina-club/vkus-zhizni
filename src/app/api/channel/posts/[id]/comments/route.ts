import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const admin = createServiceClient()

    const { data: comments, error } = await admin
      .from('channel_posts')
      .select('id, member_id, text, media_url, media_urls, is_ai_reply, likes_count, created_at, member:members(name, full_name, role, avatar_url)')
      .eq('parent_id', id)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      console.error('[channel/posts/comments GET]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const items = comments ?? []
    const ids = items.map(c => c.id)

    const { data: userLikes } = await admin
      .from('channel_likes').select('post_id').in('post_id', ids).eq('member_id', user.id)

    const likedSet = new Set((userLikes ?? []).map(l => l.post_id))
    const enriched = items.map(c => ({ ...c, liked_by_me: likedSet.has(c.id), comments_count: 0 }))

    return NextResponse.json({ comments: enriched })
  } catch (e) {
    console.error('[channel/posts/comments GET]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = createServiceClient()

    const { id: parent_id } = await params

    const { data: parent } = await supabase
      .from('channel_posts').select('id, channel, member_id').eq('id', parent_id).maybeSingle()
    if (!parent) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const body = await request.json().catch(() => null)
    const text = typeof body?.text === 'string' ? body.text.trim() : ''
    const rawUrls: string[] = Array.isArray(body?.media_urls) ? body.media_urls.slice(0, 3) : []

    const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://invalid').hostname
    const media_urls: string[] = []
    for (const url of rawUrls) {
      if (typeof url !== 'string') continue
      try {
        if (new URL(url).hostname !== supabaseHost) return NextResponse.json({ error: 'Invalid media domain' }, { status: 400 })
        media_urls.push(url)
      } catch {
        return NextResponse.json({ error: 'Invalid media domain' }, { status: 400 })
      }
    }

    if (!text && media_urls.length === 0) return NextResponse.json({ error: 'text или фото обязательны' }, { status: 400 })
    if (text.length > 1000) return NextResponse.json({ error: 'max 1000 символов' }, { status: 400 })

    const { data, error } = await supabase
      .from('channel_posts')
      .insert({
        member_id: user.id,
        channel: parent.channel,
        text: text || null,
        media_url: media_urls[0] ?? null,
        media_urls: media_urls.length > 0 ? media_urls : null,
        parent_id,
        is_pinned: false,
        is_ai_reply: false,
      })
      .select('id, member_id, text, media_url, media_urls, is_ai_reply, likes_count, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify post author if they're not the one commenting
    if (parent.member_id && parent.member_id !== user.id) {
      console.log('[notifications] creating reply for member:', parent.member_id)
      const { error: notifErr } = await admin.from('notifications').insert({
        member_id: parent.member_id,
        type: 'reply',
        text: '💬 Кто-то ответил на ваш пост',
        link: `/dashboard/channel?ch=${parent.channel}&post=${parent_id}`,
        is_read: false,
      })
      if (notifErr) console.error('[notifications] insert error:', notifErr)
      else console.log('[notifications] created OK for member:', parent.member_id)
    }

    return NextResponse.json({
      comment: { ...data, liked_by_me: false, comments_count: 0, member: null },
    }, { status: 201 })
  } catch (e) {
    console.error('[channel/posts/comments POST]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
