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

    // Find posts with expired media
    const { data: posts, error } = await supabase
      .from('channel_posts')
      .select('id, media_url')
      .lt('media_expires_at', new Date().toISOString())
      .not('media_url', 'is', null)

    if (error) {
      console.error('[cron/cleanup-media]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const items = posts ?? []
    let deleted = 0

    for (const post of items) {
      if (!post.media_url) continue
      const path = extractStoragePath(post.media_url)
      if (path) {
        await supabase.storage.from(STORAGE_BUCKET).remove([path])
      }
      // Nullify media_url — post text stays
      await supabase.from('channel_posts')
        .update({ media_url: null })
        .eq('id', post.id)
      deleted++
    }

    console.log(`[cron/cleanup-media] deleted media for ${deleted} posts`)
    return NextResponse.json({ deleted })
  } catch (e) {
    console.error('[cron/cleanup-media]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
