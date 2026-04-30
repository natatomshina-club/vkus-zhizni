'use client'
import Link from 'next/link'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/about', label: 'О методе' },
  { href: '/results', label: 'Результаты' },
  { href: '/marathon', label: 'Марафон' },
  { href: '/menyu', label: 'Рационы' },
  // { href: '/recipes', label: 'Рецепты' },
  { href: '/blog', label: 'Блог' },
]

const logoBlock = (
  <a href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '1px', lineHeight: 1.2 }}>
    <span style={{ fontFamily: 'var(--font-serif-display)', fontSize: '17px', fontWeight: 600, color: 'var(--color-text)', letterSpacing: '0.01em' }}>
      Наталья Томшина
    </span>
    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 400, color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>
      интегративный нутрициолог
    </span>
  </a>
)

export default function PublicNav({ currentPage }: { currentPage?: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hoveredHref, setHoveredHref] = useState<string | null>(null)

  return (
    <nav style={{
      background: 'rgba(var(--color-bg-page-rgb), 0.94)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1.5px solid var(--color-accent-border)',
      padding: '14px 5%',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {logoBlock}

      {/* Desktop links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="pub-nav-links">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = currentPage === href
          const isHovered = hoveredHref === href
          return (
            <Link
              key={href}
              href={href}
              onMouseEnter={() => setHoveredHref(href)}
              onMouseLeave={() => setHoveredHref(null)}
              style={{
                fontFamily: 'var(--font-serif-display)',
                fontSize: 14,
                fontWeight: 400,
                color: isHovered ? 'var(--color-accent)' : 'var(--color-text)',
                textDecoration: 'none',
                padding: '6px 10px',
                borderBottom: isActive
                  ? '1.5px solid var(--color-text)'
                  : isHovered
                    ? '1.5px solid var(--color-accent)'
                    : '1.5px solid transparent',
                transition: 'color 0.15s ease, border-color 0.15s ease',
                letterSpacing: '0.03em',
              }}
            >
              {label}
            </Link>
          )
        })}
        <a href="/club" style={{
          background: 'var(--color-cta-bg)', color: 'var(--color-cta-text)',
          padding: '10px 22px', borderRadius: 24,
          fontSize: 13, fontWeight: 700,
          textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(var(--color-cta-bg-rgb),.3)',
          whiteSpace: 'nowrap',
          marginLeft: 8,
        }}>
          Клуб «Вкус Жизни»
        </a>
      </div>

      {/* Mobile club button (visible only on mobile) */}
      <a
        href="/club"
        className="pub-nav-club-btn"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          fontWeight: 600,
          color: '#fff',
          background: 'var(--color-orange)',
          padding: '6px 14px',
          borderRadius: '20px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Клуб
      </a>

      {/* Mobile burger */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="pub-nav-burger"
        style={{
          display: 'none',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 8, color: 'var(--color-text-primary)', fontSize: 22,
        }}
        aria-label="Меню"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {menuOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'rgba(var(--color-bg-page-rgb), 0.98)',
          borderBottom: '1.5px solid var(--color-accent-border)',
          padding: '16px 5%',
          display: 'flex', flexDirection: 'column', gap: 8,
          zIndex: 200,
        }} className="pub-nav-mobile">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
              fontFamily: 'var(--font-serif-display)',
              fontSize: 17,
              fontWeight: 400,
              color: currentPage === href ? 'var(--color-accent)' : 'var(--color-text-primary)',
              textDecoration: 'none',
              padding: '10px 12px',
              borderBottom: '1px solid var(--color-accent-border)',
            }}>
              {label}
            </Link>
          ))}
          <a href="/club" style={{
            background: 'var(--color-cta-bg)', color: 'var(--color-cta-text)',
            padding: '14px 22px', borderRadius: 24,
            fontSize: 15, fontWeight: 700,
            textDecoration: 'none', textAlign: 'center',
            marginTop: 8,
          }}>
            Клуб «Вкус Жизни»
          </a>
        </div>
      )}

      <style>{`
        .pub-nav-club-btn { display: none; }
        @media (max-width: 700px) {
          .pub-nav-links { display: none !important; }
          .pub-nav-burger { display: flex !important; }
          .pub-nav-club-btn { display: inline-block !important; }
        }
      `}</style>
    </nav>
  )
}
