'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useMember } from '@/contexts/MemberContext'

function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function IconKitchen() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  )
}

function IconDiary() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="11" x2="15" y2="11" />
    </svg>
  )
}

function IconProfile() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

function IconWebinars() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}

function IconAdmin() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}

const items = [
  { href: '/dashboard',          label: 'Главная',  Icon: IconHome,     hasUnread: false },
  { href: '/dashboard/kitchen',  label: 'Кухня',    Icon: IconKitchen,  hasUnread: false },
  { href: '/dashboard/webinars', label: 'Вебинары', Icon: IconWebinars, hasUnread: false },
  { href: '/dashboard/diary',    label: 'Дневник',  Icon: IconDiary,    hasUnread: false },
  { href: '/dashboard/channel',  label: 'Чат',      Icon: IconChat,     hasUnread: true  },
]

export default function MobileNav() {
  const pathname = usePathname()
  const { member } = useMember()
  const isAdmin = member?.role === 'admin'
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch('/api/channel/notifications/unread')
        if (!res.ok) return
        const data = await res.json() as { unread_count: number }
        setUnread(data.unread_count ?? 0)
      } catch { /* silent */ }
    }
    fetchUnread()
    const id = setInterval(fetchUnread, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex items-center justify-around px-2"
      style={{
        background: '#fff',
        borderColor: '#EDE9FF',
        paddingTop: 8,
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {items.map(({ href, label, Icon, hasUnread }) => {
        const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        const showDot = hasUnread && unread > 0
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
            style={{
              color: isActive ? 'var(--pur)' : 'var(--text)',
              opacity: isActive ? 1 : 0.4,
            }}
          >
            <span className="relative">
              <Icon />
              {showDot && (
                <span
                  className="absolute -top-0.5 -right-0.5 rounded-full border-2 border-white"
                  style={{ width: 10, height: 10, background: '#E53E3E' }}
                />
              )}
            </span>
            <span
              className="text-[10px] font-semibold"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              {label}
            </span>
          </Link>
        )
      })}
      {isAdmin && (
        <Link
          href="/admin"
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
          style={{
            color: pathname.startsWith('/admin') ? 'var(--pur)' : 'var(--text)',
            opacity: pathname.startsWith('/admin') ? 1 : 0.4,
          }}
        >
          <IconAdmin />
          <span className="text-[10px] font-semibold" style={{ fontFamily: 'var(--font-nunito)' }}>
            Админка
          </span>
        </Link>
      )}
    </nav>
  )
}
