'use client'
import { useState } from 'react'

const LESSONS = [
  {
    num: '0', title: 'Вводный урок', desc: 'О практикуме и что вас ждёт',
    content: null,
    task: 'Прочитайте этот вводный текст до конца и запишите три причины, по которым вы раньше не достигали результата. Это важно для понимания.',
    note: 'Наталья рассказывает о методе и объясняет, почему этот практикум отличается от всего, что вы пробовали раньше. Важно: не меняйте питание резко — вводите привычки постепенно.',
  },
  {
    num: '1', title: 'Правильная тарелка для похудения', desc: 'Волшебный завтрак · Видео + задание',
    videos: ['maqDNYomrqnC2hbBwxR4kW', 'w7m6j1upAnWuiHFhSDfdSy'],
    task: 'Завтра утром приготовьте белково-жировой завтрак: яйца (омлет или яичница) + сыр или мясо. Никаких каш, мюсли и сока. Обратите внимание — как долго продержится сытость?',
  },
  {
    num: '2', title: 'Продукты, помогающие снижать вес', desc: 'Что есть и чего избегать — конкретно',
    videos: ['vAggowP18q2yqVqrnUmHiN'],
    note: '💡 После этого урока вы получите два списка продуктов — разрешённые и исключаемые. Следующий урок — с примером рациона.',
  },
  {
    num: '3', title: 'Порции — сколько есть?', desc: 'Пример рациона на неделю',
    videos: ['2VpTvSt1vtj1dDMZvdqLe3'],
    note: '📋 Пример рациона на неделю — смотрите в разделе ниже. Все продукты — из ближайшего магазина.',
  },
  {
    num: '4', title: 'Вода как лекарство', desc: 'Простая привычка с огромным эффектом',
    videos: ['cK1X2ZtWXeU1oannqx53Po'],
    task: 'Начните день со стакана тёплой воды с лимоном. Поставьте бутылку воды на видное место и пейте маленькими глотками в течение дня. Цель — 1,5 литра.',
  },
  {
    num: '5', title: 'Привычки до и после еды', desc: 'Для стройности и красоты',
    videos: ['iHcVVctpX1JswGz1zRxmZk'],
  },
  {
    num: '6', title: 'Перекусы — главный враг стройности', desc: 'Почему «полезный перекус» — миф',
    videos: ['5eKCzuJspnBA1NY6ZfY78D'],
    note: 'Даже яблоко или кофе с молоком между едой — это перекус. Он поднимает инсулин и блокирует жиросжигание на несколько часов. После этого урока вы поймёте механизм.',
  },
  {
    num: '7', title: '5 советов по достижению результата', desc: 'Финальный урок · Ваш план на завтра',
    isFinal: true,
  },
]

const TIPS = [
  { title: 'Составьте меню хотя бы на 3 дня', text: 'воспользуйтесь готовым рационом ниже. Уберите провоцирующие продукты подальше в шкаф.' },
  { title: 'Ешьте только когда голодны.', text: 'Не по расписанию, не «потому что все обедают». Каждый раз сначала выпейте стакан воды — часто это просто жажда.' },
  { title: 'Ешьте натуральную еду.', text: 'Птица, рыба, мясо, яйца, овощи. Чем меньше продукт подвергался переработке — тем лучше.' },
  { title: 'Не будьте фанатичны.', text: 'Съели пирожное на дне рождения — не катастрофа. Просто вернитесь к системе на следующий день без самобичевания.' },
  { title: 'Исключите сладкие напитки.', text: 'Соки, смузи, компоты, газировка — всё это «жидкие» углеводы. Учитесь пить воду, хотя бы 1,5 литра в день.' },
]

