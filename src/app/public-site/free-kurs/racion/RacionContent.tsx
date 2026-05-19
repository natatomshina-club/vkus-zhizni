'use client'
import { useState } from 'react'
import MinimalHeader from '@/components/public/MinimalHeader'
import DAYS from './data/racion'
import DayCard from './components/DayCard'
import ShoppingList from './components/ShoppingList'

declare global {
  interface Window { ym?: (id: number, action: string, goal: string) => void }
}

const PRINCIPLES = [
  {
    icon: '🥩',
    title: 'Белок в каждом приёме пищи',
    text: 'Мясо, рыба, яйца — они насыщают и сохраняют мышцы при снижении веса.',
  },
  {
    icon: '🥬',
    title: 'Овощи без крахмала',
    text: 'Огурцы, помидоры, зелень, кабачки, брокколи — заполняют тарелку без лишних углеводов.',
  },
  {
    icon: '🫒',
    title: 'Полезные жиры',
    text: 'Топлёное и оливковое масло, сметана — нужны для гормонов и длительного насыщения.',
  },
  {
    icon: '📏',
    title: 'Порции — ориентир, не закон',
    text: 'Ешьте до сытости. Если не голодны к следующему приёму — пропускайте его.',
  },
]

export default function RacionContent() {
  const [openDayIndex, setOpenDayIndex] = useState<number>(0)

  function handleDayToggle(index: number) {
    const newIndex = openDayIndex === index ? -1 : index
    setOpenDayIndex(newIndex)
    if (newIndex !== -1) {
      setTimeout(() => {
        document.getElementById(`racion-day-${newIndex + 1}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 100)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MinimalHeader />
      <main style={{ flex: 1 }}>

        {/* Hero */}
        <section style={{
          background: 'var(--grad-green-card)',
          padding: 'var(--space-16) 5% var(--space-12)',
        }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 'var(--space-6)',
            }}>
              <a
                href="/free-kurs"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.65)',
                  textDecoration: 'none',
                }}
              >
                ← Курс
              </a>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>·</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                Урок 3
              </span>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>·</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                Рацион
              </span>
            </div>

            <div style={{
              display: 'inline-block',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.8)',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              background: 'rgba(255,255,255,0.12)',
              padding: '5px 14px',
              borderRadius: 'var(--radius-full)',
              marginBottom: 'var(--space-4)',
            }}>
              Урок 3 · Приложение
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5vw, 60px)',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.1,
              margin: '0 0 var(--space-5)',
            }}>
              Рацион на 7 дней
            </h1>

            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(15px, 1.3vw, 18px)',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.6,
              margin: '0 0 var(--space-6)',
              maxWidth: 560,
            }}>
              Готовое меню. Завтрак, обед и ужин — всё продумано. Без подсчёта калорий.
              Список покупок в конце страницы.
            </p>

          </div>
        </section>

        {/* Principles */}
        <section style={{
          background: 'var(--color-cream)',
          padding: 'var(--space-12) 5%',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: 'var(--color-green-dark)',
              textTransform: 'uppercase',
              letterSpacing: '0.22em',
              marginBottom: 'var(--space-5)',
            }}>
              — ПРИНЦИПЫ РАЦИОНА
            </div>
            <div className="principles-grid">
              {PRINCIPLES.map((p, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--color-white)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    padding: 'var(--space-5)',
                    display: 'flex',
                    gap: 'var(--space-4)',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{p.icon}</span>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--color-ink)',
                      lineHeight: 1.3,
                      marginBottom: 6,
                    }}>
                      {p.title}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 14,
                      color: 'var(--color-ink-soft)',
                      lineHeight: 1.5,
                    }}>
                      {p.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7 Days */}
        <section style={{
          background: 'var(--color-bg-page)',
          padding: 'var(--space-16) 5%',
        }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: 'var(--color-green-dark)',
              textTransform: 'uppercase',
              letterSpacing: '0.22em',
              marginBottom: 'var(--space-3)',
            }}>
              — МЕНЮ НА НЕДЕЛЮ
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(26px, 3.5vw, 40px)',
              fontWeight: 700,
              color: 'var(--color-ink)',
              margin: '0 0 var(--space-4)',
              lineHeight: 1.2,
            }}>
              Завтрак · Обед · Ужин
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              color: 'var(--color-ink-soft)',
              lineHeight: 1.6,
              margin: '0 0 var(--space-8)',
            }}>
              Нажмите на день, чтобы раскрыть рецепты.
              Некоторые блюда повторяются — специально, чтобы не стоять у плиты каждый раз.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {DAYS.map((day, idx) => (
                <DayCard
                  key={day.num}
                  day={day}
                  isOpen={openDayIndex === idx}
                  onToggle={() => handleDayToggle(idx)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Shopping list */}
        <section style={{
          background: 'var(--color-cream)',
          padding: 'var(--space-16) 5%',
        }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <ShoppingList />
          </div>
        </section>

        {/* Club CTA */}
        <section style={{
          background: 'var(--color-bg-page)',
          padding: 'var(--space-20) 5%',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 580, margin: '0 auto' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(26px, 3.5vw, 38px)',
              fontWeight: 700,
              color: 'var(--color-ink)',
              lineHeight: 1.2,
              margin: '0 0 var(--space-4)',
            }}>
              Хотите{' '}
              <em style={{ color: 'var(--color-green)', fontStyle: 'normal' }}>
                большего?
              </em>
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(15px, 1.3vw, 17px)',
              color: 'var(--color-ink-soft)',
              lineHeight: 1.6,
              margin: '0 0 var(--space-8)',
            }}>
              В клубе «Вкус Жизни» — Умная кухня с 1000+ рецептами
              и рационами на каждую неделю, марафоны, и Наталья, которая отвечает
              на вопросы каждый день.
            </p>
            <a
              href="https://nata-tomshina.ru/club"
              onClick={() => window.ym?.(108262096, 'reachGoal', 'racion_to_club_click')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: 'var(--space-4) var(--space-10)',
                background: 'var(--grad-orange-btn)',
                borderRadius: 'var(--radius-full)',
                color: '#fff',
                fontFamily: 'var(--font-body)',
                fontSize: 16,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(247,125,39,0.35)',
              }}
            >
              Узнать о клубе →
            </a>
          </div>
        </section>

        {/* PDF Download */}
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
              Скачайте и распечатайте
            </p>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              color: 'var(--color-ink-soft)',
              lineHeight: 1.6,
              margin: '0 auto var(--space-6)',
              maxWidth: 480,
            }}>
              Положите на холодильник или сохраните в телефон.
              Так удобнее планировать готовку.
            </p>
            <a
              href="/pdf/racion-7-dney.pdf"
              download="Рацион на 7 дней — Наталья Томшина.pdf"
              onClick={() => window.ym?.(108262096, 'reachGoal', 'course_racion_pdf_download')}
              className="pdf-dl-btn"
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
              <span>Скачать PDF (рацион + список продуктов)</span>
            </a>
          </div>
        </section>

        {/* Back to lessons */}
        <section style={{
          background: 'var(--color-bg-page)',
          padding: 'var(--space-10) 5% var(--space-12)',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <a
              href="/free-kurs#lesson-3"
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
                letterSpacing: '0.02em',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease-out',
              }}
            >
              ← Вернуться ко всем урокам
            </a>
          </div>
        </section>

      </main>

      <style>{`
        .principles-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (max-width: 640px) {
          .principles-grid { grid-template-columns: 1fr; }
        }
        .pdf-dl-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(99,186,108,0.45) !important;
        }
        .back-to-lessons-btn:hover {
          background: var(--color-green-dark) !important;
          color: #fff !important;
        }
      `}</style>
    </div>
  )
}
