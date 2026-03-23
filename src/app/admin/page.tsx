import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import type { AdminStats } from '@/types/admin'

async function getStats(): Promise<AdminStats> {
  const admin = createServiceClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [total, trial, active, cancelled, blocked, newToday, newWeek] = await Promise.all([
    admin.from('members').select('id', { count: 'exact', head: true }),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('subscription_status', 'trial'),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('subscription_status', 'cancelled'),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('subscription_status', 'blocked'),
    admin.from('members').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
    admin.from('members').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
  ])

  return {
    total: total.count ?? 0,
    trial: trial.count ?? 0,
    active: active.count ?? 0,
    cancelled: cancelled.count ?? 0,
    blocked: blocked.count ?? 0,
    new_today: newToday.count ?? 0,
    new_week: newWeek.count ?? 0,
  }
}

const SECTIONS = [
  {
    label: 'Участницы',
    desc: 'Управление и тарифы',
    href: '/admin/members',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4CAF78" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Важное от Наташи',
    desc: 'Объявления для клуба',
    href: '/admin/announcements',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
      </svg>
    ),
  },
  {
    label: 'Сообщения',
    desc: 'Личные переписки',
    href: '/admin/messages',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF9F43" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Я и моё тело',
    desc: 'Контент для участниц',
    href: '/admin/body',
    active: false,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9B8FCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    label: 'Вебинары',
    desc: 'Уроки и доступы',
    href: '/admin/webinars',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#56CCF2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    label: 'Медитации',
    desc: 'Аудио и практики',
    href: '/admin/meditations',
    active: false,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9B8FCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
  {
    label: 'Рассылки',
    desc: 'Email-кампании',
    href: '/admin/emails',
    active: false,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9B8FCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    label: 'Аналитика',
    desc: 'Статистика клуба',
    href: '/admin/analytics',
    active: false,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9B8FCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
]

export default async function AdminPage() {
  const stats = await getStats()

  return (
    <div>
      {/* Stats strip */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #EDE8FF',
          borderRadius: 16,
          padding: '16px 20px',
          marginBottom: 28,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px 24px',
        }}
      >
        {[
          { label: 'Всего', value: stats.total },
          { label: 'Триал', value: stats.trial },
          { label: 'Активных', value: stats.active },
          { label: 'Отменили', value: stats.cancelled },
          { label: 'Новых сегодня', value: stats.new_today },
          { label: 'За неделю', value: stats.new_week },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#3D2B8A', fontFamily: 'var(--font-unbounded)' }}>
              {s.value}
            </span>
            <span style={{ fontSize: 12, color: '#7B6FAA' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Sections grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}
        className="admin-grid"
      >
        {SECTIONS.map(s => {
          const card = (
            <div
              style={{
                background: '#fff',
                border: '1px solid #EDE8FF',
                borderRadius: 20,
                padding: '20px 16px',
                minHeight: 120,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 10,
                opacity: s.active ? 1 : 0.45,
                cursor: s.active ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              className={s.active ? 'card-lift' : ''}
              title={s.active ? undefined : 'Скоро'}
            >
              {!s.active && (
                <span
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 12,
                    fontSize: 10,
                    color: '#9B8FCC',
                    background: '#F0EEFF',
                    padding: '2px 8px',
                    borderRadius: 20,
                    fontWeight: 600,
                  }}
                >
                  скоро
                </span>
              )}
              {s.icon}
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#3D2B8A', margin: 0 }}>{s.label}</p>
                <p style={{ fontSize: 12, color: '#7B6FAA', margin: '2px 0 0' }}>{s.desc}</p>
              </div>
            </div>
          )

          return s.active ? (
            <Link key={s.href} href={s.href} style={{ textDecoration: 'none', display: 'block' }}>
              {card}
            </Link>
          ) : (
            <div key={s.href}>{card}</div>
          )
        })}
      </div>

      <style>{`
        @media (min-width: 640px) {
          .admin-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
