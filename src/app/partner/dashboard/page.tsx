'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Commission {
  id: string
  payment_amount: number
  commission_amount: number
  type: 'first' | 'recurring'
  status: string
  created_at: string
  approve_after: string | null
}

interface Stats {
  clicks: number
  members: number
  total_payments: number
  total_earned: number
  pending_payout: number
}

interface DashData {
  ref_code: string
  payment_details: string
  stats: Stats
  commissions: Commission[]
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Ожидает',  color: '#B8860B', bg: '#FFFBE6' },
  approved: { label: 'Одобрено', color: '#2D6A4F', bg: '#D8F3DC' },
  paid:     { label: 'Выплачено', color: '#7B6FAA', bg: '#F0EEFF' },
  rejected: { label: 'Отклонено', color: '#CC3333', bg: '#FFF0F0' },
}

function fmt(n: number) {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PartnerDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [editingDetails, setEditingDetails] = useState(false)
  const [detailsValue, setDetailsValue] = useState('')
  const [detailsSaving, setDetailsSaving] = useState(false)
  const [detailsSaved, setDetailsSaved] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/partner/stats')
    if (res.status === 401) { router.replace('/partner/login'); return }
    if (!res.ok) { setLoading(false); return }
    const json: DashData = await res.json()
    setData(json)
    setDetailsValue(json.payment_details ?? '')
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  function copyLink() {
    if (!data) return
    const url = `https://nata-tomshina.ru/club?ref=${data.ref_code}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function saveDetails() {
    setDetailsSaving(true)
    const res = await fetch('/api/partner/payment-details', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_details: detailsValue }),
    })
    setDetailsSaving(false)
    if (res.ok) {
      setEditingDetails(false)
      setDetailsSaved(true)
      setTimeout(() => setDetailsSaved(false), 3000)
      if (data) setData({ ...data, payment_details: detailsValue })
    }
  }

  async function logout() {
    await fetch('/api/partner/auth/logout', { method: 'POST' }).catch(() => null)
    router.replace('/partner/login')
  }

  if (loading) {
    return (
      <div style={{ background: '#FAF8FF', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#7B6FAA', fontSize: 15 }}>Загружаем кабинет…</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ background: '#FAF8FF', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: '#CC3333', fontSize: 15 }}>Не удалось загрузить данные</p>
        <button onClick={load} style={{ background: '#7C5CFC', color: '#fff', border: 'none', borderRadius: 100, padding: '10px 24px', cursor: 'pointer', fontWeight: 700 }}>Повторить</button>
      </div>
    )
  }

  const refUrl = `https://nata-tomshina.ru/club?ref=${data.ref_code}`
  const { stats, commissions } = data

  const nextPayout = new Date()
  nextPayout.setMonth(nextPayout.getMonth() + (nextPayout.getDate() === 1 ? 1 : 1))
  nextPayout.setDate(1)
  const nextPayoutStr = nextPayout.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

  return (
    <div style={{ background: '#FAF8FF', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ background: 'rgba(250,248,255,0.94)', backdropFilter: 'blur(16px)', borderBottom: '1.5px solid #EDE8FF', padding: '14px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#4CAF78', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🌿</span>
          Вкус Жизни
        </Link>
        <button onClick={logout} style={{ background: 'none', border: '1.5px solid #EDE8FF', borderRadius: 20, padding: '6px 16px', fontSize: 13, color: '#7B6FAA', cursor: 'pointer', fontWeight: 600 }}>
          Выйти
        </button>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '36px 5% 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 700, color: '#3D2B8A', margin: '0 0 28px' }}>
          Кабинет партнёра
        </h1>

        {/* Реферальная ссылка */}
        <div style={{ background: 'linear-gradient(135deg,#3D2B8A,#5B3FA8)', borderRadius: 20, padding: '24px 28px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 6px' }}>Ваша реферальная ссылка</p>
            <p style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, color: '#fff', margin: 0, wordBreak: 'break-all' }}>{refUrl}</p>
          </div>
          <button
            onClick={copyLink}
            style={{ background: copied ? '#4CAF78' : 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.25)', borderRadius: 100, padding: '10px 22px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: '.2s' }}
          >
            {copied ? '✓ Скопировано' : '📋 Скопировать'}
          </button>
        </div>

        {/* Карточки статистики */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Переходов',       value: stats.clicks,                 unit: '' },
            { label: 'Участниц',        value: stats.members,                unit: '' },
            { label: 'Оплат на',        value: fmt(stats.total_payments),    unit: '₽' },
            { label: 'Заработано всего', value: fmt(stats.total_earned),     unit: '₽', accent: true },
            { label: 'К выплате',       value: fmt(stats.pending_payout),    unit: '₽', accent: stats.pending_payout >= 1000 },
          ].map((c) => (
            <div key={c.label} style={{ background: '#fff', border: `1.5px solid ${c.accent ? '#A8E6CF' : '#EDE8FF'}`, borderRadius: 16, padding: '18px 20px' }}>
              <p style={{ fontSize: 12, color: '#9B8FCC', margin: '0 0 6px', fontWeight: 600 }}>{c.label}</p>
              <p style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 700, color: c.accent ? '#2D6A4F' : '#2D1F6E', margin: 0 }}>
                {c.value}{c.unit && <span style={{ fontSize: 13, marginLeft: 3 }}>{c.unit}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Таблица начислений */}
        <div style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 20, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #EDE8FF' }}>
            <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', margin: 0 }}>Начисления</h2>
          </div>
          {commissions.length === 0 ? (
            <p style={{ padding: '28px 24px', fontSize: 14, color: '#9B8FCC', margin: 0 }}>Начислений пока нет</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F9F8FF' }}>
                    {['Дата', 'Тип', 'Оплата', 'Комиссия', 'Статус'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#7B6FAA', fontWeight: 700, fontSize: 12, borderBottom: '1px solid #EDE8FF', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {commissions.map(c => {
                    const st = STATUS_LABEL[c.status] ?? { label: c.status, color: '#7B6FAA', bg: '#F0EEFF' }
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #EDE8FF' }}>
                        <td style={{ padding: '12px 16px', color: '#7B6FAA', whiteSpace: 'nowrap' }}>{fmtDate(c.created_at)}</td>
                        <td style={{ padding: '12px 16px', color: '#2D1F6E', fontWeight: 600 }}>
                          {c.type === 'first' ? '🆕 Первый' : '🔄 Продление'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#2D1F6E' }}>{fmt(c.payment_amount)} ₽</td>
                        <td style={{ padding: '12px 16px', color: '#2D6A4F', fontWeight: 700 }}>{fmt(c.commission_amount)} ₽</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: st.bg, color: st.color, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{st.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {/* Реквизиты */}
          <div style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 20, padding: '22px 24px' }}>
            <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', margin: '0 0 14px' }}>Реквизиты для выплаты</h2>
            {editingDetails ? (
              <>
                <textarea
                  value={detailsValue}
                  onChange={e => setDetailsValue(e.target.value)}
                  rows={4}
                  placeholder="Номер карты, банк, ФИО держателя или реквизиты ИП…"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #EDE8FF', fontSize: 14, color: '#2D1F6E', background: '#FAF8FF', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button
                    onClick={saveDetails}
                    disabled={detailsSaving}
                    style={{ flex: 1, background: '#7C5CFC', color: '#fff', border: 'none', borderRadius: 100, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {detailsSaving ? 'Сохраняем…' : 'Сохранить'}
                  </button>
                  <button
                    onClick={() => { setEditingDetails(false); setDetailsValue(data.payment_details ?? '') }}
                    style={{ background: '#F0EEFF', color: '#7C5CFC', border: 'none', borderRadius: 100, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Отмена
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, color: data.payment_details ? '#2D1F6E' : '#9B8FCC', lineHeight: 1.6, margin: '0 0 14px', whiteSpace: 'pre-wrap' }}>
                  {data.payment_details || 'Реквизиты не указаны'}
                </p>
                {detailsSaved && <p style={{ fontSize: 13, color: '#4CAF78', margin: '0 0 10px', fontWeight: 600 }}>✓ Сохранено</p>}
                <button
                  onClick={() => setEditingDetails(true)}
                  style={{ background: '#F0EEFF', color: '#7C5CFC', border: 'none', borderRadius: 100, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  ✏️ Редактировать
                </button>
              </>
            )}
          </div>

          {/* Выплаты */}
          <div style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 20, padding: '22px 24px' }}>
            <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', margin: '0 0 14px' }}>Ближайшая выплата</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#7B6FAA' }}>Дата выплаты</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#2D1F6E' }}>1-е число каждого месяца</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#7B6FAA' }}>Следующая</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#7C5CFC' }}>{nextPayoutStr}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#7B6FAA' }}>К выплате</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: stats.pending_payout >= 1000 ? '#2D6A4F' : '#9B8FCC' }}>
                  {fmt(stats.pending_payout)} ₽
                </span>
              </div>
              {stats.pending_payout < 1000 && (
                <div style={{ background: '#FFFBE6', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#B8860B', lineHeight: 1.5 }}>
                  Минимум для выплаты — 1 000 ₽.<br />
                  Ещё {fmt(1000 - stats.pending_payout)} ₽ до первой выплаты.
                </div>
              )}
              <div style={{ background: '#F0EEFF', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#3D2B8A', lineHeight: 1.5 }}>
                Вопросы по выплатам: <a href="mailto:hello@nata-tomshina.ru" style={{ color: '#7C5CFC', fontWeight: 600, textDecoration: 'none' }}>hello@nata-tomshina.ru</a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
