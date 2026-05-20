import Link from 'next/link'

export default function PublicFooter() {
  return (
    <footer style={{
      background: 'var(--color-hero-bg)',
      padding: '32px 6%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 16,
    }}>
      <p style={{ fontSize: 12, color: 'rgba(var(--color-white-rgb),0.3)', margin: 0 }}>
        © 2026 Наталья Томшина · Клуб «Вкус Жизни»
      </p>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { href: '/about', label: 'О методе' },
          { href: '/results', label: 'Результаты' },
          { href: '/blog', label: 'Блог' },
          { href: '/marathon', label: 'Марафон' },
          { href: '/club', label: 'О клубе' },
          { href: 'https://club.nata-tomshina.ru/legal/privacy', label: 'Конфиденциальность', external: true },
          { href: 'https://nata-tomshina.ru/legal', label: 'Документы', external: true },
        ].map(({ href, label, external }) =>
          external ? (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" style={{
              color: 'rgba(var(--color-white-rgb),0.5)', textDecoration: 'none',
              fontSize: 12, fontWeight: 600,
            }}>
              {label}
            </a>
          ) : (
            <Link key={href} href={href} style={{
              color: 'rgba(var(--color-white-rgb),0.5)', textDecoration: 'none',
              fontSize: 12, fontWeight: 600,
            }}>
              {label}
            </Link>
          )
        )}
      </div>
    </footer>
  )
}
