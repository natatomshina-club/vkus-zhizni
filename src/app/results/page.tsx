'use client'
import { useState } from 'react'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'

type FilterKey = 'all' | 'weight' | 'health' | 'thyroid' | 'age50' | 'energy' | 'pills'

const CASES = [
  {
    id: 1, featured: true, tags: ['weight', 'energy'],
    kg: '−43', kgColor: '#2E7D50', kgUnit: 'килограмма', kgPeriod: 'за год', stripe: '#4CAF78',
    name: 'Алёна', tagBadge: '106 кг → 63 кг',
    before: 'Весила 106 кг. Постоянные срывы, вес стоял несмотря на диеты.',
    after: 'Весит 63 кг. Кожа подтянулась сама, без операций.',
    quote: 'Начинала с 106 кг. Кожа не обвисла — подтянулась. Я теперь хочу двигаться просто потому что могу. Никакого голода — ела и ела вкусно.',
    extras: ['Держит вес 4-й год', 'Кожа не обвисла'],
  },
  {
    id: 2, tags: ['health', 'pills', 'age50'],
    kg: '−39', kgColor: '#3D2B8A', kgUnit: 'кг', kgPeriod: '55 лет', stripe: '#7C5CFC',
    name: 'Лариса', tagBadge: '55 лет',
    before: 'Давление 170/100. Принимала таблетки от давления.',
    after: 'Давление 125/80. Кардиолог сам отменил таблетки.',
    quote: 'Давление ушло со 170 до 125. Кардиолог сам отменил таблетки. Теперь хожу в горы — суставы не болят.',
    extras: ['Отменила таблетки', 'Горы в 55 лет'],
  },
  {
    id: 3, tags: ['health', 'pills'],
    kg: '13 💊', kgColor: '#E8845A', kgUnit: '', kgPeriod: '14 диагнозов', stripe: '#E8845A',
    name: 'Ирина', tagBadge: '14 диагнозов',
    before: '14 таблеток ежедневно. Чувствовала себя инвалидом.',
    after: 'Отменила 13 из 14 препаратов. Сделала ремонт своими руками.',
    quote: '14 таблеток ежедневно. Через 2 недели в клубе почувствовала себя другим человеком. Сделала ремонт своими руками.',
    extras: ['Отменила 13 препаратов', 'Вернулась к жизни'],
  },
  {
    id: 4, tags: ['weight', 'energy'],
    kg: '−26', kgColor: '#3D2B8A', kgUnit: 'кг', kgPeriod: '', stripe: '#4CAF78',
    name: 'Нина', tagBadge: '',
    before: 'Вечная усталость, мир казался серым.',
    after: 'Вернулась энергия. Ходит на работу пешком.',
    quote: 'Мир стал ярче буквально — цвета насыщеннее. Как будто убрали запотевшее стекло. Я начала ходить на работу пешком.',
    extras: ['Вернулась энергия', '−26 кг'],
  },
  {
    id: 5, tags: ['thyroid', 'age50', 'weight'],
    kg: '−18', kgColor: '#2E7D50', kgUnit: 'кг', kgPeriod: '62 года', stripe: '#4CAF78',
    name: 'Тамара', tagBadge: 'Гипотиреоз',
    before: 'Гипотиреоз, 62 года. Врачи говорили — похудеть невозможно.',
    after: 'Минус 18 кг. Колени перестали болеть. Врачи удивились анализам.',
    quote: 'Врачи говорили — при гипотиреозе в 62 года это невозможно. Я им показала анализы. Они удивились.',
    extras: ['Колени не болят', 'Анализы улучшились'],
  },
  {
    id: 6, tags: ['weight'],
    kg: '−83', kgColor: '#3D2B8A', kgUnit: 'кг', kgPeriod: 'рекорд клуба', stripe: '#7C5CFC',
    name: 'Анонимная участница', tagBadge: 'Рекорд клуба',
    before: 'Начинала с 185 кг. Думала что ничто не поможет.',
    after: 'Похудела на 83 кг — рекорд клуба.',
    quote: 'Начинала с 185 кг. Думала — не для меня. Система работает для всех, кто готов понять как устроен организм.',
    extras: ['Рекорд клуба', '−83 кг'],
  },
  {
    id: 7, tags: ['health', 'pills', 'thyroid'],
    kg: '−22', kgColor: '#2E7D50', kgUnit: 'кг', kgPeriod: 'АИТ', stripe: '#4CAF78',
    name: 'Светлана', tagBadge: 'АИТ',
    before: 'АИТ, постоянная усталость. Не могла встать утром без кофе.',
    after: 'ТТГ нормализовался. Врач удивилась улучшению.',
    quote: 'Эндокринолог спросила что я делаю — анализы на щитовидку пришли в норму впервые за 7 лет.',
    extras: ['ТТГ в норме', 'Нет усталости'],
  },
  {
    id: 8, tags: ['age50', 'energy'],
    kg: '−15', kgColor: '#3D2B8A', kgUnit: 'кг', kgPeriod: '58 лет', stripe: '#7C5CFC',
    name: 'Валентина', tagBadge: '58 лет',
    before: 'Менопауза, 58 лет. Набрала 15 кг за 3 года.',
    after: 'Вернулась к прежнему весу. Сон улучшился.',
    quote: 'Думала в менопаузу похудеть нереально. Оказалось — просто никто не объяснял правильно.',
    extras: ['Сон улучшился', 'Менопауза не помеха'],
  },
  {
    id: 9, tags: ['weight', 'health'],
    kg: '−31', kgColor: '#2E7D50', kgUnit: 'кг', kgPeriod: 'преддиабет', stripe: '#4CAF78',
    name: 'Марина', tagBadge: 'Преддиабет',
    before: 'Преддиабет, сахар 6.8. Врач сказал — скоро таблетки.',
    after: 'Сахар 5.2. Врач убрала из группы риска.',
    quote: 'Сахар снизился с 6.8 до 5.2. Врач сказала что я образцово-показательный пациент.',
    extras: ['Сахар в норме', 'Нет диабета'],
  },
]

