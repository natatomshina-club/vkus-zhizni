import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'

export const metadata: Metadata = {
  title: 'Обучение — курсы, вебинары и протоколы · Наталья Томшина',
  description: 'Форматы обучения от нутрициолога Натальи Томшиной: глубокие курсы с сопровождением, вебинары и пошаговые протоколы по питанию для женского здоровья.',
  alternates: { canonical: 'https://nata-tomshina.ru/obuchenie' },
  openGraph: {
    title: 'Обучение — курсы, вебинары и протоколы',
    description: 'Курсы, вебинары и протоколы по питанию для женского здоровья от Натальи Томшиной.',
    url: 'https://nata-tomshina.ru/obuchenie',
    type: 'website',
    siteName: 'Вкус Жизни',
    locale: 'ru_RU',
  },
}

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': 'https://nata-tomshina.ru/obuchenie#webpage',
      url: 'https://nata-tomshina.ru/obuchenie',
      name: 'Обучение',
      inLanguage: 'ru-RU',
      isPartOf: { '@id': 'https://nata-tomshina.ru#website' },
      about: { '@id': 'https://nata-tomshina.ru#organization' },
    },
  ],
}

const CATEGORIES = [
  {
    href: '/obuchenie/kursy',
    label: 'Курсы',
    description: 'Глубокие программы с сопровождением. Идём по шагам и доводим до результата.',
    active: true,
  },
  {
    href: null,
    label: 'Вебинары',
    description: 'Разборы конкретных тем: гормоны, ЖКТ, щитовидка.',
    active: false,
  },
  {
    href: null,
    label: 'Протоколы',
    description: 'Короткие пошаговые схемы под конкретную задачу.',
    active: false,
  },
]

export default function ObuhenieHubPage() {
  return (
    <div style={{ background: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PublicNav currentPage="/obuchenie" />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 5% 0' }}>
        <Breadcrumbs items={[
          { label: 'Главная', href: '/' },
          { label: 'Обучение' },
        ]} />
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 5% 80px' }}>
        <h1 style={{
          fontFamily: 'var(--font-serif-display)',
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 16px',
          lineHeight: 1.15,
        }}>
          Обучение
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: 'var(--color-text-secondary)',
          maxWidth: '60ch',
          margin: '0 0 48px',
          lineHeight: 1.65,
        }}>
          Три формата, чтобы разобраться в питании для женского здоровья — от пошагового практикума до коротких протоколов. Выбирайте, с чего начать.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
        }}>
          {CATEGORIES.map(({ href, label, description, active }) => (
            <div
              key={label}
              style={{
                background: active ? 'var(--color-bg-surface)' : 'var(--color-bg-page)',
                border: `1.5px solid ${active ? 'var(--color-accent-border)' : 'var(--color-border)'}`,
                borderRadius: 20,
                padding: '28px 28px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                opacity: active ? 1 : 0.65,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <h2 style={{
                  fontFamily: 'var(--font-serif-display)',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  margin: 0,
                }}>
                  {label}
                </h2>
                {!active && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-bg-cream)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 20,
                    padding: '3px 10px',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.04em',
                  }}>
                    Скоро
                  </span>
                )}
              </div>
              <p style={{
                fontSize: '0.97rem',
                color: 'var(--color-text-secondary)',
                margin: 0,
                lineHeight: 1.6,
                flex: 1,
              }}>
                {description}
              </p>
              {active && href && (
                <Link
                  href={href}
                  className="hp-btn hp-btn--orange"
                  style={{ alignSelf: 'flex-start', marginTop: 8 }}
                >
                  Открыть →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}
