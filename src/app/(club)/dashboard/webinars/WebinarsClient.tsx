'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { WebinarRow, WebinarState } from '@/types/webinars'

type WebinarWithState = WebinarRow & { state: WebinarState }

interface Props {
  webinars: WebinarWithState[]
  quotaTotal: number | null    // null = Infinity (Бриллиант)
  quotaUsed: number
  quotaLeft: number | null     // null = Infinity
  monthsInClub: number
  statusLabel: string
}

// ── Status table rows ──────────────────────────────────────────────────────

const STATUS_TABLE = [
  { icon: '⭐', label: 'Вошла во вкус', months: '3 мес', desc: '2 вебинара на выбор' },
  { icon: '🔥', label: 'Уже своя',       months: '6 мес', desc: 'ещё +3 вебинара' },
  { icon: '💚', label: 'Легенда',         months: '9 мес', desc: 'ещё +2 (включая курсы)' },
  { icon: '💎', label: 'Бриллиант',       months: '12 мес', desc: 'все вебинары и курсы' },
]

// ── Toast ──────────────────────────────────────────────────────────────────

function Toast({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, background: '#2D1F6E', color: '#fff',
      padding: '12px 22px', borderRadius: 14, fontSize: 14, fontWeight: 600,
      boxShadow: '0 4px 24px rgba(44,30,110,0.22)',
      whiteSpace: 'nowrap', maxWidth: '90vw',
      animation: 'fadeUp 0.25s ease',
    }}>
      {msg}
    </div>
  )
}

// ── WebinarCard ────────────────────────────────────────────────────────────

