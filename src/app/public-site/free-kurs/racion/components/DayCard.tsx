'use client'
import type { Day } from '../data/racion'
import MealCard from './MealCard'

export default function DayCard({
  day,
  isOpen,
  onToggle,
}: {
  day: Day
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div
      id={`racion-day-${day.num}`}
      style={{
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-lg)',
        border: isOpen ? '2px solid var(--color-green)' : '1px solid var(--color-border)',
        boxShadow: isOpen ? '0 8px 24px rgba(99,186,108,0.12)' : 'var(--shadow-card)',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        scrollMarginTop: 80,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
          padding: 'var(--space-5) var(--space-6)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--radius-sm)',
          background: isOpen ? 'var(--color-green-base)' : 'var(--color-cream)',
          border: isOpen ? 'none' : '2px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.2s, border-color 0.2s',
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 700,
            color: isOpen ? '#fff' : 'var(--color-ink)',
            lineHeight: 1,
          }}>
            {day.num}
          </span>
        </div>

        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(15px, 1.3vw, 17px)',
            fontWeight: 600,
            color: 'var(--color-ink)',
          }}>
            День {day.num}
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--color-ink-soft)',
            marginTop: 2,
            lineHeight: 1.4,
          }}>
            {day.summary}
          </div>
        </div>

        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.25s ease',
            color: 'var(--color-ink-soft)',
          }}
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div style={{
        display: 'grid',
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.4s ease-out',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '0 var(--space-6) var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}>
            {day.meals.map((meal, i) => (
              <MealCard key={i} meal={meal} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
