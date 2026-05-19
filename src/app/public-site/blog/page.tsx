import type { Metadata } from 'next'
import BlogPageClient from './BlogPageClient'

export const metadata: Metadata = {
  title: 'Блог о питании и гормональном балансе | Наталья Томшина',
  description: 'Статьи нутрициолога Натальи Томшиной о питании для гормонального баланса, похудении после 40, здоровье и витаминах.',
  alternates: {
    canonical: 'https://nata-tomshina.ru/blog/',
  },
  openGraph: {
    title: 'Блог о питании и гормональном балансе | Наталья Томшина',
    description: 'Статьи нутрициолога Натальи Томшиной о питании для гормонального баланса, похудении после 40, здоровье и витаминах.',
    url: 'https://nata-tomshina.ru/blog/',
    type: 'website',
  },
}

export default function BlogPage() {
  return <BlogPageClient />
}
