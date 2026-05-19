'use client'
import MinimalHeader from '@/components/public/MinimalHeader'
import PlanStep from './components/PlanStep'

declare global {
  interface Window { ym?: (id: number, action: string, goal: string) => void }
}

const STEPS = [
  {
    num: 1,
    title: 'Подготовьте кухню',
    paragraphs: [
      'Откройте список продуктов и пример рациона, которые вы получили в курсе. Проверьте, какие продукты есть дома, купите недостающие.',
      'Составьте меню хотя бы на 3 дня (или воспользуйтесь готовым).',
      { text: 'Уберите с глаз все провоцирующие продукты — подальше в шкаф или отдайте кому-нибудь.', accent: true as const },
      'На следующий день просто начните применять рекомендации по формированию тарелки и изменению завтрака.',
    ],
  },
  {
    num: 2,
    title: 'Ешьте только когда голодны',
    paragraphs: [
      'Не потому что кто-то сказал, что надо обязательно завтракать. Не потому что наступил обеденный перерыв. Не потому что девочки в офисе сели пить кофе.',
      { text: 'Ешьте только когда почувствуете настоящий голод.', accent: true as const },
      'И каждый раз проверяйте это стаканом воды. Очень большая вероятность, что вы просто испытываете жажду.',
    ],
  },
  {
    num: 3,
    title: 'Ешьте натуральную еду',
    paragraphs: [
      'Ту, что создала природа, а не сделал человек. Порцию птицы, рыбы, мяса, яиц и овощи. Чем меньше продукт подвергался переработке — тем лучше.',
      { text: 'Однозначно: запечённое мясо или курица лучше даже самой дорогой колбасы из магазина.', accent: true as const },
    ],
  },
  {
    num: 4,
    title: 'Не будьте фанатичны',
    paragraphs: [
      'Даже если вдруг вы съедите пирожное или кусок торта — вы не получите мгновенное ожирение.',
      { text: 'Но проблема с лишним весом в том, что пирожные и дни рождения у нас стали ежедневными.', accent: true as const },
    ],
  },
  {
    num: 5,
    title: 'Исключите все сладкие напитки',
    paragraphs: [
      'Соки, смузи, морсы, компоты, квас, сладкую газировку, молочные коктейли.',
      { text: 'Ешьте еду, а не пейте её. И научитесь пить воду.', accent: true as const },
      'Много воды. Небольшими глотками в течение дня. Не сразу по 3 литра — начните хотя бы с 1,5 литров в день и постепенно увеличивайте.',
    ],
  },
]

const CLUB_BENEFITS = [
  'Сбалансированные рецепты, которые можно сочетать как конструктор для рациона',
  'Подсказки, как помочь ЖКТ при тяжести, изжоге и проблемах с кишечником',
  'Как питаться в разных жизненных обстоятельствах: в гостях, в кафе, в отпуске',
  'Памятки по питанию без желчного, при подагре, при псориазе и других диагнозах',
  'Вебинары о женском здоровье',
  'Чаты поддержки и марафоны для усиления сброса веса каждый месяц',
]

const HEALTH_RESULTS = [
  'снижение сахара крови',
  'улучшение работы ЖКТ',
  'снижение инсулина и мочевой кислоты',
  'увеличение уровня энергии и желание жить интересную жизнь',
]

