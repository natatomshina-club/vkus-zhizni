'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { inlineStyles, buildEmailHtml } from '@/lib/email-template'

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false, loading: () => (
  <div style={{ border: '1.5px solid #EDE8FF', borderRadius: 10, minHeight: 180, background: '#FAF8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9B8FCC', fontSize: 13 }}>
    Загрузка редактора...
  </div>
) })

const EmailBuilder = dynamic(() => import('@/components/admin/EmailBuilder'), { ssr: false, loading: () => (
  <div style={{ border: '1.5px solid #EDE8FF', borderRadius: 10, minHeight: 200, background: '#FAF8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9B8FCC', fontSize: 13 }}>
    Загрузка редактора...
  </div>
) })

// ── Types ────────────────────────────────────────────────────────────
type Subscriber = {
  id: string
  email: string
  name: string | null
  source: string | null
  status: string
  converted_to_member: boolean
  subscribed_at: string | null
}

type MemberSegment = { label: string; value: string; count: number; icon: string }

type Tab = 'subscribers' | 'members' | 'leads' | 'history'

type SegMember = {
  id: string
  email: string
  full_name: string | null
  subscription_status: string
  created_at: string
}

type CampaignLog = {
  id: string
  sent_at: string
  subject: string
  segment: string
  recipients_count: number
  sent_by: string | null
}

