import type { Meal, KBJUData } from '../data/racion'
import { MEAL_LABELS, REF_MEAL_NAMES } from '../data/racion'

const KBJU_CONFIG = [
  { key: 'kcal' as const,    label: 'Ккал',   color: '#B84500', bg: '#FEF0E8', unit: ''  },
  { key: 'protein' as const, label: 'Белки',  color: '#1F5A33', bg: '#E8F5EE', unit: 'г' },
  { key: 'fat' as const,     label: 'Жиры',   color: '#F77D27', bg: '#FFF4E8', unit: 'г' },
  { key: 'carbs' as const,   label: 'Углев.', color: '#5B7A8A', bg: '#EEF3F7', unit: 'г' },
]

const MEAL_ACCENT: Record<string, string> = {
  breakfast: '#F77D27',
  lunch: '#2B7A3D',
  dinner: '#5B7A8A',
}

export default function MealCard({ meal }: { meal: Meal }) {
  const accent = MEAL_ACCENT[meal.type]

  if (meal.kind === 'repeat') {
    return (
      <div style={{
        background: 'var(--color-cream)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        borderLeft: `4px solid ${accent}`,
        padding: 'var(--space-4) var(--space-5)',
      }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: accent,
          marginBottom: 6,
        }}>
          {MEAL_LABELS[meal.type]}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(16px, 1.2vw, 18px)',
          fontWeight: 600,
          color: 'var(--color-ink)',
          lineHeight: 1.3,
          marginBottom: 10,
        }}>
          {meal.title}
        </div>
        <a
          href={`#racion-day-${meal.refDay}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--color-green-dark)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          <span>↑</span>
          <span>Рецепт из Дня {meal.refDay} · {REF_MEAL_NAMES[meal.refMeal]}</span>
        </a>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--color-white)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      borderLeft: `4px solid ${accent}`,
      boxShadow: 'var(--shadow-card)',
      padding: 'var(--space-5) var(--space-5) var(--space-6)',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        flexWrap: 'wrap',
        marginBottom: 'var(--space-4)',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: accent,
            marginBottom: 4,
          }}>
            {MEAL_LABELS[meal.type]}
          </div>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(17px, 1.4vw, 19px)',
            fontWeight: 600,
            color: 'var(--color-ink)',
            lineHeight: 1.25,
            margin: 0,
          }}>
            {meal.title}
          </h3>
        </div>
        {meal.portionNote && (
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--color-ink-soft)',
            background: 'var(--color-cream)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            border: '1px solid var(--color-border)',
          }}>
            {meal.portionNote}
          </span>
        )}
      </div>

      {/* КБЖУ */}
      {meal.kbju && <KbjuTable kbju={meal.kbju} />}

      {/* Ingredients */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--color-green-dark)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--space-2)',
        }}>
          Ингредиенты:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {meal.ingredients.map((ing, i) => (
            <div
              key={i}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                color: 'var(--color-ink)',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <span style={{ color: 'var(--color-green)', fontSize: 9, flexShrink: 0 }}>●</span>
              <span>{ing.amount ? `${ing.item} — ${ing.amount}` : ing.item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      {meal.steps.length > 0 && (
        <div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--color-green-dark)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 'var(--space-2)',
          }}>
            Приготовление:
          </div>
          <ol style={{
            margin: 0,
            paddingLeft: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            {meal.steps.map((step, i) => (
              <li
                key={i}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  color: 'var(--color-ink)',
                  lineHeight: 1.6,
                }}
              >
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

    </div>
  )
}

function KbjuTable({ kbju }: { kbju: KBJUData }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      border: '1px solid var(--color-border)',
      marginBottom: 'var(--space-5)',
    }}>
      {KBJU_CONFIG.map((cell, i) => (
        <div
          key={cell.key}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '8px 4px',
            borderRight: i < 3 ? '1px solid var(--color-border)' : 'none',
          }}
        >
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 700,
            color: cell.color,
            background: cell.bg,
            padding: '2px 6px',
            borderRadius: 4,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
          }}>
            {cell.label}
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-ink)',
            textAlign: 'center',
          }}>
            {kbju[cell.key]}{cell.unit}
          </div>
        </div>
      ))}
    </div>
  )
}
