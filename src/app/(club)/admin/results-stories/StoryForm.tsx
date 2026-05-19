'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Story {
  id: string
  slug: string
  name: string
  age: number | null
  age_label: string | null
  tag_label: string | null
  tag_filter: string[]
  before_kg: number | null
  after_kg: number | null
  metric_main: string | null
  metric_label: string | null
  summary_quote: string | null
  check_items: string[]
  content_html: string | null
  content_source: string | null
  seo_title: string | null
  seo_description: string | null
  order_index: number
  published: boolean
  photo_before_url: string | null
  photo_after_url: string | null
}

interface FormState {
  name: string
  slug: string
  age: string
  age_label: string
  tag_label: string
  tag_filter: string
  before_kg: string
  after_kg: string
  metric_main: string
  metric_label: string
  summary_quote: string
  content_html: string
  content_source: string
  seo_title: string
  seo_description: string
  order_index: string
  published: boolean
}

interface StoryFormProps {
  mode: 'create' | 'edit'
  storyId?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(text: string): string {
  const map: Record<string, string> = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',
    к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
    х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  }
  return text.toLowerCase().split('').map(c => map[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

/** Convert internal supabase-kong URL to browser-accessible proxy path */
function toDisplayUrl(url: string | null): string {
  if (!url) return ''
  return url
    .replace(/^http:\/\/supabase-kong:\d+/, '/supabase')
    .replace(/^https?:\/\/[a-z0-9]+\.supabase\.co/, '/supabase')
}

const emptyForm: FormState = {
  name: '', slug: '', age: '', age_label: '', tag_label: '', tag_filter: '',
  before_kg: '', after_kg: '', metric_main: '', metric_label: '', summary_quote: '',
  content_html: '', content_source: '', seo_title: '', seo_description: '',
  order_index: '0', published: false,
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid var(--border)', borderRadius: 10,
  padding: '9px 12px', fontSize: 14, color: 'var(--text)', background: '#FAF8FF',
  outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4,
}
const hintStyle: React.CSSProperties = {
  fontSize: 11, color: '#9B8FCC', marginTop: 4,
}
const btnPrimary: React.CSSProperties = {
  padding: '10px 24px', borderRadius: 10, background: 'var(--pur)', color: '#fff',
  fontFamily: 'var(--font-nunito)', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--border)',
  background: 'none', fontFamily: 'var(--font-nunito)', fontSize: 14, fontWeight: 600,
  color: 'var(--pur)', cursor: 'pointer',
}
const btnSmall: React.CSSProperties = {
  padding: '5px 12px', borderRadius: 8, border: '1.5px solid var(--border)',
  background: 'none', fontFamily: 'var(--font-nunito)', fontSize: 12, fontWeight: 600,
  color: 'var(--pur)', cursor: 'pointer',
}
const btnDanger: React.CSSProperties = {
  padding: '5px 10px', borderRadius: 8, background: 'none', border: '1px solid #FFCDD2',
  color: '#C0395A', fontFamily: 'var(--font-nunito)', fontSize: 12, cursor: 'pointer',
}
const sectionCard: React.CSSProperties = {
  background: '#fff', border: '1px solid #EDE8FF', borderRadius: 16,
  padding: '24px', marginBottom: 16,
}
const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-unbounded)', fontSize: 13, fontWeight: 700,
  color: '#3D2B8A', marginBottom: 16,
}
const row2: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StoryForm({ mode, storyId }: StoryFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({ ...emptyForm })
  const [checkItems, setCheckItems] = useState<string[]>([''])
  const [loadedStory, setLoadedStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [uploadingBefore, setUploadingBefore] = useState(false)
  const [uploadingAfter, setUploadingAfter] = useState(false)
  const [err, setErr] = useState('')

  // Photo files selected (not yet uploaded)
  const [photoBeforeFile, setPhotoBeforeFile] = useState<File | null>(null)
  const [photoAfterFile, setPhotoAfterFile] = useState<File | null>(null)
  // Preview URLs (object URL for local files, display URL for stored)
  const [photoBeforePreview, setPhotoBeforePreview] = useState('')
  const [photoAfterPreview, setPhotoAfterPreview] = useState('')

  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)

  // Load existing story in edit mode
  useEffect(() => {
    if (mode !== 'edit' || !storyId) return
    fetch(`/api/admin/results-stories/${storyId}`)
      .then(r => r.json())
      .then(({ story }: { story: Story }) => {
        if (!story) return
        setLoadedStory(story)
        setForm({
          name: story.name,
          slug: story.slug,
          age: story.age?.toString() ?? '',
          age_label: story.age_label ?? '',
          tag_label: story.tag_label ?? '',
          tag_filter: (story.tag_filter ?? []).join(', '),
          before_kg: story.before_kg?.toString() ?? '',
          after_kg: story.after_kg?.toString() ?? '',
          metric_main: story.metric_main ?? '',
          metric_label: story.metric_label ?? '',
          summary_quote: story.summary_quote ?? '',
          content_html: story.content_html ?? '',
          content_source: story.content_source ?? '',
          seo_title: story.seo_title ?? '',
          seo_description: story.seo_description ?? '',
          order_index: story.order_index.toString(),
          published: story.published,
        })
        setCheckItems(story.check_items?.length ? story.check_items : [''])
        setPhotoBeforePreview(toDisplayUrl(story.photo_before_url))
        setPhotoAfterPreview(toDisplayUrl(story.photo_after_url))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [mode, storyId])

  function set(key: keyof FormState, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleNameChange(v: string) {
    set('name', v)
    if (mode === 'create') set('slug', toSlug(v))
  }

  function handlePhotoSelect(type: 'before' | 'after', file: File) {
    const previewUrl = URL.createObjectURL(file)
    if (type === 'before') {
      setPhotoBeforeFile(file)
      setPhotoBeforePreview(previewUrl)
    } else {
      setPhotoAfterFile(file)
      setPhotoAfterPreview(previewUrl)
    }
  }

  async function uploadPhoto(storyId: string, file: File, type: 'before' | 'after'): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    const res = await fetch(`/api/admin/results-stories/${storyId}/upload-photo`, { method: 'POST', body: fd })
    const data = await res.json() as { url?: string; error?: string }
    if (data.error) throw new Error(data.error)
    return data.url ?? null
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setErr('')

    if (!form.name.trim()) { setErr('Имя обязательно'); return }
    if (!form.slug.trim()) { setErr('Slug обязателен'); return }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) {
      setErr('Slug: только строчные латиница, цифры, дефисы (пример: elena-58-let)')
      return
    }

    const filledItems = checkItems.filter(s => s.trim())
    if (form.published && !form.content_html.trim()) {
      if (!window.confirm('content_html пустой. Опубликовать всё равно?')) return
    }
    if (form.published && !photoBeforePreview && !photoAfterPreview) {
      if (!window.confirm('Фото не загружены. Опубликовать всё равно?')) return
    }

    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        age: form.age ? Number(form.age) : null,
        age_label: form.age_label || null,
        tag_label: form.tag_label || null,
        tag_filter: form.tag_filter ? form.tag_filter.split(',').map(s => s.trim()).filter(Boolean) : [],
        before_kg: form.before_kg ? Number(form.before_kg) : null,
        after_kg: form.after_kg ? Number(form.after_kg) : null,
        metric_main: form.metric_main || null,
        metric_label: form.metric_label || null,
        summary_quote: form.summary_quote || null,
        check_items: filledItems,
        content_html: form.content_html || null,
        content_source: form.content_source || null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        order_index: Number(form.order_index) || 0,
        published: form.published,
      }

      const url = mode === 'create'
        ? '/api/admin/results-stories'
        : `/api/admin/results-stories/${storyId}`
      const method = mode === 'create' ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { story?: Story; error?: string }
      if (data.error) { setErr(data.error); setSaving(false); return }

      const savedId = data.story!.id

      // Upload photos if files were selected
      if (photoBeforeFile) {
        setUploadingBefore(true)
        await uploadPhoto(savedId, photoBeforeFile, 'before').catch(e => setErr(String(e)))
        setUploadingBefore(false)
      }
      if (photoAfterFile) {
        setUploadingAfter(true)
        await uploadPhoto(savedId, photoAfterFile, 'after').catch(e => setErr(String(e)))
        setUploadingAfter(false)
      }

      router.push('/admin/results-stories')
    } catch (e) {
      setErr(String(e))
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#7B6FAA' }}>Загрузка…</div>
  }

  const isWorking = saving || uploadingBefore || uploadingAfter
  const workLabel = uploadingBefore ? 'Загружаем фото ДО…' : uploadingAfter ? 'Загружаем фото ПОСЛЕ…' : 'Сохраняем…'

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link
          href="/admin/results-stories"
          style={{ fontSize: 13, color: '#7B6FAA', textDecoration: 'none', padding: '8px 12px', borderRadius: 10, background: '#F0EEFF' }}
        >
          ← Назад
        </Link>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#3D2B8A', margin: 0, flex: 1 }}>
          {mode === 'create' ? 'Новая история' : `Редактировать: ${loadedStory?.name ?? ''}`}
        </h1>
        {mode === 'edit' && form.slug && (
          <a
            href={`https://nata-tomshina.ru/results/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...btnSecondary, textDecoration: 'none', fontSize: 13, padding: '8px 16px' }}
          >
            Открыть страницу ↗
          </a>
        )}
      </div>

      <form onSubmit={handleSave}>
        {/* ── Основное ── */}
        <div style={sectionCard}>
          <div style={sectionTitle}>Основное</div>
          <div style={{ ...row2, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Имя участницы *</label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Елена"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Slug (URL) *</label>
              <input
                style={inputStyle}
                value={form.slug}
                onChange={e => set('slug', e.target.value.toLowerCase())}
                placeholder="elena-istoriya-58-let"
                required
              />
              <p style={hintStyle}>Латиница, цифры, дефисы. Пример: elena-minus-31-kg</p>
            </div>
          </div>
          <div style={row2}>
            <div>
              <label style={labelStyle}>Возраст</label>
              <input style={inputStyle} type="number" value={form.age} onChange={e => set('age', e.target.value)} placeholder="58" />
            </div>
            <div>
              <label style={labelStyle}>Подпись возраста</label>
              <input style={inputStyle} value={form.age_label} onChange={e => set('age_label', e.target.value)} placeholder="58 лет" />
            </div>
          </div>
        </div>

        {/* ── Карточка на /results ── */}
        <div style={sectionCard}>
          <div style={sectionTitle}>Карточка на /results</div>
          <div style={{ ...row2, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Тег</label>
              <input style={inputStyle} value={form.tag_label} onChange={e => set('tag_label', e.target.value)} placeholder="Диагнозы" />
            </div>
            <div>
              <label style={labelStyle}>Фильтры (tag_filter)</label>
              <input style={inputStyle} value={form.tag_filter} onChange={e => set('tag_filter', e.target.value)} placeholder="health, pills" />
              <p style={hintStyle}>Через запятую: weight, energy, thyroid, health, pills, age50, big_weight_loss</p>
            </div>
          </div>
          <div style={{ ...row2, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Вес ДО (кг)</label>
              <input style={inputStyle} type="number" step="0.1" value={form.before_kg} onChange={e => set('before_kg', e.target.value)} placeholder="104" />
            </div>
            <div>
              <label style={labelStyle}>Вес ПОСЛЕ (кг)</label>
              <input style={inputStyle} type="number" step="0.1" value={form.after_kg} onChange={e => set('after_kg', e.target.value)} placeholder="73" />
            </div>
          </div>
          <div style={{ ...row2, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Главная цифра (metric_main)</label>
              <input style={inputStyle} value={form.metric_main} onChange={e => set('metric_main', e.target.value)} placeholder="−31" />
            </div>
            <div>
              <label style={labelStyle}>Подпись к цифре (metric_label)</label>
              <input style={inputStyle} value={form.metric_label} onChange={e => set('metric_label', e.target.value)} placeholder="кг за 3 года" />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Цитата для карточки</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
              value={form.summary_quote}
              onChange={e => set('summary_quote', e.target.value)}
              placeholder="Кардиолог сказал: «Вам с такими анализами бояться надо»…"
            />
          </div>

          {/* Check items */}
          <div>
            <label style={labelStyle}>Чек-лист результатов</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {checkItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={item}
                    onChange={e => {
                      const next = [...checkItems]
                      next[i] = e.target.value
                      setCheckItems(next)
                    }}
                    placeholder={`Результат ${i + 1}`}
                  />
                  {checkItems.length > 1 && (
                    <button
                      type="button"
                      style={btnDanger}
                      onClick={() => setCheckItems(checkItems.filter((_, j) => j !== i))}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              style={{ ...btnSmall, marginTop: 8 }}
              onClick={() => setCheckItems([...checkItems, ''])}
            >
              + Добавить пункт
            </button>
          </div>
        </div>

        {/* ── Фото ── */}
        <div style={sectionCard}>
          <div style={sectionTitle}>Фото</div>
          <div style={row2}>
            {/* Photo before */}
            <div>
              <label style={labelStyle}>Фото ДО</label>
              <input
                ref={beforeInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoSelect('before', f) }}
              />
              {photoBeforePreview ? (
                <div>
                  <img
                    src={photoBeforePreview}
                    alt="До"
                    style={{ width: '100%', maxWidth: 160, height: 213, objectFit: 'cover', borderRadius: 10, display: 'block', marginBottom: 8 }}
                  />
                  <button type="button" style={btnSmall} onClick={() => beforeInputRef.current?.click()}>
                    Заменить
                  </button>
                </div>
              ) : (
                <button type="button" style={btnSecondary} onClick={() => beforeInputRef.current?.click()}>
                  Выбрать файл
                </button>
              )}
              {uploadingBefore && <p style={{ fontSize: 12, color: '#7B6FAA', marginTop: 6 }}>Загружаем…</p>}
            </div>

            {/* Photo after */}
            <div>
              <label style={labelStyle}>Фото ПОСЛЕ</label>
              <input
                ref={afterInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoSelect('after', f) }}
              />
              {photoAfterPreview ? (
                <div>
                  <img
                    src={photoAfterPreview}
                    alt="После"
                    style={{ width: '100%', maxWidth: 160, height: 213, objectFit: 'cover', borderRadius: 10, display: 'block', marginBottom: 8 }}
                  />
                  <button type="button" style={btnSmall} onClick={() => afterInputRef.current?.click()}>
                    Заменить
                  </button>
                </div>
              ) : (
                <button type="button" style={btnSecondary} onClick={() => afterInputRef.current?.click()}>
                  Выбрать файл
                </button>
              )}
              {uploadingAfter && <p style={{ fontSize: 12, color: '#7B6FAA', marginTop: 6 }}>Загружаем…</p>}
            </div>
          </div>
          <p style={{ ...hintStyle, marginTop: 12 }}>
            Фотографии загружаются в Supabase Storage (bucket: results-photos) при сохранении.
          </p>
        </div>

        {/* ── Текст истории ── */}
        <div style={sectionCard}>
          <div style={sectionTitle}>Текст истории</div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>HTML текста истории (content_html)</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 320, fontFamily: 'monospace', fontSize: 12 }}
              value={form.content_html}
              onChange={e => set('content_html', e.target.value)}
              placeholder={'<div class="story-hook">\n  <blockquote>Цитата…</blockquote>\n</div>\n<div class="story-sub">…</div>\n<div class="story-body">\n  <h3>Как было</h3>\n  <p>…</p>\n</div>\n<div class="story-outro">\n  <blockquote>Итоговая цитата</blockquote>\n  <cite>— Имя, …</cite>\n</div>'}
            />
            <p style={hintStyle}>
              Вставьте HTML из Claude. Структура: story-hook → story-sub → story-body (секции h3+p) → story-outro.
            </p>
          </div>
          <div>
            <label style={labelStyle}>Исходный конспект (необязательно)</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
              value={form.content_source}
              onChange={e => set('content_source', e.target.value)}
              placeholder="Исходный текст для будущих правок…"
            />
          </div>
        </div>

        {/* ── SEO ── */}
        <div style={sectionCard}>
          <div style={sectionTitle}>SEO</div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>SEO заголовок</label>
            <input style={inputStyle} value={form.seo_title} onChange={e => set('seo_title', e.target.value)} placeholder="История Елены: −31 кг за 3 года…" />
          </div>
          <div>
            <label style={labelStyle}>SEO описание</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              value={form.seo_description}
              onChange={e => set('seo_description', e.target.value)}
              placeholder="Реальная история похудения…"
            />
          </div>
        </div>

        {/* ── Публикация ── */}
        <div style={sectionCard}>
          <div style={sectionTitle}>Публикация</div>
          <div style={{ ...row2, alignItems: 'center' }}>
            <div>
              <label style={labelStyle}>Порядок отображения</label>
              <input
                style={{ ...inputStyle, maxWidth: 120 }}
                type="number"
                value={form.order_index}
                onChange={e => set('order_index', e.target.value)}
                placeholder="0"
              />
              <p style={hintStyle}>Меньше = выше в списке</p>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 20 }}>
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={e => set('published', e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--pur)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#3D2B8A' }}>
                  Опубликовать
                </span>
              </label>
              <p style={hintStyle}>
                {form.published
                  ? 'История появится на /results и /results/' + (form.slug || 'slug')
                  : 'Черновик — видна только в админке'}
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#C0395A' }}>
            {err}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="submit" style={btnPrimary} disabled={isWorking}>
            {isWorking ? workLabel : 'Сохранить'}
          </button>
          <button
            type="button"
            style={btnSecondary}
            onClick={() => router.push('/admin/results-stories')}
            disabled={isWorking}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}
