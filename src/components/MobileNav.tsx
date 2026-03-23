'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useMember } from '@/contexts/MemberContext'

const items = [
  { href: '/dashboard', label: 'Главная', icon: '🏠' },
  { href: '/dashboard/kitchen', label: 'Кухня', icon: '🍳' },
  { href: '/dashboard/diary', label: 'Дневник', icon: '📓' },
  { href: '/dashboard/profile', label: 'Профиль', icon: '👤' },
  { href: '/dashboard/channel', label: 'Чат', icon: '💬', hasUnread: true },
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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex items-center justify-around px-2 py-2 safe-b"
      style={{ background: '#fff', borderColor: '#EDE9FF' }}
    >
      {items.map(({ href, label, icon, hasUnread }) => {
        const isActive = pathname === href
        const showDot = hasUnread && unread > 0
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
            style={{
              color: isActive ? 'var(--pur)' : 'var(--text)',
              opacity: isActive ? 1 : 0.45,
            }}
          >
            <span className="text-xl relative">
              {icon}
              {showDot && (
                <span
                  className="absolute -top-0.5 -right-0.5 rounded-full border-2 border-white"
                  style={{ width: 10, height: 10, background: '#E53E3E' }}
                />
              )}
            </span>
            <span
              className="text-[10px] font-medium"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              {label}
            </span>
          </Link>
        )
      })}
      {isAdmin && (
        <Link
          href="/admin/messages"
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
          style={{
            color: pathname.startsWith('/admin') ? 'var(--pur)' : 'var(--text)',
            opacity: pathname.startsWith('/admin') ? 1 : 0.45,
          }}
        >
          <span className="text-xl">⚙️</span>
          <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-nunito)' }}>
            Админка
          </span>
        </Link>
      )}
    </nav>
  )
}