function WebinarCard({
  webinar,
  quotaLeft,
  onStateChange,
}: {
  webinar: WebinarWithState
  quotaLeft: number | null
  onStateChange: (id: string, state: WebinarState) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [buyOpen, setBuyOpen] = useState(false)
  const [selectOpen, setSelectOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function handleBuy() {
    setBusy(true)
    const res = await fetch(`/api/webinars/${webinar.slug}/buy`, { method: 'POST' })
    setBusy(false)
    setBuyOpen(false)
    if (res.ok) {
      showToast('✉️ Сообщение отправлено! Наташа ответит в разделе «Наташе»')
    } else {
      showToast('Ошибка отправки — попробуй ещё раз')
    }
  }

  async function handleSelect() {
    setBusy(true)
    const res = await fetch(`/api/webinars/${webinar.slug}/select`, { method: 'POST' })
    setBusy(false)
    setSelectOpen(false)
    if (res.ok) {
      const data = await res.json() as { state?: WebinarState }
      const newState = data.state ?? 'pending'
      onStateChange(webinar.id, newState)
      if (newState === 'has_access') {
        showToast('🎉 Доступ открыт! Можешь смотреть вебинар')
      } else {
        showToast('⏳ Заявка отправлена! Наташа скоро откроет доступ')
      }
    } else {
      const err = await res.json().catch(() => ({})) as { error?: string }
      showToast(err.error ?? 'Ошибка — попробуй ещё раз')
    }
  }

  const state = webinar.state
  const canStillSelect = quotaLeft === null || quotaLeft > 0

  return (
    <div style={{
      background: '#fff',
      border: '2px solid #EDE8FF',
      borderRadius: 16,
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
    className="card-lift"
    >
      {toast && <Toast msg={toast} />}

      {/* Gradient header */}
      <div style={{
        background: `linear-gradient(135deg, ${webinar.color_from}, ${webinar.color_to})`,
        padding: '18px 20px',
        minHeight: 80,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 36, lineHeight: 1 }}>{webinar.emoji}</span>
          <h3 style={{
            margin: 0, fontSize: 16, fontWeight: 700,
            fontFamily: 'var(--font-unbounded)',
            color: '#fff', lineHeight: 1.3,
            textShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}>
            {webinar.title}
          </h3>
        </div>
        {state !== 'has_access' && (
          <span style={{
            fontSize: 13, fontWeight: 700, color: '#fff',
            background: 'rgba(0,0,0,0.18)', padding: '4px 10px',
            borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {webinar.price} ₽
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 20px 0' }}>
        {webinar.content_type === 'course' && (
          <span style={{
            display: 'inline-block', marginBottom: 10,
            fontSize: 11, fontWeight: 700, padding: '3px 10px',
            borderRadius: 20, background: '#F0EEFF', color: '#7C5CFC',
          }}>
            КУРС
          </span>
        )}
        <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
          {webinar.short_desc}
        </p>

        {/* Full desc toggle */}
        {webinar.full_desc && (
          <>
            <button
              onClick={() => setExpanded(v => !v)}
              style={{
                marginTop: 8, background: 'none', border: 'none',
                fontSize: 13, color: 'var(--pur)', cursor: 'pointer',
                padding: '4px 0', fontWeight: 600, fontFamily: 'var(--font-nunito)',
              }}
            >
              {expanded ? 'Скрыть ↑' : 'Читать подробнее ↓'}
            </button>
            {expanded && (
              <p style={{
                margin: '8px 0 0', fontSize: 13.5, color: 'var(--text)',
                lineHeight: 1.65, whiteSpace: 'pre-wrap',
              }}>
                {webinar.full_desc}
              </p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 20px 20px' }}>

        {state === 'has_access' && (
          <Link
            href={`/dashboard/webinars/${webinar.slug}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '13px 20px', borderRadius: 12,
              background: '#4CAF78', color: '#fff',
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
              minHeight: 48, transition: 'opacity 0.15s',
            }}
          >
            → Смотреть вебинар
          </Link>
        )}

        {state === 'pending' && (
          <div style={{
            padding: '12px 16px', borderRadius: 12,
            background: '#FFF8E6', border: '1px solid #FFD93D',
            fontSize: 14, color: '#5C4200', fontWeight: 600,
            textAlign: 'center',
          }}>
            ⏳ Ожидает подтверждения Наташи
          </div>
        )}

        {(state === 'can_select' || state === 'locked') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Buy inline popup */}
            {!buyOpen ? (
              <button
                onClick={() => { setBuyOpen(true); setSelectOpen(false) }}
                style={{
                  padding: '13px 20px', borderRadius: 12, border: 'none',
                  background: '#FFD93D', color: '#5C4200',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 48,
                  transition: 'opacity 0.15s',
                }}
              >
                Купить — {webinar.price} ₽
              </button>
            ) : (
              <div style={{
                background: '#FFFBEE', border: '1px solid #FFD93D',
                borderRadius: 12, padding: '14px 16px',
              }}>
                <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--muted)' }}>
                  Сообщение Наташе уже составлено:
                </p>
                <p style={{
                  margin: '0 0 12px', fontSize: 13, color: 'var(--text)',
                  fontStyle: 'italic', background: '#fff',
                  padding: '8px 12px', borderRadius: 8, border: '1px solid #EDE8FF',
                }}>
                  «Наташа, хочу купить вебинар «{webinar.title}» — {webinar.price} ₽»
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleBuy}
                    disabled={busy}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                      background: '#7C5CFC', color: '#fff',
                      fontSize: 13, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer',
                      minHeight: 44, opacity: busy ? 0.7 : 1,
                    }}
                  >
                    {busy ? 'Отправляю...' : '✉️ Отправить Наташе'}
                  </button>
                  <button
                    onClick={() => setBuyOpen(false)}
                    style={{
                      padding: '10px 14px', borderRadius: 10,
                      border: '1px solid #EDE8FF', background: '#fff',
                      color: 'var(--muted)', fontSize: 13, cursor: 'pointer', minHeight: 44,
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {/* Select free */}
            {state === 'can_select' && canStillSelect && !buyOpen && (
              <>
                {!selectOpen ? (
                  <button
                    onClick={() => setSelectOpen(true)}
                    style={{
                      padding: '11px 20px', borderRadius: 12,
                      border: '1px solid #4CAF78', background: '#F0FFF6',
                      color: '#2D6A4F', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', minHeight: 44,
                    }}
                  >
                    Выбрать бесплатно
                  </button>
                ) : (
                  <div style={{
                    background: '#F0FFF6', border: '1px solid #A8E6CF',
                    borderRadius: 12, padding: '14px 16px',
                  }}>
                    <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#1A5C3A' }}>
                      Выбрать «{webinar.title}» из своей квоты?
                    </p>
                    {quotaLeft !== null && (
                      <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--muted)' }}>
                        После выбора останется {quotaLeft - 1} выборов.
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={handleSelect}
                        disabled={busy}
                        style={{
                          flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                          background: '#4CAF78', color: '#fff',
                          fontSize: 13, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer',
                          minHeight: 44, opacity: busy ? 0.7 : 1,
                        }}
                      >
                        {busy ? 'Отправляю...' : 'Да, выбрать'}
                      </button>
                      <button
                        onClick={() => setSelectOpen(false)}
                        style={{
                          padding: '10px 14px', borderRadius: 10,
                          border: '1px solid #EDE8FF', background: '#fff',
                          color: 'var(--muted)', fontSize: 13, cursor: 'pointer', minHeight: 44,
                        }}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function WebinarsClient({
  webinars: initialWebinars,
  quotaTotal,
  quotaUsed,
  quotaLeft: initialQuotaLeft,
  monthsInClub,
  statusLabel,
}: Props) {
  const [webinars, setWebinars] = useState<WebinarWithState[]>(initialWebinars)
  const [quotaLeft, setQuotaLeft] = useState<number | null>(initialQuotaLeft)
  const [infoOpen, setInfoOpen] = useState(true)

  function handleStateChange(id: string, state: WebinarState) {
    setWebinars(prev => prev.map(w => w.id === id ? { ...w, state } : w))
    if (state === 'pending' || state === 'has_access') {
      setQuotaLeft(prev => prev === null ? null : Math.max(0, prev - 1))
    }
  }

  const isBrilliant = quotaTotal === null

  return (
    <div style={{
      maxWidth: 680, margin: '0 auto',
      padding: '24px 16px 96px',
      fontFamily: 'var(--font-nunito)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          margin: '0 0 4px',
          fontFamily: 'var(--font-unbounded)',
          fontSize: 22, fontWeight: 800, color: 'var(--text)',
        }}>
          Вебинары
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
          {webinars.length} записей от Наташи
        </p>
      </div>

      {/* How to get free — accordion */}
      <div style={{
        background: '#fff', border: '2px solid #EDE8FF', borderRadius: 16,
        marginBottom: 24, overflow: 'hidden',
      }}>
        <button
          onClick={() => setInfoOpen(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', background: 'none', border: 'none',
            cursor: 'pointer', fontFamily: 'var(--font-nunito)',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
            💚 Как получить бесплатно
          </span>
          <span style={{ fontSize: 18, color: 'var(--muted)', transform: infoOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            ↓
          </span>
        </button>

        {infoOpen && (
          <div style={{ padding: '0 20px 20px' }}>
            <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text)', fontWeight: 700, lineHeight: 1.5 }}>
              Все вебинары можно купить отдельно прямо сейчас.<br />
              А можно дождаться повышения статуса в клубе и получить бесплатно 💚
            </p>

            {/* Status table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {STATUS_TABLE.map(row => {
                const isActive = statusLabel.includes(row.label)
                return (
                <div key={row.label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: isActive ? '10px 14px' : '8px 12px',
                  borderRadius: 12,
                  background: isActive ? '#FFD93D' : '#FAF8FF',
                  border: `1px solid ${isActive ? '#FFD93D' : '#EDE8FF'}`,
                }}>
                  <span style={{ fontSize: isActive ? 20 : 18, flexShrink: 0 }}>{row.icon}</span>
                  <span style={{
                    fontSize: 13, minWidth: 120,
                    fontWeight: 700,
                    fontFamily: isActive ? 'var(--font-unbounded)' : 'var(--font-nunito)',
                    color: isActive ? '#5C4200' : 'var(--text)',
                  }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: 12, color: isActive ? '#7A5500' : 'var(--muted)', minWidth: 50 }}>{row.months}</span>
                  <span style={{ fontSize: 13, color: isActive ? '#5C4200' : 'var(--text)' }}>{row.desc}</span>
                </div>
                )
              })}
            </div>

            {/* Current status */}
            <div style={{
              background: '#F0EEFF', border: '1px solid #DDD5FF', borderRadius: 12,
              padding: '12px 16px',
            }}>
              <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                Твой статус: {statusLabel} ({monthsInClub} мес в клубе)
              </p>
              {isBrilliant ? (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                  💎 Все вебинары и курсы доступны бесплатно
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                  Доступно выборов: {quotaTotal ?? 0}
                  &nbsp;•&nbsp;Использовано: {quotaUsed}
                  &nbsp;•&nbsp;Осталось: {quotaLeft ?? 0}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {webinars.map(w => (
          <WebinarCard
            key={w.id}
            webinar={w}
            quotaLeft={quotaLeft}
            onStateChange={handleStateChange}
          />
        ))}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px) }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) }
        }
      `}</style>
    </div>
  )
}
