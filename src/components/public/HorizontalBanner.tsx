'use client'
import { useMemo } from 'react'
import Link from 'next/link'

export default function HorizontalBanner() {
  const showClub = useMemo(() => Math.random() > 0.5, [])

  if (showClub) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #3D2B8A 0%, #5B3FA8 100%)', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>🌿</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>
            Клуб «Вкус Жизни» — похудеть без голода
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>7 дней полного доступа за 149 ₽</div>
        </div>
        <Link href="/marathon" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#4CAF78', color: '#fff', fontFamily: 'var(--font-unbounded)', fontSize: 12, fontWeight: 700, padding: '10px 18px', borderRadius: 100, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
          Узнать о марафоне →
        </Link>
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #4CAF78 100%)', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 24, flexShrink: 0 }}>🏃</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>
          Апрельский марафон стартует 1 апреля
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>Снижаем инсулин и запускаем жиросжигание</div>
      </div>
      <Link href="/marathon" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#2D6A4F', fontFamily: 'var(--font-unbounded)', fontSize: 12, fontWeight: 700, padding: '10px 18px', borderRadius: 100, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
        Узнать подробнее →
      </Link>
    </div>
  )
}
