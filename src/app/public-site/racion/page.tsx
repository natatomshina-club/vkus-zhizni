import { cookies } from 'next/headers'
import { verifyFreeToken } from '@/lib/jwt'
import RacionClient from './RacionClient'

export const metadata = {
  title: 'Бесплатный рацион на 7 дней | Вкус Жизни',
  description: 'Получите персональный план питания на 7 дней — бесплатно. Рассчитано под ваши параметры по методу Натальи Томшиной.',
}

export default async function RacionPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('racion_token')?.value ?? null
  let verified = false
  if (token) {
    const payload = await verifyFreeToken(token)
    verified = !!payload
  }

  return <RacionClient initialVerified={verified} />
}
