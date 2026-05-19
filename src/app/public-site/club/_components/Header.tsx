'use client'
import { useState, useEffect, useCallback } from 'react'

const BASE_NAV_LINKS = [
  { label: 'Результаты', href: '#results' },
  { label: 'Программа', href: '#roadmap' },
  { label: 'Платформа', href: '#platform' },
  { label: 'Стоимость', href: '#pricing' },
]

export default function Header() {
  const isDiagnostic = process.env.NEXT_PUBLIC_CLUB_MODE === 'diagnostic'

  const NAV_LINKS = isDiagnostic
    ? BASE_NAV_LINKS.filter(l => l.label !== 'Стоимость')
    : BASE_NAV_LINKS

  const ctaHref = isDiagnostic ? '#diagnostic' : '#pricing'

  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    const onClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.l-header')) setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [menuOpen])

  const scrollTo = useCallback((href: string) => {
    setMenuOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <header className={`l-header${scrolled ? ' is-scrolled' : ''}`}>
      <a href="/" className="l-logo">
        <span className="l-logo__name">Наталья Томшина</span>
        <span className="l-logo__sub">интегративный нутрициолог</span>
      </a>

      <nav className="l-nav" aria-label="Навигация">
        {NAV_LINKS.map((link) => (
          <button key={link.href} className="l-nav__link" onClick={() => scrollTo(link.href)}>
            {link.label}
          </button>
        ))}
      </nav>

      <button
        className={`l-hamburger${menuOpen ? ' is-open' : ''}`}
        onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
        aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
        aria-expanded={menuOpen}
      >
        <span /><span /><span />
      </button>

      <a href={ctaHref} className="btn btn--green btn--md l-header__cta">
        Записаться в клуб
      </a>

      {menuOpen && (
        <nav className="l-mobile-menu" aria-label="Мобильное меню">
          {NAV_LINKS.map((link) => (
            <button key={link.href} className="l-mobile-menu__link" onClick={() => scrollTo(link.href)}>
              {link.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  )
}
