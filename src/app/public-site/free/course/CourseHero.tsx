import Image from 'next/image'

export default function CourseHero({ email }: { email: string }) {
  return (
    <section style={{
      background: 'var(--grad-green-card)',
      padding: 'var(--space-16) 5%',
    }}>
      <div style={{
        maxWidth: 920,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
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
          У вас есть доступ
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 7vw, 84px)',
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1.0,
          margin: 'var(--space-6) 0 0',
          letterSpacing: '-0.01em',
        }}>
          Волшебный пендель
        </h1>

        {/* Subtitle */}
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(16px, 1.8vw, 19px)',
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.5,
          margin: 'var(--space-5) 0 0',
          maxWidth: 640,
        }}>
          7 уроков, которые объяснят, почему диеты не работают
          и что делать прямо сейчас. Смотрите в своём темпе.
        </p>

        {/* Author card */}
        <div style={{
          marginTop: 'var(--space-8)',
          maxWidth: 480,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 'var(--radius-full)',
          padding: 'var(--space-4) var(--space-6)',
        }}>
          <Image
            src="/images/natalia.jpg"
            alt="Наталья Томшина"
            width={56}
            height={56}
            style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              fontWeight: 600,
              color: '#fff',
            }}>
              Наталья Томшина
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'rgba(255,255,255,0.75)',
              marginTop: 2,
            }}>
              Нутрициолог · Основатель клуба «Вкус Жизни»
            </div>
          </div>
        </div>

        {/* Email */}
        {email && (
          <p style={{
            marginTop: 'var(--space-5)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'rgba(255,255,255,0.6)',
          }}>
            Доступ для: {email}
          </p>
        )}

      </div>
    </section>
  )
}
