'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { MemberRow, SubscriptionStatus } from '@/types/admin'
import Avatar from '@/components/Avatar'

const STATUS_TABS: { value: SubscriptionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'trial', label: 'Триал' },
  { value: 'active', label: 'Активные' },
  { value: 'cancelled', label: 'Отменили' },
  { value: 'blocked', label: 'Заблокированы' },
]

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  trial: { label: 'Триал', bg: '#FFF3C0', color: '#5C4200' },
  active: { label: 'Активная', bg: '#D0F5E8', color: '#1A5C3A' },
  cancelled: { label: 'Отменила', bg: '#FFE4E4', color: '#7A1E1E' },
  blocked: { label: 'Заблок.', bg: '#E8E8E8', color: '#444' },
}

const TARIFF_LABEL: Record<string, string> = {
  trial: 'Пробный',
  monthly: 'Месяц',
  halfyear: 'Полгода',
}

function StatusBadge({ status }: { status: string }) {
  const b = STATUS_BADGE[status] ?? { label: status, bg: '#eee', color: '#333' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: b.bg,
        color: b.color,
        whiteSpace: 'nowrap',
      }}
    >
      {b.label}
    </span>
  )
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          style={{
            height: 64,
            borderRadius: 12,
            background: 'linear-gradient(90deg, #f0eeff 25%, #e8e0ff 50%, #f0eeff 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }}
        />
      ))}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isBirthdayToday(birth_date: string | null): boolean {
  if (!birth_date) return false
  const today = new Date()
  const bd = new Date(birth_date + 'T00:00:00')
  return bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate()
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add member form
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({ email: '', full_name: '', tariff: 'monthly', admin_note: '' })
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState('')
  const [addToast, setAddToast] = useState('')

  const LIMIT = 20
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({
      search: debouncedSearch,
      status: statusFilter,
      page: String(page),
      limit: String(LIMIT),
    })
    const res = await fetch(`/api/admin/members?${params}`)
    if (!res.ok) { setError('Ошибка загрузки'); setLoading(false); return }
    const data = await res.json() as { members: MemberRow[]; total: number }
    setMembers(data.members)
    setTotal(data.total)
    setLoading(false)
  }, [debouncedSearch, statusFilter, page])

  useEffect(() => { load() }, [load])

  function handleStatusChange(s: SubscriptionStatus | 'all') {
    setStatusFilter(s)
    setPage(1)
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setAddSaving(true)
    setAddError('')
    const res = await fetch('/api/admin/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    setAddSaving(false)
    const d = await res.json().catch(() => ({})) as { error?: string; warning?: string; member?: unknown }
    if (!res.ok) {
      setAddError(d.error ?? (d as Record<string, string>).message ?? 'Неизвестная ошибка — проверь логи Vercel')
      return
    }
    setShowAddForm(false)
    setAddForm({ email: '', full_name: '', tariff: 'monthly', admin_note: '' })
    setAddError('')
    const toastMsg = d.warning
      ? `⚠️ ${d.warning}`
      : '✅ Участница добавлена, приглашение отправлено'
    setAddToast(toastMsg)
    setTimeout(() => setAddToast(''), 6000)
    load()
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast */}
      {addToast && (
        <div style={{
          position: 'fixed', top: 72, right: 16, zIndex: 100,
          background: addToast.startsWith('⚠️') ? '#7A5200' : '#3D2B8A',
          color: '#fff', padding: '12px 20px',
          borderRadius: 14, fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(60,30,130,0.25)',
          maxWidth: 360, lineHeight: 1.5,
        }}>
          {addToast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link
          href="/admin"
          style={{
            fontSize: 13,
            color: '#7B6FAA',
            textDecoration: 'none',
            padding: '8px 12px',
            borderRadius: 10,
            background: '#F0EEFF',
          }}
        >
          ← Назад
        </Link>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#3D2B8A', margin: 0 }}>
          Участницы
        </h1>
        <span style={{ fontSize: 13, color: '#7B6FAA', marginLeft: 'auto' }}>
          {total} чел.
        </span>
        <button
          onClick={() => { setShowAddForm(p => !p); setAddError('') }}
          style={{
            padding: '8px 16px', borderRadius: 10, border: 'none',
            background: '#4CAF78', color: '#fff', fontSize: 13,
            fontWeight: 700, cursor: 'pointer', minHeight: 40,
            fontFamily: 'var(--font-nunito)',
          }}
        >
          + Добавить
        </button>
      </div>

      {/* Add member form */}
      {showAddForm && (
        <form
          onSubmit={handleAddMember}
          style={{
            background: '#fff', border: '1px solid #EDE8FF', borderRadius: 16,
            padding: '20px', marginBottom: 20,
          }}
        >
          <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#3D2B8A', fontFamily: 'var(--font-nunito)' }}>
            Добавить участницу вручную
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#7B6FAA', marginBottom: 4 }}>Email *</label>
              <input
                type="email"
                required
                value={addForm.email}
                onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #EDE8FF',
                  fontSize: 14, color: '#2D1F6E', background: '#FAF8FF', outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'var(--font-nunito)',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#7B6FAA', marginBottom: 4 }}>Имя (Ф.И.О.) *</label>
              <input
                type="text"
                required
                value={addForm.full_name}
                onChange={e => setAddForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Иванова Мария"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #EDE8FF',
                  fontSize: 14, color: '#2D1F6E', background: '#FAF8FF', outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'var(--font-nunito)',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#7B6FAA', marginBottom: 6 }}>Тариф</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'monthly', label: 'Месяц (30 дней)' },
                { value: 'halfyear', label: 'Полгода (180 дней)' },
              ].map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setAddForm(p => ({ ...p, tariff: o.value }))}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: '1px solid',
                    borderColor: addForm.tariff === o.value ? '#7C5CFC' : '#EDE8FF',
                    background: addForm.tariff === o.value ? '#7C5CFC' : '#fff',
                    color: addForm.tariff === o.value ? '#fff' : '#7B6FAA',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 40,
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#7B6FAA', marginBottom: 4 }}>Комментарий (для себя)</label>
            <input
              type="text"
              value={addForm.admin_note}
              onChange={e => setAddForm(p => ({ ...p, admin_note: e.target.value }))}
              placeholder="Напр.: оплата на карту, Казахстан"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #EDE8FF',
                fontSize: 14, color: '#2D1F6E', background: '#FAF8FF', outline: 'none',
                boxSizing: 'border-box', fontFamily: 'var(--font-nunito)',
              }}
            />
          </div>

          {addError && (
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#C0392B', fontWeight: 600 }}>{addError}</p>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              disabled={addSaving}
              style={{
                padding: '10px 20px', borderRadius: 12, background: '#4CAF78', color: '#fff',
                fontSize: 14, fontWeight: 700, cursor: addSaving ? 'not-allowed' : 'pointer',
                border: 'none', minHeight: 44, opacity: addSaving ? 0.7 : 1,
                fontFamily: 'var(--font-nunito)',
              }}
            >
              {addSaving ? 'Добавляю...' : '📩 Добавить и отправить приглашение'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setAddError('') }}
              style={{
                padding: '10px 16px', borderRadius: 12, background: '#fff', color: '#7B6FAA',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                border: '1px solid #EDE8FF', minHeight: 44,
              }}
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="🔍 Поиск по имени или email"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid #EDE8FF',
              fontSize: 14,
              color: '#2D1F6E',
              background: '#fff',
              outline: 'none',
              fontFamily: 'var(--font-nunito)',
              minHeight: 48,
            }}
          />
          {(search || statusFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setPage(1) }}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid #EDE8FF',
                background: '#F0EEFF',
                color: '#7C5CFC',
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: 600,
                minHeight: 48,
              }}
            >
              Сбросить
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => handleStatusChange(t.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: statusFilter === t.value ? '#7C5CFC' : '#EDE8FF',
                background: statusFilter === t.value ? '#7C5CFC' : '#fff',
                color: statusFilter === t.value ? '#fff' : '#7B6FAA',
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.15s',
                minHeight: 36,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', background: '#FFE4E4', borderRadius: 12, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: '#7A1E1E', fontSize: 14 }}>{error}</span>
          <button onClick={load} style={{ marginLeft: 'auto', fontSize: 13, color: '#7C5CFC', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Повторить
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <Skeleton />
      ) : members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#7B6FAA', fontSize: 14 }}>
          Участниц не найдено. Попробуйте другой запрос.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="members-table" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #EDE8FF' }}>
                  {['Участница', 'Email', 'Статус', 'Тариф', 'Вступила', ''].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#7B6FAA', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr
                    key={m.id}
                    style={{ borderBottom: '1px solid #EDE8FF', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAF8FF')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar url={m.avatar_url} name={m.full_name ?? m.email} size={36} />
                        <span style={{ color: '#3D2B8A', fontWeight: 600 }}>
                          {m.full_name ?? '—'}
                          {isBirthdayToday(m.birth_date) && (
                            <span title="День рождения сегодня!" style={{ marginLeft: 6 }}>🎂</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 12px', color: '#7B6FAA' }}>{m.email}</td>
                    <td style={{ padding: '12px 12px' }}><StatusBadge status={m.subscription_status} /></td>
                    <td style={{ padding: '12px 12px', color: '#7B6FAA' }}>
                      {TARIFF_LABEL[m.tariff] ?? m.tariff}
                      {m.is_manual_subscription && (
                        <span style={{ marginLeft: 6, fontSize: 11, background: '#E8F5E9', color: '#1A5C3A', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>
                          ручн.
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 12px', color: '#7B6FAA', whiteSpace: 'nowrap' }}>{formatDate(m.created_at)}</td>
                    <td style={{ padding: '12px 12px' }}>
                      <Link
                        href={`/admin/members/${m.id}`}
                        style={{
                          fontSize: 13,
                          color: '#7C5CFC',
                          textDecoration: 'none',
                          padding: '6px 12px',
                          borderRadius: 8,
                          background: '#F0EEFF',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Открыть →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="members-cards" style={{ display: 'none', flexDirection: 'column', gap: 8 }}>
            {members.map(m => (
              <Link
                key={m.id}
                href={`/admin/members/${m.id}`}
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  background: '#fff',
                  border: '1px solid #EDE8FF',
                  borderRadius: 14,
                }}
              >
                <Avatar url={m.avatar_url} name={m.full_name ?? m.email} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#3D2B8A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.full_name ?? m.email}
                    {isBirthdayToday(m.birth_date) && (
                      <span title="День рождения сегодня!" style={{ marginLeft: 6 }}>🎂</span>
                    )}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7B6FAA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.full_name ? m.email : formatDate(m.created_at)}
                  </p>
                </div>
                <StatusBadge status={m.subscription_status} />
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid #EDE8FF',
              background: page === 1 ? '#F9F9F9' : '#fff',
              color: page === 1 ? '#C0B8D8' : '#7C5CFC',
              fontSize: 13,
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              minHeight: 40,
            }}
          >
            ← Пред
          </button>
          <span style={{ fontSize: 13, color: '#7B6FAA' }}>
            Страница {page} из {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid #EDE8FF',
              background: page === totalPages ? '#F9F9F9' : '#fff',
              color: page === totalPages ? '#C0B8D8' : '#7C5CFC',
              fontSize: 13,
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              minHeight: 40,
            }}
          >
            След →
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 639px) {
          .members-table { display: none !important; }
          .members-cards { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