const QUOTES = [
  { text: 'Через месяц муж сам попросил готовить так же — и похудел на 25 кг, не зная что «на диете»!', name: 'Аня', result: '−19 кг' },
  { text: 'Впервые за 8 лет вышла из размера XL. Дочь не узнала на вокзале.', name: 'Людмила', result: '−28 кг' },
  { text: 'Кофе по утрам уже не нужен — просто просыпаюсь бодрой. Это было первым чудом.', name: 'Ольга', result: '+энергия' },
  { text: 'Гинеколог спросила что я делаю — цикл восстановился после 4 лет сбоев.', name: 'Катя', result: 'СПКЯ улучш.' },
  { text: 'Суставы перестали болеть через 6 недель. Теперь хожу на скандинавскую ходьбу.', name: 'Тамара В.', result: '−23 кг' },
  { text: 'Первый раз за 10 лет прошла медкомиссию без замечаний.', name: 'Ирина К.', result: '−17 кг' },
  { text: 'Начинала из-за веса — осталась из-за энергии и ясности головы.', name: 'Наталья С.', result: '−12 кг' },
  { text: 'Холестерин снизился с 7.8 до 5.1. Кардиолог попросил телефон Наташи.', name: 'Галина', result: 'Холестерин ↓' },
  { text: 'В 67 лет съездила в поход на 5 дней. Раньше из квартиры выйти было тяжело.', name: 'Зинаида', result: '−21 кг · 67 лет' },
]

