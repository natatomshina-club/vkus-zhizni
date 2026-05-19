import Link from 'next/link'
import { headers } from 'next/headers'

export default async function NotFound() {
  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  const isPublic = host === 'nata-tomshina.ru' || host === 'www.nata-tomshina.ru'

  if (isPublic) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #1A0E4E 0%, #3D2B8A 60%, #4F3B9F 100%)',
      }}>
        <div style={{ textAlign: 'center', color: '#fff', maxWidth: 440, padding: '0 24px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>
            Страница не найдена
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.6, margin: '0 0 40px' }}>
            Возможно, ссылка устарела или страница была перемещена
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <a href="/" style={{
              background: '#22c55e', color: '#fff', padding: '14px 24px', borderRadius: 100,
              fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'block',
            }}>
              На главную
            </a>
            <a href="/blog" style={{
              background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '14px 24px',
              borderRadius: 100, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'block',
            }}>
              Читать блог
            </a>
            <a href="/recipes" style={{
              background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '14px 24px',
              borderRadius: 100, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'block',
            }}>
              Посмотреть рецепты
            </a>
            <a href="/club" style={{
              border: '2px solid rgba(255,255,255,0.5)', color: '#fff', padding: '14px 24px',
              borderRadius: 100, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'block',
            }}>
              О клубе
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Клубная 404
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)', fontFamily: 'var(--font-nunito)' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
        <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="80" cy="80" r="72" fill="#F0EEFF" />
          <rect x="44" y="52" width="72" height="56" rx="8" fill="white" stroke="#DDD5FF" strokeWidth="2"/>
          <path d="M56 72 Q68 64 76 76 Q84 88 96 80" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d="M56 84 Q64 80 72 84" stroke="#E9D5FF" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <text x="92" y="78" fill="#7C5CFC" fontSize="20" fontWeight="700" fontFamily="system-ui">?</text>
          <circle cx="68" cy="96" r="14" fill="white" stroke="#7C5CFC" strokeWidth="2.5"/>
          <circle cx="68" cy="96" r="8" fill="#F0EEFF" stroke="#7C5CFC" strokeWidth="2"/>
          <line x1="78" y1="106" x2="86" y2="114" stroke="#7C5CFC" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="36" cy="44" r="3" fill="#FFD93D"/>
          <circle cx="124" cy="52" r="2" fill="#A8E6CF"/>
          <circle cx="120" cy="116" r="3" fill="#FF9F43"/>
          <circle cx="40" cy="112" r="2" fill="#7C5CFC" opacity="0.4"/>
        </svg>
        <div className="flex flex-col gap-2">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}
          >
            Упс, такой страницы нет
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Возможно ссылка устарела или была удалена
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center py-3.5 rounded-2xl text-white text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
          >
            Вернуться в клуб
          </Link>
          <Link
            href="/"
            className="w-full flex items-center justify-center py-3.5 rounded-2xl text-sm font-semibold transition-colors hover:opacity-80"
            style={{
              background: 'var(--card)',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-nunito)',
            }}
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  )
}
