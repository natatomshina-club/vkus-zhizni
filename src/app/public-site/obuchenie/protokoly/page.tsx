import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'

export const metadata: Metadata = {
  title: 'Протоколы — скоро · Наталья Томшина',
  description: 'Раздел готовится к запуску.',
  alternates: { canonical: 'https://nata-tomshina.ru/obuchenie/protokoly' },
  robots: { index: false, follow: true },
}

export default function ProtokologyPage() {
  return (
    <div style={{ background: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <PublicNav currentPage="/obuchenie" />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 5% 0' }}>
        <Breadcrumbs items={[
          { label: 'Главная', href: '/' },
          { label: 'Обучение', href: '/obuchenie' },
          { label: 'Протоколы' },
        ]} />
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 5% 120px', textAlign: 'center' }}>
        <span style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: 'var(--color-text-secondary)',
          background: 'var(--color-bg-cream)',
          border: '1px solid var(--color-border)',
          borderRadius: 20,
          padding: '4px 14px',
          marginBottom: 24,
        }}>
          Скоро
        </span>
        <h1 style={{
          fontFamily: 'var(--font-serif-display)',
          fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 20px',
          lineHeight: 1.2,
        }}>
          Протоколы
        </h1>
        <p style={{
          fontSize: '1.05rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.7,
          margin: '0 0 36px',
        }}>
          Раздел скоро откроется. Пока загляните в{' '}
          <Link href="/obuchenie/kursy" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>Курсы</Link>
          {' '}или в{' '}
          <Link href="/club" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>Клуб</Link>.
        </p>
        <Link href="/obuchenie" style={{
          display: 'inline-block',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          textDecoration: 'none',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 2,
        }}>
          ← Все форматы обучения
        </Link>
      </div>

      <PublicFooter />
    </div>
  )
}
