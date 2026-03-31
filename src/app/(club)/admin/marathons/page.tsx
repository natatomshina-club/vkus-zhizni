'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Marathon = {
  id: string
  title: string
  month_label: string | null
  emoji: string | null
  status: 'planned' | 'active' | 'finished'
  starts_at: string | null
  ends_at: string | null
  duration_days: number
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  planned: { label: 'Плановый', color: '#5C4200', bg: '#FFD93D' },
  active: { label: 'Активный', color: '#fff', bg: '#4CAF78' },
  finished: { label: 'Завершён', color: '#2D6A4F', bg: '#A8E6CF' },
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminMarathonsPage() {
  const [marathons, setMarathons] = useState<Marathon[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createForm, setCreateForm] = useState({
    title: '', month_label: '', emoji: '🔥', status: 'planned', starts_at: '', ends_at: '', duration_days: '10',
  })

  const load = useCallback(async () => {
    setLoading(true)
    const url = statusFilter === 'all' ? '/api/admin/marathons' : `/api/admin/marathons?status=${statusFilter}`
    const res = await fetch(url)
    if (res.ok) {
      const { marathons: m } = await res.json() as { marathons: Marathon[] }
      setMarathons(m ?? [])
    }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    setDeleting(true)
    const res = await fetch(`/api/admin/marathons/${id}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    if (res.ok) load()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    const res = await fetch('/api/admin/marathons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...createForm,
        duration_days: parseInt(createForm.duration_days) || 10,
      }),
    })
    const d = await res.json().catch(() => ({})) as { error?: string; marathon?: Marathon }
    setCreating(false)
    if (!res.ok) { setCreateError(d.error ?? 'Ошибка'); return }
    setShowCreate(false)
    setCreateForm({ title: '', month_label: '', emoji: '🔥', status: 'planned', starts_at: '', ends_at: '', duration_days: '10' })
    load()
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link href="/admin" style={{
          fontSize: 13, color: 'var(--muted)', textDecoration: 'none',
          padding: '8px 12px', borderRadius: 10, background: 'var(--pur-lt)',
        }}>
          ← Назад
        </Link>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#3D2B8A', margin: 0, flex: 1 }}>
          🏃 Марафоны
        </h1>
        <button
          onClick={() => setShowCreate(s => !s)}
          style={{
            background: 'var(--pur)', color: '#fff', border: 'none', borderRadius: 12,
            padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 48,
          }}
        >
          + Создать
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Новый марафон</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="sm:col-span-2">
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Название *</label>
              <input
                required value={createForm.title}
                onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                placeholder="10-дневный марафон"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Месяц/период</label>
              <input value={createForm.month_label}
                onChange={e => setCreateForm(f => ({ ...f, month_label: e.target.value }))}
                placeholder="Апрель 2026"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Эмодзи</label>
              <input value={createForm.emoji}
                onChange={e => setCreateForm(f => ({ ...f, emoji: e.target.value }))}
                placeholder="🔥"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Дата начала</label>
              <input type="datetime-local" value={createForm.starts_at}
                onChange={e => setCreateForm(f => ({ ...f, starts_at: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Дата окончания</label>
              <input type="datetime-local" value={createForm.ends_at}
                onChange={e => setCreateForm(f => ({ ...f, ends_at: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Длительность (дней)</label>
              <input type="number" min={1} max={90} value={createForm.duration_days}
                onChange={e => setCreateForm(f => ({ ...f, duration_days: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Статус</label>
              <select value={createForm.status}
                onChange={e => setCreateForm(f => ({ ...f, status: e.target.value }))}
                style={inputStyle}
              >
                <option value="planned">Плановый</option>
                <option value="active">Активный</option>
                <option value="finished">Завершён</option>
              </select>
            </div>
          </div>
          {createError && <div style={{ color: '#E53E3E', fontSize: 13, marginBottom: 10 }}>{createError}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={creating} style={{
              background: 'var(--pur)', color: '#fff', border: 'none', borderRadius: 10,
              padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44,
            }}>
              {creating ? 'Создаём…' : 'Создать'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} style={{
              background: 'var(--pur-lt)', color: 'var(--pur)', border: 'none', borderRadius: 10,
              padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'planned', 'active', 'finished'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700,
            background: statusFilter === s ? 'var(--pur)' : 'var(--pur-lt)',
            color: statusFilter === s ? '#fff' : 'var(--pur)',
          }}>
            {s === 'all' ? 'Все' : STATUS_LABELS[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: 'var(--muted)', padding: '20px 0', textAlign: 'center' }}>Загружаем…</div>
      ) : marathons.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 16,
          padding: 32, textAlign: 'center', color: 'var(--muted)',
        }}>
          Марафонов нет. Создай первый!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {marathons.map(m => {
            const statusInfo = STATUS_LABELS[m.status] ?? { label: m.status, color: 'var(--muted)', bg: 'var(--pur-lt)' }
            return (
              <div key={m.id} style={{
                background: '#fff', border: '1px solid var(--border)', borderRadius: 16,
                padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{m.emoji ?? '🔥'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    {m.month_label && `${m.month_label} · `}
                    {formatDate(m.starts_at)} → {formatDate(m.ends_at)} · {m.duration_days} дней
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 800, color: statusInfo.color, background: statusInfo.bg,
                  borderRadius: 8, padding: '3px 10px', flexShrink: 0,
                }}>
                  {statusInfo.label}
                </span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <Link href={`/admin/marathons/${m.id}`} style={{
                    background: 'var(--pur-lt)', color: 'var(--pur)', borderRadius: 9,
                    padding: '7px 13px', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  }}>
                    Редактировать
                  </Link>
                  <Link href={`/admin/marathons/${m.id}/days`} style={{
                    background: '#FFF3E0', color: '#8B4A00', borderRadius: 9,
                    padding: '7px 13px', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  }}>
                    Дни
                  </Link>
                  {deleteId === m.id ? (
                    <>
                      <button onClick={() => handleDelete(m.id)} disabled={deleting} style={{
                        background: '#FF6B6B', color: '#fff', border: 'none', borderRadius: 9,
                        padding: '7px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      }}>
                        {deleting ? '…' : 'Да, удалить'}
                      </button>
                      <button onClick={() => setDeleteId(null)} style={{
                        background: 'var(--pur-lt)', color: 'var(--pur)', border: 'none', borderRadius: 9,
                        padding: '7px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      }}>
                        Отмена
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setDeleteId(m.id)} style={{
                      background: '#FFF0F0', color: '#E53E3E', border: 'none', borderRadius: 9,
                      padding: '7px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid var(--border)', borderRadius: 10,
  padding: '9px 12px', fontSize: 14, color: 'var(--text)', background: '#FAF8FF', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4,
}
