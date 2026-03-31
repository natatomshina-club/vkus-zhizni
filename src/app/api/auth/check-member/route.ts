import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// In-memory rate limit: email → last request timestamp
const rateLimitMap = new Map<string, number>()
const RATE_LIMIT_MS = 60_000 // 60 seconds

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 })
  }

  // Rate limiting
  const now = Date.now()
  const lastSent = rateLimitMap.get(email)
  if (lastSent && now - lastSent < RATE_LIMIT_MS) {
    return NextResponse.json({ status: 'rate_limited' })
  }

  const admin = createServiceClient()
  const { data: member } = await admin
    .from('members')
    .select('id, is_blocked')
    .eq('email', email)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ status: 'not_found' })
  }

  if (member.is_blocked) {
    return NextResponse.json({ status: 'blocked' })
  }

  // Record timestamp only for valid members that will get a link
  rateLimitMap.set(email, now)

  // Cleanup old entries to prevent memory leak
  if (rateLimitMap.size > 1000) {
    const cutoff = now - RATE_LIMIT_MS
    for (const [key, ts] of rateLimitMap) {
      if (ts < cutoff) rateLimitMap.delete(key)
    }
  }

  return NextResponse.json({ status: 'ok' })
}