export default function ResultsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Все истории' },
    { key: 'weight', label: 'Большое похудение' },
    { key: 'health', label: 'Здоровье и анализы' },
    { key: 'thyroid', label: 'Щитовидная железа' },
    { key: 'age50', label: '50+ лет' },
    { key: 'energy', label: 'Энергия и усталость' },
    { key: 'pills', label: 'Отменили таблетки' },
  ]

  const visible = CASES.filter(c => activeFilter === 'all' || c.tags.includes(activeFilter))

  return (
    <div style={{ background: '#FAF8FF', minHeight: '100vh', overflowX: 'hidden' as const }}>
      <PublicNav currentPage="/results" />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 5%' }}>
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Результаты участниц' }]} />
      </div>

      {/* HERO */}
      <div style={{
        background: 'linear-gradient(135deg, #1A0E4E 0%, #3D2B8A 55%, #5B3FA8 100%)',
        padding: '72px 5% 80px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24, position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Главная</Link>
          <span>›</span>
          <span>Результаты</span>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          color: '#7BDFAA', marginBottom: 16, position: 'relative', zIndex: 1,
        }}>
          <span style={{ display: 'block', width: 24, height: 2, background: '#7BDFAA', borderRadius: 2 }} />
          Истории участниц
          <span style={{ display: 'block', width: 24, height: 2, background: '#7BDFAA', borderRadius: 2 }} />
        </div>
        <h1 style={{
          fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(28px,4.5vw,52px)',
          fontWeight: 700, color: '#fff', lineHeight: 1.15, margin: '0 0 16px',
          position: 'relative', zIndex: 1,
        }}>
          Реальные люди.<br /><span style={{ color: '#7BDFAA' }}>Реальные результаты.</span>
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', maxWidth: 560, margin: '0 auto 44px', lineHeight: 1.65, position: 'relative', zIndex: 1 }}>
          Никакого фотошопа и постановочных фото. Только истории участниц клуба — в килограммах, анализах и изменённом качестве жизни.
        </p>

        {/* Stats */}
        <div className="results-stats-row" style={{
          display: 'inline-flex', gap: 0,
          background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.12)',
          borderRadius: 20, overflow: 'hidden', position: 'relative', zIndex: 1,
        }}>
          {[
            { val: '4 000+', label: 'участниц в клубе' },
            { val: '83 кг', label: 'рекорд похудения' },
            { val: '13', label: 'макс. отменённых таблеток' },
            { val: 'с 2017', label: 'года работы метода' },
          ].map(({ val, label }, i) => (
            <div key={i} style={{
              padding: '20px 32px', textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 28, fontWeight: 700, color: '#7BDFAA', lineHeight: 1, marginBottom: 4 }}>{val}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTER */}
      <div style={{
        background: '#fff', borderBottom: '1.5px solid #EDE8FF',
        padding: '0 5%',
        position: 'sticky', top: 65, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 10,
          overflowX: 'auto', padding: '20px 0',
          scrollbarWidth: 'none' as const,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#7B6FAA', textTransform: 'uppercase' as const, letterSpacing: '0.08em', whiteSpace: 'nowrap', marginRight: 4 }}>Фильтр:</span>
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              style={{
                fontSize: 13, fontWeight: 600,
                color: activeFilter === key ? '#fff' : '#7B6FAA',
                padding: '8px 18px', borderRadius: 100,
                border: '1.5px solid',
                borderColor: activeFilter === key ? '#3D2B8A' : '#EDE8FF',
                background: activeFilter === key ? '#3D2B8A' : 'transparent',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* CASES GRID */}
      <section style={{ padding: '56px 5%' }}>
        <div className="results-cases-grid" style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20,
        }}>
          {visible.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 16, color: '#7B6FAA' }}>Нет историй по этому фильтру</div>
            </div>
          )}
          {visible.map(c => (
            <div key={c.id} style={{
              background: '#fff', border: '1.5px solid #EDE8FF',
              borderRadius: 28, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              ...(c.featured ? { gridColumn: 'span 2' } : {}),
            }}>
              <div style={{ height: 4, background: c.stripe }} />
              <div style={{ padding: '28px 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* KG */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 14 }}>
                  <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: c.featured ? 72 : 52, fontWeight: 700, color: c.kgColor, lineHeight: 0.9 }}>{c.kg}</div>
                  <div style={{ paddingBottom: 4 }}>
                    {c.kgUnit && <div style={{ fontSize: 12, fontWeight: 700, color: '#7B6FAA', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>{c.kgUnit}</div>}
                    {c.kgPeriod && <div style={{ fontSize: 13, color: '#7B6FAA' }}>{c.kgPeriod}</div>}
                  </div>
                </div>

                {/* Name row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' as const }}>
                  <span style={{ fontFamily: 'var(--font-unbounded)', fontSize: 16, fontWeight: 700, color: '#1A1230' }}>{c.name}</span>
                  {c.tagBadge && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, letterSpacing: '0.05em', textTransform: 'uppercase' as const, background: '#E8F5EE', color: '#2E7D50' }}>
                      {c.tagBadge}
                    </span>
                  )}
                </div>

                {/* Before / After */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                  <div style={{ padding: '12px 14px', borderRadius: 14, background: '#FEF2F0', border: '1.5px solid #FDDDD6' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#B84C30', marginBottom: 6 }}>До</div>
                    <div style={{ fontSize: 12, color: '#1A1230', lineHeight: 1.5 }}>{c.before}</div>
                  </div>
                  <div style={{ padding: '12px 14px', borderRadius: 14, background: '#E8F5EE', border: '1.5px solid rgba(76,175,120,0.25)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#2E7D50', marginBottom: 6 }}>После</div>
                    <div style={{ fontSize: 12, color: '#1A1230', lineHeight: 1.5 }}>{c.after}</div>
                  </div>
                </div>

                {/* Quote */}
                <div style={{
                  fontSize: c.featured ? 15 : 14, color: '#7B6FAA',
                  lineHeight: 1.7, fontStyle: 'italic',
                  padding: '14px 16px', background: '#FAF8FF',
                  borderRadius: 14, borderLeft: '3px solid #EDE8FF',
                  flex: 1, marginBottom: 16, position: 'relative',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-unbounded)', fontSize: 40, fontWeight: 700,
                    color: '#EDE8FF', position: 'absolute', top: -8, left: 10, lineHeight: 1,
                  }}>"</span>
                  <div style={{ paddingTop: 10, position: 'relative' }}>{c.quote}</div>
                </div>

                {/* Extras */}
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                  {c.extras.map(e => (
                    <span key={e} style={{
                      fontSize: 12, fontWeight: 600, color: '#2E7D50',
                      background: '#E8F5EE', border: '1.5px solid rgba(76,175,120,0.25)',
                      padding: '4px 12px', borderRadius: 100,
                    }}>✓ {e}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QUOTES WALL */}
      <section style={{
        background: 'linear-gradient(135deg, #1A0E4E 0%, #2E1A6E 100%)',
        padding: '72px 5%', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
              color: '#7BDFAA', marginBottom: 12, justifyContent: 'center',
            }}>
              <span style={{ display: 'block', width: 20, height: 2, background: '#7BDFAA', borderRadius: 2 }} />
              Отзывы участниц
            </div>
            <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(22px,3vw,34px)', fontWeight: 700, color: '#fff', margin: 0 }}>
              Их словами
            </h2>
          </div>
          <div className="results-quotes-cols" style={{ columns: 3, columnGap: 16 }}>
            {QUOTES.map(({ text, name, result }) => (
              <div key={name} style={{
                background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '22px 20px', marginBottom: 16, breakInside: 'avoid' as const,
              }}>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 14, margin: '0 0 14px' }}>
                  {text}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#7BDFAA', background: 'rgba(76,175,120,0.15)', padding: '3px 10px', borderRadius: 100 }}>{result}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '72px 5%' }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          background: 'linear-gradient(135deg, #3D2B8A 0%, #5B3FA8 100%)',
          borderRadius: 32, padding: '64px 48px', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(22px,3.5vw,34px)', fontWeight: 700, color: '#fff', margin: '0 0 12px', position: 'relative' }}>
            Следующая история — твоя
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, maxWidth: 500, margin: '0 auto 36px', position: 'relative', lineHeight: 1.6 }}>
            Начни с 7 дней в клубе. Посмотри как работает система — без обязательств.
          </p>
          <a href="https://club.nata-tomshina.ru/join?plan=trial" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, position: 'relative',
            background: '#4CAF78', color: '#fff',
            fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700,
            padding: '17px 36px', borderRadius: 100, textDecoration: 'none',
            boxShadow: '0 6px 24px rgba(76,175,120,0.4)',
          }}>
            Попробовать 7 дней за 149 ₽
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
          <span style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 14, position: 'relative' }}>
            Без обязательств. Отмена в 1 клик.
          </span>
        </div>
      </section>

      <PublicFooter />

      <style>{`
        @media (max-width: 900px) {
          .results-cases-grid { grid-template-columns: repeat(2,1fr) !important; }
          .results-quotes-cols { columns: 2 !important; }
        }
        @media (max-width: 600px) {
          .results-cases-grid { grid-template-columns: 1fr !important; }
          .results-cases-grid > div[style*="span 2"] { grid-column: span 1 !important; }
          .results-quotes-cols { columns: 1 !important; }
          .results-stats-row { flex-direction: column !important; border-radius: 16px !important; }
          .results-stats-row > div { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; padding: 16px 24px !important; }
        }
      `}</style>
    </div>
  )
}
