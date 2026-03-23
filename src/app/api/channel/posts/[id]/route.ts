import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STORAGE_BUCKET = 'channel-media'

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

    const { data: post } = await supabase
      .from('channel_posts')
      .select('id, member_id, media_url')
      .eq('id', id)
      .maybeSingle()

    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (post.member_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Delete media from storage if present
    if (post.media_url) {
      const path = extractStoragePath(post.media_url)
      if (path) {
        await supabase.storage.from(STORAGE_BUCKET).remove([path])
      }
    }

    const { error } = await supabase.from('channel_posts').delete().eq('id', id)
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
