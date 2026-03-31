import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'

export const metadata: Metadata = {
  title: 'Об авторе — Наталья Томшина | Клуб «Вкус Жизни»',
  description: 'Наталья Томшина — нутрициолог, основатель клуба «Вкус Жизни». С 2017 года помогает женщинам восстановить гормональный баланс и снизить вес без голода.',
}

const S = {
  page: { background: '#FAF8FF', minHeight: '100vh', overflowX: 'hidden' as const },

  // Hero
  hero: {
    maxWidth: 1100, margin: '0 auto', padding: '72px 5% 0',
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'end' as const,
  },
  heroText: { paddingBottom: 60 },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#7B6FAA', marginBottom: 28 },
  eyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    color: '#2E7D50', marginBottom: 16,
  },
  h1: {
    fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(28px,4vw,46px)',
    fontWeight: 700, color: '#3D2B8A', lineHeight: 1.15, marginBottom: 12, margin: '0 0 12px',
  },
  heroRole: { fontSize: 18, color: '#7B6FAA', marginBottom: 28, margin: '0 0 28px' },
  heroTags: { display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 36 },
  heroCtaRow: { display: 'flex', gap: 12, flexWrap: 'wrap' as const },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: '#4CAF78', color: '#fff',
    fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 600,
    padding: '14px 28px', borderRadius: 100, textDecoration: 'none',
    boxShadow: '0 4px 20px rgba(76,175,120,0.35)',
  },
  btnSecondary: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'transparent', color: '#3D2B8A',
    fontSize: 14, fontWeight: 600,
    padding: '14px 28px', borderRadius: 100,
    border: '1.5px solid #EDE8FF', textDecoration: 'none',
  },

  // Stats band
  statsBand: {
    background: 'linear-gradient(135deg, #1A0E4E 0%, #3D2B8A 100%)',
    padding: '64px 5%',
  },
  statsGrid: {
    maxWidth: 900, margin: '0 auto',
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 2,
  },
  statItem: { textAlign: 'center' as const, padding: '32px 24px', borderRight: '1px solid rgba(255,255,255,0.1)' },
  statVal: { fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(32px,4vw,48px)', fontWeight: 700, color: '#7BDFAA', lineHeight: 1, marginBottom: 8 },
  statLabel: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 },

  // Section
  section: { padding: '80px 5%' },
  container: { maxWidth: 900, margin: '0 auto' },
  sectionEyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    color: '#2E7D50', marginBottom: 12,
  },
  h2: {
    fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(22px,3.5vw,32px)',
    fontWeight: 700, color: '#3D2B8A', lineHeight: 1.25, marginBottom: 10, margin: '0 0 10px',
  },
  sectionSub: { fontSize: 17, color: '#7B6FAA', marginBottom: 48, maxWidth: 600, margin: '0 0 48px' },
}

