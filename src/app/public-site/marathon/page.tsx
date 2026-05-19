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
    <div style={{ background: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <PublicNav currentPage="/marathon" />

      {/* HERO */}
      <div className="mr-hero">
        <div className="mr-hero__breadcrumbs">
          <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Марафон' }]} />
        </div>
        <div className="mr-hero__inner">
          <span className="mr-hero__badge">БЛИЖАЙШИЙ МАРАФОН</span>
          <h1 className="mr-hero__title">{title}</h1>
          <p className="mr-hero__lead">{subtitle}</p>
          <p className="mr-hero__meta">Старт {startDate} · {durationDays} дней</p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <MarathonCTA />
            <span className="mr-cta-note">Марафон доступен с тарифа «Месяц»</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 5%' }}>

        {/* PROGRAM */}
        <section style={{ padding: '72px 0 48px' }}>
          <h2 className="mr-section__title">Программа марафона</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {program.map((item, i) => (
              <div key={i} className="mr-step">
                <span className="mr-step__num">{i + 1}</span>
                <span className="mr-step__text">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* RESULTS */}
        <section style={{ padding: '0 0 72px' }}>
          <h2 className="mr-section__title">Что вы получите</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
            {results.map((r, i) => (
              <div key={i} className="mr-feature">
                <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>{r.icon}</span>
                <div className="mr-feature__title">{r.title}</div>
                <div className="mr-feature__desc">{r.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* MINI CASES */}
        <section style={{ padding: '0 0 72px' }}>
          <h2 className="mr-section__title">Результаты прошлых марафонов</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {MINI_CASES.map((c, i) => (
              <div key={i} className="mr-case">
                <div className="mr-case__avatar">
                  <span className="mr-case__kg">{c.kg}</span>
                </div>
                <div>
                  <div className="mr-case__name">
                    {c.name} <span className="mr-case__period">{c.period}</span>
                  </div>
                  <p className="mr-case__quote">«{c.quote}»</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FOR WHOM */}
        <section style={{ padding: '0 0 72px' }}>
          <h2 className="mr-section__title">Для кого этот марафон</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
            {forWhom.map((item, i) => (
              <div key={i} className="mr-for-whom__item">
                <span className="mr-for-whom__check">✓</span>
                <span className="mr-for-whom__text">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* HOW TO JOIN */}
        <section style={{ padding: '0 0 72px' }}>
          <h2 className="mr-section__title">Как участвовать</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto' }}>
            {[
              { n: 1, title: 'Вступи в клуб', desc: 'Если ещё не участница — оформи подписку за 149 ₽/7 дней' },
              { n: 2, title: 'Войди в личный кабинет', desc: 'Перейди в раздел «Марафоны» и нажми «Участвую»' },
              { n: 3, title: 'Следуй заданиям каждый день', desc: 'Ежедневные задания открываются утром. Выполняй — и результат придёт' },
            ].map(step => (
              <div key={step.n} className="mr-how__step">
                <div className="mr-how__num">{step.n}</div>
                <div>
                  <div className="mr-how__title">{step.title}</div>
                  <div className="mr-how__desc">{step.desc}</div>
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
          <h2 style={{ fontFamily: 'var(--font-serif-display)', fontSize: 20, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 20px' }}>
            Архив прошлых марафонов
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PAST_MARATHONS.map((m, i) => (
              <div key={i} className="mr-archive__row">
                <span className="mr-archive__title">{m.title}</span>
                <span className="mr-archive__period">{m.period}</span>
              </div>
            ))}
          </div>
        </section>

      </div>

      <PublicFooter />
    </div>
  )
}
