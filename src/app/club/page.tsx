'use client'
import { useState } from 'react'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'

const FAQS = [
  {
    q: '«Смогу ли я так есть всю жизнь?»',
    a: 'Это не диета с ограничениями — это система питания, которая становится образом жизни. Участницы едят вкусно: мясо, рыба, яйца, жирный сыр, сливки, авокадо. Привыкаешь за 2–3 недели — и старая еда просто перестаёт казаться привлекательной.',
  },
  {
    q: '«Я уже пробовала всё — почему это будет иначе?»',
    a: 'Потому что ты впервые поймёшь механику — как именно конкретные продукты влияют на твои гормоны. Когда понимаешь это, не нужно себя заставлять. Ты не «сидишь на диете», ты просто знаешь зачем делаешь то, что делаешь.',
  },
  {
    q: '«Подходит ли это при гипотиреозе / диабете?»',
    a: 'Метод разработан с учётом именно этих проблем. Снижение инсулина — это лечение корня инсулинорезистентности. Нутриенты для щитовидки — прямо в рационе: белок, железо, цинк, селен. Участницы с гипотиреозом и диабетом 2 типа улучшают анализы и отменяют таблетки.',
  },
  {
    q: '«Не слишком ли дорого есть мясо каждый день?»',
    a: 'Мы считали. Мясо с тушёными овощами дешевле, чем гречка + куриная грудка + обезжиренный творог + пачка печенья «для срыва». Плюс ты перестаёшь тратить деньги на постоянные перекусы.',
  },
  {
    q: '«Нужно ли готовить отдельно от семьи?»',
    a: 'Нет. Семья ест то же самое — только у них на тарелке может быть гарнир. Аня готовила для семьи — муж сам попросил то же самое и похудел на 25 кг, даже не зная что «на диете».',
  },
  {
    q: '«Можно ли похудеть в 55 / 60 / 65 лет?»',
    a: 'Тамара похудела на 18 кг в 62 года с гипотиреозом. Другая участница — на 23 кг в 66 лет. Возраст не является ограничением, когда ты работаешь с причиной, а не со следствием.',
  },
  {
    q: '«А если я сорвусь?»',
    a: 'Срывы случаются — это нормально. Система не рушится от одного праздничного ужина. Ты знаешь как вернуться — без вины и «следующего понедельника». Именно поэтому это работает долго.',
  },
  {
    q: '«Почему вес может стоять первые дни?»',
    a: 'В первые 3–5 дней организм перестраивается: почки начинают выводить лишнюю воду и натрий. Уходят отёки. Потом, как правило, результат становится очень заметным. В клубе Наташа объясняет каждый этап адаптации.',
  },
]

