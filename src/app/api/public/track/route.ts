import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Simple in-memory rate limit: IP → last 'view' timestamp
const viewTimestamps = new Map<string, number>()

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body?.path || !body?.event) return NextResponse.json({ ok: true })

    const { path, event, widget_type, referrer } = body

    // Rate limit 'view' events: 1 per 30s per IP
    if (event === 'view') {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
      const key = `${ip}:${path}`
      const last = viewTimestamps.get(key) ?? 0
      const now = Date.now()
      if (now - last < 30_000) return NextResponse.json({ ok: true })
      viewTimestamps.set(key, now)
      // Cleanup old entries periodically
      if (viewTimestamps.size > 5000) {
        const cutoff = now - 60_000
        for (const [k, t] of viewTimestamps) {
          if (t < cutoff) viewTimestamps.delete(k)
        }
      }
    }

    const supabase = createServiceClient()
    await supabase.from('page_views').insert({
      path,
      event,
      widget_type: widget_type ?? null,
      referrer: referrer ? String(referrer).slice(0, 500) : null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