export default function AboutPage() {
  return (
    <div style={S.page}>
      <PublicNav currentPage="/about" />

      {/* HERO */}
      <div style={S.hero} className="about-hero">
        <div style={S.heroText}>
          <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Об авторе' }]} />
          <div style={S.eyebrow}>
            <span style={{ display: 'block', width: 24, height: 2, background: '#4CAF78', borderRadius: 2 }} />
            Об авторе
          </div>
          <h1 style={S.h1}>Наталья<br /><span style={{ color: '#4CAF78' }}>Томшина</span></h1>
          <p style={S.heroRole}>Нутрициолог · Основатель клуба «Вкус Жизни»</p>
          <div style={S.heroTags}>
            {['С 2017 года в практике', 'Мама двоих детей', 'Нутрициолог'].map(t => (
              <span key={t} style={{
                fontSize: 13, fontWeight: 600,
                padding: '6px 16px', borderRadius: 100,
                border: '1.5px solid #EDE8FF',
                color: '#3D2B8A', background: '#fff',
              }}>{t}</span>
            ))}
            <span style={{
              fontSize: 13, fontWeight: 600,
              padding: '6px 16px', borderRadius: 100,
              border: '1.5px solid rgba(76,175,120,0.35)',
              color: '#2E7D50', background: '#E8F5EE',
            }}>4000+ участниц</span>
          </div>
          <div style={S.heroCtaRow}>
            <a href="https://club.nata-tomshina.ru/join?plan=trial" style={S.btnPrimary}>
              Попробовать клуб за 149 ₽
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
            <Link href="/results" style={S.btnSecondary}>Результаты участниц →</Link>
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 440 }}>
            {/* Decorative bg */}
            <div style={{
              position: 'absolute', bottom: 0, left: '8%', right: '8%', height: '88%',
              background: 'linear-gradient(160deg, #EDE8FF 0%, #D4C8FF 100%)',
              borderRadius: '28px 28px 0 0', zIndex: 0,
            }} />
            {/* Floating badges */}
            <div className="about-float-badge" style={{
              position: 'absolute', top: 40, left: -20, zIndex: 2,
              background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 16,
              padding: '12px 16px', boxShadow: '0 8px 40px rgba(61,43,138,0.10)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>📅</span>
              <div>
                <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 700, color: '#3D2B8A', lineHeight: 1 }}>2017</div>
                <div style={{ fontSize: 12, color: '#7B6FAA', lineHeight: 1.3 }}>Год начала практики</div>
              </div>
            </div>
            <div className="about-float-badge" style={{
              position: 'absolute', top: 160, right: -24, zIndex: 2,
              background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 16,
              padding: '12px 16px', boxShadow: '0 8px 40px rgba(61,43,138,0.10)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>💚</span>
              <div>
                <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 700, color: '#3D2B8A', lineHeight: 1 }}>4 000+</div>
                <div style={{ fontSize: 12, color: '#7B6FAA', lineHeight: 1.3 }}>Женщин прошли курс</div>
              </div>
            </div>
            <div className="about-float-badge" style={{
              position: 'absolute', bottom: 80, left: -24, zIndex: 2,
              background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 16,
              padding: '12px 16px', boxShadow: '0 8px 40px rgba(61,43,138,0.10)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>⚡</span>
              <div>
                <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 700, color: '#3D2B8A', lineHeight: 1 }}>0</div>
                <div style={{ fontSize: 12, color: '#7B6FAA', lineHeight: 1.3 }}>Голода и подсчёта калорий</div>
              </div>
            </div>

            {/* Photo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/natalia.jpg"
              alt="Наталья Томшина — нутрициолог"
              style={{
                position: 'relative', zIndex: 1,
                width: '100%', borderRadius: '24px 24px 0 0',
                display: 'block', objectFit: 'cover', objectPosition: 'top center',
                maxHeight: 560,
              }}
            />
          </div>
        </div>
      </div>

      {/* STATS BAND */}
      <div style={S.statsBand}>
        <div style={S.statsGrid} className="about-stats">
          {[
            { val: '9+', label: 'лет в нутрициологии и практике' },
            { val: '4 000+', label: 'женщин изменили здоровье и вес' },
            { val: '83 кг', label: 'рекорд похудения участницы клуба' },
            { val: '3', label: 'сертификата и диплома нутрициолога' },
          ].map((s, i) => (
            <div key={i} style={{ ...S.statItem, ...(i === 3 ? { borderRight: 'none' } : {}) }}>
              <div style={S.statVal}>{s.val}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* STORY */}
      <section style={S.section}>
        <div style={S.container}>
          <div style={S.sectionEyebrow}>
            <span style={{ display: 'block', width: 20, height: 2, background: '#4CAF78', borderRadius: 2 }} />
            История
          </div>
          <h2 style={S.h2}>Я сама прошла этот путь</h2>
          <p style={S.sectionSub}>Почему нутрициолог, которая знает всё о питании, годами не могла похудеть — и что всё изменило.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 56, alignItems: 'start' }} className="about-story">
            <div>
              {[
                <>Я не пришла в нутрициологию из академии. Я пришла туда <strong style={{ color: '#3D2B8A', fontWeight: 600 }}>из собственного тупика</strong>.</>,
                'Много лет я делала «всё правильно»: считала калории, ела по 5–6 раз в день маленькими порциями, избегала жирного. После рождения детей вес никуда не уходил, несмотря на все усилия. Я чувствовала себя уставшей, раздражительной, и постоянно хотела сладкого.',
                <><em>«Всё в норме»</em> — говорили врачи. Анализы были в референсных значениях. Но я понимала — что-то не так на более глубоком уровне.</>,
                <>Когда я начала изучать, <strong style={{ color: '#3D2B8A', fontWeight: 600 }}>как инсулин управляет жировым обменом</strong>, как питание влияет на гормоны щитовидной железы, как связаны усталость, сахар и тяга к сладкому — всё встало на свои места.</>,
                'Я изменила подход к питанию. Убрала перекусы, добавила правильные жиры, поставила белок в основу каждого приёма пищи. Через две недели ушла дневная сонливость. Через месяц — постоянный голод. Тело начало работать так, как должно.',
                'С 2017 года я живу в этой системе. И каждый год помогаю тысячам женщин — от 30 до 70+ лет — сделать то же самое. Не через насилие над собой, а через понимание биохимии своего тела.',
              ].map((text, i) => (
                <p key={i} style={{ fontSize: 17, color: '#1A1230', lineHeight: 1.8, marginBottom: 20 }}>{text}</p>
              ))}
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #3D2B8A 0%, #5B3FA8 100%)',
              borderRadius: 20, padding: '32px 28px', color: '#fff',
              position: 'sticky', top: 90,
            }}>
              <p style={{
                fontSize: 18, lineHeight: 1.6, fontStyle: 'italic',
                color: 'rgba(255,255,255,0.9)', marginBottom: 24, margin: '0 0 24px',
                paddingLeft: 16, borderLeft: '3px solid rgba(76,175,120,0.7)',
              }}>
                «Лишний вес — это не слабость характера. Это гормональный сигнал. Как только вы начнёте работать с причиной, а не следствием — всё меняется.»
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/natalia.jpg" alt="Наталья Томшина" style={{
                  width: 44, height: 44, borderRadius: '50%', objectFit: 'cover',
                  border: '2px solid rgba(76,175,120,0.5)',
                }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Наталья Томшина</div>
                  <div style={{ fontSize: 13, opacity: 0.65 }}>Нутрициолог, основатель «Вкус Жизни»</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { year: '2017', text: 'Начала практиковать метаболическое питание, первые результаты у себя' },
                  { year: '2018', text: 'Первые клиентки, запуск марафонов по похудению' },
                  { year: '2020', text: 'Основание закрытого клуба «Вкус Жизни»' },
                  { year: '2024', text: 'Более 4000 женщин прошли обучение и изменили здоровье' },
                ].map(({ year, text }) => (
                  <div key={year} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', minWidth: 44, paddingTop: 2 }}>{year}</div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF78', flexShrink: 0, marginTop: 8 }} />
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METHOD */}
      <section style={{ ...S.section, background: '#fff' }}>
        <div style={S.container}>
          <div style={S.sectionEyebrow}>
            <span style={{ display: 'block', width: 20, height: 2, background: '#4CAF78', borderRadius: 2 }} />
            Подход
          </div>
          <h2 style={S.h2}>Три принципа, которые работают</h2>
          <p style={S.sectionSub}>Почему обычные диеты дают временный результат — и что происходит, когда работаешь с причиной.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="about-principles">
            {[
              { num: '01', title: 'Гормоны управляют весом, а не калории', text: 'Когда инсулин постоянно высок — тело накапливает жир, что бы вы ни ели. Нормализуем инсулин через питание — тело само начинает использовать собственные запасы.' },
              { num: '02', title: 'Сытость — это физиология, не сила воли', text: 'Голод и тяга к сладкому — не слабость. Это сигналы гормонов грелина и инсулина. Когда организм получает нутритивно плотную еду — эти сигналы выключаются сами.' },
              { num: '03', title: 'Это образ жизни, а не временная диета', text: 'Участницы клуба держат результат годами — потому что не «сидят на диете», а живут в системе питания, которая им комфортна и не требует постоянного контроля.' },
            ].map(({ num, title, text }) => (
              <div key={num} style={{
                background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 20, padding: '28px 24px',
              }}>
                <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 42, fontWeight: 700, color: '#EDE8FF', lineHeight: 1, marginBottom: 16 }}>{num}</div>
                <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 600, color: '#3D2B8A', marginBottom: 10, lineHeight: 1.3 }}>{title}</div>
                <p style={{ fontSize: 15, color: '#7B6FAA', lineHeight: 1.6, margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR WHOM */}
      <section style={S.section}>
        <div style={S.container}>
          <div style={S.sectionEyebrow}>
            <span style={{ display: 'block', width: 20, height: 2, background: '#4CAF78', borderRadius: 2 }} />
            Для кого
          </div>
          <h2 style={S.h2}>Метод работает, даже если у вас...</h2>
          <p style={S.sectionSub}>Большинство участниц приходят с одним или несколькими из этих состояний.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 16 }}>
            {[
              { icon: '🦋', title: 'Гипотиреоз / АИТ', desc: 'Питание даёт щитовидке нужные нутриенты вместо того, чтобы её «выключать»' },
              { icon: '📈', title: 'Инсулинорезистентность', desc: 'Снижение инсулина — это и есть лечение корня проблемы' },
              { icon: '💉', title: 'Диабет 2 типа / преддиабет', desc: 'Участницы снижают сахар и инсулин, врачи отменяют таблетки' },
              { icon: '🌸', title: 'Менопауза / СПКЯ', desc: 'Питание берёт на себя роль «протектора» в период гормональной перестройки' },
              { icon: '🔁', title: '«Ветеран диет»', desc: 'Все перепробовали, вес возвращается — потому что работали со следствием' },
              { icon: '😴', title: 'Хроническая усталость', desc: 'Клеточный голод при инсулинорезистентности — причина «состояния мумии»' },
              { icon: '🎂', title: 'Возраст 50–70+ лет', desc: 'Тамара — минус 18 кг в 62 года с гипотиреозом. Возраст не ограничение' },
              { icon: '⚖️', title: 'Вес 100+ кг', desc: 'Рекорд клуба — минус 83 кг. Начинала с 185 кг' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 16, padding: 20,
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EDE8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#3D2B8A', marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 13, color: '#7B6FAA', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CERTS */}
      <section style={{ padding: '0 5% 80px' }}>
        <div style={S.container}>
          <div style={S.sectionEyebrow}>
            <span style={{ display: 'block', width: 20, height: 2, background: '#4CAF78', borderRadius: 2 }} />
            Образование
          </div>
          <h2 style={S.h2}>Сертификаты и дипломы</h2>
          <p style={S.sectionSub}>Теория подкреплена практикой с тысячами реальных клиенток.</p>

          <div style={{
            background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 20, padding: 40,
            display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' as const,
          }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h3 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#3D2B8A', marginBottom: 16, margin: '0 0 16px' }}>
                Профессиональное образование
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Нутрициолог — диплом об окончании профессионального курса',
                  'Управление весом — специализированный сертификат',
                  'Витаминология и нутрициология — дополнительная специализация',
                ].map(cert => (
                  <div key={cert} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: '#1A1230' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF78', flexShrink: 0, display: 'block' }} />
                    {cert}
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 20, fontSize: 14, color: '#7B6FAA', fontStyle: 'italic', margin: '20px 0 0' }}>
                Наталья не является врачом. Рекомендации по питанию не заменяют медицинскую консультацию при наличии серьёзных заболеваний.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, alignItems: 'flex-start' }}>
              {[1, 2, 3].map(n => (
                <div key={n} style={{
                  width: 100, height: 140, borderRadius: 12,
                  background: 'linear-gradient(135deg, #EDE8FF 0%, #D4C8FF 100%)',
                  border: '2px dashed #EDE8FF',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, fontSize: 12, color: '#7B6FAA', textAlign: 'center', padding: 12,
                }}>
                  <span style={{ fontSize: 28 }}>📜</span>
                  Сертификат {n}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '0 5% 80px' }}>
        <div style={S.container}>
          <div style={{
            background: 'linear-gradient(135deg, #3D2B8A 0%, #5B3FA8 100%)',
            borderRadius: 28, padding: '56px 48px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <h2 style={{ color: '#fff', fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(22px,3.5vw,32px)', marginBottom: 12, margin: '0 0 12px' }}>
              Хотите узнать, как это работает именно для вас?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.6 }}>
              Начните с 7 дней в клубе. Полный доступ ко всем материалам, рецептам и поддержке куратора.
            </p>
            <a href="https://club.nata-tomshina.ru/join?plan=trial" style={{
              ...S.btnPrimary,
              position: 'relative',
            }}>
              Попробовать 7 дней за 149 ₽
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
            <span style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 14 }}>
              Без обязательств. Отмена в 1 клик.
            </span>
          </div>
        </div>
      </section>

      <PublicFooter />

      <style>{`
        @media (max-width: 900px) {
          .about-hero { grid-template-columns: 1fr !important; }
          .about-story { grid-template-columns: 1fr !important; }
          .about-float-badge { display: none !important; }
        }
        @media (max-width: 700px) {
          .about-principles { grid-template-columns: 1fr !important; }
          .about-stats { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 480px) {
          .about-stats { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
