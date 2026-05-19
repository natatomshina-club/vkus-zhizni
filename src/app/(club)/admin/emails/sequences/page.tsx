'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const EmailBuilder = dynamic(() => import('@/components/admin/EmailBuilder'), {
  ssr: false,
  loading: () => (
    <div style={{ border: '1.5px solid #EDE8FF', borderRadius: 10, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9B8FCC', fontSize: 13, background: '#FAF8FF' }}>
      Загрузка редактора...
    </div>
  ),
})

// ── Types ─────────────────────────────────────────────────────────────
type SequenceEmail = {
  id: string
  series: string
  step: number
  subject: string
  html: string
  delay_days: number
  is_active: boolean
  created_at: string
}

// ── Shared styles ─────────────────────────────────────────────────────
const BTN_PRIMARY: React.CSSProperties = {
  background: 'var(--pur)', color: '#fff', border: 'none', borderRadius: 12,
  padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  fontFamily: 'var(--font-nunito)',
}
const BTN_GHOST: React.CSSProperties = {
  background: '#F0EEFF', color: '#7C5CFC', border: 'none', borderRadius: 12,
  padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  fontFamily: 'var(--font-nunito)',
}
const BTN_DANGER: React.CSSProperties = {
  background: '#FFF0F0', color: '#E53E3E', border: 'none', borderRadius: 10,
  padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  fontFamily: 'var(--font-nunito)',
}
const OVERLAY: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 200, padding: 16,
}
const MODAL_BOX: React.CSSProperties = {
  background: '#fff', borderRadius: 20,
  padding: '28px', width: '100%', maxWidth: 960,
  maxHeight: '94dvh', overflowY: 'auto',
  fontFamily: 'var(--font-nunito)',
}
const LABEL: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700,
  color: '#7B6FAA', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
}
const INPUT: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid #EDE8FF', outline: 'none', fontSize: 14,
  color: '#2D1F6E', background: '#FAF8FF', boxSizing: 'border-box',
  fontFamily: 'var(--font-nunito)',
}

