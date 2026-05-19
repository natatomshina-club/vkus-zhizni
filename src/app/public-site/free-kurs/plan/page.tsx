import type { Metadata } from 'next'
import PlanContent from './PlanContent'

export const metadata: Metadata = {
  title: '5 советов для результата — Финальный план курса',
  description: 'Пошаговый план на завтра. Финальный урок мини-курса «Волшебный пендель».',
  alternates: { canonical: 'https://nata-tomshina.ru/free-kurs/plan' },
  robots: { index: false, follow: false },
}

export default function PlanPage() {
  return <PlanContent />
}
