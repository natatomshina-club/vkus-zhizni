'use client'
import { useMemo } from 'react'
import Link from 'next/link'

export default function HorizontalBanner() {
  const showClub = useMemo(() => Math.random() > 0.5, [])

  if (showClub) {
    return (
      <div style={{ background: 'linear-gradient(135deg, var(--color-bg-dark) 0%, var(--color-hero-bg-2) 100%)', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>🌿</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: 'var(--color-hero-text)', lineHeight: 1.25 }}>
            Клуб «Вкус Жизни» — похудеть без голода
          </div>
          <div style={{ fontSize: 12, color: 'rgba(var(--color-white-rgb),.6)', marginTop: 2 }}>7 дней полного доступа за 149 ₽</div>
        </div>
        <Link href="/marathon" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-cta-bg)', color: 'var(--color-cta-text)', fontFamily: 'var(--font-unbounded)', fontSize: 12, fontWeight: 700, padding: '10px 18px', borderRadius: 100, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
          Узнать о марафоне →
        </Link>
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, var(--color-accent-forest) 0%, var(--color-cta-bg) 100%)', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 24, flexShrink: 0 }}>🏃</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: 'var(--color-hero-text)', lineHeight: 1.25 }}>
          Апрельский марафон стартует 1 апреля
        </div>
        <div style={{ fontSize: 12, color: 'rgba(var(--color-white-rgb),.7)', marginTop: 2 }}>Снижаем инсулин и запускаем жиросжигание</div>
      </div>
      <Link href="/marathon" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-bg-surface)', color: 'var(--color-accent-forest)', fontFamily: 'var(--font-unbounded)', fontSize: 12, fontWeight: 700, padding: '10px 18px', borderRadius: 100, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
        Узнать подробнее →
      </Link>
    </div>
  )
}
