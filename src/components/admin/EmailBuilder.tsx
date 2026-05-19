'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

// ── Block types ───────────────────────────────────────────────────────
type TextBlock    = { id: string; type: 'text';    content: string }
type HeadingBlock = { id: string; type: 'heading'; content: string; level: 1 | 2 }
type ButtonBlock  = { id: string; type: 'button';  text: string; url: string; color: 'purple' | 'green' | 'orange' }
type ImageBlock   = { id: string; type: 'image';   url: string; alt: string }
type DividerBlock = { id: string; type: 'divider' }
type ColoredBlock = { id: string; type: 'colored'; content: string; bg: string }
export type EmailBlock = TextBlock | HeadingBlock | ButtonBlock | ImageBlock | DividerBlock | ColoredBlock

function uid() { return Math.random().toString(36).slice(2, 10) }

function makeBlock(type: EmailBlock['type']): EmailBlock {
  const id = uid()
  switch (type) {
    case 'text':    return { id, type, content: '' }
    case 'heading': return { id, type, content: '', level: 2 }
    case 'button':  return { id, type, text: 'Перейти', url: 'https://', color: 'purple' }
    case 'image':   return { id, type, url: '', alt: '' }
    case 'divider': return { id, type }
    case 'colored': return { id, type, content: '', bg: '#F0EEFF' }
  }
}

// ── HTML generation ───────────────────────────────────────────────────
const BTN_COLORS = {
  purple: { bg: '#7C5CFC', text: '#fff' },
  green:  { bg: '#4CAF78', text: '#fff' },
  orange: { bg: '#FF7A29', text: '#fff' },
}

