import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'

export const metadata: Metadata = {
  title: 'Курсы — программы по питанию для женского здоровья · Наталья Томшина',
  description: 'Курсы нутрициолога Натальи Томшиной с сопровождением. Первый — практикум «Лёгкость перемен»: восстановление ЖКТ, желчного, щитовидной железы и гормонов через питание.',
  alternates: { canonical: 'https://nata-tomshina.ru/obuchenie/kursy' },
  openGraph: {
    title: 'Курсы — программы по питанию для женского здоровья',
    description: 'Курсы с сопровождением от Натальи Томшиной. Первый — практикум «Лёгкость перемен».',
    url: 'https://nata-tomshina.ru/obuchenie/kursy',
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
      '@id': 'https://nata-tomshina.ru/obuchenie/kursy#webpage',
      url: 'https://nata-tomshina.ru/obuchenie/kursy',
      name: 'Курсы',
      inLanguage: 'ru-RU',
      isPartOf: { '@id': 'https://nata-tomshina.ru#website' },
    },
    {
      '@type': 'ItemList',
      '@id': 'https://nata-tomshina.ru/obuchenie/kursy#list',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          url: 'https://nata-tomshina.ru/legko',
          name: 'Лёгкость перемен',
        },
      ],
    },
  ],
}

const COURSES = [
  {
    href: '/legko',
    title: 'Лёгкость перемен',
    tag: '3-месячный практикум',
    description: 'Убираем тяжесть, вздутие, изжогу и хроническую усталость и восстанавливаем работу ЖКТ, желчного, щитовидной железы и гормонов — через питание, без лекарств.',
    cover: '/images/og/legko.webp',
  },
]

export default function KursyPage() {
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
          { label: 'Обучение', href: '/obuchenie' },
          { label: 'Курсы' },
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
          Курсы
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: 'var(--color-text-secondary)',
          maxWidth: '60ch',
          margin: '0 0 48px',
          lineHeight: 1.65,
        }}>
          Программы, где мы не читаем теорию, а меняем состояние — по шагам и с поддержкой.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 28,
        }}>
          {COURSES.map(({ href, title, tag, description, cover }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
              <article style={{
                background: 'var(--color-bg-surface)',
                borderRadius: 20,
                overflow: 'hidden',
                border: '1.5px solid var(--color-accent-border)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
              }}>
                <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                  <Image
                    src={cover}
                    alt={title}
                    fill
                    sizes="(max-width: 700px) 100vw, 50vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: '22px 24px 26px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tag && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--color-accent)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      {tag}
                    </span>
                  )}
                  <h2 style={{
                    fontFamily: 'var(--font-serif-display)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    lineHeight: 1.3,
                  }}>
                    {title}
                  </h2>
                  <p style={{
                    fontSize: '0.97rem',
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                    lineHeight: 1.65,
                    flex: 1,
                  }}>
                    {description}
                  </p>
                  <span
                    className="hp-btn hp-btn--orange"
                    style={{ alignSelf: 'flex-start', marginTop: 8 }}
                  >
                    Подробнее →
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}
