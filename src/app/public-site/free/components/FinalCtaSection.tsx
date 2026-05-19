'use client'
import EmailForm from './EmailForm'

export default function FinalCtaSection() {
  return (
    <section style={{
      background: 'var(--grad-orange-card)',
      padding: 'var(--space-24) 5%',
    }}>
      <div style={{
        maxWidth: 760,
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
          background: 'linear-gradient(135deg, #FFE8D0, #FFD4A8)',
          borderRadius: 'var(--radius-full)',
          padding: '8px 20px',
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          color: 'var(--color-orange-dark)',
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
        }}>
          <span style={{ fontSize: 8, lineHeight: 1 }}>●</span>
          Готовы начать?
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(32px, 5vw, 52px)',
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1.05,
          textAlign: 'center',
          margin: 'var(--space-6) 0 0',
          letterSpacing: '-0.01em',
        }}>
          Получите доступ к курсу<br />прямо сейчас
        </h2>

        {/* Lead */}
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(16px, 1.5vw, 18px)',
          color: 'rgba(255,255,255,0.9)',
          lineHeight: 1.55,
          textAlign: 'center',
          margin: 'var(--space-4) 0 0',
          maxWidth: 580,
        }}>
          Без оплаты. Просто впишите email, и откроем 7 уроков сразу.
          Доступ навсегда.
        </p>

        {/* Email Card */}
        <div style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          marginTop: 'var(--space-10)',
          boxShadow: '0 30px 70px rgba(184, 69, 0, 0.35)',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 600,
            color: 'var(--color-ink)',
            textAlign: 'center',
            margin: '0 0 var(--space-5)',
          }}>
            Получить доступ
          </h3>

          <EmailForm
            buttonVariant="orange"
            size="lg"
            ymGoal="free_email_sent_final"
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