function blockToHtml(b: EmailBlock): string {
  switch (b.type) {
    case 'text':
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2D1F6E;">${b.content || '&nbsp;'}</p>`
    case 'heading':
      return b.level === 1
        ? `<h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#3D2B8A;line-height:1.3;">${b.content || '&nbsp;'}</h1>`
        : `<h2 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#3D2B8A;line-height:1.4;">${b.content || '&nbsp;'}</h2>`
    case 'button': {
      const c = BTN_COLORS[b.color] ?? BTN_COLORS.purple
      return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr><td align="center"><a href="${b.url}" style="display:inline-block;background:${c.bg};color:${c.text};text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;">${b.text}</a></td></tr></table>`
    }
    case 'image':
      return b.url
        ? `<img src="${b.url}" alt="${b.alt}" style="max-width:100%;height:auto;display:block;margin:0 auto 20px;border-radius:10px;">`
        : `<div style="background:#F0EEFF;border-radius:10px;padding:24px;text-align:center;color:#9B8FCC;font-size:13px;margin-bottom:20px;">🖼 Изображение (URL не указан)</div>`
    case 'divider':
      return `<hr style="border:none;border-top:1px solid #EDE8FF;margin:20px 0;">`
    case 'colored':
      return `<div style="background:${b.bg};border-radius:12px;padding:20px 24px;margin-bottom:20px;"><p style="margin:0;font-size:15px;line-height:1.7;color:#2D1F6E;">${b.content || '&nbsp;'}</p></div>`
  }
}

const FOOTER_HTML = `<div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #EDE8FF;color:#9B8FCC;font-size:12px;line-height:1.8;">
Клуб «Вкус Жизни» · nata-tomshina.ru<br>
<a href="{{unsubscribe_url}}" style="color:#9B8FCC;">Отписаться</a>
</div>`

function blocksToHtml(blocks: EmailBlock[]): string {
  const inner = blocks.map(blockToHtml).join('\n')
  const json = JSON.stringify(blocks)
  return `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#fff;padding:20px;">
${inner}
${FOOTER_HTML}
</div>
<!-- emailbuilder:${btoa(encodeURIComponent(json))} -->`
}

function htmlToBlocks(html: string): EmailBlock[] | null {
  const m = html.match(/<!-- emailbuilder:([A-Za-z0-9+/=]+) -->/)
  if (!m) return null
  try {
    return JSON.parse(decodeURIComponent(atob(m[1]))) as EmailBlock[]
  } catch {
    return null
  }
}

// ── Image compression ─────────────────────────────────────────────────
async function compressImage(file: File, maxW = 800, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxW / img.width)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', quality)
    }
    img.onerror = reject
    img.src = url
  })
}

// ── Rich content editor (contenteditable) ────────────────────────────
function RichEditor({ content, onChange, placeholder, minHeight = 120 }: {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isTyping = useRef(false)

  // Set innerHTML only when content changes from outside
  useEffect(() => {
    if (!ref.current || isTyping.current) return
    if (ref.current.innerHTML !== content) {
      ref.current.innerHTML = content
    }
  }, [content])

  function exec(cmd: string, val?: string) {
    ref.current?.focus()
    document.execCommand(cmd, false, val)
    isTyping.current = true
    onChange(ref.current?.innerHTML ?? '')
    setTimeout(() => { isTyping.current = false }, 50)
  }

  function handleInput() {
    isTyping.current = true
    onChange(ref.current?.innerHTML ?? '')
    setTimeout(() => { isTyping.current = false }, 50)
  }

  function handleLink(e: React.MouseEvent) {
    e.preventDefault()
    // Save selection before prompt
    const sel = window.getSelection()
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null
    const url = prompt('URL ссылки:', 'https://')
    if (!url) return
    ref.current?.focus()
    if (range) {
      sel!.removeAllRanges()
      sel!.addRange(range)
    }
    exec('createLink', url)
  }

  const TB_BTN: React.CSSProperties = {
    background: 'none', border: '1px solid #EDE8FF', borderRadius: 5,
    padding: '2px 7px', fontSize: 13, cursor: 'pointer', color: '#3D2B8A',
    fontFamily: 'inherit', lineHeight: 1.4, minWidth: 28,
  }

  return (
    <div style={{ border: '1.5px solid #EDE8FF', borderRadius: 8, overflow: 'hidden', background: '#FAF8FF' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 3, padding: '5px 7px', borderBottom: '1px solid #EDE8FF', flexWrap: 'wrap', background: '#fff' }}>
        <button onMouseDown={e => { e.preventDefault(); exec('bold') }}        style={{ ...TB_BTN, fontWeight: 700 }}>Ж</button>
        <button onMouseDown={e => { e.preventDefault(); exec('italic') }}      style={{ ...TB_BTN, fontStyle: 'italic' }}>К</button>
        <button onMouseDown={e => { e.preventDefault(); exec('underline') }}   style={{ ...TB_BTN, textDecoration: 'underline' }}>Ч</button>
        <div style={{ width: 1, background: '#EDE8FF', margin: '0 2px' }} />
        <button onMouseDown={handleLink}                                         style={TB_BTN} title="Ссылка">🔗</button>
        <div style={{ width: 1, background: '#EDE8FF', margin: '0 2px' }} />
        <button onMouseDown={e => { e.preventDefault(); exec('justifyLeft') }}   style={TB_BTN} title="По левому краю">⬅</button>
        <button onMouseDown={e => { e.preventDefault(); exec('justifyCenter') }} style={TB_BTN} title="По центру">↔</button>
        <button onMouseDown={e => { e.preventDefault(); exec('justifyRight') }}  style={TB_BTN} title="По правому краю">➡</button>
      </div>
      {/* Editable area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{
          minHeight, padding: '8px 10px', outline: 'none', fontSize: 14,
          color: '#2D1F6E', lineHeight: 1.7, fontFamily: 'inherit',
        }}
      />
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:#C0B4E8;pointer-events:none;}`}</style>
    </div>
  )
}

