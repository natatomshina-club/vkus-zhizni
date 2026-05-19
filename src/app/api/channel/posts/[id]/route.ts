import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const STORAGE_BUCKET = 'channel-media'

// ── GET /api/channel/posts/[id] ────────────────────────────────────────────────

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

    const { data: post, error } = await admin
      .from('channel_posts')
      .select('id, member_id, channel, text, media_url, media_urls, media_expires_at, meal_tag, is_ai_reply, is_pinned, parent_id, likes_count, expires_at, created_at, member:members(name, full_name, role, avatar_url)')
      .eq('id', id)
      .is('parent_id', null)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [{ data: userLike }, { data: commentRows }] = await Promise.all([
      admin.from('channel_likes').select('post_id').eq('post_id', id).eq('member_id', user.id).maybeSingle(),
      admin.from('channel_posts').select('id').eq('parent_id', id),
    ])

    return NextResponse.json({
      post: {
        ...post,
        liked_by_me: !!userLike,
        comments_count: (commentRows ?? []).length,
      },
    })
  } catch (e) {
    console.error('[channel/posts/[id] GET]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

function extractStoragePath(url: string): string | null {
  const marker = `/${STORAGE_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const admin = createServiceClient()

    const { data: post } = await admin
      .from('channel_posts')
      .select('id, member_id, media_url')
      .eq('id', id)
      .maybeSingle()

    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
    const isAdmin = member?.role === 'admin'
    const isCurator = member?.role === 'curator'

    if (post.member_id !== user.id && !isAdmin && !isCurator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete child comments' media files from storage
    const { data: childComments } = await admin
      .from('channel_posts')
      .select('id, media_url')
      .eq('parent_id', id)
      .not('media_url', 'is', null)

    if (childComments?.length) {
      const paths = childComments
        .map(c => extractStoragePath(c.media_url!))
        .filter((p): p is string => p !== null)
      if (paths.length) await admin.storage.from(STORAGE_BUCKET).remove(paths)
    }

    // Delete child comments
    await admin.from('channel_posts').delete().eq('parent_id', id)

    // Delete post media from storage
    if (post.media_url) {
      const path = extractStoragePath(post.media_url)
      if (path) await admin.storage.from(STORAGE_BUCKET).remove([path])
    }

    // Delete post
    const { error } = await admin.from('channel_posts').delete().eq('id', id)
    if (error) {
      console.error('[channel/posts DELETE]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[channel/posts DELETE]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('[PATCH] Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    console.log('[PATCH] id:', id, 'user:', user.id)

    // Use service client to read — bypass RLS for lookup
    const admin = createServiceClient()
    const { data: post, error: fetchErr } = await admin
      .from('channel_posts')
      .select('id, member_id, created_at')
      .eq('id', id)
      .maybeSingle()

    console.log('[PATCH] post:', post, 'fetchErr:', fetchErr)

    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (post.member_id !== user.id) {
      console.log('[PATCH] Forbidden: post.member_id', post.member_id, '!== user.id', user.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const hoursSinceCreated = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60)
    console.log('[PATCH] hoursSinceCreated:', hoursSinceCreated)
    if (hoursSinceCreated > 24) {
      return NextResponse.json({ error: 'Редактирование доступно только в течение 24 часов' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    console.log('[PATCH] body:', body)
    const text = typeof body?.text === 'string' ? body.text.trim() : null
    if (!text) return NextResponse.json({ error: 'text обязателен' }, { status: 400 })
    if (text.length > 1000) return NextResponse.json({ error: 'max 1000 символов' }, { status: 400 })

    // Use service client to update — bypasses RLS UPDATE policy
    const { data, error } = await admin
      .from('channel_posts')
      .update({ text })
      .eq('id', id)
      .select('id, text')
      .single()

    console.log('[PATCH] update result:', data, error)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ post: data })
  } catch (e) {
    console.error('[channel/posts PATCH]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
