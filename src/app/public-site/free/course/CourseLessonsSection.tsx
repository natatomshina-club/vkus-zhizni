'use client'
import { useState } from 'react'
import BreakfastsAccordion from './BreakfastsAccordion'

declare global {
  interface Window { ym?: (id: number, action: string, goal: string) => void }
}

const TIPS = [
  { title: 'Составьте меню хотя бы на 3 дня.', text: 'Воспользуйтесь готовым рационом. Уберите провоцирующие продукты подальше в шкаф.' },
  { title: 'Ешьте только когда голодны.', text: 'Не по расписанию, не «потому что все обедают». Каждый раз сначала выпейте стакан воды — часто это просто жажда.' },
  { title: 'Ешьте натуральную еду.', text: 'Птица, рыба, мясо, яйца, овощи. Чем меньше продукт подвергался переработке — тем лучше.' },
  { title: 'Не будьте фанатичны.', text: 'Съели пирожное на дне рождения — не катастрофа. Просто вернитесь к системе на следующий день без самобичевания.' },
  { title: 'Исключите сладкие напитки.', text: 'Соки, смузи, компоты, газировка — всё это «жидкие» углеводы. Учитесь пить воду, хотя бы 1,5 литра в день.' },
]

type Marker = { icon: string; label: string }

const LESSONS = [
  {
    num: 1,
    title: 'Правильная тарелка для похудения',
    subtitle: 'Волшебный завтрак · Видео + задание',
    videos: ['maqDNYomrqnC2hbBwxR4kW', 'w7m6j1upAnWuiHFhSDfdSy'],
    note: 'Попробуйте уже завтра поменять завтрак. Через 2 дня заметите: к обеду не голодны, на работе не хочется заедать стресс печенькой.',
    orange: false,
    isFinal: false,
    marker: { icon: '🍳', label: 'примеры завтраков' } as Marker | null,
  },
  {
    num: 2,
    title: 'Продукты для стройности',
    subtitle: 'Два списка, которые меняют всё',
    videos: ['vAggowP18q2yqVqrnUmHiN'],
    note: 'Скачайте два PDF-списка. Первый — продукты, которые подавляют аппетит. Второй — те, что разгоняют его. Распечатайте и положите на холодильник.',
    orange: false,
    isFinal: false,
    marker: { icon: '📎', label: 'списки продуктов' } as Marker | null,
  },
  {
    num: 3,
    title: 'Порции: сколько есть, чтобы худеть',
    subtitle: 'Без подсчёта калорий',
    videos: ['2VpTvSt1vtj1dDMZvdqLe3'],
    note: 'Скачайте пример рациона на 7 дней. Завтраки, обеды, ужины — готовое меню, чтобы не ломать голову.',
    orange: false,
    isFinal: false,
    marker: { icon: '📎', label: 'рацион на 7 дней' } as Marker | null,
  },
  {
    num: 4,
    title: 'Вода как лекарство',
    subtitle: 'Простая привычка с огромным эффектом',
    videos: ['cK1X2ZtWXeU1oannqx53Po'],
    note: 'Простая привычка: начните пить воду по правилам из урока. Эффект почувствуете уже за неделю.',
    orange: false,
    isFinal: false,
    marker: null as Marker | null,
  },
  {
    num: 5,
    title: 'Привычки до и после еды',
    subtitle: 'Для стройности и спокойного желудка',
    videos: ['iHcVVctpX1JswGz1zRxmZk'],
    note: 'Выберите хотя бы 2 ритуала из видео и введите их завтра. По 2 минуты каждый, эффект на весь день.',
    orange: false,
    isFinal: false,
    marker: null as Marker | null,
  },
  {
    num: 6,
    title: 'Перекусы',
    subtitle: 'Почему «полезный перекус» это миф',
    videos: ['5eKCzuJspnBA1NY6ZfY78D'],
    note: 'Уберите все перекусы на 7 дней. Только три приёма пищи. Через неделю удивитесь как легко стало.',
    orange: false,
    isFinal: false,
    marker: null as Marker | null,
  },
  {
    num: 7,
    title: '5 советов для результата',
    subtitle: 'Ваш пошаговый план',
    videos: [] as string[],
    note: 'Это финальный урок. Соберите свой план: что делать в первую неделю, что во вторую. Распечатайте и держите перед глазами.',
    orange: true,
    isFinal: true,
    marker: { icon: '📎', label: 'план на завтра' } as Marker | null,
  },
]

