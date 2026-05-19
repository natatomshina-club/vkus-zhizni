import type { Metadata } from 'next'
import FreeLanding from './FreeLanding'

export const metadata: Metadata = {
  title: 'Волшебный пендель — бесплатный мини-курс Натальи Томшиной',
  description: 'Как выйти из круга «диета-срыв-диета». 7 уроков о метаболическом питании. Бесплатно, доступ навсегда.',
  alternates: {
    canonical: 'https://nata-tomshina.ru/free',
  },
  openGraph: {
    title: 'Волшебный пендель · Бесплатный мини-курс',
    description: 'Как выйти из круга «диета-срыв-диета». 7 уроков от нутрициолога Натальи Томшиной.',
    url: 'https://nata-tomshina.ru/free',
    type: 'website',
  },
}

export default function FreePage() {
  return <FreeLanding />
}