// ── Image uploader ────────────────────────────────────────────────────
function ImageUploader({ url, alt, onChange }: {
  url: string
  alt: string
  onChange: (url: string, alt: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const compressed = await compressImage(file)
      const fd = new FormData()
      fd.append('file', compressed, file.name.replace(/\.[^.]+$/, '.jpg'))
      const res = await fetch('/api/admin/emails/upload-image', { method: 'POST', body: fd })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) { setError(data.error ?? 'Ошибка загрузки'); return }
      onChange(data.url, alt)
    } catch (err) {
      setError(String(err))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const S_INPUT: React.CSSProperties = {
    width: '100%', padding: '7px 10px', borderRadius: 8,
    border: '1.5px solid #EDE8FF', outline: 'none', fontSize: 13,
    color: '#2D1F6E', background: '#FAF8FF', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Upload area */}
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        style={{
          border: '2px dashed #DDD5FF', borderRadius: 10, padding: '16px',
          textAlign: 'center', cursor: uploading ? 'default' : 'pointer',
          background: '#FAF8FF', opacity: uploading ? 0.6 : 1,
        }}
      >
        {url ? (
          // Preview
          <div style={{ position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={alt} style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 8, display: 'block', margin: '0 auto' }} />
            <p style={{ fontSize: 11, color: '#9B8FCC', margin: '6px 0 0' }}>Нажми чтобы заменить</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{uploading ? '⏳' : '🖼'}</div>
            <p style={{ fontSize: 13, color: '#7B6FAA', margin: 0, fontWeight: 600 }}>
              {uploading ? 'Загружаем...' : 'Нажми чтобы загрузить фото'}
            </p>
            <p style={{ fontSize: 11, color: '#9B8FCC', margin: '4px 0 0' }}>до 800px, сжимается автоматически</p>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      {error && <p style={{ color: '#E53E3E', fontSize: 12, margin: 0 }}>{error}</p>}
      {/* Alt text */}
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7B6FAA', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Alt текст</label>
        <input value={alt} onChange={e => onChange(url, e.target.value)} placeholder="Описание картинки" style={S_INPUT} />
      </div>
      {/* Manual URL fallback */}
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7B6FAA', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>или вставь URL</label>
        <input value={url} onChange={e => onChange(e.target.value, alt)} placeholder="https://..." style={S_INPUT} />
      </div>
    </div>
  )
}

// ── Block editor content (middle panel) ──────────────────────────────
function BlockEditorContent({ block, onChange }: { block: EmailBlock; onChange: (b: EmailBlock) => void }) {
  const S_INPUT: React.CSSProperties = {
    width: '100%', padding: '7px 10px', borderRadius: 8,
    border: '1.5px solid #EDE8FF', outline: 'none', fontSize: 13,
    color: '#2D1F6E', background: '#FAF8FF', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const S_LABEL: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#7B6FAA',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  if (block.type === 'text') return (
    <div>
      <label style={S_LABEL}>Текст</label>
      <RichEditor
        content={block.content}
        onChange={html => onChange({ ...block, content: html })}
        placeholder="Введите текст письма..."
        minHeight={160}
      />
    </div>
  )

  if (block.type === 'heading') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <label style={S_LABEL}>Текст заголовка</label>
        <input value={block.content} onChange={e => onChange({ ...block, content: e.target.value })} placeholder="Заголовок" style={S_INPUT} />
      </div>
      <div>
        <label style={S_LABEL}>Уровень</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {([1, 2] as const).map(l => (
            <button key={l} onClick={() => onChange({ ...block, level: l })} style={{
              padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800,
              background: block.level === l ? '#7C5CFC' : '#F0EEFF',
              color: block.level === l ? '#fff' : '#7C5CFC',
            }}>H{l}</button>
          ))}
        </div>
      </div>
    </div>
  )

  if (block.type === 'button') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <label style={S_LABEL}>Текст кнопки</label>
        <input value={block.text} onChange={e => onChange({ ...block, text: e.target.value })} placeholder="Нажми меня" style={S_INPUT} />
      </div>
      <div>
        <label style={S_LABEL}>URL</label>
        <input value={block.url} onChange={e => onChange({ ...block, url: e.target.value })} placeholder="https://..." style={S_INPUT} />
      </div>
      <div>
        <label style={S_LABEL}>Цвет</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['purple', 'green', 'orange'] as const).map(c => (
            <button key={c} onClick={() => onChange({ ...block, color: c })} style={{
              flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: c === 'purple' ? '#7C5CFC' : c === 'green' ? '#4CAF78' : '#FF7A29',
              color: '#fff', opacity: block.color === c ? 1 : 0.4,
            }}>
              {c === 'purple' ? 'Фиолет' : c === 'green' ? 'Зелёный' : 'Оранжев'}
            </button>
          ))}
        </div>
      </div>
      {/* Preview */}
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <span style={{
          display: 'inline-block',
          background: block.color === 'purple' ? '#7C5CFC' : block.color === 'green' ? '#4CAF78' : '#FF7A29',
          color: '#fff', padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700,
        }}>{block.text || 'Кнопка'}</span>
      </div>
    </div>
  )

  if (block.type === 'image') return (
    <ImageUploader
      url={block.url}
      alt={block.alt}
      onChange={(url, alt) => onChange({ ...block, url, alt })}
    />
  )

  if (block.type === 'divider') return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <hr style={{ border: 'none', borderTop: '1px solid #EDE8FF' }} />
      <p style={{ fontSize: 12, color: '#9B8FCC', margin: '8px 0 0' }}>Горизонтальная разделительная линия</p>
    </div>
  )

  if (block.type === 'colored') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <label style={S_LABEL}>Текст</label>
        <RichEditor
          content={block.content}
          onChange={html => onChange({ ...block, content: html })}
          placeholder="Текст на цветном фоне..."
          minHeight={120}
        />
      </div>
      <div>
        <label style={S_LABEL}>Цвет фона</label>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
          {['#F0EEFF', '#D0F5E8', '#FFF3C0', '#FFE8E8', '#E8F5FF', '#F0F0F0'].map(bg => (
            <button key={bg} onClick={() => onChange({ ...block, bg })} style={{
              width: 30, height: 30, borderRadius: 8,
              border: block.bg === bg ? '3px solid #7C5CFC' : '2px solid #EDE8FF',
              background: bg, cursor: 'pointer',
            }} />
          ))}
          <input type="color" value={block.bg} onChange={e => onChange({ ...block, bg: e.target.value })} title="Свой цвет" style={{ width: 30, height: 30, padding: 0, border: '2px solid #EDE8FF', borderRadius: 8, cursor: 'pointer' }} />
        </div>
      </div>
    </div>
  )

  return null
}