// ── Email Editor Modal ─────────────────────────────────────────────────
function EmailEditorModal({
  email,
  series,
  onClose,
  onSaved,
}: {
  email: SequenceEmail | null
  series: string
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = email !== null
  const [subject, setSubject] = useState(email?.subject ?? '')
  const [html, setHtml] = useState(email?.html ?? '')
  const [delayDays, setDelayDays] = useState(email?.delay_days ?? 1)
  const [isActive, setIsActive] = useState(email?.is_active ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!subject.trim() || !html.trim()) { setError('Заполни тему и текст'); return }
    setLoading(true)
    setError('')
    try {
      if (isEdit) {
        const res = await fetch(`/api/admin/email-sequences/${email.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, html, delay_days: delayDays, is_active: isActive }),
        })
        const data = await res.json() as { error?: string }
        if (!res.ok) { setError(data.error ?? 'Ошибка'); return }
      } else {
        const res = await fetch('/api/admin/email-sequences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ series, subject, html, delay_days: delayDays, is_active: isActive }),
        })
        const data = await res.json() as { error?: string }
        if (!res.ok) { setError(data.error ?? 'Ошибка'); return }
      }
      onSaved()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={OVERLAY}>
      <div style={MODAL_BOX}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 16, fontWeight: 800, color: '#3D2B8A', margin: 0 }}>
            {isEdit ? '✏️ Редактировать письмо' : '+ Новое письмо'}
          </h2>
          <button onClick={onClose} style={{ background: '#F0EEFF', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: '#7C5CFC' }}>✕</button>
        </div>

        <label style={LABEL}>Тема письма</label>
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Тема письма" style={{ ...INPUT, marginBottom: 16 }} />

        <label style={LABEL}>Через сколько дней после предыдущего</label>
        <input
          type="number"
          min={0}
          value={delayDays}
          onChange={e => setDelayDays(Math.max(0, parseInt(e.target.value) || 0))}
          style={{ ...INPUT, width: 120, marginBottom: 16 }}
        />
        <p style={{ fontSize: 12, color: '#9B8FCC', marginTop: -12, marginBottom: 16 }}>
          {delayDays === 0 ? 'Сразу при старте серии' : `Через ${delayDays} ${delayDays === 1 ? 'день' : delayDays < 5 ? 'дня' : 'дней'} после предыдущего`}
        </p>

        <label style={LABEL}>Текст письма</label>
        <div style={{ marginBottom: 16 }}>
          <EmailBuilder value={html} onChange={setHtml} />
        </div>

        {/* Active toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => setIsActive(v => !v)}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: isActive ? '#7C5CFC' : '#DDD5FF',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: isActive ? 22 : 2,
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s',
            }} />
          </button>
          <span style={{ fontSize: 13, color: '#3D2B8A', fontWeight: 600 }}>
            {isActive ? 'Активно — будет отправляться' : 'Неактивно — пропускается'}
          </span>
        </div>

        {error && <p style={{ color: '#E53E3E', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={BTN_GHOST}>Отмена</button>
          <button onClick={handleSave} disabled={loading} style={{ ...BTN_PRIMARY, flex: 1, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Сохраняем...' : isEdit ? 'Сохранить изменения' : 'Создать письмо'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Email List for one series ─────────────────────────────────────────
function SeriesEmailList({ series, seriesLabel }: { series: string; seriesLabel: string }) {
  const [emails, setEmails] = useState<SequenceEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<SequenceEmail | 'new' | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/email-sequences?series=${series}`)
      if (res.ok) {
        const data = await res.json() as { emails: SequenceEmail[] }
        setEmails(data.emails ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [series])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string, subject: string) {
    if (!confirm(`Удалить письмо «${subject}»?`)) return
    const res = await fetch(`/api/admin/email-sequences/${id}`, { method: 'DELETE' })
    if (res.ok) setEmails(prev => prev.filter(e => e.id !== id))
    else {
      const data = await res.json() as { error?: string }
      alert(data.error ?? 'Ошибка удаления')
    }
  }

  async function handleToggleActive(email: SequenceEmail) {
    const res = await fetch(`/api/admin/email-sequences/${email.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !email.is_active }),
    })
    if (res.ok) {
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_active: !e.is_active } : e))
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#7B6FAA', margin: 0 }}>
          {emails.length === 0 ? 'Писем ещё нет' : `${emails.length} ${emails.length === 1 ? 'письмо' : emails.length < 5 ? 'письма' : 'писем'} в серии`}
        </p>
        <button onClick={() => setEditTarget('new')} style={{ ...BTN_PRIMARY, padding: '8px 16px' }}>
          + Добавить письмо
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#9B8FCC' }}>Загрузка...</div>
      ) : emails.length === 0 ? (
        <div style={{
          background: '#FAF8FF', borderRadius: 16, border: '2px dashed #DDD5FF',
          padding: '40px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ fontSize: 14, color: '#7B6FAA', margin: '0 0 16px' }}>Нет писем в серии</p>
          <button onClick={() => setEditTarget('new')} style={BTN_PRIMARY}>+ Добавить первое письмо</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {emails.map((email, idx) => (
            <div
              key={email.id}
              style={{
                background: '#fff', borderRadius: 14,
                border: `1.5px solid ${email.is_active ? '#EDE8FF' : '#F0F0F0'}`,
                padding: '14px 18px',
                opacity: email.is_active ? 1 : 0.65,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                  {/* Step badge */}
                  <div style={{
                    background: email.is_active ? '#F0EEFF' : '#F0F0F0',
                    color: email.is_active ? '#7C5CFC' : '#999',
                    borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0,
                    fontFamily: 'var(--font-unbounded)',
                  }}>
                    {email.step}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#2D1F6E', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {email.subject}
                    </p>
                    <p style={{ fontSize: 12, color: '#9B8FCC', margin: 0 }}>
                      {idx === 0
                        ? 'Первое письмо серии'
                        : email.delay_days === 0
                          ? 'Сразу после предыдущего'
                          : `Через ${email.delay_days} ${email.delay_days === 1 ? 'день' : email.delay_days < 5 ? 'дня' : 'дней'} после предыдущего`
                      }
                      {' · '}
                      <span style={{
                        background: email.is_active ? '#D0F5E8' : '#EBEBEB',
                        color: email.is_active ? '#1A5C3A' : '#666',
                        padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                      }}>
                        {email.is_active ? 'Активно' : 'Неактивно'}
                      </span>
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleToggleActive(email)}
                    title={email.is_active ? 'Деактивировать' : 'Активировать'}
                    style={{ ...BTN_GHOST, padding: '6px 10px', fontSize: 12 }}
                  >
                    {email.is_active ? '⏸' : '▶'}
                  </button>
                  <button
                    onClick={() => setEditTarget(email)}
                    style={{ ...BTN_GHOST, padding: '6px 12px', fontSize: 12 }}
                  >
                    ✏️ Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(email.id, email.subject)}
                    style={{ ...BTN_DANGER, padding: '6px 12px' }}
                  >
                    🗑 Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editTarget !== null && (
        <EmailEditorModal
          email={editTarget === 'new' ? null : editTarget}
          series={series}
          onClose={() => setEditTarget(null)}
          onSaved={load}
        />
      )}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────
function SequencesContent() {
  const searchParams = useSearchParams()
  const source = searchParams.get('source') ?? 'leads'

  const isLeads = source === 'leads'
  const isMembers = source === 'members'
  const isEvergreen = source === 'evergreen'

  const pageTitle = isLeads
    ? 'Серия писем для Лидов с сайта'
    : isMembers
    ? 'Серия писем для Участниц'
    : 'Вечнозелёная серия'

  // Tabs: leads → welcome_leads + evergreen; members → welcome_members; evergreen → evergreen only
  type SeriesTab = 'welcome_leads' | 'evergreen' | 'welcome_members'
  const defaultTab: SeriesTab = isLeads ? 'welcome_leads' : isMembers ? 'welcome_members' : 'evergreen'
  const [activeTab, setActiveTab] = useState<SeriesTab>(defaultTab)

  const tabs: { value: SeriesTab; label: string; desc: string }[] = isLeads
    ? [
        { value: 'welcome_leads', label: '👋 Приветственная', desc: '3–4 письма после подписки' },
        { value: 'evergreen', label: '🌲 Вечнозелёная', desc: 'Автоматически после приветственной' },
      ]
    : isMembers
    ? [
        { value: 'welcome_members', label: '👋 Приветственная', desc: 'Письма для новых участниц клуба' },
      ]
    : [
        { value: 'evergreen', label: '🌲 Вечнозелёная', desc: 'Длинная продающая серия' },
      ]

  return (
    <div style={{ fontFamily: 'var(--font-nunito)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link
          href="/admin/emails"
          style={{ fontSize: 13, color: '#7B6FAA', textDecoration: 'none', padding: '8px 12px', borderRadius: 10, background: '#F0EEFF' }}
        >
          ← Назад
        </Link>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#3D2B8A', margin: 0 }}>
          📧 {pageTitle}
        </h1>
      </div>

      {/* Info block */}
      <div style={{
        background: '#F0EEFF', borderRadius: 14, padding: '14px 18px', marginBottom: 24,
        fontSize: 13, color: '#3D2B8A', lineHeight: 1.7,
      }}>
        {isLeads ? (
          <>
            <strong>Как работает:</strong> при подтверждении email на сайте подписчик попадает в серию <em>welcome_leads</em>.
            После её завершения — автоматически переходит в <em>evergreen</em>.
            Cron запускается ежедневно в 09:00.
          </>
        ) : isMembers ? (
          <>
            <strong>Как работает:</strong> при первом платеже (триал или месяц) участница попадает в серию <em>welcome_members</em>.
            Первое письмо — через 1 час. Cron запускается ежедневно в 09:00.
          </>
        ) : (
          <>
            <strong>Как работает:</strong> длинная серия писем — подписчики попадают в неё после завершения приветственной серии.
            Cron запускается ежедневно в 09:00.
          </>
        )}
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {tabs.map(t => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              style={{
                padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-nunito)',
                background: activeTab === t.value ? 'var(--pur)' : '#F0EEFF',
                color: activeTab === t.value ? '#fff' : '#7C5CFC',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Series label */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: '#9B8FCC', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
          Серия: <code style={{ background: '#F0EEFF', padding: '1px 8px', borderRadius: 6, color: '#7C5CFC' }}>{activeTab}</code>
        </p>
        <p style={{ fontSize: 13, color: '#7B6FAA', margin: 0 }}>
          {tabs.find(t => t.value === activeTab)?.desc}
        </p>
      </div>

      {/* Email list */}
      <SeriesEmailList key={activeTab} series={activeTab} seriesLabel={tabs.find(t => t.value === activeTab)?.label ?? ''} />
    </div>
  )
}

export default function EmailSequencesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: '#9B8FCC', fontFamily: 'var(--font-nunito)' }}>Загрузка...</div>}>
      <SequencesContent />
    </Suspense>
  )
}
