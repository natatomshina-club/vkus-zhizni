import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'partner_token'
const TTL_DAYS = 7

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET env var is not set')
  return new TextEncoder().encode(secret)
}

export interface PartnerPayload {
  affiliate_id: string
  email: string
}

export async function signPartnerToken(payload: PartnerPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_DAYS}d`)
    .sign(getSecret())
}

export async function verifyPartnerToken(token: string): Promise<PartnerPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (!payload.affiliate_id || !payload.email) return null
    return payload as unknown as PartnerPayload
  } catch {
    return null
  }
}

/** Read + verify partner_token from the current request cookies. */
export async function getPartnerFromCookies(): Promise<PartnerPayload | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyPartnerToken(token)
}

export { COOKIE_NAME, TTL_DAYS }
