import type { Metadata } from 'next'
import MinimalHeader from '@/components/public/MinimalHeader'
import CourseHero from '../free/course/CourseHero'
import CourseLessonsSection from '../free/course/CourseLessonsSection'
import CourseResultsSection from '../free/course/CourseResultsSection'
import CourseClubCtaSection from '../free/course/CourseClubCtaSection'

export const metadata: Metadata = {
  title: 'Волшебный пендель — 7 уроков · Наталья Томшина',
  description: 'Как выйти из круга «диета-срыв-диета». 7 уроков о метаболическом питании. Бесплатный доступ навсегда.',
  alternates: {
    canonical: 'https://nata-tomshina.ru/free-kurs',
  },
  openGraph: {
    title: 'Волшебный пендель · Курс',
    description: 'Как выйти из круга «диета-срыв-диета». 7 уроков от нутрициолога Натальи Томшиной.',
    url: 'https://nata-tomshina.ru/free-kurs',
    type: 'website',
  },
}

export default function FreeKursPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MinimalHeader />
      <main style={{ flex: 1 }}>
        <CourseHero email="" />
        <CourseLessonsSection />
        <CourseResultsSection />
        <CourseClubCtaSection />
      </main>
    </div>
  )
}
