'use client'
import EmailForm from './EmailForm'
import KinescopeHeroPlayer from './KinescopeHeroPlayer'

export default function HeroSection() {
  return (
    <section style={{
      background: 'var(--grad-green-card)',
      padding: 'var(--space-20) 5%',
    }}>
      <div style={{
        maxWidth: 980,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--grad-green-pill)',
          borderRadius: 'var(--radius-full)',
          padding: '8px 20px',
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          color: 'var(--color-green-base)',
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
        }}>
          <span style={{ fontSize: 8, lineHeight: 1 }}>●</span>
          Бесплатный мини-курс
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 7vw, 84px)',
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1.0,
          textAlign: 'center',
          margin: 'var(--space-6) 0 0',
          letterSpacing: '-0.01em',
        }}>
          Волшебный пендель
        </h1>

        {/* Subtitle */}
        <p style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 'clamp(22px, 3vw, 36px)',
          fontWeight: 400,
          color: 'var(--color-green-light)',
          lineHeight: 1.2,
          textAlign: 'center',
          margin: 'var(--space-4) 0 0',
          maxWidth: 820,
        }}>
          Как выйти из круга «диета-срыв-диета»
        </p>

        {/* Lead */}
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(16px, 1.8vw, 20px)',
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.55,
          textAlign: 'center',
          margin: 'var(--space-6) 0 0',
          maxWidth: 720,
        }}>
          Без голодовок и подсчёта калорий.{' '}
          7 коротких уроков, которые объяснят, почему диеты не работают,
          и что делать прямо сейчас.
        </p>

        {/* Video */}
        <div style={{
          width: '100%',
          maxWidth: 880,
          margin: 'var(--space-10) 0',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 30px 70px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}>
          <KinescopeHeroPlayer />
        </div>

        {/* Email Card */}
        <div style={{
          width: '100%',
          maxWidth: 560,
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-card-lg)',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 600,
            color: 'var(--color-ink)',
            textAlign: 'center',
            margin: '0 0 var(--space-2)',
          }}>
            Получить доступ к курсу
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--color-ink-soft)',
            textAlign: 'center',
            margin: '0 0 var(--space-5)',
          }}>
            Введите email — откроем курс сразу.
          </p>

          <EmailForm
            buttonVariant="green"
            size="lg"
            ymGoal="free_email_sent_hero"
          />

          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--color-ink-soft)',
            textAlign: 'center',
            margin: 'var(--space-4) 0 0',
          }}>
            Нажимая кнопку, вы соглашаетесь с{' '}
            <a
              href="/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-ink-soft)', textDecoration: 'underline' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-green-dark)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-soft)')}
            >обработкой персональных данных</a>
          </p>
        </div>

      </div>
    </section>
  )
}