// ── Helpers ──────────────────────────────────────────────────────────
function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatusBadge({ status, converted }: { status: string; converted: boolean }) {
  if (converted) return (
    <span style={{ background: '#D0F5E8', color: '#1A5C3A', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      В клубе
    </span>
  )
  if (status === 'unsubscribed') return (
    <span style={{ background: '#EBEBEB', color: '#666', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
      Отписалась
    </span>
  )
  return (
    <span style={{ background: '#D0F5E8', color: '#1A5C3A', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
      Активная
    </span>
  )
}

// ── CSV parsing ──────────────────────────────────────────────────────
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length === 0) return { headers: [], rows: [] }

  function splitLine(line: string) {
    const cells: string[] = []
    let cur = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') { inQ = !inQ }
      else if ((c === ',' || c === ';') && !inQ) { cells.push(cur.trim()); cur = '' }
      else cur += c
    }
    cells.push(cur.trim())
    return cells
  }

  const headers = splitLine(lines[0])
  const rows = lines.slice(1).map(l => splitLine(l))
  return { headers, rows }
}

// ── Email Preview Modal ───────────────────────────────────────────────
function PreviewModal({ html, onClose }: { html: string; onClose: () => void }) {
  return (
    <div style={{ ...OVERLAY, zIndex: 300 }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620,
        maxHeight: '92dvh', display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--font-nunito)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #EDE8FF', flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#3D2B8A' }}>👁 Предпросмотр письма</span>
          <button onClick={onClose} style={CLOSE_BTN}>✕</button>
        </div>
        {/* Scrollable preview */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px' }}>
          <div
            style={{ maxWidth: 560, margin: '0 auto', borderRadius: 16, overflow: 'hidden', border: '1px solid #EDE8FF' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Send Announcement Modal ──────────────────────────────────────────
function SendModal({
  segment,
  onClose,
}: {
  segment: MemberSegment
  onClose: () => void
}) {
  const isReturn = segment.value === 'expired_trial' || segment.value === 'expired'
  const actionLabel = isReturn ? '🔁 Вернуть' : '📢 Анонс'

  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sent: number } | null>(null)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Consider empty if no emailbuilder blocks or truly empty
  const isEmpty = !bodyHtml?.trim()

  async function handleSend() {
    if (!subject.trim() || isEmpty) { setError('Заполни тему и текст'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/emails/send-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, bodyHtml, segment: segment.value }),
      })
      const data = await res.json() as { sent?: number; error?: string }
      if (!res.ok) { setError(data.error ?? 'Ошибка'); return }
      setResult({ sent: data.sent ?? 0 })
    } finally {
      setLoading(false)
    }
  }

  const previewHtml = bodyHtml || ''

  return (
    <>
      <div style={OVERLAY}>
        <div style={{ ...MODAL_BOX, maxWidth: 960 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={MODAL_TITLE}>{actionLabel}</h2>
            <button onClick={onClose} style={CLOSE_BTN}>✕</button>
          </div>

          {result ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#1A5C3A', marginBottom: 8 }}>Отправлено!</p>
              <p style={{ fontSize: 14, color: '#7B6FAA' }}>Писем отправлено: <strong>{result.sent}</strong></p>
              <button onClick={onClose} style={{ ...BTN_PRIMARY, marginTop: 20 }}>Закрыть</button>
            </div>
          ) : (
            <>
              <div style={{ background: '#F0EEFF', borderRadius: 12, padding: '10px 16px', marginBottom: 18, fontSize: 13, color: '#3D2B8A' }}>
                {segment.icon} <strong>{segment.label}</strong> — {segment.count} получательниц
              </div>

              <label style={LABEL}>Тема письма</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Тема письма"
                style={INPUT}
              />

              <label style={{ ...LABEL, marginTop: 14 }}>Текст письма</label>
              <EmailBuilder value={bodyHtml} onChange={setBodyHtml} />

              {error && <p style={{ color: '#E53E3E', fontSize: 13, marginTop: 8 }}>{error}</p>}

              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button onClick={onClose} style={BTN_GHOST}>Отмена</button>
                <button
                  onClick={() => setShowPreview(true)}
                  disabled={isEmpty}
                  style={{ ...BTN_GHOST, opacity: isEmpty ? 0.4 : 1, cursor: isEmpty ? 'not-allowed' : 'pointer' }}
                >
                  👁 Предпросмотр
                </button>
                <button onClick={handleSend} disabled={loading} style={{ ...BTN_PRIMARY, flex: 1, opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'Отправляем...' : `Отправить ${segment.count} письм${plural(segment.count)}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showPreview && <PreviewModal html={previewHtml} onClose={() => setShowPreview(false)} />}
    </>
  )
}

const SEGMENT_LABELS: Record<string, string> = {
  trial: 'Триал',
  monthly: 'Месяц',
  halfyear: 'Полгода',
  expired_trial: 'Бывшие триалки',
  expired: 'Истёкшие',
  cold: 'Холодные подписчики',
  getcourse_club: 'Клубные (Геткурс)',
  leads: 'Лиды с сайта',
  custom: 'Список адресов',
}

function segmentLabel(s: string) {
  return SEGMENT_LABELS[s] ?? s
}

function plural(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'о'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'а'
  return ''
}

// ── Import CSV Modal ─────────────────────────────────────────────────
type PreviewRow = { email: string; name: string | null; subscribed_at: string | null }
type ImportResult = { imported: number; skipped_members: number; skipped_duplicates: number; skipped_invalid: number; errors: string[] }

function ImportModal({ onClose, onSuccess, source = 'getcourse_import' }: { onClose: () => void; onSuccess: () => void; source?: string }) {
  const [step, setStep] = useState<'upload' | 'map' | 'confirm'>('upload')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [total, setTotal] = useState(0)
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const dropRef = useRef<HTMLDivElement>(null)

  async function handleFile(file: File) {
    setCsvFile(file)
    setError('')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('mode', 'preview')
      fd.append('source', source)
      const res = await fetch('/api/admin/emails/import-csv', { method: 'POST', body: fd })
      const data = await res.json() as { total?: number; preview?: PreviewRow[]; error?: string }
      if (!res.ok) { setError(data.error ?? 'Ошибка при анализе файла'); return }
      setTotal(data.total ?? 0)
      setPreviewRows(data.preview ?? [])
      setStep('map')
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) handleFile(file)
  }

  async function handleImport() {
    if (!csvFile) return
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', csvFile)
      fd.append('mode', 'import')
      fd.append('source', source)
      const res = await fetch('/api/admin/emails/import-csv', { method: 'POST', body: fd })
      const data = await res.json() as ImportResult & { error?: string }
      if (!res.ok) { setError(data.error ?? 'Ошибка импорта'); return }
      setResult(data)
    } finally {
      setLoading(false)
    }
  }

  function fmtDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div style={OVERLAY}>
      <div style={{ ...MODAL_BOX, maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={MODAL_TITLE}>📥 Импорт CSV</h2>
          <button onClick={onClose} style={CLOSE_BTN}>✕</button>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['upload', 'map', 'confirm'] as const).map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 4,
              background: ['upload', 'map', 'confirm'].indexOf(step) >= i ? '#7C5CFC' : '#EDE8FF',
            }} />
          ))}
        </div>

        {result ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1A5C3A', marginBottom: 8 }}>Импорт завершён!</p>
            <p style={{ fontSize: 14, color: '#7B6FAA', lineHeight: 1.9 }}>
              Импортировано: <strong>{result.imported}</strong><br />
              Пропущено (в клубе): <strong>{result.skipped_members}</strong><br />
              Пропущено (дубли): <strong>{result.skipped_duplicates}</strong><br />
              Невалидных email: <strong>{result.skipped_invalid}</strong>
            </p>
            {result.errors.length > 0 && (
              <p style={{ fontSize: 12, color: '#E53E3E', marginTop: 8 }}>
                Ошибки: {result.errors.join('; ')}
              </p>
            )}
            <button onClick={() => { onSuccess(); onClose() }} style={{ ...BTN_PRIMARY, marginTop: 20 }}>Готово</button>
          </div>

        ) : step === 'upload' ? (
          <>
            <div
              ref={dropRef}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('csv-file-input')?.click()}
              style={{
                border: '2px dashed #DDD5FF', borderRadius: 16,
                padding: '48px 24px', textAlign: 'center',
                cursor: loading ? 'default' : 'pointer', background: '#FAF8FF',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>{loading ? '⏳' : '📄'}</div>
              <p style={{ fontSize: 14, color: '#3D2B8A', fontWeight: 600, marginBottom: 4 }}>
                {loading ? 'Анализируем файл...' : 'Перетащи CSV или нажми для выбора'}
              </p>
              <p style={{ fontSize: 12, color: '#9B8FCC' }}>CSV из Геткурса (автодетект разделителя , или ;)</p>
            </div>
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {error && <p style={{ color: '#E53E3E', fontSize: 13, marginTop: 10 }}>{error}</p>}
          </>

        ) : step === 'map' ? (
          <>
            <p style={{ fontSize: 13, color: '#7B6FAA', marginBottom: 16 }}>
              Найдено адресов: <strong>{total}</strong>. Превью первых строк:
            </p>

            <div style={{ background: '#F0EEFF', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: 0 }}>
                {['Email', 'Имя', 'Дата регистрации'].map(h => (
                  <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#7B6FAA', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #DDD5FF' }}>
                    {h}
                  </div>
                ))}
                {previewRows.map((row, i) => (
                  <>
                    <div key={`e${i}`} style={{ fontSize: 12, color: '#3D2B8A', padding: '7px 12px', borderBottom: i < previewRows.length - 1 ? '1px solid #EDE8FF' : 'none', wordBreak: 'break-all' }}>{row.email}</div>
                    <div key={`n${i}`} style={{ fontSize: 12, color: '#3D2B8A', padding: '7px 12px', borderBottom: i < previewRows.length - 1 ? '1px solid #EDE8FF' : 'none' }}>{row.name ?? '—'}</div>
                    <div key={`d${i}`} style={{ fontSize: 12, color: '#3D2B8A', padding: '7px 12px', borderBottom: i < previewRows.length - 1 ? '1px solid #EDE8FF' : 'none' }}>{fmtDate(row.subscribed_at)}</div>
                  </>
                ))}
              </div>
            </div>

            {error && <p style={{ color: '#E53E3E', fontSize: 13, marginBottom: 10 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('upload')} style={BTN_GHOST}>← Назад</button>
              <button onClick={() => setStep('confirm')} style={{ ...BTN_PRIMARY, flex: 1 }}>
                Продолжить →
              </button>
            </div>
          </>

        ) : (
          <>
            <div style={{ background: '#F0EEFF', borderRadius: 14, padding: '16px 20px', marginBottom: 18 }}>
              <p style={{ fontSize: 14, color: '#3D2B8A', fontWeight: 600, marginBottom: 8 }}>Готово к импорту</p>
              <p style={{ fontSize: 13, color: '#7B6FAA', lineHeight: 1.9 }}>
                Файл: <strong>{csvFile?.name}</strong><br />
                Всего адресов: <strong>{total}</strong><br />
                source: <strong>{source}</strong>
              </p>
            </div>

            {error && <p style={{ color: '#E53E3E', fontSize: 13, marginBottom: 10 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('map')} style={BTN_GHOST}>← Назад</button>
              <button onClick={handleImport} disabled={loading || total === 0} style={{ ...BTN_PRIMARY, flex: 1, opacity: loading || total === 0 ? 0.6 : 1 }}>
                {loading ? 'Импортируем...' : `Импортировать ${total}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Send Test Modal ───────────────────────────────────────────────────
function SendTestModal({ onClose }: { onClose: () => void }) {
  const [emailsRaw, setEmailsRaw] = useState('')
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number; errors: string[] } | null>(null)
  const [error, setError] = useState('')

  async function handleSend() {
    const emails = emailsRaw.split(/[\n,]+/).map(e => e.trim()).filter(Boolean)
    if (emails.length === 0) { setError('Введи хотя бы один email'); return }
    if (!subject.trim()) { setError('Заполни тему письма'); return }
    if (!html.trim()) { setError('Заполни текст письма'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/emails/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, subject, html }),
      })
      const data = await res.json() as { sent?: number; failed?: number; errors?: string[]; error?: string }
      if (!res.ok) { setError(data.error ?? 'Ошибка'); return }
      setResult({ sent: data.sent ?? 0, failed: data.failed ?? 0, errors: data.errors ?? [] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={OVERLAY}>
      <div style={{ ...MODAL_BOX, maxWidth: 540 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={MODAL_TITLE}>🧪 Тестовая отправка</h2>
          <button onClick={onClose} style={CLOSE_BTN}>✕</button>
        </div>

        {result ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{result.failed === 0 ? '✅' : '⚠️'}</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1A5C3A', marginBottom: 8 }}>
              {result.failed === 0 ? 'Отправлено!' : 'Отправлено с ошибками'}
            </p>
            <p style={{ fontSize: 14, color: '#7B6FAA', lineHeight: 1.9 }}>
              Доставлено: <strong>{result.sent}</strong><br />
              {result.failed > 0 && <>Ошибок: <strong>{result.failed}</strong></>}
            </p>
            {result.errors.length > 0 && (
              <p style={{ fontSize: 12, color: '#E53E3E', marginTop: 8 }}>
                Не доставлено: {result.errors.join(', ')}
              </p>
            )}
            <button onClick={onClose} style={{ ...BTN_PRIMARY, marginTop: 20 }}>Закрыть</button>
          </div>
        ) : (
          <>
            <label style={LABEL}>Email адреса (каждый с новой строки или через запятую)</label>
            <textarea
              value={emailsRaw}
              onChange={e => setEmailsRaw(e.target.value)}
              placeholder={'test@example.com\nuser@mail.ru'}
              rows={4}
              style={{ ...INPUT, resize: 'vertical' }}
            />

            <label style={{ ...LABEL, marginTop: 14 }}>Тема письма</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Тема письма"
              style={INPUT}
            />

            <label style={{ ...LABEL, marginTop: 14 }}>Текст письма</label>
            <RichEditor value={html} onChange={setHtml} />

            {error && <p style={{ color: '#E53E3E', fontSize: 13, marginTop: 8 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={onClose} style={BTN_GHOST}>Отмена</button>
              <button onClick={handleSend} disabled={loading} style={{ ...BTN_PRIMARY, flex: 1, opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Отправляем...' : '📤 Отправить'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Shared styles ────────────────────────────────────────────────────
const OVERLAY: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 200, padding: 16,
}
const MODAL_BOX: React.CSSProperties = {
  background: '#fff', borderRadius: 20,
  padding: '28px 28px', width: '100%',
  maxHeight: '90dvh', overflowY: 'auto',
  fontFamily: 'var(--font-nunito)',
}
const MODAL_TITLE: React.CSSProperties = {
  fontSize: 18, fontWeight: 800, color: '#3D2B8A', margin: 0,
  fontFamily: 'var(--font-unbounded)',
}
const CLOSE_BTN: React.CSSProperties = {
  background: '#F0EEFF', border: 'none', borderRadius: 8,
  width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: '#7C5CFC',
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
const BTN_PRIMARY: React.CSSProperties = {
  background: 'var(--pur)', color: '#fff', border: 'none', borderRadius: 12,
  padding: '12px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  fontFamily: 'var(--font-nunito)',
}
const BTN_GHOST: React.CSSProperties = {
  background: '#F0EEFF', color: '#7C5CFC', border: 'none', borderRadius: 12,
  padding: '12px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  fontFamily: 'var(--font-nunito)',
}

type SubStats = { total: number; cold: number; clubCount: number; converted: number; unsubscribed: number; leadsCount: number }
type SubsResponse = {
  subscribers: Subscriber[]
  total: number
  page: number
  totalPages: number
  stats: SubStats
}

// ── Main Page ────────────────────────────────────────────────────────
export default function AdminEmailsPage() {
  const [tab, setTab] = useState<Tab>('subscribers')
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [stats, setStats] = useState<SubStats>({ total: 0, cold: 0, clubCount: 0, converted: 0, unsubscribed: 0, leadsCount: 0 })
  const [leads, setLeads] = useState<Subscriber[]>([])
  const [leadsPage, setLeadsPage] = useState(1)
  const [leadsTotalPages, setLeadsTotalPages] = useState(1)
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [leadsSearch, setLeadsSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [segments, setSegments] = useState<MemberSegment[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)
  const [loadingSegs, setLoadingSegs] = useState(true)
  const [subsError, setSubsError] = useState('')
  const [search, setSearch] = useState('')
  const [sendTarget, setSendTarget] = useState<MemberSegment | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [showClubImport, setShowClubImport] = useState(false)
  const [showSendTest, setShowSendTest] = useState(false)
  const [history, setHistory] = useState<CampaignLog[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Accordion state for segment member lists
  const [expandedSegs, setExpandedSegs] = useState<Set<string>>(new Set())
  const [segMembers, setSegMembers] = useState<Record<string, SegMember[]>>({})
  const [loadingSegMembers, setLoadingSegMembers] = useState<Record<string, boolean>>({})
  const [segSearch, setSegSearch] = useState<Record<string, string>>({})

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/admin/emails/history')
      if (res.ok) {
        const data = await res.json() as { logs: CampaignLog[] }
        setHistory(data.logs ?? [])
      }
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  const loadSubscribers = useCallback(async (p: number, q: string) => {
    setLoadingSubs(true)
    setSubsError('')
    try {
      const params = new URLSearchParams({ page: String(p), limit: '50' })
      if (q) params.set('search', q)
      const res = await fetch(`/api/admin/emails/subscribers?${params}`)
      const data = await res.json() as SubsResponse & { error?: string }
      if (!res.ok) { setSubsError(data.error ?? `Ошибка ${res.status}`); return }
      setSubscribers(data.subscribers ?? [])
      setPage(data.page ?? p)
      setTotalPages(data.totalPages ?? 1)
      if (data.stats) setStats(data.stats)
    } catch (e) {
      setSubsError(String(e))
    } finally {
      setLoadingSubs(false)
    }
  }, [])

  const loadSegments = useCallback(async () => {
    setLoadingSegs(true)
    try {
      const res = await fetch('/api/admin/emails/segments')
      if (res.ok) {
        const data = await res.json() as { segments: MemberSegment[] }
        setSegments(data.segments ?? [])
      }
    } finally {
      setLoadingSegs(false)
    }
  }, [])

  const loadLeads = useCallback(async (p: number, q: string) => {
    setLoadingLeads(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '50', leadsOnly: '1' })
      if (q) params.set('search', q)
      const res = await fetch(`/api/admin/emails/subscribers?${params}`)
      const data = await res.json() as SubsResponse & { error?: string }
      if (!res.ok) return
      setLeads(data.subscribers ?? [])
      setLeadsPage(data.page ?? p)
      setLeadsTotalPages(data.totalPages ?? 1)
    } finally {
      setLoadingLeads(false)
    }
  }, [])

  async function loadSegmentMembers(segValue: string, search = '') {
    setLoadingSegMembers(prev => ({ ...prev, [segValue]: true }))
    try {
      const params = new URLSearchParams({ segment: segValue, limit: '200' })
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/members?${params}`)
      if (res.ok) {
        const data = await res.json() as { members: SegMember[] }
        setSegMembers(prev => ({ ...prev, [segValue]: data.members ?? [] }))
      }
    } finally {
      setLoadingSegMembers(prev => ({ ...prev, [segValue]: false }))
    }
  }

  function toggleSegment(segValue: string) {
    setExpandedSegs(prev => {
      const next = new Set(prev)
      if (next.has(segValue)) {
        next.delete(segValue)
      } else {
        next.add(segValue)
        if (!segMembers[segValue]) {
          loadSegmentMembers(segValue, segSearch[segValue] ?? '')
        }
      }
      return next
    })
  }

  function handleSegSearch(segValue: string, q: string) {
    setSegSearch(prev => ({ ...prev, [segValue]: q }))
    loadSegmentMembers(segValue, q)
  }

  const searchMounted = useRef(false)

  useEffect(() => {
    loadSubscribers(1, '')
    loadSegments()
  }, [loadSubscribers, loadSegments])

  // Debounced search (skip first mount — initial load handled above)
  useEffect(() => {
    if (!searchMounted.current) { searchMounted.current = true; return }
    const t = setTimeout(() => loadSubscribers(1, search), 350)
    return () => clearTimeout(t)
  }, [search, loadSubscribers])

  async function handleDelete(email: string) {
    if (!confirm(`Удалить ${email} из базы? Это действие необратимо.`)) return
    const res = await fetch(`/api/admin/emails/subscribers?email=${encodeURIComponent(email)}`, { method: 'DELETE' })
    if (res.ok) {
      setSubscribers(prev => prev.filter(s => s.email !== email))
      setStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }))
    } else {
      const data = await res.json() as { error?: string }
      alert(data.error ?? 'Ошибка удаления')
    }
  }

  function goToPage(p: number) {
    loadSubscribers(p, search)
  }

  // Load leads when switching to leads tab
  useEffect(() => {
    if (tab === 'leads') loadLeads(1, leadsSearch)
    if (tab === 'history') loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const { total, cold, clubCount, converted, unsubscribed, leadsCount } = stats
  const filtered = subscribers

  return (
    <div style={{ fontFamily: 'var(--font-nunito)' }}>
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
          📧 Email-рассылки
        </h1>
      </div>
      <p style={{ fontSize: 13, color: '#7B6FAA', margin: '-16px 0 24px' }}>
        Управление подписчиками и рассылками клуба
      </p>

      {/* Series navigation block */}
      <div style={{
        background: '#F8F5FF', border: '1px solid #EDE8FF', borderRadius: 16,
        padding: '16px 20px', marginBottom: 24,
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#3D2B8A', marginRight: 4 }}>📧 Серии писем:</span>
        <Link href="/admin/emails/sequences?source=members" style={{ ...BTN_GHOST, padding: '8px 14px', fontSize: 12, textDecoration: 'none', display: 'inline-block' }}>
          👋 Для участниц
        </Link>
        <Link href="/admin/emails/sequences?source=leads" style={{ ...BTN_GHOST, padding: '8px 14px', fontSize: 12, textDecoration: 'none', display: 'inline-block' }}>
          🌱 Для лидов
        </Link>
        <Link href="/admin/emails/sequences?source=evergreen" style={{ ...BTN_GHOST, padding: '8px 14px', fontSize: 12, textDecoration: 'none', display: 'inline-block' }}>
          🌲 Вечнозелёная
        </Link>
        <Link href="/admin/emails/templates" style={{ ...BTN_GHOST, padding: '8px 14px', fontSize: 12, textDecoration: 'none', display: 'inline-block', marginLeft: 'auto' }}>
          💾 Шаблоны
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {([
          { value: 'subscribers' as Tab, label: '👥 Подписчики' },
          { value: 'members' as Tab, label: '🏠 Участницы клуба' },
          { value: 'leads' as Tab, label: '🌱 Лиды с сайта' },
          { value: 'history' as Tab, label: '📋 История' },
        ]).map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            style={{
              padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-nunito)',
              background: tab === t.value ? 'var(--pur)' : '#F0EEFF',
              color: tab === t.value ? '#fff' : '#7C5CFC',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Subscribers ── */}
      {tab === 'subscribers' && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Всего', value: total, bg: '#F0EEFF', color: '#7C5CFC' },
              { label: 'Холодные', value: cold, bg: '#D0F5E8', color: '#1A5C3A' },
              { label: 'В клубе', value: converted, bg: '#FFF3C0', color: '#5C4200' },
              { label: 'Отписались', value: unsubscribed, bg: '#EBEBEB', color: '#555' },
              { label: 'Лиды с сайта', value: leadsCount, bg: '#E8F5E8', color: '#2D7A3A' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-unbounded)', fontSize: 24, fontWeight: 800, color: s.color, margin: '0 0 2px' }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 11, color: s.color, opacity: 0.75, margin: 0, fontWeight: 600 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Клубные (Геткурс) segment card */}
          <div style={{
            background: '#fff', borderRadius: 16, border: '1px solid #EDE8FF',
            padding: '16px 20px', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#2D1F6E', margin: '0 0 2px' }}>🏠 Клубные (Геткурс)</p>
              <p style={{ fontSize: 13, color: '#9B8FCC', margin: 0 }}>{clubCount} активных подписчиков</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowClubImport(true)}
                style={{ ...BTN_GHOST, padding: '8px 14px', fontSize: 12 }}
              >
                📥 Импорт CSV
              </button>
              <button
                onClick={() => setSendTarget({ value: 'getcourse_club', label: 'Клубные (Геткурс)', count: clubCount, icon: '🏠' })}
                disabled={clubCount === 0}
                style={{ ...BTN_PRIMARY, padding: '8px 14px', fontSize: 12, opacity: clubCount === 0 ? 0.4 : 1, cursor: clubCount === 0 ? 'not-allowed' : 'pointer' }}
              >
                📢 Письмо
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowImport(true)}
              style={{ ...BTN_PRIMARY, padding: '10px 18px' }}
            >
              📥 Импорт CSV
            </button>
            {cold > 0 && (
              <button
                onClick={() => setSendTarget({
                  value: 'cold',
                  label: 'Холодные подписчики',
                  count: cold,
                  icon: '👥',
                })}
                style={{ ...BTN_GHOST, padding: '10px 18px' }}
              >
                📢 Разослать анонс ({cold})
              </button>
            )}
            <button
              onClick={() => setShowSendTest(true)}
              style={{ ...BTN_GHOST, padding: '10px 18px', background: '#D0F5E8', color: '#1A5C3A' }}
            >
              🧪 Тестовая отправка
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Поиск по email или имени..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12, marginBottom: 12,
              border: '1.5px solid #EDE8FF', outline: 'none', fontSize: 13,
              color: '#2D1F6E', background: '#FAF8FF', boxSizing: 'border-box',
              fontFamily: 'var(--font-nunito)',
            }}
          />

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDE8FF', overflow: 'hidden' }}>
            {loadingSubs ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#9B8FCC' }}>Загрузка...</div>
            ) : subsError ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#C0392B', fontSize: 13 }}>
                ⚠️ Ошибка загрузки: {subsError}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#9B8FCC' }}>
                {search ? 'Ничего не найдено' : 'Подписчиков пока нет. Импортируй CSV из Геткурса.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#FAF8FF', borderBottom: '1px solid #EDE8FF' }}>
                    {['Email', 'Имя', 'Источник', 'Дата', 'Статус', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#7B6FAA', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F5F0FF' : 'none' }}>
                      <td style={{ padding: '10px 14px', color: '#2D1F6E', fontWeight: 600 }}>{s.email}</td>
                      <td style={{ padding: '10px 14px', color: '#7B6FAA' }}>{s.name ?? '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#9B8FCC', fontSize: 12 }}>
                        {s.source === 'getcourse_import' ? 'Геткурс (рассылка)' : s.source === 'getcourse_club' ? 'Геткурс (клуб)' : s.source ?? '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#9B8FCC', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {s.subscribed_at ? fmt(s.subscribed_at) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <StatusBadge status={s.status} converted={s.converted_to_member} />
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDelete(s.email)}
                          title="Удалить"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, opacity: 0.45, lineHeight: 1 }}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || loadingSubs}
                style={{ ...BTN_GHOST, padding: '8px 16px', fontSize: 13, opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
              >
                ← Назад
              </button>
              <span style={{ fontSize: 13, color: '#7B6FAA', fontWeight: 600 }}>
                Страница {page} из {totalPages}
              </span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || loadingSubs}
                style={{ ...BTN_GHOST, padding: '8px 16px', fontSize: 13, opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
              >
                Вперёд →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── TAB: Members ── */}
      {tab === 'members' && (
        <>
          <p style={{ fontSize: 13, color: '#7B6FAA', marginBottom: 20 }}>
            Выбери сегмент и отправь письмо участницам клуба
          </p>

          {loadingSegs ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#9B8FCC' }}>Загрузка...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {segments.map(seg => {
                const isExpanded = expandedSegs.has(seg.value)
                const members = segMembers[seg.value] ?? []
                const isLoading = loadingSegMembers[seg.value] ?? false
                const search = segSearch[seg.value] ?? ''
                const filtered = search
                  ? members.filter(m =>
                      m.email.toLowerCase().includes(search.toLowerCase()) ||
                      (m.full_name ?? '').toLowerCase().includes(search.toLowerCase())
                    )
                  : members

                return (
                  <div
                    key={seg.value}
                    style={{
                      background: '#fff', borderRadius: 16, border: '1px solid #EDE8FF',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Card header — clickable to toggle */}
                    <div
                      onClick={() => toggleSegment(seg.value)}
                      style={{
                        padding: '16px 20px', display: 'flex', alignItems: 'flex-start',
                        justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                        cursor: 'pointer', userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, color: '#C0B4E8', transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 700, color: '#2D1F6E', margin: '0 0 2px' }}>
                            {seg.icon} {seg.label}
                          </p>
                          <p style={{ fontSize: 13, color: '#9B8FCC', margin: 0 }}>
                            {seg.count} получательниц
                          </p>
                        </div>
                      </div>
                      <div
                        style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
                        onClick={e => e.stopPropagation()}
                      >
                        {seg.value !== 'cancelled' && (
                          <button
                            onClick={() => setSendTarget(seg)}
                            disabled={seg.count === 0}
                            style={{
                              ...(seg.value === 'expired_trial' || seg.value === 'expired' ? BTN_GHOST : BTN_PRIMARY),
                              opacity: seg.count === 0 ? 0.4 : 1,
                              cursor: seg.count === 0 ? 'not-allowed' : 'pointer',
                            }}
                          >
                            📢 Письмо
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Accordion body */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #EDE8FF' }}>
                        <div style={{ padding: '12px 16px' }}>
                          <input
                            type="text"
                            placeholder="Поиск по email или имени..."
                            value={search}
                            onChange={e => handleSegSearch(seg.value, e.target.value)}
                            onClick={e => e.stopPropagation()}
                            style={{
                              width: '100%', padding: '8px 12px', borderRadius: 10,
                              border: '1.5px solid #EDE8FF', outline: 'none', fontSize: 13,
                              color: '#2D1F6E', background: '#FAF8FF', boxSizing: 'border-box',
                              fontFamily: 'var(--font-nunito)',
                            }}
                          />
                        </div>

                        {isLoading ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#9B8FCC', fontSize: 13 }}>Загрузка...</div>
                        ) : filtered.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#9B8FCC', fontSize: 13 }}>
                            {search ? 'Ничего не найдено' : 'Нет участниц в этом сегменте'}
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead>
                                <tr style={{ background: '#FAF8FF' }}>
                                  {['Email', 'Имя', 'Дата вступления', 'Статус'].map(h => (
                                    <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 700, color: '#7B6FAA', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {filtered.map((m, i) => (
                                  <tr key={m.id} style={{ borderTop: '1px solid #F5F0FF' }}>
                                    <td style={{ padding: '8px 16px', color: '#2D1F6E', fontWeight: 600 }}>{m.email}</td>
                                    <td style={{ padding: '8px 16px', color: '#7B6FAA' }}>{m.full_name ?? '—'}</td>
                                    <td style={{ padding: '8px 16px', color: '#9B8FCC', fontSize: 12, whiteSpace: 'nowrap' }}>
                                      {m.created_at ? fmt(m.created_at) : '—'}
                                    </td>
                                    <td style={{ padding: '8px 16px' }}>
                                      <span style={{
                                        background: m.subscription_status === 'active' ? '#D0F5E8' : m.subscription_status === 'trial' ? '#E8F5E8' : '#EBEBEB',
                                        color: m.subscription_status === 'active' ? '#1A5C3A' : m.subscription_status === 'trial' ? '#2D7A3A' : '#555',
                                        padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                                      }}>
                                        {m.subscription_status === 'active' ? 'Активная' : m.subscription_status === 'trial' ? 'Триал' : m.subscription_status === 'expired' ? 'Истекла' : m.subscription_status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── TAB: Leads ── */}
      {tab === 'leads' && (
        <>
          <p style={{ fontSize: 13, color: '#7B6FAA', marginBottom: 16 }}>
            Подписчики с публичного сайта — бесплатный курс, марафон, блог
          </p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {leadsCount > 0 && (
              <button
                onClick={() => setSendTarget({ value: 'leads', label: 'Лиды с сайта', count: leadsCount, icon: '🌱' })}
                style={{ ...BTN_GHOST, padding: '10px 18px' }}
              >
                📢 Разослать ({leadsCount})
              </button>
            )}
            <Link
              href="/admin/emails/sequences?source=leads"
              style={{ ...BTN_GHOST, padding: '10px 18px', textDecoration: 'none', display: 'inline-block' }}
            >
              📧 Серия писем
            </Link>
          </div>
          <input
            type="text"
            placeholder="Поиск по email или имени..."
            value={leadsSearch}
            onChange={e => { setLeadsSearch(e.target.value); loadLeads(1, e.target.value) }}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12, marginBottom: 12,
              border: '1.5px solid #EDE8FF', outline: 'none', fontSize: 13,
              color: '#2D1F6E', background: '#FAF8FF', boxSizing: 'border-box',
              fontFamily: 'var(--font-nunito)',
            }}
          />
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDE8FF', overflow: 'hidden' }}>
            {loadingLeads ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#9B8FCC' }}>Загрузка...</div>
            ) : leads.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#9B8FCC' }}>Лидов пока нет</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#FAF8FF', borderBottom: '1px solid #EDE8FF' }}>
                      {['Email', 'Имя', 'Источник', 'Дата', 'Конвертирован', ''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#7B6FAA', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((s, i) => (
                      <tr key={s.id} style={{ borderBottom: i < leads.length - 1 ? '1px solid #F5F0FF' : 'none' }}>
                        <td style={{ padding: '10px 14px', color: '#2D1F6E', fontWeight: 600 }}>{s.email}</td>
                        <td style={{ padding: '10px 14px', color: '#7B6FAA' }}>{s.name ?? '—'}</td>
                        <td style={{ padding: '10px 14px', color: '#9B8FCC', fontSize: 12 }}>
                          {s.source === 'website_free' ? '🎁 Бесплатный курс'
                            : s.source === 'marathon' ? '🏃 Марафон'
                            : s.source === 'blog' ? '📝 Блог'
                            : s.source ?? '—'}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#9B8FCC', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {s.subscribed_at ? fmt(s.subscribed_at) : '—'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {s.converted_to_member
                            ? <span style={{ background: '#D0F5E8', color: '#1A5C3A', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>В клубе</span>
                            : <span style={{ background: '#EBEBEB', color: '#555', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>Нет</span>
                          }
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDelete(s.email)}
                            title="Удалить"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, opacity: 0.45 }}
                          >🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {leadsTotalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <button onClick={() => { setLeadsPage(p => p - 1); loadLeads(leadsPage - 1, leadsSearch) }} disabled={leadsPage <= 1 || loadingLeads} style={{ ...BTN_GHOST, padding: '6px 14px', opacity: leadsPage <= 1 ? 0.4 : 1 }}>← Пред</button>
              <span style={{ fontSize: 13, color: '#7B6FAA' }}>{leadsPage} / {leadsTotalPages}</span>
              <button onClick={() => { setLeadsPage(p => p + 1); loadLeads(leadsPage + 1, leadsSearch) }} disabled={leadsPage >= leadsTotalPages || loadingLeads} style={{ ...BTN_GHOST, padding: '6px 14px', opacity: leadsPage >= leadsTotalPages ? 0.4 : 1 }}>След →</button>
            </div>
          )}
        </>
      )}

      {/* ── TAB: History ── */}
      {tab === 'history' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#7B6FAA', margin: 0 }}>
              История отправленных рассылок — новые сверху
            </p>
            <button
              onClick={loadHistory}
              disabled={loadingHistory}
              style={{ ...BTN_GHOST, padding: '8px 14px', fontSize: 12, opacity: loadingHistory ? 0.5 : 1 }}
            >
              🔄 Обновить
            </button>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDE8FF', overflow: 'hidden' }}>
            {loadingHistory ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9B8FCC' }}>Загрузка...</div>
            ) : history.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9B8FCC' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                <p style={{ margin: 0 }}>Рассылок пока не было</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#FAF8FF', borderBottom: '1px solid #EDE8FF' }}>
                      {['Дата', 'Тема письма', 'Сегмент', 'Получателей', 'Отправил'].map(h => (
                        <th key={h} style={{
                          padding: '10px 16px', textAlign: 'left', fontWeight: 700,
                          color: '#7B6FAA', fontSize: 11, textTransform: 'uppercase',
                          letterSpacing: '0.05em', whiteSpace: 'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((log, i) => (
                      <tr key={log.id} style={{ borderBottom: i < history.length - 1 ? '1px solid #F5F0FF' : 'none' }}>
                        <td style={{ padding: '10px 16px', color: '#9B8FCC', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {new Date(log.sent_at).toLocaleString('ru-RU', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td style={{ padding: '10px 16px', color: '#2D1F6E', fontWeight: 600, maxWidth: 320 }}>
                          {log.subject}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{
                            background: '#F0EEFF', color: '#7C5CFC',
                            padding: '3px 10px', borderRadius: 20,
                            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                          }}>
                            {segmentLabel(log.segment)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{
                            fontFamily: 'var(--font-unbounded)', fontSize: 16,
                            fontWeight: 800, color: '#3D2B8A',
                          }}>
                            {log.recipients_count}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', color: '#9B8FCC', fontSize: 12 }}>
                          {log.sent_by ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {sendTarget && (
        <SendModal
          segment={sendTarget}
          onClose={() => setSendTarget(null)}
        />
      )}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => loadSubscribers(1, search)}
        />
      )}
      {showClubImport && (
        <ImportModal
          onClose={() => setShowClubImport(false)}
          onSuccess={() => loadSubscribers(1, search)}
          source="getcourse_club"
        />
      )}
      {showSendTest && (
        <SendTestModal onClose={() => setShowSendTest(false)} />
      )}
    </div>
  )
}
