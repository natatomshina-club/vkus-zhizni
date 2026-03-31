import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabasePublic } from '@/lib/supabase/public'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import MarathonCTA from './MarathonCTA'

export const revalidate = 300

interface MarathonLanding {
  id: string
  title: string
  subtitle: string | null
  start_date: string | null
  duration_days: number
  program: string[]
  results: { icon: string; title: string; desc: string }[]
  for_whom: string[]
}

async function getMarathon(): Promise<MarathonLanding | null> {
  const supabase = createSupabasePublic()
  const { data } = await supabase
    .from('marathon_landing')
    .select('*')
    .eq('is_active', true)
    .single()
  return data as MarathonLanding | null
}

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMarathon()
  return {
    title: m ? `${m.title} — Клуб «Вкус Жизни»` : 'Марафон — Клуб «Вкус Жизни»',
    description: m?.subtitle ?? 'Марафон питания для гормонального баланса от Натальи Томшиной',
    alternates: { canonical: 'https://nata-tomshina.ru/marathon' },
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

const PAST_MARATHONS = [
  { title: 'Марафон «Здоровый кишечник»', period: 'Февраль 2026' },
  { title: 'Марафон «Детокс»', period: 'Январь 2026' },
  { title: 'Марафон «Снижаем кортизол»', period: 'Декабрь 2025' },
  { title: 'Марафон «Гормоны и вес»', period: 'Ноябрь 2025' },
]

const MINI_CASES = [
  { name: 'Алёна', kg: '−8 кг', period: 'за 14 дней', quote: 'Никакого голода, а инсулин нормализовался уже на 5-й день. Тяга к сладкому просто пропала.' },
  { name: 'Лариса', kg: '−5 кг', period: 'за марафон', quote: 'Сахар в крови снизился. Эндокринолог удивилась — впервые за 3 года хорошие анализы.' },
  { name: 'Марина', kg: '−6 кг', period: '+ ушли отёки', quote: 'Встала на весы на 14-й день — минус 6. Но главное — исчезла сонливость после обеда.' },
]

export default async function MarathonPage() {
  const marathon = await getMarathon()

  // Fallback data if table doesn't exist yet
  const title = marathon?.title ?? 'Марафон «Снижаем инсулин»'
  const subtitle = marathon?.subtitle ?? 'За 14 дней нормализуем главный гормон жиросжигания — без голода и изнурительных тренировок'
  const startDate = marathon?.start_date ? formatDate(marathon.start_date) : '1 апреля'
  const durationDays = marathon?.duration_days ?? 14
  const program: string[] = marathon?.program ?? [
    '14 ежедневных заданий от Натальи',
    'Разбор симптомов инсулинорезистентности',
    'Готовые рационы на каждый день марафона',
    'Живые эфиры с разбором вопросов участниц',
    'Закрытый чат участников марафона',
  ]
  const results: { icon: string; title: string; desc: string }[] = marathon?.results ?? [
    { icon: '⚡', title: 'Снижение инсулина', desc: 'Нормализация главного гормона жиросжигания' },
    { icon: '⚖️', title: '−3–7 кг', desc: 'Реалистичный результат за 14 дней' },
    { icon: '💧', title: 'Уйдут отёки', desc: 'Нормализация водно-солевого баланса' },
    { icon: '🧠', title: 'Пропадёт тяга к сладкому', desc: 'Биохимия, не сила воли' },
  ]
  const forWhom: string[] = marathon?.for_whom ?? [
    'Чувствуете усталость и сонливость после еды',
    'Вес стоит, несмотря на ограничения в питании',
    'Есть тяга к сладкому — особенно к вечеру',
    'Поставлен диагноз инсулинорезистентность или преддиабет',
    'Хотите запустить жиросжигание быстро и безопасно',
    'Ищете поддержку и живое сообщество',
  ]

  return (
    <div style={{ background: '#FAF8FF', minHeight: '100vh' }}>
      <PublicNav currentPage="/marathon" />

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg, #1A0E4E 0%, #2D6A4F 100%)', padding: '72px 5% 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -60, right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(76,175,120,.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: '5%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(124,92,252,.1)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto 24px', textAlign: 'left' }}>
            <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Марафон' }]} dark />
          </div>
          <span style={{ display: 'inline-block', background: 'rgba(76,175,120,.2)', border: '1px solid rgba(76,175,120,.4)', color: '#4CAF78', fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 100, letterSpacing: '.06em', marginBottom: 20 }}>
            БЛИЖАЙШИЙ МАРАФОН
          </span>
          <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(24px,4vw,44px)', fontWeight: 700, color: '#fff', margin: '0 0 16px', lineHeight: 1.2 }}>
            {title}
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,.75)', margin: '0 0 12px', lineHeight: 1.6 }}>
            {subtitle}
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.55)', margin: '0 0 36px' }}>
            Старт {startDate} · {durationDays} дней
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <MarathonCTA />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>
              Марафон доступен с тарифа «Месяц»
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 5%' }}>

        {/* PROGRAM */}
        <section style={{ padding: '72px 0 48px' }}>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, color: '#3D2B8A', textAlign: 'center', margin: '0 0 40px' }}>
            Программа марафона
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {program.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 16, padding: '16px 20px' }}>
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#2D6A4F,#4CAF78)', color: '#fff', fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 15, color: '#2D1F6E', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* RESULTS */}
        <section style={{ padding: '0 0 72px' }}>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, color: '#3D2B8A', textAlign: 'center', margin: '0 0 40px' }}>
            Что вы получите
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
            {results.map((r, i) => (
              <div key={i} style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 20, padding: '24px 20px', textAlign: 'center' }}>
                <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>{r.icon}</span>
                <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: '#2D6A4F', marginBottom: 8 }}>{r.title}</div>
                <div style={{ fontSize: 13, color: '#7B6FAA', lineHeight: 1.5 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* MINI CASES */}
        <section style={{ padding: '0 0 72px' }}>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, color: '#3D2B8A', textAlign: 'center', margin: '0 0 40px' }}>
            Результаты прошлых марафонов
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {MINI_CASES.map((c, i) => (
              <div key={i} style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 20, padding: '20px 24px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#2D6A4F,#4CAF78)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-unbounded)', fontSize: 13, fontWeight: 700, color: '#fff' }}>{c.kg}</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: '#3D2B8A', marginBottom: 4 }}>{c.name} <span style={{ color: '#7B6FAA', fontWeight: 400, fontSize: 12 }}>{c.period}</span></div>
                  <p style={{ fontSize: 14, color: '#7B6FAA', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>«{c.quote}»</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FOR WHOM */}
        <section style={{ padding: '0 0 72px' }}>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, color: '#3D2B8A', textAlign: 'center', margin: '0 0 40px' }}>
            Для кого этот марафон
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
            {forWhom.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#F0EEFF', borderRadius: 14, padding: '14px 16px' }}>
                <span style={{ color: '#4CAF78', fontWeight: 700, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 14, color: '#2D1F6E', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* HOW TO JOIN */}
        <section style={{ padding: '0 0 72px' }}>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, color: '#3D2B8A', textAlign: 'center', margin: '0 0 40px' }}>
            Как участвовать
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto' }}>
            {[
              { n: 1, title: 'Вступи в клуб', desc: 'Если ещё не участница — оформи подписку за 149 ₽/7 дней' },
              { n: 2, title: 'Войди в личный кабинет', desc: 'Перейди в раздел «Марафоны» и нажми «Участвую»' },
              { n: 3, title: 'Следуй заданиям каждый день', desc: 'Ежедневные задания открываются утром. Выполняй — и результат придёт' },
            ].map(step => (
              <div key={step.n} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#3D2B8A,#7C5CFC)', color: '#fff', fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {step.n}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', marginBottom: 4 }}>{step.title}</div>
                  <div style={{ fontSize: 14, color: '#7B6FAA', lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <MarathonCTA />
          </div>
        </section>

        {/* ARCHIVE */}
        <section style={{ padding: '0 0 80px' }}>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#3D2B8A', margin: '0 0 20px' }}>
            Архив прошлых марафонов
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PAST_MARATHONS.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 12, padding: '12px 16px' }}>
                <span style={{ fontSize: 14, color: '#2D1F6E', fontWeight: 600 }}>{m.title}</span>
                <span style={{ fontSize: 12, color: '#7B6FAA' }}>{m.period}</span>
              </div>
            ))}
          </div>
        </section>

      </div>

      <PublicFooter />

      <style>{`
        @media (max-width: 600px) {
          .marathon-cta a { min-height: 52px; padding: 14px 24px !important; font-size: 14px !important; }
        }
      `}</style>
    </div>
  )
}
