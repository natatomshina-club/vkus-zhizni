'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const EmailBuilder = dynamic(() => import('@/components/admin/EmailBuilder'), {
  ssr: false,
  loading: () => (
    <div style={{ border: '1.5px solid #EDE8FF', borderRadius: 10, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9B8FCC', fontSize: 13, background: '#FAF8FF' }}>
      Загрузка редактора...
    </div>
  ),
})

type Template = {
  id: string
  name: string
  subject: string
  created_at: string
}

// ── Shared styles ──────────────────────────────────────────────────────
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

// ── Template Editor Modal ──────────────────────────────────────────────
function TemplateEditorModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!name.trim()) { setError('Введи название шаблона'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subject, html }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { setError(data.error ?? 'Ошибка'); return }
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
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 800, color: '#3D2B8A', margin: 0 }}>
            💾 Новый шаблон
          </h2>
          <button onClick={onClose} style={{ background: '#F0EEFF', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: '#7C5CFC' }}>✕</button>
        </div>

        <label style={LABEL}>Название шаблона</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Например: Приветственное письмо"
          style={{ ...INPUT, marginBottom: 14 }}
        />

        <label style={LABEL}>Тема письма</label>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Тема письма"
          style={{ ...INPUT, marginBottom: 14 }}
        />

        <label style={{ ...LABEL, marginBottom: 10 }}>Содержимое письма</label>
        <EmailBuilder value={html} onChange={setHtml} />

        {error && <p style={{ color: '#E53E3E', fontSize: 13, marginTop: 8 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={BTN_GHOST}>Отмена</button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{ ...BTN_PRIMARY, flex: 1, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Сохраняем...' : '💾 Сохранить шаблон'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/email-templates')
      if (res.ok) {
        const data = await res.json() as { templates: Template[] }
        setTemplates(data.templates ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTemplates() }, [loadTemplates])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Удалить шаблон «${name}»?`)) return
    const res = await fetch(`/api/admin/email-templates/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTemplates(prev => prev.filter(t => t.id !== id))
    } else {
      const data = await res.json() as { error?: string }
      alert(data.error ?? 'Ошибка удаления')
    }
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

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
          💾 Шаблоны писем
        </h1>
      </div>
      <p style={{ fontSize: 13, color: '#7B6FAA', margin: '-16px 0 24px' }}>
        Сохранённые шаблоны можно выбрать при создании письма или серии
      </p>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setShowCreate(true)} style={BTN_PRIMARY}>
          + Создать шаблон
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9B8FCC' }}>Загрузка...</div>
      ) : templates.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDE8FF', padding: 40, textAlign: 'center', color: '#9B8FCC' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
          <p style={{ margin: 0 }}>Шаблонов пока нет. Создай первый!</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDE8FF', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#FAF8FF', borderBottom: '1px solid #EDE8FF' }}>
                {['Название', 'Тема письма', 'Дата создания', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#7B6FAA', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map((t, i) => (
                <tr key={t.id} style={{ borderBottom: i < templates.length - 1 ? '1px solid #F5F0FF' : 'none' }}>
                  <td style={{ padding: '10px 16px', color: '#2D1F6E', fontWeight: 600 }}>{t.name}</td>
                  <td style={{ padding: '10px 16px', color: '#7B6FAA', maxWidth: 320 }}>{t.subject || '—'}</td>
                  <td style={{ padding: '10px 16px', color: '#9B8FCC', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {fmt(t.created_at)}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
                      style={BTN_DANGER}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <TemplateEditorModal
          onClose={() => setShowCreate(false)}
          onSaved={loadTemplates}
        />
      )}
    </div>
  )
}
