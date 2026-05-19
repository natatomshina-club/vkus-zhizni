'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { MemberRow, Tariff, SubscriptionStatus, PaymentLog } from '@/types/admin'
import Avatar from '@/components/Avatar'
import { getEffectiveMonths } from '@/lib/webinars'

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  trial: { label: '🟡 Триал', bg: '#FFF3C0', color: '#5C4200' },
  active: { label: '🟢 Активная', bg: '#D0F5E8', color: '#1A5C3A' },
  cancelled: { label: '🔴 Отменила', bg: '#FFE4E4', color: '#7A1E1E' },
  blocked: { label: '⛔ Заблокирована', bg: '#E8E8E8', color: '#444' },
}

const TARIFF_LABELS: Record<string, string> = {
  trial: 'Пробный (7 дней)',
  'Пробный': 'Пробный (7 дней)',
  month: 'Месяц',
  monthly: 'Месяц',
  halfyear: 'Полгода',
  'Полгода': 'Полгода',
}

function getClubRank(createdAt: string, plan?: string | null) {
  const months = getEffectiveMonths(createdAt, plan)
  if (months < 3) return '🌸 Новенькая'
  if (months < 6) return '🔥 Вошла во вкус'
  if (months < 9) return '💚 Уже своя'
  if (months < 12) return '👑 Легенда'
  return '💎 Бриллиант'
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #EDE8FF', borderRadius: 20, padding: '20px 20px 24px', marginBottom: 16 }}>
      {title && (
        <p style={{ fontSize: 12, fontWeight: 700, color: '#7B6FAA', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16, margin: '0 0 16px' }}>
          {title}
        </p>
      )}
      {children}
    </div>
  )
}

