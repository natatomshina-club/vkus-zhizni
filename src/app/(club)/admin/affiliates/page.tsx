'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Affiliate {
  id: string
  name: string
  email: string
  ref_code: string
  status: 'pending' | 'active' | 'suspended' | 'blocked'
  total_earned: number
  total_paid: number
  clicks: number
  members: number
  promo_text: string | null
  created_at: string
}

interface Commission {
  id: string
  affiliate_id: string
  member_id: string
  member_email: string | null
  payment_amount: number
  commission_amount: number
  type: 'first' | 'recurring'
  status: string
  created_at: string
  affiliates: { name: string; email: string; ref_code: string } | null
}

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: 'Заявка',          bg: '#FFFBE6', color: '#B8860B' },
  active:    { label: 'Активен',         bg: '#D8F3DC', color: '#2D6A4F' },
  suspended: { label: 'Приостановлен',   bg: '#FFF0E6', color: '#C05C00' },
  blocked:   { label: 'Заблокирован',    bg: '#FFF0F0', color: '#CC3333' },
}

const FILTER_OPTIONS = [
  { value: 'all',       label: 'Все' },
  { value: 'pending',   label: 'Заявки' },
  { value: 'active',    label: 'Активные' },
  { value: 'suspended', label: 'Приостановленные' },
  { value: 'blocked',   label: 'Заблокированные' },
]