export default function CourseContent({ email }: { email: string }) {
  const [openLesson, setOpenLesson] = useState<string | null>('0')

  return (
    <div style={{ background: '#FAF8FF', minHeight: '100vh' }}>
      {/* Simple nav */}
      <nav style={{
        background: 'rgba(250,248,255,0.94)', backdropFilter: 'blur(16px)',
        borderBottom: '1.5px solid #EDE8FF', padding: '14px 20px',
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', textDecoration: 'none' }}>
          Вкус<span style={{ color: '#4CAF78' }}>Жизни</span>
        </a>
        <a href="https://nata-tomshina.ru/club" style={{
          fontSize: 13, fontWeight: 600, color: '#2E7D50', textDecoration: 'none',
          padding: '8px 18px', border: '1.5px solid #4CAF78', borderRadius: 100,
        }}>
          Попробовать клуб →
        </a>
      </nav>

      {/* HERO */}
      <div style={{
        background: 'linear-gradient(135deg, #2E1A6E 0%, #3D2B8A 50%, #5B3FA8 100%)',
        padding: '60px 20px 80px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'inline-block', background: 'rgba(76,175,120,0.25)', border: '1px solid rgba(76,175,120,0.5)', color: '#7BDFAA', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 18px', borderRadius: 100, marginBottom: 24 }}>
          Бесплатный мини-курс
        </div>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(26px,5vw,44px)', fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: '0 0 16px' }}>
          Волшебный <span style={{ color: '#7BDFAA' }}>пендель</span>
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', maxWidth: 560, margin: '0 auto 32px' }}>
          7 уроков, которые объяснят — почему диеты не работают и что делать прямо с завтра
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 16,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 100, padding: '10px 24px 10px 10px',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/natalia.jpg" alt="Наталья Томшина" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(76,175,120,0.6)' }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 600, color: '#fff' }}>Наталья Томшина</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Нутрициолог · Основатель клуба «Вкус Жизни»</div>
          </div>
        </div>
        {email && (
          <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            Доступ для: {email}
          </p>
        )}
      </div>

      {/* WHAT YOU GET */}
      <section style={{ padding: '56px 0' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2E7D50', marginBottom: 12 }}>
            <span style={{ display: 'block', width: 24, height: 2, background: '#4CAF78', borderRadius: 2 }} />
            За время курса
          </div>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,3.5vw,30px)', fontWeight: 700, color: '#3D2B8A', margin: '0 0 8px' }}>
            Что изменится уже за 7 уроков
          </h2>
          <p style={{ fontSize: 17, color: '#7B6FAA', margin: '0 0 32px' }}>Никаких сложных схем. Смотрите уроки и выполняйте простые задания.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
            {[
              { icon: '🎯', text: <><strong style={{ color: '#3D2B8A' }}>Поймёте причину</strong> — почему вес стоит, даже если вы едите «правильно»</> },
              { icon: '🍳', text: <><strong style={{ color: '#3D2B8A' }}>Поменяете завтрак</strong> на жиросжигающий — почувствуете разницу через 2 дня</> },
              { icon: '⚡', text: <><strong style={{ color: '#3D2B8A' }}>Узнаете об инсулине</strong> — главном «выключателе» жиросжигания</> },
              { icon: '🚫', text: <><strong style={{ color: '#3D2B8A' }}>Избавитесь от тяги к сладкому</strong> — это биохимия, не слабость воли</> },
              { icon: '📋', text: <><strong style={{ color: '#3D2B8A' }}>Получите пример рациона</strong> на неделю — продукты из любого магазина</> },
              { icon: '✨', text: <><strong style={{ color: '#3D2B8A' }}>Уже в первые дни</strong> уйдут отёки, вздутие и появится энергия</> },
            ].map(({ icon, text }, i) => (
              <div key={i} style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 16, padding: 20, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#E8F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
                <p style={{ fontSize: 15, color: '#1A1230', lineHeight: 1.5, margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LESSONS */}
      <section style={{ paddingTop: 0, paddingBottom: 56 }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2E7D50', marginBottom: 12 }}>
            <span style={{ display: 'block', width: 24, height: 2, background: '#4CAF78', borderRadius: 2 }} />
            Программа
          </div>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,3.5vw,30px)', fontWeight: 700, color: '#3D2B8A', margin: '0 0 8px' }}>
            7 уроков · Смотрите в своём темпе
          </h2>
          <p style={{ fontSize: 17, color: '#7B6FAA', margin: '0 0 32px' }}>Не спешите. Вводите привычки плавно — мозг принимает только 10% новизны.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {LESSONS.map(lesson => {
              const isOpen = openLesson === lesson.num
              return (
                <div key={lesson.num} style={{
                  background: '#fff', border: `1.5px solid ${isOpen ? '#7C5CFC' : '#EDE8FF'}`,
                  borderRadius: 20, overflow: 'hidden',
                  boxShadow: isOpen ? '0 4px 20px rgba(61,43,138,0.08)' : 'none',
                }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', cursor: 'pointer' }}
                    onClick={() => setOpenLesson(isOpen ? null : lesson.num)}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 14, flexShrink: 0,
                      background: lesson.isFinal ? '#F5A623' : '#3D2B8A',
                      color: '#fff', fontFamily: 'var(--font-unbounded)', fontSize: 16, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{lesson.num}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: '#3D2B8A', marginBottom: 3 }}>{lesson.title}</div>
                      <div style={{ fontSize: 13, color: '#7B6FAA' }}>{lesson.desc}</div>
                    </div>
                    <div style={{ fontSize: 18, color: '#7B6FAA', transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.3s', flexShrink: 0 }}>
                      ↓
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ padding: '0 24px 24px' }}>
                      {/* Videos */}
                      {lesson.videos?.map(vid => (
                        <div key={vid} style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
                          <iframe
                            src={`https://kinescope.io/embed/${vid}`}
                            allow="autoplay; fullscreen"
                            allowFullScreen
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                          />
                        </div>
                      ))}

                      {/* Note */}
                      {lesson.note && (
                        <div style={{ background: '#FAF8FF', borderRadius: 14, padding: '14px 16px', marginBottom: 14, fontSize: 15, color: '#3D2B8A', lineHeight: 1.6 }}>
                          {lesson.note}
                        </div>
                      )}

                      {/* Task */}
                      {lesson.task && (
                        <div style={{ background: '#EDE8FF', borderRadius: 14, padding: '16px 20px', marginTop: 12 }}>
                          <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 12, fontWeight: 700, color: '#3D2B8A', marginBottom: 8, letterSpacing: '0.05em' }}>⚡ ЗАДАНИЕ</div>
                          <p style={{ fontSize: 15, color: '#3D2B8A', lineHeight: 1.6, margin: 0 }}>{lesson.task}</p>
                        </div>
                      )}

                      {/* Final lesson tips */}
                      {lesson.isFinal && (
                        <>
                          <p style={{ fontSize: 16, color: '#7B6FAA', margin: '0 0 16px' }}>
                            Вот и подошёл к завершению наш экспресс-курс. Держите конкретный план — что делать прямо с завтрашнего дня:
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {TIPS.map(({ title, text }, i) => (
                              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 16, padding: '18px 20px' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 12, background: '#3D2B8A', color: '#fff', fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#1A1230', margin: 0 }}>
                                  <strong style={{ color: '#3D2B8A' }}>{title}</strong> {text}
                                </p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* RESULTS STRIP */}
      <div style={{ background: 'linear-gradient(135deg, #1A0E4E 0%, #2E1A6E 100%)', padding: '48px 0' }}>
        <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: '#fff', textAlign: 'center', margin: '0 0 8px' }}>
          Участницы, которые начали с этого курса
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', textAlign: 'center', margin: '0 0 32px' }}>Мини-курс — первый шаг. Дальше — клуб.</p>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '4px 20px 12px', scrollbarWidth: 'none' as const }}>
          {[
            { kg: '−43 кг', name: 'Алёна', quote: 'Начинала с мини-курса. Потом вступила в клуб. Похудела на 43 кг за год.' },
            { kg: '−26 кг', name: 'Нина', quote: 'Через неделю после первого урока мир стал ярче. Буквально.' },
            { kg: '−18 кг', name: 'Тамара · 62 года', quote: 'Думала в 62 это нереально. После курса вступила в клуб. Теперь знаю — реально.' },
            { kg: '−39 кг', name: 'Лариса', quote: 'Этот курс объяснил мне то, что врачи не объясняли 15 лет.' },
          ].map(({ kg, name, quote }) => (
            <div key={name} style={{ flexShrink: 0, width: 260, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 36, fontWeight: 700, color: '#7BDFAA', lineHeight: 1, marginBottom: 4 }}>{kg}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 10 }}>{name}</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>{quote}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section style={{ padding: '64px 20px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ background: 'linear-gradient(135deg, #3D2B8A 0%, #5B3FA8 100%)', borderRadius: 28, padding: '48px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(22px,4vw,32px)', fontWeight: 700, color: '#fff', margin: '0 0 12px', position: 'relative' }}>
              Понравилось? Вступайте в клуб
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 17, maxWidth: 500, margin: '0 auto 32px', position: 'relative' }}>
              В клубе — полная система, марафоны каждый месяц, умная кухня с ИИ и живое сообщество тысяч женщин.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 28, position: 'relative' }}>
              {[
                { label: '🌱 Попробовать', price: '149', period: '₽ за 7 дней', note: 'Потом 1 500 ₽/мес', featured: false },
                { label: 'Месяц', price: '1 500', period: '₽ в месяц', note: '⭐ Популярный', featured: true },
                { label: '💎 Полгода', price: '6 000', period: '₽ за 6 мес.', note: 'Экономия 3 000 ₽', featured: false },
              ].map(({ label, price, period, note, featured }) => (
                <div key={label} style={{
                  background: featured ? 'rgba(76,175,120,0.2)' : 'rgba(255,255,255,0.1)',
                  border: `1.5px solid ${featured ? 'rgba(76,175,120,0.5)' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 18, padding: '20px 16px', textAlign: 'center',
                  transform: featured ? 'scale(1.03)' : 'none',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: featured ? '#7BDFAA' : 'rgba(255,255,255,0.6)', marginBottom: 8 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{price}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>{period}</div>
                  <div style={{ fontSize: 12, color: featured ? '#7BDFAA' : 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>{note}</div>
                </div>
              ))}
            </div>
            <a href="https://nata-tomshina.ru/club" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, position: 'relative',
              background: '#4CAF78', color: '#fff',
              fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 600,
              padding: '16px 36px', borderRadius: 100, textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(76,175,120,0.4)',
            }}>
              Вступить в клуб
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
            <span style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 14, position: 'relative' }}>
              Без скрытых платежей. Отмена в 1 клик.
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 20px', textAlign: 'center', fontSize: 14, color: '#7B6FAA', borderTop: '1.5px solid #EDE8FF' }}>
        <p style={{ margin: 0 }}>© 2026 Наталья Томшина · Клуб «Вкус Жизни»</p>
        <p style={{ margin: '8px 0 0' }}>
          <a href="https://club.nata-tomshina.ru/legal/privacy" style={{ color: '#7C5CFC', textDecoration: 'none' }}>Конфиденциальность</a>
        </p>
      </footer>
    </div>
  )
}