export default function PlanContent() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MinimalHeader />
      <main style={{ flex: 1 }}>

        {/* Breadcrumbs */}
        <div style={{
          background: 'var(--color-bg-page)',
          padding: 'var(--space-4) 5%',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{
            maxWidth: 1080,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--color-ink-soft)',
          }}>
            <a href="/free-kurs" style={{ color: 'var(--color-ink-soft)', textDecoration: 'none' }}>Курс</a>
            <span style={{ color: 'var(--color-border-strong)' }}>›</span>
            <a href="/free-kurs#lesson-7" style={{ color: 'var(--color-ink-soft)', textDecoration: 'none' }}>Урок 7</a>
            <span style={{ color: 'var(--color-border-strong)' }}>›</span>
            <span style={{ color: 'var(--color-ink)' }}>План на завтра</span>
          </div>
        </div>

        {/* Hero */}
        <section style={{
          background: 'var(--grad-green-card)',
          padding: 'var(--space-16) 5%',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 920, margin: '0 auto' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--grad-green-pill)',
              padding: '6px 16px',
              borderRadius: 999,
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--color-green-abyss)',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.18em',
              marginBottom: 'var(--space-5)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green-base)', flexShrink: 0 }} />
              УРОК 7 · ФИНАЛЬНЫЙ ПЛАН
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5.5vw, 64px)',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.05,
              margin: '0 0 var(--space-3)',
            }}>
              5 советов для результата
            </h1>

            <p style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 'clamp(18px, 2.5vw, 26px)',
              color: 'var(--color-green-light)',
              lineHeight: 1.3,
              margin: '0 0 var(--space-6)',
            }}>
              Ваш пошаговый план на завтра
            </p>

            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(15px, 1.6vw, 17px)',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.6,
              maxWidth: 720,
              margin: '0 auto',
            }}>
              Это итог курса. План, который вы можете применить сами,
              начиная прямо с завтрашнего дня. Ничего сложного, берите и делайте.
            </p>
          </div>
        </section>

        {/* Main thought */}
        <section style={{
          background: 'var(--color-bg-page)',
          padding: 'var(--space-12) 5% 0',
        }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(16px, 1.5vw, 18px)',
              color: 'var(--color-ink)',
              lineHeight: 1.65,
              margin: '0 0 var(--space-4)',
            }}>
              Вот и подошёл к завершению наш экспресс-курс. Надеюсь, вам было полезно
              и вы получили тот самый волшебный пендель, которого все так ждут.
            </p>

            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(16px, 1.5vw, 18px)',
              color: 'var(--color-ink)',
              lineHeight: 1.65,
              margin: '0 0 var(--space-6)',
            }}>
              Моей задачей было донести до вас одну очень простую мысль:
            </p>

            <div style={{
              background: 'var(--grad-green-pill)',
              padding: 'var(--space-6) var(--space-8)',
              borderRadius: 'var(--radius-lg)',
              borderLeft: '4px solid var(--color-green-dark)',
              marginBottom: 'var(--space-6)',
            }}>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(16px, 1.6vw, 20px)',
                lineHeight: 1.45,
                color: 'var(--color-green-base)',
                margin: 0,
              }}>
                «Все старые методы — частое дробное питание, ПП, строгие диеты,
                «больше двигайся, меньше ешь» — не приносят долгосрочного результата.
                Потому что у вас в рационе есть продукты, которые постоянно заставляют
                вас есть, а ваш главный гормон похудения работает неправильно.»
              </p>
            </div>

            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(16px, 1.5vw, 18px)',
              color: 'var(--color-ink)',
              lineHeight: 1.65,
              margin: '0 0 var(--space-3)',
            }}>
              Вы можете дальше доводить себя до изнеможения на ПП и строгих диетах —
              и всё равно сорваться от голода и стресса. А можете прислушаться,
              немного поменять продукты на тарелке. Наладить работу гормонов, избавиться
              от голода и запустить правильное жиросжигание.
            </p>

            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(17px, 1.7vw, 20px)',
              fontWeight: 600,
              color: 'var(--color-green-base)',
              lineHeight: 1.6,
              margin: '0 0 var(--space-6)',
            }}>
              В этом и состоит решение проблемы лишнего веса.
            </p>

            <p style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 'clamp(18px, 2vw, 22px)',
              color: 'var(--color-green-dark)',
              lineHeight: 1.4,
              margin: '0 0 var(--space-12)',
            }}>
              Вот план, который вы можете применить сами,
              начиная прямо с завтрашнего дня:
            </p>
          </div>
        </section>

        {/* 5 Steps */}
        <section style={{
          background: 'var(--color-cream)',
          padding: 'var(--space-16) 5%',
        }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            {STEPS.map(step => (
              <PlanStep key={step.num} {...step} />
            ))}
          </div>
        </section>

        {/* Finale */}
        <section style={{
          background: 'var(--color-bg-page)',
          padding: 'var(--space-12) 5%',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{
              width: 40,
              height: 2,
              background: 'var(--color-green)',
              margin: '0 auto var(--space-4)',
            }} />
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 'clamp(28px, 4vw, 40px)',
              color: 'var(--color-green-dark)',
              lineHeight: 1.2,
              margin: 0,
            }}>
              Вот и весь план.
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(15px, 1.5vw, 18px)',
              color: 'var(--color-ink-soft)',
              marginTop: 'var(--space-3)',
              lineHeight: 1.6,
            }}>
              Ничего сложного. Можете брать и делать.
            </p>
          </div>
        </section>

        {/* Club CTA */}
        <section style={{
          background: 'var(--color-cream)',
          padding: '0 5% var(--space-12)',
        }}>
          <div style={{ maxWidth: 920, margin: '0 auto' }}>
            <div style={{
              background: 'var(--grad-green-card)',
              padding: 'var(--space-12)',
              borderRadius: 'var(--radius-2xl)',
              boxShadow: 'var(--shadow-green-card)',
            }}
              className="plan-club-cta"
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-orange-light)',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.22em',
                marginBottom: 'var(--space-5)',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-orange-light)', flexShrink: 0 }} />
                ХОТИТЕ ИДТИ ДАЛЬШЕ?
              </div>

              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 700,
                color: '#fff',
                lineHeight: 1.15,
                margin: '0 0 var(--space-5)',
              }}>
                А если вам важна поддержка<br />
                и дружный коллектив
              </h2>

              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(15px, 1.5vw, 17px)',
                color: 'rgba(255,255,255,0.92)',
                lineHeight: 1.6,
                margin: 0,
                maxWidth: 680,
              }}>
                Приглашаю вас в закрытый клуб стройных и здоровых, чтобы по шагам
                внедрить питание и привычки в вашу жизнь и сэкономить время
                на пробы и ошибки.
              </p>

              <div style={{ marginTop: 'var(--space-8)' }}>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--color-orange-light)',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.22em',
                  marginBottom: 'var(--space-4)',
                }}>
                  В КЛУБЕ ВЫ ПОЛУЧИТЕ
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {CLUB_BENEFITS.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--space-3)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 'clamp(14px, 1.3vw, 16px)',
                      color: 'rgba(255,255,255,0.92)',
                      lineHeight: 1.5,
                    }}>
                      <span style={{ color: 'var(--color-orange-light)', flexShrink: 0, marginTop: 2 }}>●</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(14px, 1.3vw, 16px)',
                color: 'rgba(255,255,255,0.92)',
                lineHeight: 1.6,
                margin: 'var(--space-8) 0 0',
              }}>
                В клубе множество уроков на разные темы: не только питание, но и нормализация
                здоровья, женская красота — кожа и волосы, разборы добавок. Каждый месяц
                мы проводим специальные марафоны для усиления сброса веса, каждый раз новые.
              </p>

              <div style={{ marginTop: 'var(--space-8)' }}>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--color-orange-light)',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.22em',
                  marginBottom: 'var(--space-3)',
                }}>
                  САМОЕ ВАЖНОЕ — НЕ ВЕС
                </div>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(14px, 1.3vw, 16px)',
                  color: 'rgba(255,255,255,0.92)',
                  lineHeight: 1.6,
                  margin: '0 0 var(--space-3)',
                }}>
                  По секрету скажу: вес — не самое главное. Главное те изменения
                  в здоровье, которые отмечают участницы клуба:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {HEALTH_RESULTS.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--space-3)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 'clamp(14px, 1.3vw, 16px)',
                      color: 'rgba(255,255,255,0.92)',
                      lineHeight: 1.5,
                    }}>
                      <span style={{ color: 'var(--color-orange-light)', flexShrink: 0, marginTop: 2 }}>●</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-10)', textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(20px, 2.5vw, 28px)',
                  color: 'var(--color-orange-light)',
                  lineHeight: 1.3,
                  margin: '0 0 var(--space-2)',
                }}>
                  Не зря название нашего клуба — «Вкус жизни».
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.6)',
                  margin: 0,
                }}>
                  — Наталья Томшина
                </p>
              </div>

              <div style={{ marginTop: 'var(--space-8)', textAlign: 'center' }}>
                <a
                  href="https://nata-tomshina.ru/club"
                  onClick={() => window.ym?.(108262096, 'reachGoal', 'course_plan_to_club_click')}
                  className="plan-club-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: 'var(--space-5) var(--space-10)',
                    background: 'var(--grad-orange-btn)',
                    borderRadius: 'var(--radius-full)',
                    color: '#fff',
                    fontFamily: 'var(--font-body)',
                    fontSize: 16,
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: 'var(--shadow-orange-btn)',
                    transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
                  }}
                >
                  Узнать о клубе «Вкус Жизни» →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* PDF + Back */}
        <section style={{
          background: 'var(--color-cream)',
          padding: 'var(--space-12) 5%',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 'clamp(20px, 2.5vw, 26px)',
              color: 'var(--color-green-dark)',
              margin: '0 0 var(--space-2)',
              lineHeight: 1.3,
            }}>
              Возьмите план с собой
            </p>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              color: 'var(--color-ink-soft)',
              margin: '0 auto var(--space-6)',
              lineHeight: 1.6,
              maxWidth: 480,
            }}>
              Распечатайте и держите перед глазами или сохраните в телефон.
              Так план станет реальным действием, а не идеей.
            </p>

            <a
              href="/pdf/5-sovetov-plan.pdf"
              download="5 советов для результата — Наталья Томшина.pdf"
              onClick={() => window.ym?.(108262096, 'reachGoal', 'course_plan_pdf_download')}
              className="plan-pdf-dl-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: 'var(--space-5) var(--space-10)',
                background: 'var(--color-green-base)',
                borderRadius: 999,
                color: '#fff',
                fontFamily: 'var(--font-body)',
                fontSize: 16,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(99,186,108,0.35)',
                transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
              }}
            >
              <span>📎</span>
              <span>Скачать PDF (4 страницы)</span>
            </a>

            <div style={{ marginTop: 'var(--space-12)' }}>
              <a
                href="/free-kurs#lesson-7"
                className="back-to-lessons-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 'var(--space-4) var(--space-8)',
                  border: '2px solid var(--color-green-dark)',
                  borderRadius: 999,
                  background: 'transparent',
                  color: 'var(--color-green-dark)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-out',
                }}
              >
                ← Вернуться ко всем урокам
              </a>
            </div>
          </div>
        </section>

      </main>

      <style>{`
        @media (max-width: 640px) {
          .plan-club-cta { padding: var(--space-8) !important; }
          .plan-club-btn, .plan-pdf-dl-btn {
            width: 100%;
            justify-content: center;
            padding: var(--space-4) var(--space-6) !important;
          }
        }
        .plan-pdf-dl-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(99,186,108,0.45) !important;
        }
        .plan-club-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(247,125,39,0.55) !important;
        }
        .back-to-lessons-btn:hover {
          background: var(--color-green-dark) !important;
          color: #fff !important;
        }
      `}</style>
    </div>
  )
}
