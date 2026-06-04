import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
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
    admin.from('members').select('id', { count: 'exact', head: true }).eq('subscription_status', 'expired'),
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
    label: 'FAQ',
    desc: 'FAQ и материалы для участниц',
    href: '/admin/help',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0097A7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    label: 'Кулинарная книга',
    desc: 'Ручные рецепты от Наташи',
    href: '/admin/cookbook',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 1 10 10c0 4-2.5 7.5-6 9.3V22H8v-.7C4.5 19.5 2 16 2 12A10 10 0 0 1 12 2z" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    label: 'Карта помощи',
    desc: 'Курсы и материалы',
    href: '/admin/courses',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF9F43" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
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
    label: 'Рассылки',
    desc: 'Email-кампании',
    href: '/admin/emails',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9B8FCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    label: 'Аналитика',
    desc: 'Статистика сайта',
    href: '/admin/analytics',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#56CCF2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: 'Страницы сайта',
    desc: 'CMS: главная, блог, клуб',
    href: '/admin/pages',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF9F43" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    label: 'Медитации',
    desc: 'Курсы и аудиопрактики',
    href: '/admin/meditations',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9B7CFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10" />
        <path d="M12 6v6l4 2" />
        <circle cx="18" cy="6" r="3" fill="#9B7CFF" stroke="none" opacity="0.3"/>
        <path d="M17 4l2 2-2 2" />
      </svg>
    ),
  },
  {
    label: 'Марафоны',
    desc: 'Создание и управление',
    href: '/admin/marathons',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    label: 'SEO-блог',
    desc: 'Статьи, ключевики, генератор',
    href: '/admin/blog',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4CAF78" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    label: 'Истории',
    desc: 'Результаты и преображения',
    href: '/admin/results-stories',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF9DC5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    label: 'Партнёры',
    desc: 'Заявки, комиссии, выплаты',
    href: '/admin/affiliates',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFD93D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 11l-4 4-2-2" />
      </svg>
    ),
  },
  {
    label: 'Оформление',
    desc: 'Сезонные темы и частицы',
    href: '/admin/themes',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF9DC5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
  {
    label: 'Обучающие материалы',
    desc: 'Тексты и видео для участниц',
    href: '/admin/onboarding',
    active: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4CAF78" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        <path d="M6 8h2M6 12h2M16 8h2M16 12h2" />
      </svg>
    ),
  },
]

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = user
    ? await supabase.from('members').select('role').eq('id', user.id).single()
    : { data: null }
  const isCurator = me?.role === 'curator'

  if (isCurator) {
    const marathonSection = SECTIONS.find(s => s.href === '/admin/marathons')!
    return (
      <div>
        <Link href={marathonSection.href} style={{ textDecoration: 'none', display: 'block', maxWidth: 280 }}>
          <div style={{
            background: '#fff', border: '1px solid #EDE8FF', borderRadius: 20,
            padding: '20px 16px', minHeight: 120, display: 'flex', flexDirection: 'column',
            alignItems: 'flex-start', gap: 10, cursor: 'pointer',
          }}
            className="card-lift"
          >
            {marathonSection.icon}
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#3D2B8A', margin: 0 }}>{marathonSection.label}</p>
              <p style={{ fontSize: 12, color: '#7B6FAA', margin: '2px 0 0' }}>{marathonSection.desc}</p>
            </div>
          </div>
        </Link>
      </div>
    )
  }

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
