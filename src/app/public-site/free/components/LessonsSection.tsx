'use client'
import { useState } from 'react'

const LESSONS = [
  {
    num: 1,
    title: 'Правильная тарелка для похудения',
    subtitle: 'Волшебный завтрак · Видео + задание',
    desc: 'Поменяете завтрак, и уже через 2 дня заметите: к обеду не голодны, а на работе не хочется заедать стресс печенькой.',
    orange: false,
  },
  {
    num: 2,
    title: 'Продукты для стройности',
    subtitle: 'Два списка, которые меняют всё',
    desc: 'Узнаете два списка. Первый, продукты, которые подавляют аппетит и работают на вас. Второй, продукты, которые разгоняют аппетит и держат вас на крючке.',
    orange: false,
  },
  {
    num: 3,
    title: 'Порции · Сколько есть, чтобы худеть',
    subtitle: 'Без подсчёта калорий',
    desc: 'Хорошая новость: калории мы не считаем. Узнаете простой способ понять, сколько вам нужно. И скачаете пример рациона на 7 дней, чтобы не ломать голову «что приготовить».',
    orange: false,
  },
  {
    num: 4,
    title: 'Вода как лекарство',
    subtitle: 'Простая привычка с огромным эффектом',
    desc: 'Сколько пить, когда пить и что пить. Маленькая привычка, которая ускоряет результат в разы. Эффект почувствуете уже за неделю.',
    orange: false,
  },
  {
    num: 5,
    title: 'Привычки до и после еды',
    subtitle: 'Для стройности и спокойного желудка',
    desc: 'Несколько простых ритуалов, которые помогают пищеварению и работают на стройность. Делать каждый по две минуты, эффект на весь день.',
    orange: false,
  },
  {
    num: 6,
    title: 'Перекусы',
    subtitle: 'Почему «полезный перекус» это миф',
    desc: 'Самая частая ошибка худеющих. Расскажу, почему каждый перекус откладывает ваш результат. И как из этого выйти без чувства голода.',
    orange: false,
  },
  {
    num: 7,
    title: '5 советов для результата',
    subtitle: 'Ваш пошаговый план',
    desc: 'Что делать в первую неделю, что во вторую, как держаться, когда не хочется. Конкретный план на ближайший месяц, чтобы не потеряться.',
    orange: true,
  },
]

export default function LessonsSection() {
  const [openSet, setOpenSet] = useState<Set<number>>(new Set([0]))

  function toggle(i: number) {
    setOpenSet(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

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

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          marginTop: 'var(--space-10)',
        }}>
          {LESSONS.map((lesson, i) => {
            const isOpen = openSet.has(i)
            return (
              <div
                key={i}
                style={{
                  background: 'var(--color-white)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => toggle(i)}
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
                  {/* Number badge */}
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
                    }}>
                      {lesson.num}
                    </span>
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1 }}>
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
                  </div>

                  {/* Arrow */}
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

                {/* Description */}
                <div style={{
                  maxHeight: isOpen ? 200 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease',
                }}>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 15,
                    color: 'var(--color-ink-soft)',
                    lineHeight: 1.6,
                    margin: 0,
                    padding: '0 var(--space-6) var(--space-5)',
                    paddingLeft: 'calc(var(--space-6) + 48px + var(--space-4))',
                  }}>
                    {lesson.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
