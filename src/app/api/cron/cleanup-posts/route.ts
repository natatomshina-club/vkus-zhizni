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
    if (items.length === 0) {
      return NextResponse.json({ deleted: 0 })
    }

    // Batch delete all storage files at once
    const storagePaths = items
      .map(p => p.media_url ? extractStoragePath(p.media_url) : null)
      .filter((p): p is string => p !== null)
    if (storagePaths.length > 0) {
      await supabase.storage.from(STORAGE_BUCKET).remove(storagePaths)
    }

    // Batch delete all posts (likes + comments cascade)
    const ids = items.map(p => p.id)
    await supabase.from('channel_posts').delete().in('id', ids)

    console.log(`[cron/cleanup-posts] deleted ${items.length} expired posts`)
    return NextResponse.json({ deleted: items.length })
  } catch (e) {
    console.error('[cron/cleanup-posts]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
