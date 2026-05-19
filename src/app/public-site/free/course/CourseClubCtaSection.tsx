'use client'

declare global {
  interface Window {
    ym?: (id: number, action: string, goal: string) => void
  }
}

export default function CourseClubCtaSection() {
  return (
    <section style={{
      background: 'var(--color-cream)',
      padding: 'var(--space-20) 5%',
    }}>
      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(32px, 4.5vw, 48px)',
          fontWeight: 700,
          color: 'var(--color-ink)',
          lineHeight: 1.1,
          margin: 0,
        }}>
          Хотите больше?<br />
          Вступайте в{' '}
          <em style={{ color: 'var(--color-green-dark)', fontStyle: 'italic' }}>
            Клуб «Вкус Жизни»
          </em>
        </h2>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(16px, 1.5vw, 18px)',
          color: 'var(--color-ink)',
          lineHeight: 1.6,
          maxWidth: 620,
          margin: 'var(--space-6) 0 0',
        }}>
          В клубе полная система: марафоны каждый месяц, умная кухня
          с рационами и рецептами, чат единомышленниц и поддержка нутрициолога.
        </p>

        <p style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 'clamp(20px, 2.5vw, 26px)',
          color: 'var(--color-green-dark)',
          lineHeight: 1.3,
          margin: 'var(--space-6) 0 0',
        }}>
          2–3 кг в месяц. Без надрыва. Зато навсегда.
        </p>

        <a
          href="https://nata-tomshina.ru/club"
          onClick={() => window.ym?.(108262096, 'reachGoal', 'course_to_club_click')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginTop: 'var(--space-8)',
            background: 'var(--grad-green-btn)',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            fontWeight: 700,
            padding: '20px 44px',
            borderRadius: 'var(--radius-full)',
            textDecoration: 'none',
            boxShadow: 'var(--shadow-green-btn)',
            letterSpacing: '0.03em',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Узнать о клубе «Вкус Жизни» →
        </a>

      </div>
    </section>
  )
}
