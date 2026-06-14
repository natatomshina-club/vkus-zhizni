interface RateEntry { count: number; resetAt: number }
const store = new Map<string, RateEntry>()

/** Returns true if the honeypot field is non-empty (bot filled it). */
export function isHoneypotFilled(
  body: Record<string, unknown>,
  field = 'company_url',
): boolean {
  const val = body[field]
  return typeof val === 'string' && val.trim().length > 0
}

/**
 * Simple in-memory rate limiter (single-container; resets on restart).
 * Returns true if the request should be blocked.
 */
export function rateLimit(
  ip: string,
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): boolean {
  const mapKey = `${key}:${ip}`
  const now = Date.now()
  const entry = store.get(mapKey)

  if (!entry || now > entry.resetAt) {
    store.set(mapKey, { count: 1, resetAt: now + windowMs })
    return false
  }
  if (entry.count >= limit) return true
  entry.count++
  return false
}
