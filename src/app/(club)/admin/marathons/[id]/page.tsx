'use client'

import { useState, useEffect, useCallback, useRef, use } from 'react'
import Link from 'next/link'

type AnnounceFeature = { emoji: string; title: string; description: string }

type Marathon = {
  id: string
  title: string
  description: string | null
  starts_at: string | null
  ends_at: string | null
  duration_days: number
  status: string
  month_label: string | null
  chat_channel_slug: string | null
  ration_pdf_url: string | null
  ration_html: string | null
  shopping_list: string | null
  announce_title: string | null
  announce_features: AnnounceFeature[] | null
  announce_prepare_text: string | null
  emoji: string | null
  next_date: string | null
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  try { return new Date(iso).toISOString().slice(0, 16) } catch { return '' }
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid var(--border)', borderRadius: 10,
  padding: '9px 12px', fontSize: 14, color: 'var(--text)', background: '#FAF8FF', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4,
}
const sectionStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16,
}

export default function AdminMarathonEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [marathon, setMarathon] = useState<Marathon | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [selectedPdfName, setSelectedPdfName] = useState('')
  const [deletingPdf, setDeletingPdf] = useState(false)
  const [confirmDeletePdf, setConfirmDeletePdf] = useState(false)
  const pdfFileRef = useRef<HTMLInputElement>(null)

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    month_label: '',
    emoji: '🔥',
    status: 'planned',
    starts_at: '',
    ends_at: '',
    duration_days: '10',
    chat_channel_slug: '',
    shopping_list: '',
    ration_html: '',
    announce_title: '',
    announce_prepare_text: '',
    next_date: '',
  })
  const [features, setFeatures] = useState<AnnounceFeature[]>([])

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/marathons/${id}`)
    if (!res.ok) { setLoading(false); return }
    const data = await res.json() as { marathon?: Marathon }
    const m = data.marathon ?? null
    if (m) {
      setMarathon(m)
      setForm({
        title: m.title ?? '',
        description: m.description ?? '',
        month_label: m.month_label ?? '',
        emoji: m.emoji ?? '🔥',
        status: m.status ?? 'planned',
        starts_at: toDatetimeLocal(m.starts_at),
        ends_at: toDatetimeLocal(m.ends_at),
        duration_days: String(m.duration_days ?? 10),
        chat_channel_slug: m.chat_channel_slug ?? `marathon-${id}`,
        shopping_list: m.shopping_list ?? '',
        ration_html: m.ration_html ?? '',
        announce_title: m.announce_title ?? '',
        announce_prepare_text: m.announce_prepare_text ?? '',
        next_date: m.next_date ?? '',
      })
      setFeatures(m.announce_features ?? [])
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    setSaving(true)
    setSaveErr('')
    setSaveOk(false)
    const res = await fetch(`/api/admin/marathons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        duration_days: parseInt(form.duration_days) || 10,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        next_date: form.next_date || null,
        announce_features: features.length > 0 ? features : null,
        ration_html: form.ration_html || null,
        shopping_list: form.shopping_list || null,
        announce_prepare_text: form.announce_prepare_text || null,
      }),
    })
    const d = await res.json().catch(() => ({})) as { error?: string }
    setSaving(false)
    if (!res.ok) { setSaveErr(d.error ?? 'Ошибка сохранения'); return }
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 3000)
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedPdfName(file.name)
    setUploadingPdf(true)
    setUploadMsg('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/admin/marathons/${id}/upload`, { method: 'POST', body: fd })
    const d = await res.json().catch(() => ({})) as { url?: string; error?: string }
    setUploadingPdf(false)
    if (!res.ok) { setUploadMsg(`Ошибка: ${d.error ?? 'неизвестная'}`); return }
    setUploadMsg(`✅ PDF загружен`)
    setMarathon(prev => prev ? { ...prev, ration_pdf_url: d.url! } : prev)
  }

  async function handlePdfDelete() {
    setDeletingPdf(true)
    const res = await fetch(`/api/admin/marathons/${id}/upload`, { method: 'DELETE' })
    setDeletingPdf(false)
    setConfirmDeletePdf(false)
    if (!res.ok) { setUploadMsg('Ошибка удаления PDF'); return }
    setMarathon(prev => prev ? { ...prev, ration_pdf_url: null } : prev)
    setUploadMsg('')
    setSelectedPdfName('')
    if (pdfFileRef.current) pdfFileRef.current.value = ''
  }

  function addFeature() {
    setFeatures(f => [...f, { emoji: '✨', title: '', description: '' }])
  }
  function removeFeature(i: number) {
    setFeatures(f => f.filter((_, idx) => idx !== i))
  }
  function updateFeature(i: number, key: keyof AnnounceFeature, val: string) {
    setFeatures(f => f.map((item, idx) => idx === i ? { ...item, [key]: val } : item))
  }

  if (loading) return <div style={{ padding: 32, color: 'var(--muted)', textAlign: 'center' }}>Загружаем…</div>
  if (!marathon) return (
    <div style={{ padding: 32 }}>
      <p style={{ color: '#E53E3E' }}>Марафон не найден</p>
      <Link href="/admin/marathons" style={{ color: 'var(--pur)' }}>← Назад</Link>
    </div>
  )

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link href="/admin/marathons" style={{
          fontSize: 13, color: 'var(--muted)', textDecoration: 'none',
          padding: '8px 12px', borderRadius: 10, background: 'var(--pur-lt)',
        }}>
          ← Назад
        </Link>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 16, fontWeight: 700, color: '#3D2B8A', margin: 0, flex: 1 }}>
          {form.emoji} {form.title || 'Редактирование марафона'}
        </h1>
        <Link href={`/admin/marathons/${id}/days`} style={{
          background: '#FFF3E0', color: '#8B4A00', borderRadius: 10,
          padding: '9px 14px', fontSize: 13, fontWeight: 700, textDecoration: 'none',
        }}>
          📅 Редактор дней
        </Link>
      </div>

      {/* Section 1: Main */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>Основное</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label style={labelStyle}>Название *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="10-дневный марафон" style={inputStyle} />
          </div>
          <div className="sm:col-span-2">
            <label style={labelStyle}>Описание</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2} placeholder="Короткое описание марафона"
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStyle}>Месяц/период</label>
            <input value={form.month_label} onChange={e => setForm(f => ({ ...f, month_label: e.target.value }))}
              placeholder="Апрель 2026" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Эмодзи</label>
            <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
              placeholder="🔥" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Дата начала</label>
            <input type="datetime-local" value={form.starts_at}
              onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Дата окончания</label>
            <input type="datetime-local" value={form.ends_at}
              onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Длительность (дней)</label>
            <input type="number" min={1} max={90} value={form.duration_days}
              onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Статус</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
              <option value="planned">Плановый</option>
              <option value="active">Активный</option>
              <option value="finished">Завершён</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Дата следующего (next_date)</label>
            <input value={form.next_date} onChange={e => setForm(f => ({ ...f, next_date: e.target.value }))}
              placeholder="Например: июнь 2026" style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Section 2: Announce */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>Анонс (для заглушки «скоро»)</div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Заголовок анонса</label>
          <input value={form.announce_title} onChange={e => setForm(f => ({ ...f, announce_title: e.target.value }))}
            placeholder="Марафон «Перезагрузка»" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Что тебя ждёт (фичи)</label>
          {features.map((feat, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
              <input value={feat.emoji} onChange={e => updateFeature(i, 'emoji', e.target.value)}
                style={{ ...inputStyle, width: 56, flexShrink: 0 }} placeholder="🔥" />
              <input value={feat.title} onChange={e => updateFeature(i, 'title', e.target.value)}
                style={{ ...inputStyle, flex: 1 }} placeholder="Заголовок" />
              <input value={feat.description} onChange={e => updateFeature(i, 'description', e.target.value)}
                style={{ ...inputStyle, flex: 2 }} placeholder="Описание" />
              <button onClick={() => removeFeature(i)} style={{
                background: '#FFF0F0', color: '#E53E3E', border: 'none', borderRadius: 8,
                padding: '9px 10px', cursor: 'pointer', fontSize: 14, flexShrink: 0,
              }}>✕</button>
            </div>
          ))}
          <button onClick={addFeature} style={{
            background: 'var(--pur-lt)', color: 'var(--pur)', border: 'none', borderRadius: 8,
            padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            + Добавить пункт
          </button>
        </div>
        <div>
          <label style={labelStyle}>Как подготовиться (текст)</label>
          <textarea value={form.announce_prepare_text}
            onChange={e => setForm(f => ({ ...f, announce_prepare_text: e.target.value }))}
            rows={3} placeholder="Напиши что участницы должны сделать перед стартом…"
            style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
      </div>

      {/* Section 3: Ration & Shopping */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>Рацион и продукты</div>

        {/* PDF Upload */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>PDF рациона</label>
          {marathon.ration_pdf_url && (
            <div style={{ marginBottom: 8 }}>
              {!confirmDeletePdf ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <a href={marathon.ration_pdf_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: 'var(--pur)', fontWeight: 700 }}>
                    📄 Текущий PDF — открыть ↗
                  </a>
                  <button
                    type="button"
                    onClick={() => setConfirmDeletePdf(true)}
                    title="Удалить PDF"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#C0392B', padding: '2px 4px', lineHeight: 1 }}
                  >
                    🗑
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: '#FFF5F5', border: '1px solid #FFD0D0' }}>
                  <span style={{ fontSize: 12, color: '#C0392B', flex: 1 }}>Удалить PDF файл?</span>
                  <button
                    type="button"
                    onClick={handlePdfDelete}
                    disabled={deletingPdf}
                    style={{ padding: '4px 12px', borderRadius: 8, border: 'none', background: '#C0392B', color: '#fff', fontSize: 12, fontWeight: 700, cursor: deletingPdf ? 'not-allowed' : 'pointer', opacity: deletingPdf ? 0.7 : 1 }}
                  >
                    {deletingPdf ? '...' : 'Да'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeletePdf(false)}
                    style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #EDE8FF', background: '#fff', color: '#7B6FAA', fontSize: 12, cursor: 'pointer' }}
                  >
                    Нет
                  </button>
                </div>
              )}
            </div>
          )}
          <input
            ref={pdfFileRef}
            type="file"
            accept=".pdf"
            onChange={handlePdfUpload}
            disabled={uploadingPdf}
            style={{ display: 'none' }}
          />
          {selectedPdfName && !uploadMsg ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: '#F0EEFF', border: '1px solid #DDD5FF' }}>
              <span style={{ fontSize: 13, color: '#3D2B8A', flex: 1, wordBreak: 'break-all' }}>📄 {selectedPdfName}</span>
              <button
                type="button"
                onClick={() => { setSelectedPdfName(''); setUploadMsg(''); if (pdfFileRef.current) pdfFileRef.current.value = '' }}
                style={{ fontSize: 16, color: '#7B6FAA', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0 }}
              >×</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => pdfFileRef.current?.click()}
              disabled={uploadingPdf}
              style={{
                display: 'block', width: '100%', padding: '12px 20px', borderRadius: 12,
                border: '1px dashed #7C5CFC', background: '#F8F6FF', color: '#7C5CFC',
                fontSize: 13, fontWeight: 600, cursor: uploadingPdf ? 'not-allowed' : 'pointer',
                textAlign: 'center', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!uploadingPdf) (e.currentTarget as HTMLButtonElement).style.background = '#EDE8FF' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F8F6FF' }}
            >
              {uploadingPdf ? '⏳ Загружаем…' : '📎 Выбрать PDF файл'}
            </button>
          )}
          {uploadMsg && (
            <div style={{ fontSize: 12, marginTop: 6, color: uploadMsg.startsWith('✅') ? '#2D6A4F' : '#E53E3E' }}>
              {uploadMsg}
            </div>
          )}
        </div>

        {/* HTML ration */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>HTML рациона (аккордеон, необязательно)</label>
          <textarea value={form.ration_html} onChange={e => setForm(f => ({ ...f, ration_html: e.target.value }))}
            rows={5} placeholder="<p>Завтрак: …</p>"
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
        </div>

        {/* Shopping list */}
        <div>
          <label style={labelStyle}>Список продуктов (по одному на строку)</label>
          <textarea value={form.shopping_list} onChange={e => setForm(f => ({ ...f, shopping_list: e.target.value }))}
            rows={6} placeholder="Куриная грудка&#10;Яйца&#10;Творог 5%&#10;Огурцы&#10;Помидоры"
            style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
      </div>

      {/* Section 4: Chat */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>Чат марафона</div>
        <div>
          <label style={labelStyle}>Слаг канала (chat_channel_slug)</label>
          <input value={form.chat_channel_slug}
            onChange={e => setForm(f => ({ ...f, chat_channel_slug: e.target.value }))}
            placeholder={`marathon-${id}`} style={inputStyle} />
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
            Обычно: marathon-{id.slice(0, 8)}…
          </div>
        </div>
      </div>

      {/* Save */}
      {saveErr && (
        <div style={{ background: '#FFF0F0', border: '1px solid #FFB3B3', borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: '#E53E3E', fontSize: 13 }}>
          {saveErr}
        </div>
      )}
      {saveOk && (
        <div style={{ background: '#E8FBF3', border: '1px solid #A8E6CF', borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: '#2D6A4F', fontSize: 13, fontWeight: 700 }}>
          ✅ Сохранено!
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleSave} disabled={saving} style={{
          background: 'var(--pur)', color: '#fff', border: 'none', borderRadius: 12,
          padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', minHeight: 48,
          opacity: saving ? 0.7 : 1,
        }}>
          {saving ? 'Сохраняем…' : '💾 Сохранить'}
        </button>
        <Link href="/admin/marathons" style={{
          background: 'var(--pur-lt)', color: 'var(--pur)', borderRadius: 12,
          padding: '12px 20px', fontSize: 15, fontWeight: 700, textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center',
        }}>
          Отмена
        </Link>
      </div>
    </div>
  )
}
