'use client'
import { useState } from 'react'

const BENEFITS = [
  {
    title: 'Поймёте причину',
    desc: 'Почему вес стоит, даже если вы «всё делаете правильно». Что именно в питании запускает набор веса.',
  },
  {
    title: 'Поменяете завтрак',
    desc: 'На жиросжигающий. Никаких каш и обезжиренного творога. Разницу почувствуете уже через два дня.',
  },
  {
    title: 'Узнаете про инсулин',
    desc: 'Главный «выключатель» жиросжигания. Объясню простыми словами, без занудства.',
  },
  {
    title: 'Уйдёт тяга к сладкому',
    desc: 'Это биохимия, не слабость воли. Когда наладите завтрак, к вечеру сладкого уже не захочется.',
  },
  {
    title: 'Получите рацион на неделю',
    desc: 'Готовое меню на 7 дней и список продуктов из обычной Пятёрочки или Магнита. Никаких авокадо и киноа.',
  },
  {
    title: 'Уйдут отёки, появится энергия',
    desc: 'Уже в первые дни. Меньше вздутий, спокойнее желудок, легче вставать утром.',
  },
]

export default function BenefitsSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section style={{
      background: 'var(--color-bg-page)',
      padding: 'var(--space-20) 5%',
    }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        <div style={{
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          color: 'var(--color-green-dark)',
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
        }}>
          — ЗА ВРЕМЯ КУРСА
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 700,
          color: 'var(--color-ink)',
          margin: 'var(--space-3) 0 0',
          lineHeight: 1.15,
        }}>
          Что изменится уже за 7 уроков
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-5)',
          marginTop: 'var(--space-10)',
        }} className="benefits-grid">
          {BENEFITS.map((b, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                background: 'var(--color-white)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                padding: 'var(--space-6)',
                boxShadow: hoveredIndex === i ? 'var(--shadow-hover)' : 'var(--shadow-card)',
                transform: hoveredIndex === i ? 'translateY(-2px)' : 'none',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(18px, 1.5vw, 21px)',
                fontWeight: 600,
                color: 'var(--color-green-base)',
                lineHeight: 1.2,
                margin: '0 0 12px',
              }}>
                {b.title}
              </h3>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(14px, 1.2vw, 16px)',
                color: 'var(--color-ink-soft)',
                lineHeight: 1.55,
                margin: 0,
              }}>
                {b.desc}
              </p>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .benefits-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .benefits-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  )
}
