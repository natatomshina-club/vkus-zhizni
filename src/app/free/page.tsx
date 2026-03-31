import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { verifyFreeToken } from '@/lib/jwt'
import EmailGate from './EmailGate'
import CourseContent from './CourseContent'

export const metadata: Metadata = {
  title: 'Волшебный пендель — бесплатный мини-курс Натальи Томшиной',
  description: '7 уроков, которые объяснят почему диеты не работают — и что делать прямо с завтра. Бесплатно.',
}

export default async function FreePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('free_token')?.value ?? null

  if (token) {
    const payload = await verifyFreeToken(token)
    if (payload) {
      return <CourseContent email={payload.email} />
    }
  }

  return <EmailGate />
}
