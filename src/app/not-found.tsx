import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)', fontFamily: 'var(--font-nunito)' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">

        {/* Illustration */}
        <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background circle */}
          <circle cx="80" cy="80" r="72" fill="#F0EEFF" />
          {/* Map/path */}
          <rect x="44" y="52" width="72" height="56" rx="8" fill="white" stroke="#DDD5FF" strokeWidth="2"/>
          {/* Map lines */}
          <path d="M56 72 Q68 64 76 76 Q84 88 96 80" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d="M56 84 Q64 80 72 84" stroke="#E9D5FF" strokeWidth="2" strokeLinecap="round" fill="none"/>
          {/* Question mark on map */}
          <text x="92" y="78" fill="#7C5CFC" fontSize="20" fontWeight="700" fontFamily="system-ui">?</text>
          {/* Magnifying glass */}
          <circle cx="68" cy="96" r="14" fill="white" stroke="#7C5CFC" strokeWidth="2.5"/>
          <circle cx="68" cy="96" r="8" fill="#F0EEFF" stroke="#7C5CFC" strokeWidth="2"/>
          <line x1="78" y1="106" x2="86" y2="114" stroke="#7C5CFC" strokeWidth="3" strokeLinecap="round"/>
          {/* Stars */}
          <circle cx="36" cy="44" r="3" fill="#FFD93D"/>
          <circle cx="124" cy="52" r="2" fill="#A8E6CF"/>
          <circle cx="120" cy="116" r="3" fill="#FF9F43"/>
          <circle cx="40" cy="112" r="2" fill="#7C5CFC" opacity="0.4"/>
        </svg>

        {/* Text */}
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

        {/* Buttons */}
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
