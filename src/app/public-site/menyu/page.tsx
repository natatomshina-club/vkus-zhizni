import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { MENYU_CONFIG } from '@/lib/silo-config'

export const metadata: Metadata = {
  title: 'Меню питания для женщин 40+ | Вкус Жизни',
  description: 'Готовые меню питания от нутрициолога Натальи Томшиной. При инсулинорезистентности, климаксе, диабете, гипотиреозе и для похудения.',
}

export default function MenyuPage() {
  return (
    <div style={{ background: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <PublicNav currentPage="/menyu" />

      {/* HERO */}
      <div className="mn-hero">
        <div className="mn-hero__inner">
          <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Рационы' }]} />
          <div className="mn-kicker">— Рационы питания</div>
          <h1 className="mn-hero__title">Рационы питания</h1>
          <p className="mn-hero__lead">
            Готовые меню от нутрициолога Натальи Томшиной — под конкретные задачи и состояния здоровья
          </p>
        </div>
      </div>

      {/* CATEGORY CARDS */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 5% 64px' }}>
        <h2 className="mn-sections__heading">Выберите ваш рацион</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
          {Object.entries(MENYU_CONFIG).map(([key, cat]) => (
            <Link key={key} href={`/menyu/${key}`} style={{ textDecoration: 'none' }}>
              <div className="mn-card">
                <span style={{ fontSize: 40 }}>{cat.icon}</span>
                <h3 className="mn-card__title">{cat.label}</h3>
                <p className="mn-card__desc">{cat.description}</p>
                <p className="mn-card__arrow">Смотреть меню →</p>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mn-cta">
          <h2 className="mn-cta__title">Хотите персональный рацион?</h2>
          <p className="mn-cta__lead">
            В клубе «Вкус Жизни» Наталья составляет меню с учётом ваших анализов и целей
          </p>
          <a href="/club" className="hp-btn hp-btn--green hp-btn--xl">
            Узнать о клубе →
          </a>
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}
