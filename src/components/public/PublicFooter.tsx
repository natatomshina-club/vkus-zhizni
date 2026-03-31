import Link from 'next/link'

export default function PublicFooter() {
  return (
    <footer style={{
      background: '#1A0E4E',
      padding: '32px 6%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 16,
    }}>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
        © 2026 Наталья Томшина · Клуб «Вкус Жизни»
      </p>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { href: '/about', label: 'Об авторе' },
          { href: '/blog', label: 'Блог' },
          { href: '/results', label: 'Результаты' },
          { href: '/marathon', label: 'Марафон' },
          { href: '/club', label: 'О клубе' },
          { href: '/partner', label: '✦ Партнёрка', highlight: true },
          { href: 'https://club.nata-tomshina.ru/legal/privacy', label: 'Конфиденциальность', external: true },
          { href: 'https://nata-tomshina.ru/legal', label: 'Документы', external: true },
        ].map(({ href, label, external, highlight }) =>
          external ? (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" style={{
              color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
              fontSize: 12, fontWeight: 600,
            }}>
              {label}
            </a>
          ) : highlight ? (
            <Link key={href} href={href} style={{
              background: '#FFD93D', color: '#5C4200',
              textDecoration: 'none', fontSize: 12, fontWeight: 700,
              padding: '3px 10px', borderRadius: 10,
            }}>
              {label}
            </Link>
          ) : (
            <Link key={href} href={href} style={{
              color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
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
