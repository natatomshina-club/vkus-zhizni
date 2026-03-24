'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useMember } from '@/contexts/MemberContext'

const nav = [
  {
    items: [
      { href: '/dashboard', label: 'Главная', icon: '🏠' },
      { href: '/dashboard/about', label: 'О клубе', icon: '💜' },
    ],
  },
  {
    items: [
      { href: '/dashboard/kitchen', label: 'Умная кухня', icon: '🍳' },
      { href: '/dashboard/favorites', label: 'Избранные рецепты', icon: '❤️' },
      { href: '/dashboard/diary', label: 'Дневник', icon: '📓' },
      { href: '/dashboard/tracker', label: 'Трекер', icon: '📏' },
      { href: '/dashboard/wins', label: 'Победы', icon: '🏆' },
    ],
  },
  {
    label: 'Обучение',
    items: [
      { href: '/dashboard/courses', label: 'Курсы', icon: '🎓' },
      { href: '/dashboard/body', label: 'Я и моё тело', icon: '🌸' },
      { href: '/dashboard/webinars', label: 'Вебинары', icon: '🎥' },
      { href: '/dashboard/meditations', label: 'Медитации', icon: '🧘' },
    ],
  },
  {
    items: [
      { href: '/dashboard/marathon', label: 'Марафон', icon: '🔥' },
      { href: '/dashboard/channel', label: 'Чаты клуба', icon: '💬' },
      { href: '/dashboard/profile', label: 'Профиль', icon: '👤' },
    ],
  },
]

function getDayInClub(createdAt: string | null | undefined): number {
  if (!createdAt) return 1
  const diff = Date.now() - new Date(createdAt).getTime()
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1)
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { member } = useMember()

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

  const isAdmin = member?.role === 'admin'
  const isTrial = member?.status === 'trial' || !member?.status
  const day = getDayInClub((member as unknown as { created_at?: string })?.created_at)

  const kbzhu = [
    { label: 'Вес', value: member?.weight,       unit: ' кг' },
    { label: 'К',   value: member?.kbju_calories, unit: '' },
    { label: 'Б',   value: member?.kbju_protein,  unit: 'г' },
    { label: 'Ж',   value: member?.kbju_fat,       unit: 'г' },
    { label: 'У',   value: member?.kbju_carbs,     unit: 'г' },
  ]

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0 min-h-screen border-r"
      style={{ width: 220, background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <p className="text-base font-bold leading-none" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--pur)' }}>
          Вкус Жизни
        </p>
        <p className="text-[11px] mt-1 font-medium leading-snug" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          клуб стройных и здоровых
        </p>
      </div>

      {/* Member block */}
      <div className="px-3 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="rounded-2xl p-3" style={{ background: 'var(--bg)' }}>
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
            {member?.name ?? 'Участница клуба'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            День {day} · {isTrial ? 'Триал' : 'Полный клуб'}
          </p>

          {/* КБЖУ chips */}
          <div className="mt-2.5 flex flex-wrap gap-1">
            {kbzhu.map(({ label, value, unit }) => (
              <span
                key={label}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--pur-light)', color: 'var(--pur)' }}
              >
                {label}: {value != null ? `${value}${unit}` : '—'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
        {nav.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="my-2 mx-1 border-t" style={{ borderColor: 'var(--border)' }} />}
            {group.label && (
              <p className="text-[9px] uppercase tracking-widest px-2 mb-1 mt-1" style={{ color: 'var(--muted)' }}>
                {group.label}
              </p>
            )}
            {group.items.map(({ href, label, icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] transition-all"
                  style={{
                    background: isActive ? 'var(--pur)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text)',
                    fontWeight: isActive ? 600 : 400,
                    opacity: isActive ? 1 : 0.8,
                  }}
                >
                  <span className="text-base leading-none">{icon}</span>
                  <span className="flex-1">{label}</span>
                  {href === '/dashboard/channel' && unread > 0 && (
                    <span
                      className="rounded-full text-[10px] font-bold text-white px-1.5 py-0.5 leading-none"
                      style={{ background: '#E53E3E', fontFamily: 'var(--font-nunito)' }}
                    >
                      {unread}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Admin link */}
      {isAdmin && (
        <div className="px-2 pb-1">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] transition-all"
            style={{
              background: pathname.startsWith('/admin') ? 'var(--pur)' : 'var(--pur-lt)',
              color: pathname.startsWith('/admin') ? '#fff' : 'var(--pur)',
              fontWeight: 600,
            }}
          >
            <span className="text-base leading-none">⚙️</span>
            <span className="flex-1">Админка</span>
          </Link>
        </div>
      )}

      {/* Bottom badge */}
      <div className="px-3 pb-5">
        {isTrial ? (
          <div className="rounded-2xl px-3 py-3 text-center" style={{ background: 'linear-gradient(135deg, var(--pur) 0%, #9B7CFF 100%)' }}>
            <p className="text-xs font-bold text-white leading-snug">⏳ Пробный период</p>
            <p className="text-[10px] text-white/70 mt-0.5">7 дней · 49₽</p>
            <a
              href="/join"
              className="mt-2 inline-block text-[10px] font-semibold px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}
            >
              Открыть полный доступ
            </a>
          </div>
        ) : (
          <div className="rounded-2xl px-3 py-3 text-center" style={{ background: 'var(--grn-light)' }}>
            <p className="text-xs font-bold" style={{ color: '#1A7A4F' }}>✅ Полный клуб</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#1A7A4F', opacity: 0.7 }}>Все материалы доступны</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full mt-2 text-[11px] text-center py-1.5 rounded-xl transition-colors hover:bg-red-50"
          style={{ color: 'var(--muted)' }}
        >
          Выйти
        </button>
      </div>
    </aside>
  )
}
