import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { MENYU_CONFIG } from '@/lib/silo-config'

export const dynamicParams = true

export async function generateStaticParams() {
  return Object.keys(MENYU_CONFIG).map(k => ({ category: k }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> }
): Promise<Metadata> {
  const { category } = await params
  const cat = MENYU_CONFIG[category as keyof typeof MENYU_CONFIG]
  if (!cat) return { title: 'Рационы' }
  return {
    title: `${cat.title} | Вкус Жизни`,
    description: cat.description,
  }
}

export default async function MenyuCategoryPage(
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params
  const cat = MENYU_CONFIG[category as keyof typeof MENYU_CONFIG]
  if (!cat) notFound()

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Рационы', href: '/menyu' },
    { label: cat.label },
  ]

  return (
    <div style={{ background: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <PublicNav currentPage="/menyu" />

      {/* HERO */}
      <div className="mn-hero">
        <div className="mn-hero__inner">
          <Breadcrumbs items={breadcrumbs} />
          <div style={{ fontSize: 48, marginBottom: 12 }}>{cat.icon}</div>
          <h1 className="mn-hero__title">{cat.title}</h1>
          <p className="mn-hero__lead">{cat.description}</p>
        </div>
      </div>

      {/* Category nav pills */}
      <div className="mn-nav-bar">
        <div className="mn-nav-bar__inner">
          <Link href="/menyu" className="mn-nav-pill">
            Все рационы
          </Link>
          {Object.entries(MENYU_CONFIG).map(([key, c]) => (
            <Link
              key={key}
              href={`/menyu/${key}`}
              className={`mn-nav-pill${key === category ? ' mn-nav-pill--active' : ''}`}
            >
              {c.icon} {c.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content placeholder */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 5%', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>{cat.icon}</div>
        <h2 style={{ fontFamily: 'var(--font-serif-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 12px' }}>
          Меню скоро появятся
        </h2>
        <p style={{ fontSize: 15, color: 'var(--color-ink-soft)', margin: '0 0 40px', maxWidth: 480, marginInline: 'auto', lineHeight: 1.7 }}>
          Мы готовим подробные рационы питания по этой теме. А пока — присоединяйтесь к клубу, где Наталья помогает каждой участнице лично.
        </p>
        <a href="/club" className="hp-btn hp-btn--green hp-btn--xl">
          Узнать о клубе →
        </a>
      </div>

      <PublicFooter />
    </div>
  )
}
