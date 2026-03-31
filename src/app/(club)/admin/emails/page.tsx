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

type Tab = 'subscribers' | 'members'

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

  const isEmpty = !bodyHtml || bodyHtml === '<p></p>' || bodyHtml.trim() === ''

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

  const previewHtml = buildEmailHtml(inlineStyles(bodyHtml), '#')

  return (
    <>
      <div style={OVERLAY}>
        <div style={{ ...MODAL_BOX, maxWidth: 600 }}>
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
              <RichEditor value={bodyHtml} onChange={setBodyHtml} />

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

// ── Push Notification Modal ───────────────────────────────────────────
function PushModal({
  segment,
  onClose,
}: {
  segment: MemberSegment | null
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sent: number } | null>(null)
  const [error, setError] = useState('')

  async function handleSend() {
    if (!title.trim() || !body.trim()) { setError('Заполни заголовок и текст'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, segment: segment?.value ?? null }),
      })
      const data = await res.json() as { sent?: number; error?: string }
      if (!res.ok) { setError(data.error ?? 'Ошибка'); return }
      setResult({ sent: data.sent ?? 0 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={OVERLAY}>
      <div style={{ ...MODAL_BOX, maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={MODAL_TITLE}>📲 Push-уведомление</h2>
          <button onClick={onClose} style={CLOSE_BTN}>✕</button>
        </div>

        {result ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1A5C3A', marginBottom: 8 }}>Отправлено!</p>
            <p style={{ fontSize: 14, color: '#7B6FAA' }}>Доставлено: <strong>{result.sent}</strong></p>
            <button onClick={onClose} style={{ ...BTN_PRIMARY, marginTop: 20 }}>Закрыть</button>
          </div>
        ) : (
          <>
            {segment && (
              <div style={{ background: '#F0EEFF', borderRadius: 12, padding: '10px 16px', marginBottom: 18, fontSize: 13, color: '#3D2B8A' }}>
                {segment.icon} <strong>{segment.label}</strong> — {segment.count} подписчиков
              </div>
            )}
            {!segment && (
              <div style={{ background: '#FFF3C0', borderRadius: 12, padding: '10px 16px', marginBottom: 18, fontSize: 13, color: '#5C4200' }}>
                📢 Всем участницам с включёнными уведомлениями
              </div>
            )}

            <label style={LABEL}>Заголовок</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Новый урок в клубе!"
              style={INPUT}
            />

            <label style={{ ...LABEL, marginTop: 14 }}>Текст уведомления</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Короткий текст уведомления..."
              rows={4}
              style={{ ...INPUT, resize: 'vertical' }}
            />

            {error && <p style={{ color: '#E53E3E', fontSize: 13, marginTop: 8 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={onClose} style={BTN_GHOST}>Отмена</button>
              <button onClick={handleSend} disabled={loading} style={{ ...BTN_PRIMARY, flex: 1, opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Отправляем...' : '📲 Отправить push'}
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

type SubStats = { total: number; cold: number; clubCount: number; converted: number; unsubscribed: number }
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
  const [stats, setStats] = useState<SubStats>({ total: 0, cold: 0, clubCount: 0, converted: 0, unsubscribed: 0 })
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
  const [pushTarget, setPushTarget] = useState<MemberSegment | 'all' | null>(null)

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

  const { total, cold, clubCount, converted, unsubscribed } = stats
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {([
          { value: 'subscribers' as Tab, label: '👥 Подписчики' },
          { value: 'members' as Tab, label: '🏠 Участницы клуба' },
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Всего', value: total, bg: '#F0EEFF', color: '#7C5CFC' },
              { label: 'Холодные', value: cold, bg: '#D0F5E8', color: '#1A5C3A' },
              { label: 'В клубе', value: converted, bg: '#FFF3C0', color: '#5C4200' },
              { label: 'Отписались', value: unsubscribed, bg: '#EBEBEB', color: '#555' },
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
              onClick={() => setPushTarget('all')}
              style={{ ...BTN_GHOST, padding: '10px 18px', background: '#FFF3C0', color: '#5C4200' }}
            >
              📲 Push всем
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
              {segments.map(seg => (
                <div
                  key={seg.value}
                  style={{
                    background: '#fff', borderRadius: 16, border: '1px solid #EDE8FF',
                    padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  }}
                >
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#2D1F6E', margin: '0 0 2px' }}>
                      {seg.icon} {seg.label}
                    </p>
                    <p style={{ fontSize: 13, color: '#9B8FCC', margin: 0 }}>
                      {seg.count} получательниц
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {seg.value !== 'cancelled' && (
                      <button
                        onClick={() => setSendTarget(seg)}
                        disabled={seg.count === 0}
                        style={{
                          ...(seg.value === 'expired_trial' || seg.value === 'expired' ? BTN_GHOST : BTN_PRIMARY),
                          opacity: seg.count === 0 ? 0.4 : 1,
                          cursor: seg.count === 0 ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        📢 Письмо
                      </button>
                    )}
                    {(seg.value === 'trial' || seg.value === 'monthly' || seg.value === 'halfyear') && (
                      <button
                        onClick={() => setPushTarget(seg)}
                        disabled={seg.count === 0}
                        style={{
                          ...BTN_GHOST,
                          background: '#FFF3C0', color: '#5C4200',
                          opacity: seg.count === 0 ? 0.4 : 1,
                          cursor: seg.count === 0 ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        📲 Push
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
      {pushTarget !== null && (
        <PushModal
          segment={pushTarget === 'all' ? null : pushTarget}
          onClose={() => setPushTarget(null)}
        />
      )}
    </div>
  )
}