const MARKER_PILL_STYLE = {
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  gap: 6,
  padding: '4px 10px',
  borderRadius: 999,
  background: 'var(--grad-green-pill)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-green-dark)',
  whiteSpace: 'nowrap' as const,
  lineHeight: 1.4,
}

export default function CourseLessonsSection() {
  const [openLesson, setOpenLesson] = useState<number | null>(1)

  return (
    <section style={{
      background: 'var(--color-cream)',
      padding: 'var(--space-20) 5%',
    }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>

        <div style={{
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          color: 'var(--color-green-dark)',
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
        }}>
          — ПРОГРАММА
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 700,
          color: 'var(--color-ink)',
          margin: 'var(--space-3) 0 0',
          lineHeight: 1.15,
        }}>
          7 уроков · каждый по 3-5 минут
        </h2>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(15px, 1.3vw, 17px)',
          color: 'var(--color-ink-soft)',
          margin: 'var(--space-3) 0 0',
          lineHeight: 1.6,
        }}>
          Не спешите. Вводите привычки плавно. Мозг не любит резких перемен.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          marginTop: 'var(--space-10)',
        }}>
          {LESSONS.map(lesson => {
            const isOpen = openLesson === lesson.num
            return (
              <div
                key={lesson.num}
                id={`lesson-${lesson.num}`}
                style={{
                  background: 'var(--color-white)',
                  borderRadius: 'var(--radius-lg)',
                  border: isOpen
                    ? '2px solid var(--color-green)'
                    : '1px solid var(--color-border)',
                  overflow: 'hidden',
                  boxShadow: isOpen
                    ? '0 8px 24px rgba(99, 186, 108, 0.15)'
                    : 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              >
                <button
                  onClick={() => setOpenLesson(isOpen ? null : lesson.num)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-5) var(--space-6)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-sm)',
                    background: lesson.orange ? 'var(--grad-orange-btn)' : 'var(--color-green-base)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#fff',
                      lineHeight: 1,
                    }}>{lesson.num}</span>
                  </div>

                  {/* Text column — title + subtitle + mobile marker */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'clamp(15px, 1.3vw, 17px)',
                      fontWeight: 600,
                      color: 'var(--color-ink)',
                      lineHeight: 1.3,
                    }}>
                      {lesson.title}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      color: 'var(--color-ink-soft)',
                      marginTop: 3,
                    }}>
                      {lesson.subtitle}
                    </div>
                    {/* Marker — mobile: shown below subtitle */}
                    {lesson.marker && (
                      <div className="marker-inline" style={{ marginTop: 6 }}>
                        <span style={MARKER_PILL_STYLE}>
                          <span>{lesson.marker.icon}</span>
                          <span>{lesson.marker.label}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Marker — desktop: shown between text and arrow */}
                  {lesson.marker && (
                    <span className="marker-outer" style={MARKER_PILL_STYLE}>
                      <span>{lesson.marker.icon}</span>
                      <span>{lesson.marker.label}</span>
                    </span>
                  )}

                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{
                      flexShrink: 0,
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.25s ease',
                      color: 'var(--color-ink-soft)',
                    }}
                  >
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Expandable content */}
                <div style={{
                  maxHeight: isOpen ? 9999 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.4s ease',
                }}>
                  <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>

                    {/* Videos */}
                    {lesson.videos.map(vid => (
                      <div key={vid} style={{
                        position: 'relative',
                        paddingBottom: '56.25%',
                        height: 0,
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        marginBottom: 'var(--space-5)',
                      }}>
                        <iframe
                          src={`https://kinescope.io/embed/${vid}`}
                          allow="autoplay; fullscreen"
                          allowFullScreen
                          style={{
                            position: 'absolute',
                            top: 0, left: 0,
                            width: '100%', height: '100%',
                            border: 'none',
                          }}
                        />
                      </div>
                    ))}

                    {/* Hint note */}
                    {lesson.note && (
                      <div style={{
                        background: 'var(--grad-green-pill)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-4) var(--space-5)',
                        marginTop: lesson.videos.length > 0 ? 0 : 'var(--space-2)',
                        display: 'flex',
                        gap: 'var(--space-3)',
                        alignItems: 'flex-start',
                      }}>
                        <span style={{ fontSize: 16, lineHeight: 1.5, flexShrink: 0 }}>💡</span>
                        <p style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: 15,
                          color: 'var(--color-green-abyss)',
                          lineHeight: 1.5,
                          margin: 0,
                        }}>
                          {lesson.note}
                        </p>
                      </div>
                    )}

                    {/* PDF downloads — lesson 2 */}
                    {lesson.num === 2 && (
                      <div
                        style={{
                          display: 'flex',
                          gap: 'var(--space-3)',
                          marginTop: 'var(--space-5)',
                        }}
                        className="lesson2-pdf-btns"
                      >
                        <a
                          href={encodeURI('/pdf/Продукты подавляющие аппетит.pdf')}
                          download="Продукты, подавляющие аппетит — Наталья Томшина.pdf"
                          className="pdf-btn pdf-btn--green"
                          onClick={() => window.ym?.(108262096, 'reachGoal', 'course_lesson2_pdf_suppress_download')}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: 'var(--space-4) var(--space-5)',
                            border: '2px solid var(--color-green)',
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(180deg, rgba(99,186,108,0.06), rgba(99,186,108,0.12))',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-out',
                          }}
                        >
                          <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>📎</span>
                          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.16em',
                              color: 'var(--color-green-dark)',
                              lineHeight: 1.2,
                            }}>
                              PDF · Скачать
                            </span>
                            <span style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: 15,
                              fontWeight: 600,
                              color: 'var(--color-ink)',
                              lineHeight: 1.3,
                            }}>
                              Продукты, подавляющие аппетит
                            </span>
                          </span>
                        </a>

                        <a
                          href={encodeURI('/pdf/Продукты усиливающие аппетит.pdf')}
                          download="Продукты, усиливающие аппетит — Наталья Томшина.pdf"
                          className="pdf-btn pdf-btn--orange"
                          onClick={() => window.ym?.(108262096, 'reachGoal', 'course_lesson2_pdf_enhance_download')}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: 'var(--space-4) var(--space-5)',
                            border: '2px solid var(--color-orange)',
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(180deg, rgba(247,125,39,0.06), rgba(247,125,39,0.12))',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-out',
                          }}
                        >
                          <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>📎</span>
                          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.16em',
                              color: 'var(--color-orange)',
                              lineHeight: 1.2,
                            }}>
                              PDF · Скачать
                            </span>
                            <span style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: 15,
                              fontWeight: 600,
                              color: 'var(--color-ink)',
                              lineHeight: 1.3,
                            }}>
                              Продукты, усиливающие аппетит
                            </span>
                          </span>
                        </a>
                      </div>
                    )}

                    {/* Racion link — lesson 3 */}
                    {lesson.num === 3 && (
                      <div style={{ marginTop: 'var(--space-4)' }}>
                        <a
                          href="/free-kurs/racion"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: 'var(--space-3) var(--space-6)',
                            background: 'var(--color-green-base)',
                            borderRadius: 'var(--radius-full)',
                            color: '#fff',
                            fontFamily: 'var(--font-body)',
                            fontSize: 15,
                            fontWeight: 700,
                            textDecoration: 'none',
                            boxShadow: '0 4px 16px rgba(99,186,108,0.3)',
                          }}
                        >
                          📋 Открыть рацион на 7 дней →
                        </a>
                      </div>
                    )}

                    {/* Breakfasts accordion — lesson 1 */}
                    {lesson.num === 1 && <BreakfastsAccordion />}

                    {/* Final lesson tips */}
                    {lesson.isFinal && (
                      <>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'var(--space-3)',
                          marginTop: 'var(--space-6)',
                        }}>
                          {TIPS.map(({ title, text }, i) => (
                            <div key={i} style={{
                              display: 'flex',
                              gap: 'var(--space-4)',
                              alignItems: 'flex-start',
                              background: 'var(--color-cream)',
                              borderRadius: 'var(--radius-md)',
                              padding: 'var(--space-4) var(--space-5)',
                            }}>
                              <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--grad-orange-btn)',
                                color: '#fff',
                                fontFamily: 'var(--font-display)',
                                fontSize: 16,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                {i + 1}
                              </div>
                              <p style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: 15,
                                lineHeight: 1.6,
                                color: 'var(--color-ink)',
                                margin: 0,
                              }}>
                                <strong>{title}</strong>{' '}{text}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Plan page link */}
                        <a
                          href="/free-kurs/plan"
                          className="lesson7-plan-btn"
                          onClick={() => window.ym?.(108262096, 'reachGoal', 'course_lesson7_plan_open')}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 'var(--space-4) var(--space-5)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-green)',
                            background: 'linear-gradient(180deg, rgba(99,186,108,0.04), rgba(99,186,108,0.08))',
                            textDecoration: 'none',
                            marginTop: 'var(--space-5)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-out',
                          }}
                        >
                          <span style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: 15,
                            fontWeight: 600,
                            color: 'var(--color-green-dark)',
                            lineHeight: 1.3,
                          }}>
                            📋 Открыть план на завтра
                          </span>
                          <span style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: 15,
                            color: 'var(--color-green)',
                            flexShrink: 0,
                          }}>
                            →
                          </span>
                        </a>

                        {/* Plan PDF download */}
                        <a
                          href="/pdf/5-sovetov-plan.pdf"
                          download="5 советов для результата — Наталья Томшина.pdf"
                          className="pdf-btn pdf-btn--green"
                          onClick={() => window.ym?.(108262096, 'reachGoal', 'course_lesson7_pdf_download')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: 'var(--space-4) var(--space-5)',
                            border: '2px solid var(--color-green)',
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(180deg, rgba(99,186,108,0.06), rgba(99,186,108,0.12))',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            marginTop: 'var(--space-3)',
                            transition: 'all 0.2s ease-out',
                          }}
                        >
                          <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>📎</span>
                          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: 'uppercase' as const,
                              letterSpacing: '0.16em',
                              color: 'var(--color-green-dark)',
                              lineHeight: 1.2,
                            }}>
                              PDF · СКАЧАТЬ
                            </span>
                            <span style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: 15,
                              fontWeight: 600,
                              color: 'var(--color-ink)',
                              lineHeight: 1.3,
                            }}>
                              5 советов для результата
                            </span>
                          </span>
                        </a>
                      </>
                    )}

                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        /* Marker: inline (mobile) vs outer (desktop) */
        .marker-inline { display: block; }
        .marker-outer  { display: none !important; }
        @media (min-width: 768px) {
          .marker-inline { display: none !important; }
          .marker-outer  { display: inline-flex !important; flex-shrink: 0; }
        }
        /* Lesson 2 PDF buttons */
        @media (max-width: 640px) {
          .lesson2-pdf-btns { flex-direction: column !important; }
        }
        .lesson7-plan-btn:hover {
          background: linear-gradient(180deg, rgba(99,186,108,0.10), rgba(99,186,108,0.16)) !important;
          border-color: var(--color-green-dark) !important;
        }
        .pdf-btn--green:hover {
          background: linear-gradient(180deg, rgba(99,186,108,0.12), rgba(99,186,108,0.20)) !important;
          border-color: var(--color-green-dark) !important;
          transform: translateY(-1px);
        }
        .pdf-btn--orange:hover {
          background: linear-gradient(180deg, rgba(247,125,39,0.12), rgba(247,125,39,0.20)) !important;
          border-color: var(--color-orange-dark, #c45a0a) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </section>
  )
}
