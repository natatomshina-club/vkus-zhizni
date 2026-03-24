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
      .select('id, member_id, text, media_url, is_ai_reply, likes_count, created_at, member:members(name, full_name, role, avatar_url)')
      .eq('parent_id', id)
      .order('created_at', { ascending: true })

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

    const { id: parent_id } = await params

    const { data: parent } = await supabase
      .from('channel_posts').select('id, channel').eq('id', parent_id).maybeSingle()
    if (!parent) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const body = await request.json().catch(() => null)
    const text = typeof body?.text === 'string' ? body.text.trim() : ''
    if (!text) return NextResponse.json({ error: 'text обязателен' }, { status: 400 })
    if (text.length > 1000) return NextResponse.json({ error: 'max 1000 символов' }, { status: 400 })

    const { data, error } = await supabase
      .from('channel_posts')
      .insert({
        member_id: user.id,
        channel: parent.channel,
        text,
        parent_id,
        is_pinned: false,
        is_ai_reply: false,
      })
      .select('id, member_id, text, media_url, is_ai_reply, likes_count, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      comment: { ...data, liked_by_me: false, comments_count: 0, member: null },
    }, { status: 201 })
  } catch (e) {
    console.error('[channel/posts/comments POST]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
