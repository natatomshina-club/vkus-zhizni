import type { Metadata } from 'next'
import RacionContent from './RacionContent'

export const metadata: Metadata = {
  title: 'Рацион на 7 дней — Урок 3 · Наталья Томшина',
  description: 'Готовое меню на 7 дней. Завтрак, обед, ужин — без подсчёта калорий.',
  robots: { index: false, follow: false },
}

export default function RacionPage() {
  return <RacionContent />
}
