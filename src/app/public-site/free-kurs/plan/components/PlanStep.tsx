'use client'

interface PlanStepProps {
  num: number
  title: string
  paragraphs: (string | { text: string; accent: true })[]
}

export default function PlanStep({ num, title, paragraphs }: PlanStepProps) {
  return (
    <div style={{
      display: 'flex',
      gap: 'var(--space-5)',
      padding: 'var(--space-6) var(--space-8)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--color-white)',
      boxShadow: 'var(--shadow-card)',
      borderLeft: '5px solid var(--color-orange)',
      marginBottom: 'var(--space-5)',
    }}>
      <div style={{
        width: 64,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'flex-start',
        paddingTop: 4,
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 'clamp(40px, 5vw, 60px)',
          lineHeight: 1,
          color: 'var(--color-orange)',
        }}>
          {num}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(19px, 2vw, 23px)',
          fontWeight: 600,
          color: 'var(--color-ink)',
          lineHeight: 1.2,
          margin: '0 0 var(--space-3)',
        }}>
          {title}
        </h3>
        {paragraphs.map((p, i) =>
          typeof p === 'string' ? (
            <p key={i} style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(15px, 1.3vw, 17px)',
              lineHeight: 1.6,
              color: 'var(--color-ink)',
              margin: i < paragraphs.length - 1 ? '0 0 var(--space-3)' : 0,
            }}>
              {p}
            </p>
          ) : (
            <p key={i} style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(15px, 1.3vw, 17px)',
              lineHeight: 1.6,
              color: 'var(--color-green-base)',
              fontWeight: 600,
              margin: i < paragraphs.length - 1 ? '0 0 var(--space-3)' : 0,
            }}>
              {p.text}
            </p>
          )
        )}
      </div>
    </div>
  )
}
