import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DashboardWinInput from '@/components/DashboardWinInput'
import DashboardGreeting from '@/components/DashboardGreeting'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: member }, { count: savedCount }] = await Promise.all([
    supabase
      .from('members')
      .select('name, full_name, status, created_at, age, weight, start_weight, height, goal_weight, activity_level, kbju_calories, kbju_protein, kbju_fat, kbju_carbs, segment')
      .eq('id', user.id)
      .single(),
    supabase
      .from('saved_recipes')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', user.id),
  ])

  const isTrial = member?.status === 'trial' || !member?.status

  // Determine if profile is filled
  const hasProfile = !!(member?.weight || member?.kbju_calories)

  const daysInClub = member?.created_at
    ? Math.max(1, Math.floor((Date.now() - new Date(member.created_at).getTime()) / 86400000) + 1)
    : 1

  const lostKg = member?.start_weight && member?.weight
    ? +(member.start_weight - member.weight).toFixed(1)
    : null

  const weightRemaining = member?.goal_weight && member?.weight
    ? +(member.weight - member.goal_weight).toFixed(1)
    : null

  const stats: { icon: string; value: string; label: string; bg: string; color: string; valueBg: string; href?: string }[] = [
    { icon: '🗓', value: String(daysInClub), label: 'ДЕНЬ В КЛУБЕ', bg: 'var(--pur)', color: '#fff', valueBg: 'rgba(255,255,255,0.2)' },
    { icon: '🍳', value: String(savedCount ?? 0), label: 'рецептов', bg: 'var(--ora)', color: '#fff', valueBg: 'rgba(255,255,255,0.2)', href: '/dashboard/favorites' },
    { icon: '⚖️', value: lostKg != null && lostKg > 0 ? `−${lostKg} кг` : '—', label: 'МИНУС КГ', bg: 'var(--yel)', color: 'var(--text)', valueBg: 'rgba(45,31,110,0.1)' },
    { icon: '✨', value: isTrial ? 'Триал' : 'Клуб', label: 'твой статус', bg: 'var(--grn)', color: '#1A5C3A', valueBg: 'rgba(26,92,58,0.1)' },
  ]

  const sections = [
    { href: '/dashboard/kitchen', icon: '🍳', title: 'Умная кухня', desc: 'Рецепты и питание', bg: 'var(--pur)', color: '#fff' },
    { href: '/dashboard/channel', icon: '💬', title: 'Чаты клуба', desc: 'Общение и поддержка', bg: '#5B8DEF', color: '#fff' },
    { href: '/dashboard/tracker', icon: '📏', title: 'Трекер', desc: 'Замеры и прогресс', bg: 'var(--yel)', color: 'var(--text)' },
    { href: '/dashboard/diary', icon: '📓', title: 'Дневник', desc: 'Питание за день', bg: 'var(--ora)', color: '#fff' },
    { href: '/dashboard/body', icon: '🌸', title: 'Я и моё тело', desc: 'Метод Натальи', bg: 'var(--grn)', color: '#1A5C3A' },
    { href: '/dashboard/webinars', icon: '🎥', title: 'Вебинары', desc: 'Обучение', bg: '#FF6B9D', color: '#fff' },
    { href: '/dashboard/marathon', icon: '🏃', title: 'Марафон', desc: 'Вызов себе', bg: 'linear-gradient(135deg, #FF6B35 0%, #F7C59F 100%)', color: '#7A1F00' },
    { href: '/dashboard/meditations', icon: '🧘', title: 'Медитации', desc: 'Спокойствие и баланс', bg: 'linear-gradient(135deg, #C4B5FD 0%, #EDE9FF 100%)', color: '#4C1D95' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Mobile header ── */}
      <header
        className="lg:hidden flex items-center justify-between px-4 py-4 sticky top-0 z-40"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <p className="text-base font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--pur)' }}>
          Вкус Жизни
        </p>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8 flex flex-col gap-5">

        {/* ── Trial banner ── */}
        {isTrial && (
          <div
            className="rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3"
            style={{ background: 'linear-gradient(135deg, var(--pur) 0%, #9B7CFF 100%)' }}
          >
            <p className="text-xs font-semibold text-white/90" style={{ fontFamily: 'var(--font-nunito)' }}>
              Пробный период · 7 дней
            </p>
            <a
              href="/join"
              className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap"
              style={{ background: 'rgba(255,255,255,0.22)', color: '#fff', fontFamily: 'var(--font-nunito)' }}
            >
              Открыть полный доступ
            </a>
          </div>
        )}

        {/* ── Greeting ── */}
        <DashboardGreeting />

        {/* ── Profile data block ── */}
        {hasProfile ? (
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                Твои данные из анкеты
              </p>
              <Link
                href="/dashboard/profile"
                className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0"
                style={{ background: 'var(--pur-light)', color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
              >
                ✏️ Изменить
              </Link>
            </div>

            {/* Name / age / weight / height */}
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
              {[
                member?.full_name ?? member?.name ?? null,
                member?.age ? `${member.age} лет` : null,
                member?.weight ? `${member.weight} кг` : null,
                member?.height ? `${member.height} см` : null,
              ].filter(Boolean).join(' · ')}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {/* Goal */}
              <div className="rounded-xl p-3" style={{ background: 'var(--pur-light)' }}>
                <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                  Цель
                </p>
                <p className="text-sm font-bold" style={{ color: 'var(--pur)', fontFamily: 'var(--font-unbounded)' }}>
                  {member?.goal_weight ? `${member.goal_weight} кг` : '—'}
                </p>
                {weightRemaining !== null && (
                  <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
                    осталось {Math.abs(weightRemaining)} кг
                  </p>
                )}
              </div>

              {/* Activity */}
              <div className="rounded-xl p-3" style={{ background: 'var(--yel-light)' }}>
                <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                  Активность
                </p>
                <p className="text-[11px] font-bold leading-snug" style={{ color: '#8B6000', fontFamily: 'var(--font-nunito)' }}>
                  {(() => {
                    const map: Record<string, string> = {
                      sedentary: '💻 Сидячая',
                      standing: '🚶 На ногах',
                      light_training: '🏃 Тренировки',
                      intense_training: '💪 Активная',
                    }
                    const lvl = member?.activity_level as string | null
                    return lvl ? (map[lvl] ?? lvl) : '—'
                  })()}
                </p>
              </div>

              {/* Segment */}
              <div className="rounded-xl p-3" style={{ background: 'var(--grn-light)' }}>
                <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                  Сегмент
                </p>
                <p className="text-[11px] font-bold leading-snug" style={{ color: '#1A5C3A', fontFamily: 'var(--font-nunito)' }}>
                  🌱 {member?.segment ?? 'Постепенно без стресса'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/dashboard/profile"
            className="rounded-2xl p-4 flex items-center justify-between"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                Заполни анкету участницы
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                Укажи вес, цель и активность — рассчитаем КБЖУ
              </p>
            </div>
            <span className="text-lg ml-3">→</span>
          </Link>
        )}

        {/* ── Stats 2×2 ── */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ icon, value, label, bg, color, valueBg, href }) => {
            const inner = (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">{icon}</span>
                  <span
                    className="px-2 py-0.5 rounded-lg text-sm font-bold"
                    style={{ background: valueBg, color, fontFamily: 'var(--font-unbounded)' }}
                  >
                    {value}
                  </span>
                </div>
                <p className="text-xs mt-2.5 font-medium" style={{ color, opacity: 0.8, fontFamily: 'var(--font-nunito)' }}>
                  {label}
                </p>
              </>
            )
            return href ? (
              <Link
                key={label}
                href={href}
                className="rounded-2xl p-4 block transition-transform active:scale-95"
                style={{ background: bg }}
              >
                {inner}
              </Link>
            ) : (
              <div key={label} className="rounded-2xl p-4" style={{ background: bg }}>
                {inner}
              </div>
            )
          })}
        </div>

        {/* ── Наташа's advice ── */}
        <div
          className="rounded-2xl p-4 flex gap-3"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ background: 'var(--pur-light)' }}
          >
            👩‍⚕️
          </div>
          <div>
            <p className="text-xs font-bold mb-1" style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
              Совет от Натальи
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
              Начни день со стакана тёплой воды — это запускает обмен веществ и помогает гормональному балансу. Умное питание — это забота о себе, не ограничения! 💜
            </p>
          </div>
        </div>

        {/* ── «С чего начать» кнопка ── */}
        <Link
          href="/dashboard/about"
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-colors"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
            📖 Как устроен клуб — с чего начать?
          </span>
          <span style={{ color: 'var(--muted)' }}>→</span>
        </Link>

        {/* ── Sections grid 2×4 ── */}
        <div>
          <h2 className="text-sm font-bold mb-3" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
            Разделы клуба
          </h2>
          <div className="grid grid-cols-2 gap-3 items-stretch">
            {sections.map(({ href, icon, title, desc, bg, color }) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl p-4 flex flex-col gap-1 transition-transform active:scale-95 h-full"
                style={{ background: bg }}
              >
                <span className="text-2xl leading-none">{icon}</span>
                <p className="text-sm font-bold mt-2 leading-snug" style={{ color, fontFamily: 'var(--font-unbounded)' }}>
                  {title}
                </p>
                <p className="text-xs" style={{ color, opacity: 0.75, fontFamily: 'var(--font-nunito)' }}>
                  {desc}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Вводный курс ── */}
        <div
          className="rounded-2xl p-5 flex items-center justify-between gap-3 flex-wrap"
          style={{ background: 'linear-gradient(135deg, #FF9F43 0%, #FFBF69 100%)' }}
        >
          <div className="min-w-0">
            <p className="text-base font-bold text-white leading-snug" style={{ fontFamily: 'var(--font-unbounded)' }}>
              Стройность без голода
            </p>
            <p className="text-xs text-white/80 mt-1" style={{ fontFamily: 'var(--font-nunito)' }}>
              Вводный курс · 6 уроков
            </p>
          </div>
          <Link
            href="/dashboard/minicourse"
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl whitespace-nowrap"
            style={{ background: '#fff', color: '#C96A00', fontFamily: 'var(--font-nunito)' }}
          >
            ▶ Смотреть урок
          </Link>
        </div>

        {/* ── Маленькие победы ── */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
            🏆 Маленькая победа сегодня
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            Любой маленький шаг — это уже победа!
          </p>
          <DashboardWinInput />
        </div>

        {/* bottom padding for mobile nav */}
        <div className="h-4" />
      </div>
    </div>
  )
}