export default function ClubPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const sTag = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    color: '#2E7D50', marginBottom: 12,
  }
  const sTagBefore = { display: 'block', width: 20, height: 2, background: '#4CAF78', borderRadius: 2 }
  const h2 = {
    fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(22px,3.5vw,34px)',
    fontWeight: 700, color: '#3D2B8A', lineHeight: 1.2, margin: '0 0 10px',
  }
  const sub = { fontSize: 17, color: '#7B6FAA', margin: '0 0 48px', maxWidth: 600, lineHeight: 1.7 }
  const container = { maxWidth: 1100, margin: '0 auto', padding: '0 5%' }
  const section = { padding: '80px 5%' }

  return (
    <div style={{ background: '#FAF8FF', minHeight: '100vh', overflowX: 'hidden' as const }}>
      <PublicNav currentPage="/club" />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 5%' }}>
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Клуб «Вкус Жизни»' }]} />
      </div>

      {/* HERO */}
      <div style={{
        background: 'linear-gradient(135deg, #1A0E4E 0%, #3D2B8A 55%, #5B3FA8 100%)',
        padding: '80px 5%',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'center' }} className="club-hero-grid">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(76,175,120,0.15)', border: '1px solid rgba(76,175,120,0.3)', borderRadius: 100, padding: '6px 16px', marginBottom: 28 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF78', display: 'block' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#7BDFAA' }}>Клуб стройных и здоровых</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(28px,4vw,52px)', fontWeight: 700, color: '#fff', lineHeight: 1.15, margin: '0 0 20px' }}>
              Ты ешь правильно.<br />
              Но вес{' '}
              <span style={{ color: '#7BDFAA' }}>не уходит.</span>
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', maxWidth: 520, margin: '0 0 40px', lineHeight: 1.65 }}>
              Наташа знает почему — и объяснит тебе это простым языком. Не очередная диета. Понимание того, как работают гормоны твоего тела.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 36 }}>
              <a href="https://club.nata-tomshina.ru/join?plan=trial" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#4CAF78', color: '#fff',
                fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 600,
                padding: '16px 32px', borderRadius: 100, textDecoration: 'none',
                boxShadow: '0 8px 28px rgba(76,175,120,0.4)',
              }}>
                Попробовать 7 дней за 149 ₽
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
              <a href="#inside" style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                fontSize: 14, fontWeight: 600,
                padding: '16px 28px', borderRadius: 100,
                border: '1.5px solid rgba(255,255,255,0.2)', textDecoration: 'none',
              }}>
                Что внутри клуба →
              </a>
            </div>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' as const }}>
              {[
                { val: '4 000+', label: 'участниц' },
                { val: 'с 2017', label: 'года' },
                { val: 'до −83 кг', label: 'рекорд' },
              ].map(({ val, label }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#7BDFAA' }}>{val}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero photo — hidden on mobile */}
          <div style={{ position: 'relative' }} className="club-hero-photo">
            <div style={{
              width: 280, height: 360, borderRadius: 28,
              background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/natalia.jpg" alt="Наталья Томшина" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            </div>
            {/* Float cards */}
            {[
              { style: { top: 20, left: -80 }, emoji: '⚡', text: 'Энергия вернулась', sub: 'уже за 1 неделю' },
              { style: { bottom: 80, left: -100 }, emoji: '👖', text: 'Джинсы застегнулись!', sub: 'Лада · −36 кг' },
              { style: { bottom: 20, right: -80 }, emoji: '💊', text: 'Отменила 13 таблеток', sub: 'Ирина · 14 диагнозов' },
            ].map(({ style, emoji, text, sub: s }) => (
              <div key={text} style={{
                position: 'absolute', ...style,
                background: '#fff', borderRadius: 14, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)', whiteSpace: 'nowrap',
              }}>
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#3D2B8A' }}>{text}</div>
                  <div style={{ fontSize: 11, color: '#7B6FAA' }}>{s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PAIN */}
      <section style={{
        background: 'linear-gradient(135deg, #1A0E4E 0%, #2E1A6E 100%)',
        padding: '80px 5%', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ ...container, position: 'relative', zIndex: 1 }}>
          <div style={{ ...sTag, color: '#7BDFAA' }}><span style={sTagBefore} />Узнай себя</div>
          <h2 style={{ ...h2, color: '#fff', marginBottom: 10 }}>
            Хотя бы один пункт —{' '}
            <em style={{ color: 'rgba(255,255,255,0.5)' }}>это про тебя?</em>
          </h2>
          <p style={{ ...sub, color: 'rgba(255,255,255,0.6)' }}>
            Если да — значит дело не в силе воли. Дело в том, что никто не объяснил тебе как работают гормоны.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }} className="pain-grid-3">
            {[
              { emoji: '🤷‍♀️', title: 'Ешь мало — а вес стоит', desc: 'Делаешь всё «правильно» по всем советам. Но весы уже месяцами показывают одно и то же.' },
              { emoji: '🍫', title: 'Постоянно хочется сладкого', desc: 'Думаешь — нет силы воли. На самом деле это биохимия: инсулин и грелин командуют мозгом.' },
              { emoji: '😔', title: 'Срывалась уже столько раз', desc: 'Каждый раз начинаешь с понедельника. Держишься две недели. Срыв — и всё сначала.' },
              { emoji: '😴', title: 'Вечная усталость — нет сил', desc: 'Кофе уже не помогает. После обеда хочется лечь. Ты забыла каково это — чувствовать себя бодрой.' },
              { emoji: '🏥', title: 'Есть диагнозы — врачи говорят «норма»', desc: 'Гипотиреоз, инсулинорезистентность, СПКЯ — и ощущение что тело живёт своей жизнью.' },
              { emoji: '📅', title: 'После 40 — всё пошло не так', desc: 'Делаешь то же что всегда — но результата нет. Никто не объяснял почему после 40 это не работает.' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} style={{
                background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '26px 22px',
              }}>
                <span style={{ fontSize: 32, marginBottom: 14, display: 'block' }}>{emoji}</span>
                <p style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 8, margin: '0 0 8px' }}>{title}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 20 }}>
              Это не слабость характера. <span style={{ color: '#7BDFAA' }}>Это гормоны.</span>
            </p>
            <a href="#method" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#4CAF78', color: '#fff',
              fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 600,
              padding: '14px 28px', borderRadius: 100, textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(76,175,120,0.35)',
            }}>
              Узнать в чём причина →
            </a>
          </div>
        </div>
      </section>

      {/* METHOD */}
      <section id="method" style={{ ...section, background: '#fff' }}>
        <div style={container}>
          <div style={sTag}><span style={sTagBefore} />Метод</div>
          <h2 style={h2}>Почему обычные диеты <em style={{ color: '#7B6FAA' }}>не работают</em></h2>
          <p style={sub}>И почему система питания для гормонального баланса даёт результат там, где всё остальное провалилось.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }} className="method-grid-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { num: '01', title: 'Управляем инсулином, а не калориями', desc: 'Когда инсулин постоянно высок — тело накапливает жир, что бы ты ни ела. Сокращаем приёмы пищи до 2–3 в день без перекусов — инсулин снижается и организм переключается в режим жиросжигания.' },
                { num: '02', title: 'Убираем голод через физиологию', desc: 'Едим нутритивно плотную еду — белки и правильные жиры до настоящей сытости. Гормон голода грелин выключается сам, не через силу воли. Через 2–3 недели ты перестаёшь думать о еде.' },
                { num: '03', title: 'Восстанавливаем гормоны', desc: 'Белок, железо, цинк, селен, йод — строительный материал для щитовидной железы и половых гормонов. Тело начинает работать правильно, а вес уходит как побочный эффект здоровья.' },
                { num: '04', title: 'Это образ жизни, а не временная диета', desc: 'Участницы клуба держат результат 3–4 года — потому что не «сидят на диете», а живут в системе, которая им комфортна. Алёна похудела на 43 кг — и держит вес уже четвёртый год.' },
              ].map(({ num, title, desc }) => (
                <div key={num} style={{
                  display: 'flex', gap: 18, alignItems: 'flex-start',
                  padding: 22, background: '#FAF8FF', border: '1.5px solid #EDE8FF', borderRadius: 16,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, background: '#3D2B8A', color: '#fff',
                    fontFamily: 'var(--font-unbounded)', fontSize: 16, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{num}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#3D2B8A', marginBottom: 5 }}>{title}</div>
                    <div style={{ fontSize: 14, color: '#7B6FAA', lineHeight: 1.6 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: 'linear-gradient(160deg, #3D2B8A 0%, #5B3FA8 100%)',
              borderRadius: 28, padding: '36px 32px',
            }}>
              <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 24, textAlign: 'center' }}>
                Обычная диета vs. Метод Натальи
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>Обычно</div>
                  {['Считать калории', 'Есть каждые 2 часа', 'Обезжиренные продукты', 'Терпеть голод', 'Результат на 2 мес.', 'Вес возвращается'].map(t => (
                    <div key={t} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#FF6B6B' }}>✗</span> {t}
                    </div>
                  ))}
                </div>
                <div style={{ background: 'rgba(76,175,120,0.15)', border: '1px solid rgba(76,175,120,0.3)', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#7BDFAA', marginBottom: 14 }}>Метод Натальи</div>
                  {['Есть до сытости', '2–3 раза в день', 'Жирное — полезно', 'Голода нет', 'Результат годами', 'Вес держится'].map(t => (
                    <div key={t} style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#4CAF78' }}>✓</span> {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOR WHOM */}
      <section style={section}>
        <div style={container}>
          <div style={sTag}><span style={sTagBefore} />Для кого</div>
          <h2 style={h2}>Работает, даже если у тебя...</h2>
          <p style={sub}>Большинство участниц приходят с одним или несколькими из этих состояний — и уходят с результатом.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }} className="diagn-grid-4">
            {[
              { icon: '🦋', title: 'Гипотиреоз / АИТ', desc: 'Питание даёт щитовидке нужные нутриенты вместо того, чтобы её «выключать» диетой' },
              { icon: '📈', title: 'Инсулинорезистентность', desc: 'Снижение инсулина — и есть лечение корня проблемы, а не симптомов' },
              { icon: '💉', title: 'Диабет 2 типа / преддиабет', desc: 'Участницы снижают сахар, врачи сами отменяют таблетки' },
              { icon: '🌸', title: 'СПКЯ и проблемы с циклом', desc: 'Снижение инсулина восстанавливает гормональный цикл' },
              { icon: '🫶', title: 'Менопауза / климакс', desc: 'Тамара похудела на 18 кг в 62 года — это возможно' },
              { icon: '⚖️', title: 'Вес 100+ кг', desc: 'Рекорд клуба — минус 83 кг. Начинала с 185 кг' },
              { icon: '🔁', title: '«Ветеран диет»', desc: 'Перепробовала всё — потому что работала со следствием, а не с причиной' },
              { icon: '🫀', title: 'Гипертония / подагра', desc: 'Лариса отменила таблетки от давления, снизив вес на 39 кг' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 16, padding: '18px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EDE8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#3D2B8A', lineHeight: 1.3 }}>{title}</div>
                <div style={{ fontSize: 12, color: '#7B6FAA', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S INSIDE */}
      <section id="inside" style={{ ...section, background: '#fff' }}>
        <div style={container}>
          <div style={sTag}><span style={sTagBefore} />Что внутри</div>
          <h2 style={h2}>Всё что нужно — <em style={{ color: '#7B6FAA' }}>в одном месте</em></h2>
          <p style={sub}>Клуб — это не набор видеоуроков, которые нужно «успеть пройти». Это живая среда, где ты получаешь поддержку каждый день.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }} className="inside-grid-3">
            {[
              { emoji: '🍳', title: 'Умная кухня', desc: 'ИИ-помощник по питанию. Напиши что есть в холодильнике — получи рецепт под метод Натальи. Сохрани в избранное одним касанием.', tag: 'Каждый день', color: '#4CAF78' },
              { emoji: '📚', title: 'Курсы и вебинары', desc: '300+ уроков: метаболизм, гормоны, щитовидная железа, волосы, кожа, добавки. Понимаешь один раз — и результат держится годами.', tag: '300+ уроков', color: '#7C5CFC' },
              { emoji: '🏃‍♀️', title: 'Марафоны каждый месяц', desc: '14 дней интенсивного фокуса раз в месяц. Каждый марафон — разная тема. Наташа ведёт лично. Включено в подписку.', tag: 'Каждый месяц', color: '#E8845A' },
              { emoji: '🧘', title: 'Медитации', desc: 'Аудиомедитации для работы с пищевым поведением, стрессом и пищевой зависимостью. Слушай когда угодно.', tag: 'Всегда доступны', color: '#F5A623' },
              { emoji: '💬', title: 'Живое сообщество', desc: 'Закрытый чат клуба — тысячи женщин поддерживают друг друга каждый день. Болталка, тарелочки, вопросы Наташе лично.', tag: 'Поддержка 24/7', color: '#4CAF78' },
              { emoji: '📊', title: 'Трекер и дневник', desc: 'Фиксируй вес, объёмы, самочувствие, тягу к сладкому. Видишь прогресс — держишь мотивацию даже в сложные недели.', tag: 'Твой прогресс', color: '#7C5CFC' },
            ].map(({ emoji, title, desc, tag, color }, i) => (
              <div key={title} style={{
                borderRadius: 24, padding: '28px 24px', border: '1.5px solid #EDE8FF',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '3px 3px 0 0' }} />
                <span style={{ fontSize: 36, marginBottom: 14, display: 'block' }}>{emoji}</span>
                <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', marginBottom: 10 }}>{title}</div>
                <div style={{ fontSize: 14, color: '#7B6FAA', lineHeight: 1.65, marginBottom: 14 }}>{desc}</div>
                <span style={{ display: 'inline-block', background: '#EDE8FF', color: '#3D2B8A', padding: '4px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section style={{
        background: 'linear-gradient(135deg, #1A0E4E 0%, #2E1A6E 100%)',
        padding: '80px 5%', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ ...container, position: 'relative', zIndex: 1 }}>
          <div style={{ ...sTag, color: '#7BDFAA' }}><span style={sTagBefore} />Истории участниц</div>
          <h2 style={{ ...h2, color: '#fff' }}>
            Они тоже сомневались. <em style={{ color: 'rgba(255,255,255,0.5)' }}>И всё равно попробовали.</em>
          </h2>
          <p style={{ ...sub, color: 'rgba(255,255,255,0.6)' }}>Обычные женщины — разного возраста, с разными диагнозами. У них получилось.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }} className="results-grid-3">
            {[
              { kg: '−43 кг', name: 'Алёна · за год', quote: '«Начинала с 106 кг. Кожа не обвисла — подтянулась. Я теперь хочу двигаться просто потому что могу.»', extra: 'Держит вес 4-й год' },
              { kg: '−39 кг', name: 'Лариса · 55 лет', quote: '«Давление ушло со 170 до 125. Кардиолог сам отменил таблетки. Теперь хожу в горы — суставы не болят.»', extra: '+ отменила таблетки' },
              { kg: '13 💊', name: 'Ирина · 14 диагнозов', quote: '«14 таблеток ежедневно. Через 2 недели в клубе почувствовала себя другим человеком. Сделала ремонт своими руками.»', extra: 'Отменила 13 препаратов' },
              { kg: '−26 кг', name: 'Нина', quote: '«Мир стал ярче буквально — цвета насыщеннее. Как будто убрали запотевшее стекло. Я начала ходить на работу пешком.»', extra: '+ вернулась энергия' },
              { kg: '−18 кг', name: 'Тамара · 62 года · гипотиреоз', quote: '«Врачи говорили — при гипотиреозе в 62 года это невозможно. Я им показала анализы. Они удивились.»', extra: 'Колени не болят' },
              { kg: '−83 кг', name: 'Анонимная участница', quote: '«Начинала с 185 кг. Думала — не для меня. Система работает для всех, кто готов понять как устроен организм.»', extra: 'Рекорд клуба' },
            ].map(({ kg, name, quote, extra }) => (
              <div key={name} style={{
                background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)',
                borderRadius: 22, padding: 26,
              }}>
                <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 42, fontWeight: 700, color: '#7BDFAA', lineHeight: 1, marginBottom: 4 }}>{kg}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{name}</div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, fontStyle: 'italic', marginBottom: 14 }}>{quote}</p>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#7BDFAA', background: 'rgba(76,175,120,0.15)', padding: '5px 12px', borderRadius: 10, display: 'inline-block' }}>{extra}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href="/results" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.1)', color: '#fff',
              fontSize: 14, fontWeight: 600, padding: '14px 28px', borderRadius: 100,
              border: '1.5px solid rgba(255,255,255,0.2)', textDecoration: 'none',
            }}>
              Все истории участниц →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={section}>
        <div style={container}>
          <div style={sTag}><span style={sTagBefore} />Вопросы</div>
          <h2 style={h2}>Что тебя <em style={{ color: '#7B6FAA' }}>останавливает</em></h2>
          <p style={sub}>Разбираем самые частые сомнения — честно, без давления.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="faq-grid-2">
            {FAQS.map(({ q, a }, i) => (
              <div
                key={i}
                style={{
                  background: '#fff', border: `1.5px solid ${openFaq === i ? '#7C5CFC' : '#EDE8FF'}`,
                  borderRadius: 20, padding: '24px 26px', cursor: 'pointer',
                  boxShadow: openFaq === i ? '0 6px 20px rgba(61,43,138,0.08)' : 'none',
                }}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#3D2B8A', lineHeight: 1.4 }}>{q}</div>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: openFaq === i ? '#3D2B8A' : '#EDE8FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: openFaq === i ? '#fff' : '#3D2B8A',
                    flexShrink: 0, transition: '0.3s',
                    transform: openFaq === i ? 'rotate(45deg)' : 'none',
                  }}>+</div>
                </div>
                {openFaq === i && (
                  <div style={{ fontSize: 14, color: '#7B6FAA', lineHeight: 1.7, marginTop: 14, paddingTop: 14, borderTop: '1.5px solid #EDE8FF' }}>
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{
        background: 'linear-gradient(135deg, #1A0E4E 0%, #3D2B8A 60%, #5B3FA8 100%)',
        padding: '80px 5%', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ ...container, position: 'relative', zIndex: 1 }}>
          <div style={{ ...sTag, color: '#7BDFAA', justifyContent: 'center' as const }}><span style={sTagBefore} />Вступление</div>
          <h2 style={{ ...h2, color: '#fff', textAlign: 'center' }}>Выбери свой формат</h2>
          <p style={{ ...sub, color: 'rgba(255,255,255,0.6)', margin: '0 auto 48px', textAlign: 'center' }}>Начните свой путь к здоровью и лёгкости</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, maxWidth: 860, margin: '0 auto' }} className="pricing-cards-3">
            {[
              {
                name: '🌱 Попробовать', price: '149', period: '₽ за 7 дней · полный доступ',
                save: 'Потом 1 500 ₽/мес', featured: false,
                items: ['Вводные курсы', 'Умная кухня с рецептами', 'Дневник питания', 'Трекер замеров', 'Чат для общения', '* Марафоны — с тарифа Месяц'],
                btn: 'Начать за 149 ₽ →',
                href: 'https://club.nata-tomshina.ru/join?plan=trial',
              },
              {
                name: 'Месяц', price: '1 500', period: '₽ в месяц · автопродление',
                save: ' ', featured: true, badge: '⭐ Популярный',
                items: ['Всё из тарифа «Пробный»', 'Марафоны включены', 'Вебинары (бесплатно по статусу)', 'Медитации', 'Личные вопросы Наташе'],
                btn: 'Вступить на месяц →',
                href: 'https://club.nata-tomshina.ru/join?plan=month',
              },
              {
                name: '💎 Полгода', price: '6 000', period: '₽ за 6 месяцев',
                save: 'Экономия 3 000 ₽', featured: false,
                items: ['Всё включено', '6 марафонов', 'Приоритет в чате', 'Вебинары и курсы (на выбор)'],
                btn: 'Вступить на полгода →',
                href: 'https://club.nata-tomshina.ru/join?plan=halfyear',
              },
            ].map(({ name, price, period, save, featured, badge, items, btn, href }) => (
              <div key={name} style={{
                background: featured ? '#fff' : 'rgba(255,255,255,0.08)',
                border: `1.5px solid ${featured ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 28, padding: '32px 28px', position: 'relative',
                textAlign: 'center',
                transform: featured ? 'scale(1.04)' : 'none',
              }}>
                {badge && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: '#4CAF78', color: '#fff', padding: '5px 18px', borderRadius: 16,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                    whiteSpace: 'nowrap',
                  }}>{badge}</div>
                )}
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: featured ? '#7B6FAA' : 'rgba(255,255,255,0.4)', marginBottom: 14, margin: '0 0 14px' }}>{name}</p>
                <p style={{ fontFamily: 'var(--font-unbounded)', fontSize: 44, fontWeight: 700, color: featured ? '#3D2B8A' : '#fff', lineHeight: 1, margin: '0 0 4px' }}>{price}</p>
                <p style={{ fontSize: 13, color: featured ? '#7B6FAA' : 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>{period}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: featured ? '#2E7D50' : '#7BDFAA', marginBottom: 24, margin: '0 0 24px', minHeight: 20 }}>{save}</p>
                <ul style={{ listStyle: 'none', marginBottom: 28, textAlign: 'left', padding: 0, margin: '0 0 28px' }}>
                  {items.map(item => item.startsWith('*') ? (
                    <li key={item} style={{
                      fontSize: 11, color: featured ? '#9B8FCC' : 'rgba(255,255,255,0.4)',
                      padding: '8px 0', borderBottom: `1px solid ${featured ? '#EDE8FF' : 'rgba(255,255,255,0.07)'}`,
                      fontStyle: 'italic',
                    }}>
                      {item.slice(2)}
                    </li>
                  ) : (
                    <li key={item} style={{
                      fontSize: 13, color: featured ? '#1A1230' : 'rgba(255,255,255,0.7)',
                      padding: '8px 0', borderBottom: `1px solid ${featured ? '#EDE8FF' : 'rgba(255,255,255,0.07)'}`,
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <span style={{ color: '#4CAF78', fontWeight: 700, flexShrink: 0 }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
                <a href={href} style={{
                  display: 'block', width: '100%', padding: 15, borderRadius: 20,
                  fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center',
                  background: featured ? '#4CAF78' : 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  border: featured ? '1.5px solid #4CAF78' : '1.5px solid rgba(255,255,255,0.2)',
                  boxShadow: featured ? '0 6px 20px rgba(76,175,120,0.35)' : 'none',
                  boxSizing: 'border-box' as const,
                }}>{btn}</a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            Без скрытых платежей. Отмена в личном кабинете в 1 клик.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: '#FAF8FF', padding: '80px 6%' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3D2B8A 0%, #5B3FA8 100%)',
            borderRadius: 32, padding: '64px 48px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <h2 style={{ color: '#fff', fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(24px,3.5vw,36px)', margin: '0 0 12px' }}>
              Хватит воевать с собственным телом
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.6 }}>
              Ты заслуживаешь чувствовать себя лёгкой, энергичной и здоровой. Начни с 7 дней — и убедись сама.
            </p>
            <a href="https://club.nata-tomshina.ru/join?plan=trial" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, position: 'relative',
              background: '#4CAF78', color: '#fff',
              fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 600,
              padding: '17px 36px', borderRadius: 100, textDecoration: 'none',
              boxShadow: '0 8px 28px rgba(76,175,120,0.4)',
            }}>
              Попробовать 7 дней за 149 ₽
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
            <span style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 14, position: 'relative' }}>
              Без обязательств. Отмена в 1 клик.
            </span>
          </div>
        </div>
      </section>

      <PublicFooter />

      <style>{`
        @media (max-width: 840px) {
          .club-hero-photo { display: none; }
          .club-hero-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 1000px) {
          .pain-grid-3 { grid-template-columns: repeat(2,1fr) !important; }
          .diagn-grid-4 { grid-template-columns: repeat(2,1fr) !important; }
          .inside-grid-3 { grid-template-columns: repeat(2,1fr) !important; }
          .results-grid-3 { grid-template-columns: repeat(2,1fr) !important; }
          .pricing-cards-3 { grid-template-columns: 1fr !important; max-width: 400px !important; margin: 0 auto !important; }
        }
        @media (max-width: 600px) {
          .faq-grid-2 { grid-template-columns: 1fr !important; }
          .method-grid-2 { grid-template-columns: 1fr !important; }
          .pain-grid-3 { grid-template-columns: 1fr !important; }
          .diagn-grid-4 { grid-template-columns: 1fr !important; }
          .inside-grid-3 { grid-template-columns: 1fr !important; }
          .results-grid-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
