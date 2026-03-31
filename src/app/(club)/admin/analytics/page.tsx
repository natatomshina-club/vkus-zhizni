import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface PathCount { path: string; views: number }
interface WidgetCount { widget_type: string; completions: number }

async function getAnalytics() {
  const admin = createServiceClient()

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [viewsRes, eventsRes, widgetsRes] = await Promise.all([
    admin
      .from('page_views')
      .select('path')
      .eq('event', 'view')
      .gte('created_at', since),
    admin
      .from('page_views')
      .select('event, path')
      .in('event', ['click_club', 'click_lead', 'click_marathon', 'email_verified'])
      .gte('created_at', since),
    admin
      .from('page_views')
      .select('widget_type')
      .eq('event', 'widget_complete')
      .gte('created_at', since),
  ])

  const allViews = viewsRes.data ?? []
  const allEvents = eventsRes.data ?? []
  const allWidgets = widgetsRes.data ?? []

  // Total views
  const totalViews = allViews.length

  // Email verified
  const emailVerified = allEvents.filter(e => e.event === 'email_verified').length
  const clickLead = allEvents.filter(e => e.event === 'click_lead').length

  // Club clicks
  const clubClicks = allEvents.filter(e => e.event === 'click_club').length

  // Widget completions
  const widgetCompletions = allWidgets.length

  // Top blog paths
  const blogViews: Record<string, number> = {}
  for (const v of allViews) {
    if (v.path.startsWith('/blog/')) {
      blogViews[v.path] = (blogViews[v.path] ?? 0) + 1
    }
  }
  const topPaths: PathCount[] = Object.entries(blogViews)
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)

  // Widget breakdown
  const widgetMap: Record<string, number> = {}
  for (const w of allWidgets) {
    if (w.widget_type) widgetMap[w.widget_type] = (widgetMap[w.widget_type] ?? 0) + 1
  }
  const widgetBreakdown: WidgetCount[] = Object.entries(widgetMap)
    .map(([widget_type, completions]) => ({ widget_type, completions }))
    .sort((a, b) => b.completions - a.completions)

  return { totalViews, emailVerified, clickLead, clubClicks, widgetCompletions, topPaths, widgetBreakdown }
}

const WIDGET_LABELS: Record<string, string> = {
  ir_test: 'Тест: Инсулинорезистентность',
  why_test: 'Тест: Почему не худею',
  thyroid_test: 'Тест: Щитовидная железа',
  eating_test: 'Тест: Пищевые привычки',
  calc_3months: 'Калькулятор: план 3 мес.',
}

export default async function AnalyticsPage() {
  let stats
  try {
    stats = await getAnalytics()
  } catch {
    return (
      <div>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 700, color: '#3D2B8A', marginBottom: 24 }}>Аналитика</h1>
        <div style={{ background: '#FFF5F5', border: '1.5px solid #FFD5D5', borderRadius: 14, padding: 20, color: '#C0392B', fontSize: 14 }}>
          Таблица page_views не найдена. Запустите SQL для создания таблицы.
        </div>
      </div>
    )
  }

  const { totalViews, emailVerified, clickLead, clubClicks, widgetCompletions, topPaths, widgetBreakdown } = stats
  const maxViews = topPaths[0]?.views ?? 1

  const card: React.CSSProperties = {
    background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 16, padding: '20px 24px',
    display: 'flex', flexDirection: 'column', gap: 4,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/admin" style={{ fontSize: 13, color: '#7B6FAA', textDecoration: 'none', padding: '8px 12px', borderRadius: 10, background: '#F0EEFF' }}>
          ← Админка
        </Link>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 700, color: '#3D2B8A', margin: 0, flex: 1 }}>
          Аналитика
        </h1>
        <Link href="/dashboard" style={{ fontSize: 13, color: '#4CAF78', textDecoration: 'none', padding: '8px 12px', borderRadius: 10, background: '#E8F5EE' }}>
          Клуб →
        </Link>
      </div>
      <p style={{ fontSize: 13, color: '#7B6FAA', marginBottom: 28 }}>Данные за последние 30 дней</p>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Просмотры страниц', value: totalViews, color: '#3D2B8A' },
          { label: 'Подписок email', value: emailVerified, sub: `${clickLead} кликов → ${emailVerified} подтверждений`, color: '#4CAF78' },
          { label: 'Клики «Клуб»', value: clubClicks, color: '#7C5CFC' },
          { label: 'Виджетов завершено', value: widgetCompletions, color: '#FF9F43' },
        ].map(s => (
          <div key={s.label} style={card}>
            <span style={{ fontFamily: 'var(--font-unbounded)', fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 12, color: '#7B6FAA', lineHeight: 1.4 }}>{s.label}</span>
            {s.sub && <span style={{ fontSize: 11, color: '#B0A8D4', marginTop: 2 }}>{s.sub}</span>}
          </div>
        ))}
      </div>

      {/* Top articles */}
      <div style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: '#3D2B8A', marginBottom: 16, margin: '0 0 16px' }}>
          Топ-10 статей блога
        </h2>
        {topPaths.length === 0 ? (
          <p style={{ fontSize: 13, color: '#7B6FAA', margin: 0 }}>Нет данных</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topPaths.map(({ path, views }) => (
              <div key={path} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#2D1F6E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                    {path.replace('/blog/', '')}
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: '#EDE8FF', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#7C5CFC', borderRadius: 3, width: `${Math.round((views / maxViews) * 100)}%` }} />
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#3D2B8A', flexShrink: 0, width: 36, textAlign: 'right' }}>{views}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Widgets */}
      <div style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 16, padding: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: '#3D2B8A', margin: '0 0 16px' }}>
          Виджеты
        </h2>
        {widgetBreakdown.length === 0 ? (
          <p style={{ fontSize: 13, color: '#7B6FAA', margin: 0 }}>Нет данных</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12, padding: '6px 0', borderBottom: '1px solid #EDE8FF', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#7B6FAA', textTransform: 'uppercase', letterSpacing: '.06em' }}>Виджет</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#7B6FAA', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: 'right' }}>Завершений</span>
            </div>
            {widgetBreakdown.map(({ widget_type, completions }) => (
              <div key={widget_type} style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12, padding: '8px 0', borderBottom: '1px solid #F5F3FF' }}>
                <span style={{ fontSize: 13, color: '#2D1F6E' }}>{WIDGET_LABELS[widget_type] ?? widget_type}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#3D2B8A', textAlign: 'right' }}>{completions}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
