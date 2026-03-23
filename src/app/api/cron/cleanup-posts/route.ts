import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STORAGE_BUCKET = 'channel-media'

function extractStoragePath(url: string): string | null {
  const marker = `/${STORAGE_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // Find expired posts (is_pinned=false posts only — pinned stubs live forever)
    const { data: posts, error } = await supabase
      .from('channel_posts')
      .select('id, media_url')
      .lt('expires_at', new Date().toISOString())
      .not('expires_at', 'is', null)
      .eq('is_pinned', false)

    if (error) {
      console.error('[cron/cleanup-posts]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const items = posts ?? []
    let deleted = 0

    for (const post of items) {
      // Delete media from storage if present
      if (post.media_url) {
        const path = extractStoragePath(post.media_url)
        if (path) {
          await supabase.storage.from(STORAGE_BUCKET).remove([path])
        }
      }
      // Delete post (likes + comments cascade)
      await supabase.from('channel_posts').delete().eq('id', post.id)
      deleted++
    }

    console.log(`[cron/cleanup-posts] deleted ${deleted} expired posts`)
    return NextResponse.json({ deleted })
  } catch (e) {
    console.error('[cron/cleanup-posts]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
