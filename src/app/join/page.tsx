import Link from 'next/link'

const LEGAL_LINKS = [
  { href: '/legal/terms',      label: 'Пользовательское соглашение' },
  { href: '/legal/privacy',    label: 'Политика конфиденциальности' },
  { href: '/legal/disclaimer', label: 'Медицинский дисклеймер' },
  { href: '/legal/rules',      label: 'Правила клуба' },
  { href: '/legal/refund',     label: 'Политика возврата' },
]

export default function JoinPage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        fontFamily: 'var(--font-nunito)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 16px 60px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: 'var(--font-unbounded)',
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--pur)',
              margin: 0,
            }}
          >
            Вкус Жизни
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
            Клуб стройных и здоровых
          </p>
        </div>

        {/* Offer card */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: '28px 24px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #7C5CFC 0%, #9B7BFF 100%)',
              borderRadius: 16,
              padding: '20px',
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '0 0 6px' }}>
              Пробный период
            </p>
            <p
              style={{
                fontFamily: 'var(--font-unbounded)',
                fontSize: 36,
                fontWeight: 800,
                color: '#fff',
                margin: '0 0 4px',
              }}
            >
              49 ₽
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
              7 дней полного доступа
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {[
              '🍳 Умная кухня с ИИ-помощником',
              '📓 Дневник питания',
              '📏 Трекер замеров',
              '🎓 Вводный курс (6 видеоуроков)',
              '🏆 Маленькие победы',
              '💬 Чат с Наташей',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text)' }}>
                <span style={{ flexShrink: 0 }}>{item.slice(0, 2)}</span>
                <span>{item.slice(3)}</span>
              </div>
            ))}
          </div>

          <a
            href="https://vkuszhizni.payform.ru"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #2A9D5C 0%, #52C98D 100%)',
              borderRadius: 16,
              color: '#fff',
              fontFamily: 'var(--font-nunito)',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            🌿 Начать за 49 ₽
          </a>

          <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', margin: '12px 0 0', lineHeight: 1.6 }}>
            После 7 дней — 1 500 ₽/месяц. Отменить можно в любой момент.
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginBottom: 32 }}>
          Уже есть доступ?{' '}
          <Link href="/auth" style={{ color: 'var(--pur)', textDecoration: 'underline' }}>
            Войти
          </Link>
        </p>

        {/* Legal footer */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 20,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 16px',
            justifyContent: 'center',
          }}
        >
          {LEGAL_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                color: 'var(--pale)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
