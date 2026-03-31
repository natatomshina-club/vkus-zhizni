import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'vkus-zhizni-free-course-secret-change-in-prod'
)

export async function signFreeToken(email: string): Promise<string> {
  return new SignJWT({ email, type: 'free_course' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function verifyFreeToken(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    if (payload.type !== 'free_course' || typeof payload.email !== 'string') return null
    return { email: payload.email }
  } catch {
    return null
  }
}
