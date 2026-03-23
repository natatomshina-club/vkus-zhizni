import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: postId } = await params
    const service = createServiceClient()

    // Check if already liked (user-auth read is fine)
    const { data: existing } = await supabase
      .from('channel_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('member_id', user.id)
      .maybeSingle()

    let liked: boolean

    if (existing) {
      // Unlike — delete via user auth (policy allows own row)
      await supabase.from('channel_likes').delete().eq('id', existing.id)

      // Decrement likes_count via service role (bypasses RLS — no UPDATE policy for members)
      const { data: post } = await service
        .from('channel_posts').select('likes_count').eq('id', postId).single()
      await service
        .from('channel_posts')
        .update({ likes_count: Math.max(0, (post?.likes_count ?? 1) - 1) })
        .eq('id', postId)

      liked = false
    } else {
      // Like — insert via user auth
      await supabase.from('channel_likes').insert({ post_id: postId, member_id: user.id })

      // Increment likes_count via service role
      const { data: post } = await service
        .from('channel_posts').select('likes_count').eq('id', postId).single()
      await service
        .from('channel_posts')
        .update({ likes_count: (post?.likes_count ?? 0) + 1 })
        .eq('id', postId)

      liked = true
    }

    const { data: updated } = await service
      .from('channel_posts').select('likes_count').eq('id', postId).single()

    return NextResponse.json({ liked, likes_count: updated?.likes_count ?? 0 })
  } catch (e) {
    console.error('[channel/posts/like POST]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
