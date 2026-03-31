'use client'
import Link from 'next/link'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/about', label: 'О Наташе' },
  { href: '/results', label: 'Результаты' },
  { href: '/marathon', label: 'Марафон' },
  { href: '/blog', label: 'Блог' },
  { href: '/club', label: 'О клубе' },
  { href: '/partner', label: '✦ Партнёрка', highlight: true },
]

export default function PublicNav({ currentPage }: { currentPage?: string }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={{
      background: 'rgba(250,248,255,0.94)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1.5px solid #EDE8FF',
      padding: '14px 5%',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <Link href="https://nata-tomshina.ru" style={{
        fontFamily: 'var(--font-unbounded)',
        fontSize: 15,
        fontWeight: 700,
        color: '#3D2B8A',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#4CAF78',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14,
        }}>🌿</span>
        Вкус Жизни
      </Link>

      {/* Desktop links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="pub-nav-links">
        {NAV_LINKS.map(({ href, label, highlight }) => (
          <Link key={href} href={href} style={{
            fontSize: 13, fontWeight: 700,
            color: highlight ? '#5C4200' : currentPage === href ? '#3D2B8A' : '#7B6FAA',
            textDecoration: 'none',
            padding: '6px 14px',
            borderRadius: 20,
            background: highlight ? '#FFD93D' : currentPage === href ? '#EDE8FF' : 'transparent',
            transition: '0.2s',
          }}>
            {label}
          </Link>
        ))}
        <a href="https://club.nata-tomshina.ru/join?plan=trial" style={{
          background: '#4CAF78', color: '#fff',
          padding: '10px 22px', borderRadius: 24,
          fontSize: 13, fontWeight: 700,
          textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(76,175,120,.3)',
          whiteSpace: 'nowrap',
        }}>
          Попробовать за 149 ₽
        </a>
      </div>

      {/* Mobile burger */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="pub-nav-burger"
        style={{
          display: 'none',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 8, color: '#3D2B8A', fontSize: 22,
        }}
        aria-label="Меню"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {menuOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'rgba(250,248,255,0.98)',
          borderBottom: '1.5px solid #EDE8FF',
          padding: '16px 5%',
          display: 'flex', flexDirection: 'column', gap: 8,
          zIndex: 200,
        }} className="pub-nav-mobile">
          {NAV_LINKS.map(({ href, label, highlight }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
              fontSize: 15, fontWeight: highlight ? 700 : 600,
              color: highlight ? '#5C4200' : '#3D2B8A',
              textDecoration: 'none',
              padding: '10px 12px',
              borderBottom: '1px solid #EDE8FF',
              background: highlight ? '#FFD93D' : 'transparent',
              borderRadius: highlight ? 10 : 0,
            }}>
              {label}
            </Link>
          ))}
          <a href="https://club.nata-tomshina.ru/join?plan=trial" style={{
            background: '#4CAF78', color: '#fff',
            padding: '14px 22px', borderRadius: 24,
            fontSize: 15, fontWeight: 700,
            textDecoration: 'none', textAlign: 'center',
            marginTop: 8,
          }}>
            Попробовать за 149 ₽
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 700px) {
          .pub-nav-links { display: none !important; }
          .pub-nav-burger { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}