// ── Block list item ───────────────────────────────────────────────────
const BLOCK_LABELS: Record<string, string> = {
  text: '¶ Текст', heading: 'H Заголовок', button: '⬜ Кнопка',
  image: '🖼 Фото', divider: '— Разделитель', colored: '🎨 Цветной',
}

function BlockItem({ block, isActive, isFirst, isLast, onActivate, onMoveUp, onMoveDown, onDelete }: {
  block: EmailBlock; isActive: boolean; isFirst: boolean; isLast: boolean
  onActivate: () => void; onMoveUp: () => void; onMoveDown: () => void; onDelete: () => void
}) {
  const ICON_BTN: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '2px 5px', fontSize: 13, borderRadius: 4, color: '#9B8FCC',
    lineHeight: 1,
  }
  return (
    <div
      onClick={onActivate}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
        background: isActive ? '#F0EEFF' : '#fff',
        border: `1.5px solid ${isActive ? '#7C5CFC' : '#EDE8FF'}`,
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#7C5CFC' : '#7B6FAA', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {BLOCK_LABELS[block.type] ?? block.type}
      </span>
      <div style={{ display: 'flex', gap: 1, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <button title="Вверх"   onClick={onMoveUp}   disabled={isFirst} style={{ ...ICON_BTN, opacity: isFirst ? 0.25 : 1 }}>↑</button>
        <button title="Вниз"    onClick={onMoveDown} disabled={isLast}  style={{ ...ICON_BTN, opacity: isLast  ? 0.25 : 1 }}>↓</button>
        <button title="Удалить" onClick={() => { if (confirm('Удалить?')) onDelete() }} style={{ ...ICON_BTN, color: '#E53E3E' }}>✕</button>
      </div>
    </div>
  )
}

// ── Main EmailBuilder ─────────────────────────────────────────────────
const ADD_TYPES: { type: EmailBlock['type']; label: string }[] = [
  { type: 'text',    label: '+ Текст' },
  { type: 'heading', label: '+ Заголовок' },
  { type: 'button',  label: '+ Кнопка' },
  { type: 'image',   label: '+ Фото' },
  { type: 'divider', label: '+ Линия' },
  { type: 'colored', label: '+ Цветной' },
]

type MobileTab = 'blocks' | 'editor' | 'preview'

type TemplateItem = { id: string; name: string; subject: string; created_at: string }

// ── Templates picker modal ────────────────────────────────────────────
function TemplatePickerModal({ onSelect, onClose }: {
  onSelect: (html: string) => void
  onClose: () => void
}) {
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/email-templates')
      .then(r => r.json())
      .then((d: { templates?: TemplateItem[] }) => setTemplates(d.templates ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  async function loadAndApply(id: string) {
    const res = await fetch(`/api/admin/email-templates/${id}`)
    const data = await res.json() as { template?: { html: string } }
    if (data.template?.html) {
      onSelect(data.template.html)
      onClose()
    }
  }

  const OVL: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 300, padding: 16,
  }

  return (
    <div style={OVL}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, maxHeight: '80dvh', overflowY: 'auto', fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#3D2B8A' }}>📂 Выбрать шаблон</h3>
          <button onClick={onClose} style={{ background: '#F0EEFF', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 13, color: '#7C5CFC' }}>✕</button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#9B8FCC' }}>Загрузка...</div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#9B8FCC', fontSize: 13 }}>
            Нет сохранённых шаблонов
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {templates.map(t => (
              <div
                key={t.id}
                onClick={() => loadAndApply(t.id)}
                style={{
                  padding: '12px 14px', borderRadius: 10, border: '1.5px solid #EDE8FF',
                  cursor: 'pointer', background: '#FAF8FF',
                }}
              >
                <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#2D1F6E' }}>{t.name}</p>
                {t.subject && <p style={{ margin: 0, fontSize: 12, color: '#9B8FCC' }}>{t.subject}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function EmailBuilder({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [blocks, setBlocks] = useState<EmailBlock[]>(() => {
    if (!value?.trim()) return []
    return htmlToBlocks(value) ?? []
  })
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('blocks')
  const [showTemplates, setShowTemplates] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const prevValueRef = useRef(value)

  useEffect(() => {
    if (value === prevValueRef.current) return
    prevValueRef.current = value
    const parsed = value?.trim() ? htmlToBlocks(value) : null
    if (parsed) setBlocks(parsed)
  }, [value])

  const emit = useCallback((next: EmailBlock[]) => {
    const html = blocksToHtml(next)
    prevValueRef.current = html
    onChange(html)
  }, [onChange])

  function addBlock(type: EmailBlock['type']) {
    const b = makeBlock(type)
    const next = [...blocks, b]
    setBlocks(next); setActiveId(b.id); setMobileTab('editor'); emit(next)
  }
  function updateBlock(id: string, updated: EmailBlock) {
    const next = blocks.map(b => b.id === id ? updated : b)
    setBlocks(next); emit(next)
  }
  function moveUp(idx: number) {
    if (idx === 0) return
    const next = [...blocks];[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    setBlocks(next); emit(next)
  }
  function moveDown(idx: number) {
    if (idx === blocks.length - 1) return
    const next = [...blocks];[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    setBlocks(next); emit(next)
  }
  function deleteBlock(id: string) {
    const next = blocks.filter(b => b.id !== id)
    setBlocks(next); if (activeId === id) setActiveId(null); emit(next)
  }

  async function saveAsTemplate() {
    const name = prompt('Название шаблона:')
    if (!name?.trim()) return
    setSavingTemplate(true)
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), html: blocksToHtml(blocks) }),
      })
      if (res.ok) alert('Шаблон сохранён!')
      else { const d = await res.json() as { error?: string }; alert(d.error ?? 'Ошибка') }
    } finally {
      setSavingTemplate(false)
    }
  }

  function applyTemplate(html: string) {
    const parsed = htmlToBlocks(html)
    if (!parsed) { alert('Не удалось разобрать шаблон'); return }
    setBlocks(parsed)
    setActiveId(null)
    prevValueRef.current = html
    onChange(html)
  }

  const activeBlock = blocks.find(b => b.id === activeId) ?? null
  const previewHtml = blocksToHtml(blocks)

  const ADD_BTN: React.CSSProperties = {
    background: '#F0EEFF', color: '#7C5CFC', border: '1px dashed #DDD5FF',
    borderRadius: 7, padding: '4px 9px', fontSize: 11, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
  }

  // ── Add buttons bar ──
  const addBar = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0' }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {ADD_TYPES.map(({ type, label }) => (
          <button key={type} onClick={() => addBlock(type)} style={ADD_BTN}>{label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button
          onClick={saveAsTemplate}
          disabled={savingTemplate || blocks.length === 0}
          style={{ ...ADD_BTN, background: '#D0F5E8', color: '#1A5C3A', borderColor: '#B0E8CC', opacity: blocks.length === 0 ? 0.4 : 1 }}
        >
          {savingTemplate ? '...' : '💾 Сохранить'}
        </button>
        <button
          onClick={() => setShowTemplates(true)}
          style={{ ...ADD_BTN, background: '#FFF3C0', color: '#5C4200', borderColor: '#E8D88A' }}
        >
          📂 Шаблон
        </button>
      </div>
    </div>
  )

  // ── Block list ──
  const blockList = blocks.length === 0 ? (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, color: '#C0B4E8', textAlign: 'center', gap: 8 }}>
      <div style={{ fontSize: 28 }}>📝</div>
      <p style={{ margin: 0, fontSize: 12 }}>Добавь блок выше</p>
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', flex: 1, paddingRight: 2 }}>
      {blocks.map((block, idx) => (
        <BlockItem
          key={block.id}
          block={block}
          isActive={activeId === block.id}
          isFirst={idx === 0}
          isLast={idx === blocks.length - 1}
          onActivate={() => { setActiveId(block.id); setMobileTab('editor') }}
          onMoveUp={() => moveUp(idx)}
          onMoveDown={() => moveDown(idx)}
          onDelete={() => deleteBlock(block.id)}
        />
      ))}
    </div>
  )

  // ── Block editor panel ──
  const editorPanel = (
    <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '2px 0' }}>
      {activeBlock ? (
        <>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9B8FCC', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
            {BLOCK_LABELS[activeBlock.type]}
          </p>
          <BlockEditorContent
            block={activeBlock}
            onChange={updated => updateBlock(activeBlock.id, updated)}
          />
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24, color: '#C0B4E8', textAlign: 'center', gap: 8 }}>
          <div style={{ fontSize: 28 }}>👆</div>
          <p style={{ margin: 0, fontSize: 12 }}>Выбери блок слева для редактирования</p>
        </div>
      )}
    </div>
  )

  // ── Preview panel ──
  const previewPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #EDE8FF', borderRadius: 12, overflow: 'hidden', background: '#F9F9F9', minWidth: 0 }}>
      <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#9B8FCC', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#F0EEFF', borderBottom: '1px solid #EDE8FF', flexShrink: 0 }}>
        👁 Превью
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        <div style={{ transform: 'scale(0.72)', transformOrigin: 'top left', width: '139%', pointerEvents: 'none' }} dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </div>
    </div>
  )

  // ── Mobile tab bar ──
  const mobileTabs = (
    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
      {(['blocks', 'editor', 'preview'] as MobileTab[]).map(t => (
        <button
          key={t}
          onClick={() => setMobileTab(t)}
          style={{
            flex: 1, padding: '7px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700,
            background: mobileTab === t ? '#7C5CFC' : '#F0EEFF',
            color: mobileTab === t ? '#fff' : '#7C5CFC',
          }}
        >
          {t === 'blocks' ? '📋 Блоки' : t === 'editor' ? '✏️ Редактор' : '👁 Превью'}
        </button>
      ))}
    </div>
  )

  return (
    <>
      {/* ── Desktop layout: 3 columns ── */}
      <div className="eb-desktop" style={{ display: 'flex', gap: 12, minHeight: 440, fontFamily: 'var(--font-nunito)' }}>
        {/* Col 1: blocks list */}
        <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 440 }}>
          {addBar}
          {blockList}
        </div>
        {/* Col 2: active block editor */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #EDE8FF', borderRight: '1px solid #EDE8FF', paddingLeft: 12, paddingRight: 12, minHeight: 440 }}>
          {editorPanel}
        </div>
        {/* Col 3: preview */}
        <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 440 }}>
          {previewPanel}
        </div>
      </div>

      {/* ── Mobile layout: tabs ── */}
      <div className="eb-mobile" style={{ display: 'none', fontFamily: 'var(--font-nunito)' }}>
        {mobileTabs}
        <div style={{ minHeight: 360 }}>
          {mobileTab === 'blocks'  && <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>{addBar}{blockList}</div>}
          {mobileTab === 'editor'  && <div style={{ minHeight: 320, display: 'flex', flexDirection: 'column' }}>{editorPanel}</div>}
          {mobileTab === 'preview' && <div style={{ minHeight: 320 }}>{previewPanel}</div>}
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .eb-desktop { display: none !important; }
          .eb-mobile  { display: block !important; }
        }
      `}</style>

      {showTemplates && (
        <TemplatePickerModal
          onSelect={applyTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </>
  )
}