function fmt(n: number) {
  return (n ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' })
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [pendingReady, setPendingReady] = useState<Commission[]>([])
  const [approved, setApproved] = useState<Commission[]>([])
  const [totalDebt, setTotalDebt] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'affiliates' | 'payouts'>('affiliates')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedPromo, setExpandedPromo] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [aRes, cRes] = await Promise.all([
      fetch('/api/admin/affiliates'),
      fetch('/api/admin/commissions'),
    ])
    if (aRes.ok) {
      const { affiliates: data } = await aRes.json()
      setAffiliates(data ?? [])
    }
    if (cRes.ok) {
      const { pending_ready, approved: app, total_debt } = await cRes.json()
      setPendingReady(pending_ready ?? [])
      setApproved(app ?? [])
      setTotalDebt(total_debt ?? 0)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  async function setStatus(id: string, status: string) {
    setActionLoading(id + status)
    await fetch(`/api/admin/affiliates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await loadAll()
    setActionLoading(null)
  }

  async function commissionAction(id: string, action: 'approve' | 'paid') {
    setActionLoading(id + action)
    await fetch(`/api/admin/commissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    await loadAll()
    setActionLoading(null)
  }

  const pendingCount = affiliates.filter(a => a.status === 'pending').length
  const filteredAffiliates = statusFilter === 'all'
    ? affiliates
    : affiliates.filter(a => a.status === statusFilter)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link href="/admin" style={{ fontSize: 13, color: '#7B6FAA', textDecoration: 'none', padding: '6px 12px', borderRadius: 10, background: '#F0EEFF' }}>
            ← Назад
          </Link>
          <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#2D1F6E', margin: '12px 0 0' }}>
            Партнёры
          </h1>
        </div>
        <div style={{ background: totalDebt > 0 ? '#FFF0E6' : '#F0EEFF', border: `1.5px solid ${totalDebt > 0 ? '#FFD0A0' : '#EDE8FF'}`, borderRadius: 14, padding: '10px 18px', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#9B8FCC', margin: '0 0 2px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Общий долг по выплатам</p>
          <p style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 700, color: totalDebt > 0 ? '#C05C00' : '#2D1F6E', margin: 0 }}>{fmt(totalDebt)} ₽</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {([
          { key: 'affiliates' as const, label: `Партнёры${pendingCount > 0 ? ` · ${pendingCount} заявок` : ''}` },
          { key: 'payouts' as const, label: `Выплаты${pendingReady.length + approved.length > 0 ? ` · ${pendingReady.length + approved.length}` : ''}` },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{ padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: tab === t.key ? '#3D2B8A' : '#F0EEFF', color: tab === t.key ? '#fff' : '#7B6FAA' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: '#9B8FCC', fontSize: 14 }}>Загрузка…</p> : tab === 'affiliates' ? (

        /* ══════════════════════════════════════════════
           ВКЛ. 1 — ПАРТНЁРЫ
        ══════════════════════════════════════════════ */
        <div>
          {/* Status filter */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                style={{ padding: '5px 14px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: '.15s',
                  background: statusFilter === opt.value ? '#3D2B8A' : 'transparent',
                  borderColor: statusFilter === opt.value ? '#3D2B8A' : '#EDE8FF',
                  color: statusFilter === opt.value ? '#fff' : '#7B6FAA',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {filteredAffiliates.length === 0 ? (
            <p style={{ color: '#9B8FCC', fontSize: 14 }}>Нет партнёров с таким статусом</p>
          ) : (
            <div style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F9F8FF' }}>
                      {['Имя / Email', 'Ref-код', 'Статус', 'Переходы', 'Заработано', 'Выплачено', 'Дата', 'Действия'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#7B6FAA', fontWeight: 700, fontSize: 12, borderBottom: '1px solid #EDE8FF', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAffiliates.map(a => {
                      const st = STATUS_STYLE[a.status] ?? STATUS_STYLE.pending
                      return (
                        <tr key={a.id} style={{ borderBottom: '1px solid #EDE8FF' }}>
                          <td style={{ padding: '12px 14px', minWidth: 180 }}>
                            <p style={{ margin: 0, fontWeight: 700, color: '#2D1F6E' }}>{a.name}</p>
                            <p style={{ margin: 0, fontSize: 12, color: '#9B8FCC' }}>{a.email}</p>
                            {a.promo_text && (
                              <>
                                <button onClick={() => setExpandedPromo(expandedPromo === a.id ? null : a.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#7C5CFC', fontWeight: 600, padding: '2px 0', marginTop: 2 }}>
                                  {expandedPromo === a.id ? '▲ скрыть' : '▼ о продвижении'}
                                </button>
                                {expandedPromo === a.id && (
                                  <p style={{ fontSize: 12, color: '#2D1F6E', lineHeight: 1.5, margin: '4px 0 0', background: '#F9F8FF', borderRadius: 8, padding: '8px 10px', maxWidth: 260 }}>{a.promo_text}</p>
                                )}
                              </>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#7C5CFC', fontWeight: 700, background: '#F0EEFF', padding: '3px 8px', borderRadius: 8 }}>{a.ref_code}</span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ background: st.bg, color: st.color, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{st.label}</span>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#2D1F6E', fontWeight: 600, textAlign: 'center' }}>{a.clicks}</td>
                          <td style={{ padding: '12px 14px', color: '#2D6A4F', fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt(a.total_earned)} ₽</td>
                          <td style={{ padding: '12px 14px', color: '#7B6FAA', whiteSpace: 'nowrap' }}>{fmt(a.total_paid)} ₽</td>
                          <td style={{ padding: '12px 14px', color: '#9B8FCC', whiteSpace: 'nowrap' }}>{fmtDate(a.created_at)}</td>
                          <td style={{ padding: '8px 12px', minWidth: 120 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {a.status === 'pending' && (
                                <button onClick={() => setStatus(a.id, 'active')} disabled={actionLoading === a.id + 'active'}
                                  style={{ background: '#4CAF78', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                  {actionLoading === a.id + 'active' ? '…' : '✓ Одобрить'}
                                </button>
                              )}
                              {a.status === 'active' && (
                                <button onClick={() => setStatus(a.id, 'suspended')} disabled={actionLoading === a.id + 'suspended'}
                                  style={{ background: '#FFF0E6', color: '#C05C00', border: '1.5px solid #FFD0A0', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                  {actionLoading === a.id + 'suspended' ? '…' : '⏸ Пауза'}
                                </button>
                              )}
                              {a.status === 'suspended' && (
                                <button onClick={() => setStatus(a.id, 'active')} disabled={actionLoading === a.id + 'active'}
                                  style={{ background: '#D8F3DC', color: '#2D6A4F', border: '1.5px solid #A8E6CF', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                  {actionLoading === a.id + 'active' ? '…' : '▶ Возобновить'}
                                </button>
                              )}
                              {a.status !== 'blocked' && (
                                <button onClick={() => { if (confirm(`Заблокировать ${a.name}?`)) setStatus(a.id, 'blocked') }}
                                  disabled={actionLoading === a.id + 'blocked'}
                                  style={{ background: '#FFF0F0', color: '#CC3333', border: '1.5px solid #FFCCCC', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                  {actionLoading === a.id + 'blocked' ? '…' : '🚫 Блок'}
                                </button>
                              )}
                              {a.status === 'blocked' && (
                                <button onClick={() => setStatus(a.id, 'active')} disabled={actionLoading === a.id + 'active'}
                                  style={{ background: '#D8F3DC', color: '#2D6A4F', border: '1.5px solid #A8E6CF', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                  {actionLoading === a.id + 'active' ? '…' : '↩ Разблок'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      ) : (

        /* ══════════════════════════════════════════════
           ВКЛ. 2 — ВЫПЛАТЫ
        ══════════════════════════════════════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* ── Раздел 1: Готовы к одобрению (pending, hold прошёл) ── */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: '#3D2B8A', margin: '0 0 12px' }}>
              К одобрению {pendingReady.length > 0 && <span style={{ background: '#FFFBE6', color: '#B8860B', fontSize: 12, padding: '2px 10px', borderRadius: 20, marginLeft: 8 }}>{pendingReady.length}</span>}
            </h2>
            {pendingReady.length === 0 ? (
              <div style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 14, padding: '20px 24px' }}>
                <p style={{ color: '#9B8FCC', fontSize: 14, margin: 0 }}>Нет комиссий, готовых к одобрению</p>
                <p style={{ color: '#C4B8FF', fontSize: 12, margin: '4px 0 0' }}>14-дневный период ожидания ещё не прошёл</p>
              </div>
            ) : (
              <CommissionsTable
                commissions={pendingReady}
                actionLabel="✓ Одобрить к выплате"
                actionKey="approve"
                actionColor="#4CAF78"
                actionLoading={actionLoading}
                onAction={commissionAction}
              />
            )}
          </div>

          {/* ── Раздел 2: Одобрены, ожидают выплаты ── */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: '#3D2B8A', margin: '0 0 12px' }}>
              Ожидают выплаты {approved.length > 0 && <span style={{ background: '#D8F3DC', color: '#2D6A4F', fontSize: 12, padding: '2px 10px', borderRadius: 20, marginLeft: 8 }}>{approved.length}</span>}
            </h2>
            {approved.length === 0 ? (
              <div style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 14, padding: '20px 24px' }}>
                <p style={{ color: '#9B8FCC', fontSize: 14, margin: 0 }}>Нет одобренных комиссий</p>
              </div>
            ) : (
              <CommissionsTable
                commissions={approved}
                actionLabel="💸 Отметить выплаченным"
                actionKey="paid"
                actionColor="#7C5CFC"
                actionLoading={actionLoading}
                onAction={commissionAction}
              />
            )}

            {/* Total debt row */}
            {totalDebt > 0 && (
              <div style={{ background: '#FFF0E6', border: '1.5px solid #FFD0A0', borderRadius: 12, padding: '14px 20px', marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#C05C00' }}>Общий долг по выплатам</span>
                <span style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 700, color: '#C05C00' }}>{fmt(totalDebt)} ₽</span>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

function CommissionsTable({
  commissions, actionLabel, actionKey, actionColor, actionLoading, onAction,
}: {
  commissions: Commission[]
  actionLabel: string
  actionKey: 'approve' | 'paid'
  actionColor: string
  actionLoading: string | null
  onAction: (id: string, action: 'approve' | 'paid') => void
}) {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F9F8FF' }}>
              {['Партнёр', 'Участница', 'Сумма оплаты', 'Комиссия', 'Тип', 'Дата', 'Действие'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#7B6FAA', fontWeight: 700, fontSize: 12, borderBottom: '1px solid #EDE8FF', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commissions.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #EDE8FF' }}>
                <td style={{ padding: '11px 14px' }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#2D1F6E' }}>{c.affiliates?.name ?? '—'}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#9B8FCC', fontFamily: 'monospace' }}>{c.affiliates?.ref_code}</p>
                </td>
                <td style={{ padding: '11px 14px', color: '#7B6FAA', fontSize: 12 }}>{c.member_email ?? '—'}</td>
                <td style={{ padding: '11px 14px', color: '#2D1F6E', whiteSpace: 'nowrap' }}>{(c.payment_amount ?? 0).toLocaleString('ru-RU')} ₽</td>
                <td style={{ padding: '11px 14px', color: '#2D6A4F', fontWeight: 700, whiteSpace: 'nowrap' }}>{(c.commission_amount ?? 0).toLocaleString('ru-RU')} ₽</td>
                <td style={{ padding: '11px 14px', color: '#2D1F6E', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {c.type === 'first' ? '🆕 Первый' : '🔄 Продление'}
                </td>
                <td style={{ padding: '11px 14px', color: '#9B8FCC', whiteSpace: 'nowrap' }}>
                  {new Date(c.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' })}
                </td>
                <td style={{ padding: '11px 14px' }}>
                  <button
                    onClick={() => onAction(c.id, actionKey)}
                    disabled={actionLoading === c.id + actionKey}
                    style={{ background: actionColor, color: '#fff', border: 'none', borderRadius: 100, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {actionLoading === c.id + actionKey ? '…' : actionLabel}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
