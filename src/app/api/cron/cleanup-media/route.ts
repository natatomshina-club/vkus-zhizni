import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

/** Extract all storage paths from a post's media fields */
function extractPaths(mediaUrl: string | null, mediaUrls: string[] | null): string[] {
  const urls: string[] = []
  if (mediaUrl) urls.push(mediaUrl)
  if (mediaUrls) urls.push(...mediaUrls)
  return urls.flatMap(u => {
    try {
      const pathname = new URL(u).pathname
      const after = pathname.replace(/^\/storage\/v1\/object\/public\//, '')
      const slash = after.indexOf('/')
      if (slash === -1) return []
      return [{ bucket: after.slice(0, slash), path: after.slice(slash + 1) }]
    } catch { return [] }
  }).reduce<{ byBucket: Map<string, string[]> }>((acc, { bucket, path }) => {
    if (!acc.byBucket.has(bucket)) acc.byBucket.set(bucket, [])
    acc.byBucket.get(bucket)!.push(path)
    return acc
  }, { byBucket: new Map() }).byBucket as unknown as string[]
}

/** Delete storage files grouped by bucket */
async function deleteStorageFiles(admin: ReturnType<typeof createServiceClient>, items: Array<{ media_url: string | null; media_urls?: string[] | null }>) {
  const byBucket = new Map<string, string[]>()
  for (const item of items) {
    const urls: string[] = []
    if (item.media_url) urls.push(item.media_url)
    if (item.media_urls) urls.push(...item.media_urls)
    for (const u of urls) {
      try {
        const pathname = new URL(u).pathname
        const after = pathname.replace(/^\/storage\/v1\/object\/public\//, '')
        const slash = after.indexOf('/')
        if (slash === -1) continue
        const bucket = after.slice(0, slash)
        const path   = after.slice(slash + 1)
        if (!bucket || !path) continue
        if (!byBucket.has(bucket)) byBucket.set(bucket, [])
        byBucket.get(bucket)!.push(path)
      } catch { /* malformed */ }
    }
  }
  for (const [bucket, paths] of byBucket) {
    const { error } = await admin.storage.from(bucket).remove(paths)
    if (error) console.error(`[cron/cleanup-media] storage ${bucket}:`, error)
  }
}

const SEVEN_DAYS_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

async function run() {
  const admin = createServiceClient()
  let totalDeleted = 0

  // ── 1. channel_posts with media older than 7 days ────────────────────────────
  // Covers both old posts (via media_expires_at) and new posts (via expires_at / created_at)
  const cutoff = SEVEN_DAYS_AGO()
  const { data: posts, error: postsErr } = await admin
    .from('channel_posts')
    .select('id, media_url, media_urls')
    .lt('created_at', cutoff)
    .not('media_url', 'is', null)

  if (postsErr) {
    console.error('[cron/cleanup-media] channel_posts query:', postsErr)
  } else if (posts && posts.length > 0) {
    await deleteStorageFiles(admin, posts as Array<{ media_url: string | null; media_urls?: string[] | null }>)
    const ids = posts.map(p => p.id)
    const { error: delErr } = await admin.from('channel_posts').delete().in('id', ids)
    if (delErr) console.error('[cron/cleanup-media] channel_posts delete:', delErr)
    else totalDeleted += ids.length
  }

  // ── 2. private_messages with media older than 7 days ────────────────────────
  const { data: msgs, error: msgsErr } = await admin
    .from('private_messages')
    .select('id, media_url, media_urls')
    .lt('created_at', cutoff)
    .not('media_url', 'is', null)

  if (msgsErr) {
    console.error('[cron/cleanup-media] private_messages query:', msgsErr)
  } else if (msgs && msgs.length > 0) {
    await deleteStorageFiles(admin, msgs as Array<{ media_url: string | null; media_urls?: string[] | null }>)
    const ids = msgs.map(m => m.id)
    const { error: delErr } = await admin.from('private_messages').delete().in('id', ids)
    if (delErr) console.error('[cron/cleanup-media] private_messages delete:', delErr)
    else totalDeleted += ids.length
  }

  console.log(`[cron/cleanup-media] deleted ${totalDeleted} records with media`)
  return NextResponse.json({ deleted: totalDeleted })
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return run()
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return run()
}