function tariffDefaultDate(tariff: Tariff): string {
  const days = tariff === 'trial' ? 7 : tariff === 'halfyear' ? 180 : 30
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

export default function MemberClient({ initial, payments }: { initial: MemberRow; payments: PaymentLog[] }) {
  const router = useRouter()
  const [member, setMember] = useState<MemberRow>(initial)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [resetingTour, setResetingTour] = useState(false)

  // Tariff form
  const [showTariffForm, setShowTariffForm] = useState(false)
  const [newTariff, setNewTariff] = useState<Tariff>(member.tariff)
  const [newEndsAt, setNewEndsAt] = useState(member.subscription_ends_at?.slice(0, 10) ?? '')
  const [tariffError, setTariffError] = useState('')

  // Manual renewal form
  const [showRenewForm, setShowRenewForm] = useState(false)
  const [renewTariff, setRenewTariff] = useState<'monthly' | 'halfyear' | 'date'>('monthly')
  const [renewDate, setRenewDate] = useState('')
  const [renewSaving, setRenewSaving] = useState(false)
  const [renewError, setRenewError] = useState('')

  // Role management
  const [roleChanging, setRoleChanging] = useState(false)

  // Block form
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [blockSaving, setBlockSaving] = useState(false)

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function saveTariff() {
    if (!newEndsAt) { setTariffError('Укажите дату окончания'); return }
    setSaving(true)
    setTariffError('')
    const res = await fetch(`/api/admin/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tariff: newTariff, subscription_ends_at: new Date(newEndsAt).toISOString() }),
    })
    setSaving(false)
    if (!res.ok) { const e = await res.json().catch(() => ({})) as { error?: string }; setTariffError(e.error ?? 'Ошибка'); return }
    const { member: updated } = await res.json() as { member: MemberRow }
    setMember(m => ({ ...m, ...updated }))
    setShowTariffForm(false)
    showToast('✅ Тариф обновлён')
    router.refresh()
  }

  async function renewAccess() {
    setRenewSaving(true)
    setRenewError('')
    let body: Record<string, unknown>
    if (renewTariff === 'date') {
      if (!renewDate) { setRenewError('Укажите дату'); setRenewSaving(false); return }
      body = { expires_at: renewDate }
    } else {
      const days = renewTariff === 'halfyear' ? 180 : 30
      body = { extend_days: days, tariff: renewTariff }
    }
    const res = await fetch(`/api/admin/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setRenewSaving(false)
    if (!res.ok) {
      const e = await res.json().catch(() => ({})) as { error?: string }
      setRenewError(e.error ?? 'Ошибка')
      return
    }
    const { member: updated } = await res.json() as { member: MemberRow }
    setMember(m => ({ ...m, ...updated }))
    setShowRenewForm(false)
    showToast('✅ Доступ продлён')
  }

  async function blockMember() {
    setBlockSaving(true)
    const res = await fetch(`/api/admin/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_blocked: true, blocked_reason: blockReason.trim() || null }),
    })
    setBlockSaving(false)
    if (!res.ok) { showToast('Ошибка блокировки'); return }
    const { member: updated } = await res.json() as { member: MemberRow }
    setMember(m => ({ ...m, ...updated }))
    setShowBlockConfirm(false)
    setBlockReason('')
    showToast('⛔ Участница заблокирована')
  }

  async function unblockMember() {
    setBlockSaving(true)
    const res = await fetch(`/api/admin/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_blocked: false }),
    })
    setBlockSaving(false)
    if (!res.ok) { showToast('Ошибка разблокировки'); return }
    const { member: updated } = await res.json() as { member: MemberRow }
    setMember(m => ({ ...m, ...updated }))
    showToast('✅ Участница разблокирована')
  }

  async function changeRole(newRole: 'curator' | 'member') {
    setRoleChanging(true)
    const res = await fetch(`/api/admin/members/${member.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    setRoleChanging(false)
    if (!res.ok) { showToast('Ошибка изменения роли'); return }
    const { member: updated } = await res.json() as { member: { role: string } }
    setMember(m => ({ ...m, role: updated.role as MemberRow['role'] }))
    showToast(newRole === 'curator' ? '✅ Роль куратора назначена' : '✅ Роль куратора снята')
  }

  async function deleteMember() {
    setDeleting(true)
    const res = await fetch(`/api/admin/members/${member.id}/delete`, { method: 'DELETE' })
    if (res.ok) {
      window.location.href = '/admin/members'
    } else {
      const e = await res.json().catch(() => ({})) as { error?: string }
      showToast('Ошибка удаления: ' + (e.error ?? 'неизвестная ошибка'))
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const badge = STATUS_BADGE[member.subscription_status] ?? { label: member.subscription_status, bg: '#eee', color: '#333' }

  return (
    <div style={{ maxWidth: 600, position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 72, right: 16, zIndex: 100,
          background: '#3D2B8A', color: '#fff', padding: '12px 20px',
          borderRadius: 14, fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(60,30,130,0.25)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}

      {/* Profile */}
      <Card title="Профиль">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <Avatar url={member.avatar_url} name={member.full_name ?? member.email} size={64} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <p style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#3D2B8A' }}>
                {member.full_name ?? '—'}
              </p>
              {member.birth_date && (() => {
                const today = new Date()
                const bd = new Date(member.birth_date + 'T00:00:00')
                const isToday = bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate()
                const age = today.getFullYear() - bd.getFullYear() - (today < new Date(today.getFullYear(), bd.getMonth(), bd.getDate()) ? 1 : 0)
                return (
                  <span style={{ fontSize: 13, background: isToday ? '#FFE4F0' : '#F0EEFF', color: isToday ? '#9B1B5A' : '#7B6FAA', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                    {isToday ? '🎂' : '🎈'} {age} лет
                  </span>
                )
              })()}
            </div>
            <p style={{ margin: '0 0 6px', fontSize: 14, color: '#7B6FAA' }}>{member.email}</p>
            {member.birth_date && (
              <p style={{ margin: '0 0 6px', fontSize: 12, color: '#7B6FAA' }}>
                ДР: {new Date(member.birth_date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#7B6FAA' }}>
                Вступила {formatDate(member.created_at)}
              </span>
              <span style={{ fontSize: 12, background: '#F0EEFF', color: '#7C5CFC', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                {getClubRank(member.subscription_started_at ?? member.created_at, member.subscription_plan)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Subscription */}
      <Card title="Подписка">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: '#7B6FAA' }}>Статус</p>
            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: badge.bg, color: badge.color }}>
              {badge.label}
            </span>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: '#7B6FAA' }}>Тариф</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#3D2B8A' }}>{TARIFF_LABELS[member.tariff]}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: '#7B6FAA' }}>Действует до</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#3D2B8A' }}>
              {member.subscription_ends_at ? formatDate(member.subscription_ends_at) : '∞'}
            </p>
          </div>
        </div>

        {!showTariffForm ? (
          <button
            onClick={() => setShowTariffForm(true)}
            style={{
              padding: '10px 20px', borderRadius: 12, border: '1px solid #EDE8FF',
              background: '#F0EEFF', color: '#7C5CFC', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', minHeight: 44,
            }}
          >
            Сменить тариф
          </button>
        ) : (
          <div style={{ background: '#F9F8FF', borderRadius: 14, padding: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#3D2B8A' }}>Изменить тариф</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              {(Object.entries(TARIFF_LABELS) as [Tariff, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => { setNewTariff(val); setNewEndsAt(tariffDefaultDate(val)) }}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: '1px solid',
                    borderColor: newTariff === val ? '#7C5CFC' : '#EDE8FF',
                    background: newTariff === val ? '#7C5CFC' : '#fff',
                    color: newTariff === val ? '#fff' : '#7B6FAA',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 40,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: '#7B6FAA', display: 'block', marginBottom: 6 }}>
                Действует до *
              </label>
              <input
                type="date"
                value={newEndsAt}
                onChange={e => setNewEndsAt(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #EDE8FF',
                  fontSize: 14, color: '#2D1F6E', background: '#fff', outline: 'none',
                  fontFamily: 'var(--font-nunito)', boxSizing: 'border-box',
                }}
              />
            </div>
            {tariffError && <p style={{ margin: '0 0 10px', fontSize: 13, color: '#C0392B' }}>{tariffError}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={saveTariff}
                disabled={saving}
                style={{
                  padding: '10px 20px', borderRadius: 12, background: '#4CAF78', color: '#fff',
                  fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  border: 'none', minHeight: 44, opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Сохраняю...' : 'Сохранить'}
              </button>
              <button
                onClick={() => { setShowTariffForm(false); setTariffError('') }}
                style={{
                  padding: '10px 16px', borderRadius: 12, background: '#fff', color: '#7B6FAA',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  border: '1px solid #EDE8FF', minHeight: 44,
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Manual renewal */}
      <Card title="Продлить доступ вручную">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 12, color: '#7B6FAA' }}>Текущий доступ до</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#3D2B8A' }}>
              {member.subscription_ends_at ? formatDate(member.subscription_ends_at) : '—'}
              {member.subscription_ends_at && new Date(member.subscription_ends_at) < new Date() && (
                <span style={{ marginLeft: 8, fontSize: 12, background: '#FFE4E4', color: '#7A1E1E', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                  истёк
                </span>
              )}
            </p>
          </div>
        </div>

        {!showRenewForm ? (
          <button
            onClick={() => setShowRenewForm(true)}
            style={{
              padding: '10px 20px', borderRadius: 12, border: '1px solid #EDE8FF',
              background: '#F0EEFF', color: '#7C5CFC', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', minHeight: 44,
            }}
          >
            Продлить доступ
          </button>
        ) : (
          <div style={{ background: '#F9F8FF', borderRadius: 14, padding: 16 }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#3D2B8A' }}>Выбери срок продления</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {([
                { value: 'monthly' as const, label: 'Месяц (+30 дней)' },
                { value: 'halfyear' as const, label: 'Полгода (+180 дней)' },
                { value: 'date' as const, label: 'До определённой даты' },
              ]).map(o => (
                <button
                  key={o.value}
                  onClick={() => setRenewTariff(o.value)}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: '1px solid',
                    borderColor: renewTariff === o.value ? '#7C5CFC' : '#EDE8FF',
                    background: renewTariff === o.value ? '#7C5CFC' : '#fff',
                    color: renewTariff === o.value ? '#fff' : '#7B6FAA',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 40,
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {renewTariff === 'date' ? (
              <div style={{ marginBottom: 14 }}>
                <input
                  type="date"
                  value={renewDate}
                  min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                  max={new Date(Date.now() + 2 * 365 * 86400000).toISOString().slice(0, 10)}
                  onChange={e => setRenewDate(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #EDE8FF',
                    fontSize: 14, color: '#2D1F6E', background: '#fff', outline: 'none',
                    fontFamily: 'var(--font-nunito)', boxSizing: 'border-box',
                  }}
                />
                {renewDate && (
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: '#3D2B8A', fontWeight: 600 }}>
                    Доступ будет продлён до: {new Date(renewDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            ) : (
              <p style={{ margin: '0 0 14px', fontSize: 13, color: '#7B6FAA' }}>
                Срок прибавляется к текущей дате окончания (или считается от сегодня если доступ истёк).
              </p>
            )}
            {renewError && <p style={{ margin: '0 0 10px', fontSize: 13, color: '#C0392B' }}>{renewError}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={renewAccess}
                disabled={renewSaving}
                style={{
                  padding: '10px 20px', borderRadius: 12, background: '#4CAF78', color: '#fff',
                  fontSize: 14, fontWeight: 700, cursor: renewSaving ? 'not-allowed' : 'pointer',
                  border: 'none', minHeight: 44, opacity: renewSaving ? 0.7 : 1,
                }}
              >
                {renewSaving ? 'Продлеваю...' : '✅ Продлить'}
              </button>
              <button
                onClick={() => { setShowRenewForm(false); setRenewError('') }}
                style={{
                  padding: '10px 16px', borderRadius: 12, background: '#fff', color: '#7B6FAA',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  border: '1px solid #EDE8FF', minHeight: 44,
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Role management */}
      <Card title="Роль в клубе">
        {member.role === 'admin' ? (
          <p style={{ fontSize: 14, color: '#7B6FAA', margin: 0 }}>
            👑 Администратор — роль нельзя изменить
          </p>
        ) : member.role === 'curator' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: '#D0F5E8', color: '#1A5C3A' }}>
                🎓 Куратор
              </span>
            </div>
            <button
              onClick={() => changeRole('member')}
              disabled={roleChanging}
              style={{
                padding: '10px 20px', borderRadius: 12, border: '1px solid #FFD0D0',
                background: '#FFF5F5', color: '#C0392B', fontSize: 14, fontWeight: 600,
                cursor: roleChanging ? 'not-allowed' : 'pointer', minHeight: 44,
                opacity: roleChanging ? 0.7 : 1,
              }}
            >
              {roleChanging ? 'Сохраняю...' : '✕ Снять роль куратора'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ margin: '0 0 14px', fontSize: 14, color: '#7B6FAA' }}>
              Обычная участница клуба
            </p>
            <button
              onClick={() => changeRole('curator')}
              disabled={roleChanging}
              style={{
                padding: '10px 20px', borderRadius: 12, border: 'none',
                background: '#4CAF78', color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: roleChanging ? 'not-allowed' : 'pointer', minHeight: 44,
                opacity: roleChanging ? 0.7 : 1,
              }}
            >
              {roleChanging ? 'Сохраняю...' : '🎓 Назначить куратором'}
            </button>
          </div>
        )}
      </Card>

      {/* Admin note */}
      {member.admin_note && (
        <Card title="Заметка администратора">
          <p style={{ margin: 0, fontSize: 14, color: '#3D2B8A', lineHeight: 1.6, background: '#FFF9E6', padding: '12px 14px', borderRadius: 10, border: '1px solid #FFE082' }}>
            📝 {member.admin_note}
          </p>
        </Card>
      )}

      {/* Block / Unblock — only for non-admins */}
      {member.role !== 'admin' && (
        <Card title="Блокировка">
          {member.is_blocked ? (
            <div>
              <div style={{ background: '#F5F5F5', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
                <p style={{ margin: '0 0 6px', fontSize: 13, color: '#444', fontWeight: 600 }}>⛔ Заблокирована</p>
                {member.blocked_at && (
                  <p style={{ margin: '0 0 4px', fontSize: 13, color: '#7B6FAA' }}>
                    Дата: {formatDate(member.blocked_at)}
                  </p>
                )}
                {member.blocked_reason && (
                  <p style={{ margin: 0, fontSize: 13, color: '#7B6FAA' }}>
                    Причина: «{member.blocked_reason}»
                  </p>
                )}
              </div>
              <button
                onClick={unblockMember}
                disabled={blockSaving}
                style={{
                  padding: '10px 20px', borderRadius: 12, background: '#4CAF78', color: '#fff',
                  fontSize: 14, fontWeight: 700, cursor: blockSaving ? 'not-allowed' : 'pointer',
                  border: 'none', minHeight: 44, opacity: blockSaving ? 0.7 : 1,
                }}
              >
                {blockSaving ? 'Разблокирую...' : '✅ Разблокировать'}
              </button>
            </div>
          ) : (
            <div>
              {!showBlockConfirm ? (
                <button
                  onClick={() => setShowBlockConfirm(true)}
                  style={{
                    padding: '10px 20px', borderRadius: 12, border: '1px solid #FFD0D0',
                    background: '#FFF5F5', color: '#C0392B', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', minHeight: 44,
                  }}
                >
                  ⛔ Заблокировать участницу
                </button>
              ) : (
                <div style={{ background: '#FFF5F5', borderRadius: 14, padding: '16px', border: '1px solid #FFD0D0' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#C0392B' }}>
                    ⚠️ Вы уверены?
                  </p>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: '#7B6FAA' }}>
                    Участница потеряет доступ к клубу.
                  </p>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 13, color: '#7B6FAA', display: 'block', marginBottom: 6 }}>
                      Причина (необязательно)
                    </label>
                    <input
                      type="text"
                      value={blockReason}
                      onChange={e => setBlockReason(e.target.value)}
                      placeholder="нарушение правил клуба..."
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #FFD0D0',
                        fontSize: 14, color: '#2D1F6E', background: '#fff', outline: 'none',
                        fontFamily: 'var(--font-nunito)', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={blockMember}
                      disabled={blockSaving}
                      style={{
                        padding: '10px 20px', borderRadius: 12, background: '#C0392B', color: '#fff',
                        fontSize: 14, fontWeight: 700, cursor: blockSaving ? 'not-allowed' : 'pointer',
                        border: 'none', minHeight: 44, opacity: blockSaving ? 0.7 : 1,
                      }}
                    >
                      {blockSaving ? 'Блокирую...' : 'Да, заблокировать'}
                    </button>
                    <button
                      onClick={() => { setShowBlockConfirm(false); setBlockReason('') }}
                      style={{
                        padding: '10px 16px', borderRadius: 12, background: '#fff', color: '#7B6FAA',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        border: '1px solid #EDE8FF', minHeight: 44,
                      }}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Onboarding reset */}
      <Card title="Онбординг-тур">
        <p style={{ margin: '0 0 14px', fontSize: 14, color: '#7B6FAA' }}>
          Сбросить флаг завершения тура — при следующем входе в ЛК тур запустится снова.
        </p>
        <button
          onClick={async () => {
            setResetingTour(true)
            const res = await fetch(`/api/admin/members/${member.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ onboarding_completed: false }),
            })
            setResetingTour(false)
            if (res.ok) showToast('🔄 Онбординг сброшен')
            else showToast('Ошибка сброса')
          }}
          disabled={resetingTour}
          style={{
            padding: '10px 20px', borderRadius: 12, border: '1px solid #EDE8FF',
            background: '#F0EEFF', color: '#7C5CFC', fontSize: 14, fontWeight: 600,
            cursor: resetingTour ? 'not-allowed' : 'pointer', minHeight: 44,
            opacity: resetingTour ? 0.7 : 1,
          }}
        >
          {resetingTour ? 'Сбрасываю...' : '🔄 Сбросить онбординг'}
        </button>
      </Card>

      {/* Write message */}
      <Card title="Сообщения">
        <p style={{ margin: '0 0 14px', fontSize: 14, color: '#7B6FAA' }}>
          Написать участнице в личные сообщения
        </p>
        <Link
          href={`/admin/messages?member_id=${member.id}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 12, background: '#F0EEFF',
            color: '#7C5CFC', fontSize: 14, fontWeight: 600, textDecoration: 'none',
            minHeight: 44,
          }}
        >
          ✉️ Написать участнице
        </Link>
      </Card>

      {/* Payment history */}
      <Card title="История платежей">
        {payments.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: '#7B6FAA' }}>Платежи не найдены</p>
        ) : (
          <>
            {payments.map((p, i) => {
              const d = new Date(p.created_at)
              const dateStr = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
                + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
              const isFirst = i === 0
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 12, padding: '10px 14px', borderRadius: 12, marginBottom: 8,
                    background: isFirst ? '#F0EEFF' : '#F9F8FF',
                    border: `1px solid ${isFirst ? '#DDD5FF' : '#EDE8FF'}`,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {isFirst && (
                        <span style={{ fontSize: 11, background: '#7C5CFC', color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                          первый
                        </span>
                      )}
                      <span style={{ fontSize: 13, color: '#7B6FAA', fontFamily: 'var(--font-nunito)' }}>
                        {dateStr}
                      </span>
                    </div>
                    {p.plan && (
                      <p style={{ margin: '3px 0 0', fontSize: 13, color: '#3D2B8A', fontWeight: 600 }}>
                        {p.plan}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1A5C3A', whiteSpace: 'nowrap' }}>
                    {p.amount != null ? `${Number(p.amount).toLocaleString('ru-RU')} ₽` : '—'}
                  </span>
                </div>
              )
            })}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderRadius: 12, marginTop: 4,
              background: '#D0F5E8', border: '1px solid #9FEBB3',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A5C3A' }}>ИТОГО</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1A5C3A' }}>
                {payments.reduce((sum, p) => sum + (p.amount ? Number(p.amount) : 0), 0).toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </>
        )}
      </Card>

      {/* Delete — только для не-администраторов */}
      {member.role !== 'admin' && (
        <Card title="Удаление участницы">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: '10px 20px', borderRadius: 12, border: '1px solid #FFB0B0',
                background: '#FFF0F0', color: '#900', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', minHeight: 44,
              }}
            >
              🗑 Удалить участницу
            </button>
          ) : (
            <div style={{ background: '#FFF0F0', borderRadius: 14, padding: '16px', border: '1px solid #FFB0B0' }}>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#900' }}>
                ⚠️ Вы уверены?
              </p>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#7B6FAA' }}>
                Это действие необратимо. Будут удалены все данные участницы: дневник, замеры, победы, история платежей и аккаунт.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={deleteMember}
                  disabled={deleting}
                  style={{
                    padding: '10px 20px', borderRadius: 12, background: '#900', color: '#fff',
                    fontSize: 14, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer',
                    border: 'none', minHeight: 44, opacity: deleting ? 0.7 : 1,
                  }}
                >
                  {deleting ? 'Удаляю...' : 'Да, удалить навсегда'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '10px 16px', borderRadius: 12, background: '#fff', color: '#7B6FAA',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    border: '1px solid #EDE8FF', minHeight: 44,
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }`}</style>
    </div>
  )
}
