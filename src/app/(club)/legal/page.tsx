import Link from 'next/link'

const DOCS = [
  { href: '/legal/oferta',     label: 'Договор публичной оферты' },
  { href: '/legal/rules',      label: 'Правила клуба' },
  { href: '/legal/terms',      label: 'Пользовательское соглашение' },
  { href: '/legal/privacy',    label: 'Политика конфиденциальности' },
  { href: '/legal/disclaimer', label: 'Медицинский дисклеймер' },
  { href: '/legal/refund',     label: 'Политика возврата' },
  { href: '/legal/affiliate',  label: '✦ Условия партнёрской программы', highlight: true },
]

export default function LegalIndexPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#FAF8FF',
      fontFamily: 'var(--font-nunito)',
      padding: '24px 16px 48px',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link
          href="/"
          style={{
            display: 'inline-block', marginBottom: 20,
            fontSize: 13, color: '#7B6FAA', textDecoration: 'none',
            padding: '8px 14px', borderRadius: 10, background: '#F0EEFF',
          }}
        >
          ← На главную
        </Link>

        <div style={{
          background: '#fff',
          border: '1px solid #EDE8FF',
          borderRadius: 20,
          padding: '28px 24px',
        }}>
          <h1 style={{
            margin: '0 0 8px',
            fontFamily: 'var(--font-unbounded)',
            fontSize: 18,
            fontWeight: 700,
            color: '#2D1F6E',
            lineHeight: 1.35,
          }}>
            Юридические документы
          </h1>
          <p style={{ margin: '0 0 28px', fontSize: 13, color: '#7B6FAA', lineHeight: 1.6 }}>
            Клуб «Вкус Жизни» · ИП Томшина Наталья Викторовна
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DOCS.map(({ href, label, highlight }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: 14,
                  background: highlight ? '#FFFBE6' : '#F9F8FF',
                  border: highlight ? '1.5px solid #FFD93D' : '1px solid #EDE8FF',
                  textDecoration: 'none',
                  color: highlight ? '#5C4200' : '#2D1F6E',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'background 0.15s',
                }}
              >
                <span>{label}</span>
                <span style={{ color: highlight ? '#B8860B' : '#9B8FCC', fontSize: 16 }}>→</span>
              </Link>
            ))}
          </div>

          <p style={{
            margin: '28px 0 0',
            fontSize: 12,
            color: '#9B8FCC',
            lineHeight: 1.7,
            borderTop: '1px solid #EDE8FF',
            paddingTop: 20,
          }}>
            ИП Томшина Наталья Викторовна · ОГРНИП 320385000051004 · ИНН 381105203104
          </p>
        </div>
      </div>
    </div>
  )
}
