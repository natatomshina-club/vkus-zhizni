'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ─── Styles ──────────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', border: '1.5px solid #EDE8FF', borderRadius: 10,
  padding: '9px 12px', fontSize: 14, color: '#2D1F6E', background: '#FAF8FF',
  outline: 'none', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#7B6FAA', display: 'block', marginBottom: 4 }
const btnPrimary: React.CSSProperties = {
  padding: '9px 22px', borderRadius: 10, background: '#3D2B8A', color: '#fff',
  fontFamily: 'var(--font-nunito)', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 10, border: '1.5px solid #EDE8FF',
  background: 'none', fontSize: 13, fontWeight: 600, color: '#7C5CFC', cursor: 'pointer',
}
const card: React.CSSProperties = {
  background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 16, padding: '20px 22px', marginBottom: 20,
}
const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-nunito)', fontSize: 13, fontWeight: 700, color: '#7B6FAA',
  textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14, display: 'block',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type KV = Record<string, string>

function usePageContent(page: string) {
  const [data, setData] = useState<KV>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/page-content?page=${page}`)
    if (res.ok) {
      const json = await res.json() as { data: { key: string; value: string }[] }
      const kv: KV = {}
      for (const item of json.data) kv[item.key] = item.value
      setData(kv)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  async function save(updates: KV) {
    setSaving(true); setMsg('')
    const res = await fetch('/api/admin/page-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page, updates: Object.entries(updates).map(([key, value]) => ({ key, value })) }),
    })
    setSaving(false)
    setMsg(res.ok ? 'Сохранено ✓' : 'Ошибка сохранения')
    setTimeout(() => setMsg(''), 3000)
    if (res.ok) setData(d => ({ ...d, ...updates }))
  }

  return { data, saving, msg, save }
}

// ─── SaveBar ─────────────────────────────────────────────────────────────────

function SaveBar({ saving, msg, onSave }: { saving: boolean; msg: string; onSave: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
      <button onClick={onSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Сохранение...' : 'Сохранить'}
      </button>
      {msg && <span style={{ fontSize: 13, color: msg.includes('✓') ? '#4CAF78' : '#C0392B' }}>{msg}</span>}
    </div>
  )
}

// ─── Tab 1: Главная ───────────────────────────────────────────────────────────

function HomeTab() {
  const { data, saving, msg, save } = usePageContent('home')
  const [form, setForm] = useState<KV>({})
  useEffect(() => { setForm(data) }, [data])
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div>
      <div style={card}>
        <span style={sectionTitle}>Блок Hero</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div><label style={lbl}>Заголовок</label><input style={inp} value={form.hero_title ?? ''} onChange={e => set('hero_title', e.target.value)} /></div>
          <div><label style={lbl}>Подзаголовок</label><input style={inp} value={form.hero_subtitle ?? ''} onChange={e => set('hero_subtitle', e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Кнопка 1: текст</label><input style={inp} value={form.hero_btn1_text ?? ''} onChange={e => set('hero_btn1_text', e.target.value)} /></div>
            <div><label style={lbl}>Кнопка 1: ссылка</label><input style={inp} value={form.hero_btn1_url ?? ''} onChange={e => set('hero_btn1_url', e.target.value)} /></div>
            <div><label style={lbl}>Кнопка 2: текст</label><input style={inp} value={form.hero_btn2_text ?? ''} onChange={e => set('hero_btn2_text', e.target.value)} /></div>
            <div><label style={lbl}>Кнопка 2: ссылка</label><input style={inp} value={form.hero_btn2_url ?? ''} onChange={e => set('hero_btn2_url', e.target.value)} /></div>
          </div>
        </div>
        <SaveBar saving={saving} msg={msg} onSave={() => save(form)} />
      </div>

      <div style={card}>
        <span style={sectionTitle}>О методе — 3 карточки</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ background: '#FAF8FF', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#3D2B8A', marginBottom: 8 }}>Карточка {n}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>Иконка</label><input style={inp} value={form[`method_${n}_icon`] ?? ''} onChange={e => set(`method_${n}_icon`, e.target.value)} /></div>
                <div><label style={lbl}>Заголовок</label><input style={inp} value={form[`method_${n}_title`] ?? ''} onChange={e => set(`method_${n}_title`, e.target.value)} /></div>
                <div><label style={lbl}>Текст</label><input style={inp} value={form[`method_${n}_text`] ?? ''} onChange={e => set(`method_${n}_text`, e.target.value)} /></div>
              </div>
            </div>
          ))}
        </div>
        <SaveBar saving={saving} msg={msg} onSave={() => save(form)} />
      </div>

      <div style={card}>
        <span style={sectionTitle}>Теги «Для кого» (через запятую)</span>
        <textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={form.for_whom_tags ?? ''} onChange={e => set('for_whom_tags', e.target.value)} placeholder="Хочу похудеть на 10+ кг, После 40 лет, Есть гипотиреоз..." />
        <SaveBar saving={saving} msg={msg} onSave={() => save(form)} />
      </div>
    </div>
  )
}

// ─── Tab 2: About ─────────────────────────────────────────────────────────────

function AboutTab() {
  const { data, saving, msg, save } = usePageContent('about')
  const [form, setForm] = useState<KV>({})
  useEffect(() => { setForm(data) }, [data])
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div>
      <div style={card}>
        <span style={sectionTitle}>Hero</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div><label style={lbl}>Имя</label><input style={inp} value={form.name ?? ''} onChange={e => set('name', e.target.value)} /></div>
          <div><label style={lbl}>Роль</label><input style={inp} value={form.role ?? ''} onChange={e => set('role', e.target.value)} /></div>
          <div><label style={lbl}>Теги-пилюли (через запятую)</label><input style={inp} value={form.tags ?? ''} onChange={e => set('tags', e.target.value)} /></div>
        </div>
        <SaveBar saving={saving} msg={msg} onSave={() => save(form)} />
      </div>

      <div style={card}>
        <span style={sectionTitle}>История</span>
        <textarea style={{ ...inp, height: 160, resize: 'vertical' }} value={form.story_text ?? ''} onChange={e => set('story_text', e.target.value)} placeholder="Текст истории..." />
        <SaveBar saving={saving} msg={msg} onSave={() => save(form)} />
      </div>

      <div style={card}>
        <span style={sectionTitle}>Статистика (4 числа)</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><label style={lbl}>Число {n}</label><input style={inp} value={form[`stat_${n}_val`] ?? ''} onChange={e => set(`stat_${n}_val`, e.target.value)} /></div>
              <div><label style={lbl}>Подпись {n}</label><input style={inp} value={form[`stat_${n}_label`] ?? ''} onChange={e => set(`stat_${n}_label`, e.target.value)} /></div>
            </div>
          ))}
        </div>
        <SaveBar saving={saving} msg={msg} onSave={() => save(form)} />
      </div>

      <div style={card}>
        <span style={sectionTitle}>3 принципа</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ background: '#FAF8FF', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div><label style={lbl}>Принцип {n}: заголовок</label><input style={inp} value={form[`principle_${n}_title`] ?? ''} onChange={e => set(`principle_${n}_title`, e.target.value)} /></div>
              <div><label style={lbl}>Принцип {n}: текст</label><input style={inp} value={form[`principle_${n}_text`] ?? ''} onChange={e => set(`principle_${n}_text`, e.target.value)} /></div>
            </div>
          ))}
        </div>
        <SaveBar saving={saving} msg={msg} onSave={() => save(form)} />
      </div>

      <div style={card}>
        <span style={sectionTitle}>Сертификаты (URL фото)</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Сертификат {n}: URL</label>
                <input style={inp} value={form[`cert_${n}_url`] ?? ''} onChange={e => set(`cert_${n}_url`, e.target.value)} placeholder="https://..." />
              </div>
              {form[`cert_${n}_url`] && (
                <img src={form[`cert_${n}_url`]} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
        <SaveBar saving={saving} msg={msg} onSave={() => save(form)} />
      </div>
    </div>
  )
}

// ─── Tab 3: Club ─────────────────────────────────────────────────────────────

function ClubTab() {
  const { data, saving, msg, save } = usePageContent('club')
  const [form, setForm] = useState<KV>({})
  const [faqCount, setFaqCount] = useState(5)
  const [editFaq, setEditFaq] = useState<number | null>(null)
  useEffect(() => { setForm(data) }, [data])
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const maxFaq = Math.max(faqCount, ...Object.keys(data).filter(k => k.startsWith('faq_') && k.endsWith('_q')).map(k => parseInt(k.split('_')[1])))

  return (
    <div>
      <div style={card}>
        <span style={sectionTitle}>FAQ — Вопросы и ответы</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {Array.from({ length: Math.max(faqCount, maxFaq) }, (_, i) => i + 1).map(n => (
            <div key={n}>
              <div style={{ background: '#FAF8FF', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#7C5CFC', flexShrink: 0 }}>#{n}</span>
                <span style={{ flex: 1, fontSize: 13, color: '#2D1F6E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {form[`faq_${n}_q`] || <em style={{ color: '#B0A8D4' }}>Вопрос не заполнен</em>}
                </span>
                <button onClick={() => setEditFaq(editFaq === n ? null : n)} style={btnSecondary}>
                  {editFaq === n ? 'Свернуть' : 'Изменить'}
                </button>
              </div>
              {editFaq === n && (
                <div style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 10, padding: 14, marginTop: 4 }}>
                  <div style={{ marginBottom: 8 }}><label style={lbl}>Вопрос</label><input style={inp} value={form[`faq_${n}_q`] ?? ''} onChange={e => set(`faq_${n}_q`, e.target.value)} /></div>
                  <div><label style={lbl}>Ответ</label><textarea style={{ ...inp, height: 100, resize: 'vertical' }} value={form[`faq_${n}_a`] ?? ''} onChange={e => set(`faq_${n}_a`, e.target.value)} /></div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={() => setFaqCount(c => c + 1)} style={btnSecondary}>+ Добавить вопрос</button>
          {faqCount > 1 && <button onClick={() => setFaqCount(c => c - 1)} style={{ ...btnSecondary, color: '#C0392B', borderColor: '#FFD5D5' }}>− Убрать последний</button>}
        </div>
        <SaveBar saving={saving} msg={msg} onSave={() => save(form)} />
      </div>

      <div style={card}>
        <span style={sectionTitle}>Тарифы</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
          <div style={{ background: '#FAF8FF', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3D2B8A', marginBottom: 8 }}>Триал</div>
            <div><label style={lbl}>Цена (₽)</label><input style={inp} value={form.trial_price ?? ''} onChange={e => set('trial_price', e.target.value)} /></div>
            <div><label style={lbl}>Дни</label><input style={inp} value={form.trial_days ?? ''} onChange={e => set('trial_days', e.target.value)} /></div>
            <div><label style={lbl}>Подпись</label><input style={inp} value={form.trial_label ?? ''} onChange={e => set('trial_label', e.target.value)} /></div>
          </div>
          <div style={{ background: '#FAF8FF', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3D2B8A', marginBottom: 8 }}>Месяц</div>
            <div><label style={lbl}>Цена (₽)</label><input style={inp} value={form.month_price ?? ''} onChange={e => set('month_price', e.target.value)} /></div>
            <div><label style={lbl}>Подпись</label><input style={inp} value={form.month_label ?? ''} onChange={e => set('month_label', e.target.value)} /></div>
          </div>
          <div style={{ background: '#FAF8FF', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3D2B8A', marginBottom: 8 }}>Полгода</div>
            <div><label style={lbl}>Цена (₽)</label><input style={inp} value={form.halfyear_price ?? ''} onChange={e => set('halfyear_price', e.target.value)} /></div>
            <div><label style={lbl}>Экономия</label><input style={inp} value={form.halfyear_save ?? ''} onChange={e => set('halfyear_save', e.target.value)} /></div>
            <div><label style={lbl}>Подпись</label><input style={inp} value={form.halfyear_label ?? ''} onChange={e => set('halfyear_label', e.target.value)} /></div>
          </div>
        </div>
        <SaveBar saving={saving} msg={msg} onSave={() => save(form)} />
      </div>
    </div>
  )
}

// ─── Tab 4: Banners ───────────────────────────────────────────────────────────

function BannersTab() {
  const { data, saving, msg, save } = usePageContent('banners')
  const [form, setForm] = useState<KV>({})
  useEffect(() => { setForm(data) }, [data])
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div>
      <div style={card}>
        <span style={sectionTitle}>Лид-магнит (сайдбар блога)</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div><label style={lbl}>Заголовок</label><input style={inp} value={form.lead_title ?? ''} onChange={e => set('lead_title', e.target.value)} /></div>
          <div><label style={lbl}>Описание</label><textarea style={{ ...inp, height: 72, resize: 'vertical' }} value={form.lead_description ?? ''} onChange={e => set('lead_description', e.target.value)} /></div>
          {[1, 2, 3].map(n => (
            <div key={n}><label style={lbl}>Пункт чеклиста {n}</label><input style={inp} value={form[`lead_check_${n}`] ?? ''} onChange={e => set(`lead_check_${n}`, e.target.value)} /></div>
          ))}
          <div><label style={lbl}>Текст кнопки</label><input style={inp} value={form.lead_cta ?? ''} onChange={e => set('lead_cta', e.target.value)} /></div>
        </div>
        <SaveBar saving={saving} msg={msg} onSave={() => save(form)} />
      </div>

      <div style={card}>
        <span style={sectionTitle}>Баннер марафона (сайдбар + горизонтальный в статье)</span>
        <p style={{ fontSize: 12, color: '#7B6FAA', margin: '0 0 12px' }}>Один источник данных для обоих баннеров марафона</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div><label style={lbl}>Заголовок</label><input style={inp} value={form.marathon_title ?? ''} onChange={e => set('marathon_title', e.target.value)} /></div>
          <div><label style={lbl}>Подзаголовок</label><input style={inp} value={form.marathon_subtitle ?? ''} onChange={e => set('marathon_subtitle', e.target.value)} /></div>
          <div><label style={lbl}>Дата (напр. «Старт 1 апреля»)</label><input style={inp} value={form.marathon_date ?? ''} onChange={e => set('marathon_date', e.target.value)} /></div>
          <div><label style={lbl}>Текст кнопки</label><input style={inp} value={form.marathon_cta ?? ''} onChange={e => set('marathon_cta', e.target.value)} /></div>
          <div><label style={lbl}>URL кнопки</label><input style={inp} value={form.marathon_url ?? '/marathon'} onChange={e => set('marathon_url', e.target.value)} /></div>
        </div>
        <SaveBar saving={saving} msg={msg} onSave={() => save(form)} />
      </div>
    </div>
  )
}

// ─── Tab 5: Results ───────────────────────────────────────────────────────────

const RESULT_TAGS = [
  { value: 'weight', label: 'Большое похудение' },
  { value: 'health', label: 'Здоровье и анализы' },
  { value: 'thyroid', label: 'Щитовидная железа' },
  { value: 'age50', label: '50+ лет' },
  { value: 'energy', label: 'Энергия' },
  { value: 'pills', label: 'Отменили таблетки' },
]

interface ResultCase {
  id: string; name: string; tag_badge: string | null; kg: string | null
  kg_period: string | null; before_text: string | null; after_text: string | null
  quote: string | null; extras: string[]; tags: string[]; video_url: string | null
  photo_before_url: string | null; photo_after_url: string | null
  is_published: boolean; featured: boolean; sort_order: number
  kg_color: string; stripe: string
}

const emptyCase: Omit<ResultCase, 'id'> = {
  name: '', tag_badge: '', kg: '', kg_period: '', before_text: '', after_text: '',
  quote: '', extras: [], tags: [], video_url: '', photo_before_url: null, photo_after_url: null,
  is_published: false, featured: false, sort_order: 0, kg_color: '#2E7D50', stripe: '#4CAF78',
}

function ResultsTab() {
  const [cases, setCases] = useState<ResultCase[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<Omit<ResultCase, 'id'>>({ ...emptyCase })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/result-cases')
    if (res.ok) {
      const json = await res.json() as { cases: ResultCase[] }
      setCases(json.cases ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function startEdit(c: ResultCase) {
    setEditId(c.id); setShowCreate(false)
    setForm({
      ...emptyCase,
      ...c,
      extras: Array.isArray(c.extras) ? c.extras : [],
      tags: Array.isArray(c.tags) ? c.tags : [],
    })
    setErr('')
  }

  function cancelForm() {
    setEditId(null); setShowCreate(false); setForm({ ...emptyCase }); setErr('')
  }

  async function handleSave() {
    if (!form.name.trim()) { setErr('Имя обязательно'); return }
    setSaving(true); setErr('')
    try {
      const url = editId ? `/api/admin/result-cases/${editId}` : '/api/admin/result-cases'
      const method = editId ? 'PUT' : 'POST'
      const { id: _id, ...formWithoutId } = form as typeof form & { id?: string }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formWithoutId),
      })
      const data = await res.json() as { error?: string; case?: ResultCase }
      setSaving(false)
      if (data.error) { setErr(data.error); return }
      if (!editId && data.case?.id) {
        // After create: switch to edit mode so photos can be uploaded
        setEditId(data.case.id)
        setShowCreate(false)
        setForm({ ...formWithoutId, photo_before_url: null, photo_after_url: null })
        load()
      } else {
        cancelForm(); load()
      }
    } catch (err) {
      console.error('Update case error:', err)
      setSaving(false)
      setErr('Ошибка сохранения')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить кейс?')) return
    await fetch(`/api/admin/result-cases/${id}`, { method: 'DELETE' })
    load()
  }

  async function handleToggle(c: ResultCase, field: 'is_published' | 'featured') {
    await fetch(`/api/admin/result-cases/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !c[field] }),
    })
    load()
  }

  async function handleSort(c: ResultCase, dir: 'up' | 'down') {
    const idx = cases.findIndex(x => x.id === c.id)
    const swap = dir === 'up' ? cases[idx - 1] : cases[idx + 1]
    if (!swap) return
    await Promise.all([
      fetch(`/api/admin/result-cases/${c.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: swap.sort_order }) }),
      fetch(`/api/admin/result-cases/${swap.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: c.sort_order }) }),
    ])
    load()
  }

  async function handleUploadPhoto(id: string, type: 'before' | 'after', file: File) {
    setUploading(`${id}-${type}`)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    const res = await fetch(`/api/admin/result-cases/${id}/upload-photo`, { method: 'POST', body: fd })
    setUploading(null)
    if (res.ok) load()
    else setErr('Ошибка загрузки фото')
  }

  const setF = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const toggleTag = (tag: string) => setForm(f => ({
    ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
  }))
  const toggleExtra = (i: number, v: string) => setForm(f => {
    const extras = [...f.extras]; extras[i] = v; return { ...f, extras }
  })
  const addExtra = () => setForm(f => ({ ...f, extras: [...f.extras, ''] }))
  const removeExtra = (i: number) => setForm(f => ({ ...f, extras: f.extras.filter((_, j) => j !== i) }))

  const isFormOpen = showCreate || !!editId

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        {!isFormOpen && (
          <button style={btnPrimary} onClick={() => { setShowCreate(true); setEditId(null); setForm({ ...emptyCase }) }}>
            + Новый кейс
          </button>
        )}
      </div>

      {isFormOpen && (
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-nunito)', fontSize: 15, fontWeight: 700, color: '#3D2B8A' }}>
              {editId ? 'Редактировать кейс' : 'Новый кейс'}
            </span>
            <button onClick={cancelForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7B6FAA', fontSize: 13 }}>Отмена</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>Имя *</label><input style={inp} value={form.name} onChange={e => setF('name', e.target.value)} /></div>
              <div><label style={lbl}>Бейдж (напр. 106 кг → 63 кг)</label><input style={inp} value={form.tag_badge ?? ''} onChange={e => setF('tag_badge', e.target.value)} /></div>
              <div><label style={lbl}>Число кг (напр. −43)</label><input style={inp} value={form.kg ?? ''} onChange={e => setF('kg', e.target.value)} /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>Период (напр. «за год»)</label><input style={inp} value={form.kg_period ?? ''} onChange={e => setF('kg_period', e.target.value)} /></div>
              <div><label style={lbl}>Видео URL (Kinescope)</label><input style={inp} value={form.video_url ?? ''} onChange={e => setF('video_url', e.target.value)} /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>До</label><textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={form.before_text ?? ''} onChange={e => setF('before_text', e.target.value)} /></div>
              <div><label style={lbl}>После</label><textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={form.after_text ?? ''} onChange={e => setF('after_text', e.target.value)} /></div>
            </div>

            <div><label style={lbl}>Цитата</label><textarea style={{ ...inp, height: 72, resize: 'vertical' }} value={form.quote ?? ''} onChange={e => setF('quote', e.target.value)} /></div>

            <div>
              <label style={lbl}>Дополнительные результаты</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {form.extras.map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6 }}>
                    <input style={{ ...inp, flex: 1 }} value={e} onChange={ev => toggleExtra(i, ev.target.value)} placeholder="Напр. Держит вес 4-й год" />
                    <button onClick={() => removeExtra(i)} style={{ ...btnSecondary, color: '#C0392B', borderColor: '#FFD5D5', flexShrink: 0 }}>✕</button>
                  </div>
                ))}
                <button onClick={addExtra} style={{ ...btnSecondary, alignSelf: 'flex-start' }}>+ Добавить</button>
              </div>
            </div>

            <div>
              <label style={lbl}>Теги</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {RESULT_TAGS.map(t => (
                  <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.tags.includes(t.value)} onChange={() => toggleTag(t.value)} />
                    <span style={{ fontSize: 13, color: '#2D1F6E' }}>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {editId && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {(['before', 'after'] as const).map(type => {
                  const url = type === 'before' ? form.photo_before_url : form.photo_after_url
                  const key = `${editId}-${type}`
                  return (
                    <div key={type}>
                      <label style={lbl}>Фото {type === 'before' ? '«До»' : '«После»'}</label>
                      {url && <img src={url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }} />}
                      <input type="file" accept="image/*" disabled={uploading === key}
                        onChange={e => { const f = e.target.files?.[0]; if (f && editId) handleUploadPhoto(editId, type, f) }}
                        style={{ fontSize: 12, color: '#7B6FAA', width: '100%' }}
                      />
                      {uploading === key && <span style={{ fontSize: 12, color: '#7B6FAA' }}>Загружаем...</span>}
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_published} onChange={e => setF('is_published', e.target.checked)} />
                <span style={{ fontSize: 14, color: '#2D1F6E' }}>Опубликован</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.featured} onChange={e => setF('featured', e.target.checked)} />
                <span style={{ fontSize: 14, color: '#2D1F6E' }}>Избранное (большая карточка)</span>
              </label>
            </div>

            {err && <p style={{ color: '#C0392B', fontSize: 13, margin: 0 }}>{err}</p>}
            <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1, alignSelf: 'flex-start' }}>
              {saving ? 'Сохранение...' : editId ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#7B6FAA', fontSize: 14 }}>Загрузка...</p>
      ) : cases.length === 0 ? (
        <p style={{ color: '#7B6FAA', fontSize: 14 }}>Кейсов пока нет</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cases.map((c, idx) => (
            <div key={c.id} style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => handleSort(c, 'up')} disabled={idx === 0} style={{ ...btnSecondary, padding: '4px 8px', opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                <button onClick={() => handleSort(c, 'down')} disabled={idx === cases.length - 1} style={{ ...btnSecondary, padding: '4px 8px', opacity: idx === cases.length - 1 ? 0.3 : 1 }}>↓</button>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#2D1F6E' }}>{c.name} {c.kg && <span style={{ color: '#4CAF78' }}>{c.kg}</span>}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7B6FAA' }}>
                  {c.tags.join(', ')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
                <button onClick={() => handleToggle(c, 'is_published')} style={{ ...btnSecondary, fontSize: 12, padding: '5px 10px', color: c.is_published ? '#4CAF78' : '#7B6FAA' }}>
                  {c.is_published ? '● Опубл.' : '○ Скрыт'}
                </button>
                <button onClick={() => handleToggle(c, 'featured')} style={{ ...btnSecondary, fontSize: 12, padding: '5px 10px', color: c.featured ? '#FF9F43' : '#7B6FAA' }}>
                  {c.featured ? '★ Избр.' : '☆ Обычн.'}
                </button>
                <button onClick={() => startEdit(c)} style={btnSecondary}>Изменить</button>
                <button onClick={() => handleDelete(c.id)} style={{ ...btnSecondary, color: '#C0392B', borderColor: '#FFD5D5' }}>Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab 6: Marathon ─────────────────────────────────────────────────────────

interface MarathonForm {
  title: string; subtitle: string; start_date: string; duration_days: number
  program: string[]; results: { icon: string; title: string; desc: string }[]
  for_whom: string[]
}

function MarathonTab() {
  const [form, setForm] = useState<MarathonForm>({
    title: '', subtitle: '', start_date: '', duration_days: 14, program: [''], results: [
      { icon: '⚡', title: '', desc: '' }, { icon: '⚖️', title: '', desc: '' },
      { icon: '💧', title: '', desc: '' }, { icon: '🧠', title: '', desc: '' },
    ], for_whom: [''],
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/marathon').then(r => r.json()).then((d: { marathon?: MarathonForm }) => {
      if (d.marathon) setForm({
        title: d.marathon.title ?? '',
        subtitle: d.marathon.subtitle ?? '',
        start_date: d.marathon.start_date ? String(d.marathon.start_date).slice(0, 10) : '',
        duration_days: d.marathon.duration_days ?? 14,
        program: Array.isArray(d.marathon.program) && d.marathon.program.length > 0 ? d.marathon.program : [''],
        results: Array.isArray(d.marathon.results) && d.marathon.results.length > 0 ? d.marathon.results : form.results,
        for_whom: Array.isArray(d.marathon.for_whom) && d.marathon.for_whom.length > 0 ? d.marathon.for_whom : [''],
      })
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save() {
    setSaving(true); setMsg('')
    const res = await fetch('/api/admin/marathon', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setMsg(res.ok ? 'Сохранено ✓' : 'Ошибка')
    setTimeout(() => setMsg(''), 3000)
  }

  const setField = <K extends keyof MarathonForm>(k: K, v: MarathonForm[K]) => setForm(f => ({ ...f, [k]: v }))
  const setProg = (i: number, v: string) => setField('program', form.program.map((p, j) => j === i ? v : p))
  const addProg = () => setField('program', [...form.program, ''])
  const rmProg = (i: number) => setField('program', form.program.filter((_, j) => j !== i))
  const setWhom = (i: number, v: string) => setField('for_whom', form.for_whom.map((p, j) => j === i ? v : p))
  const addWhom = () => setField('for_whom', [...form.for_whom, ''])
  const rmWhom = (i: number) => setField('for_whom', form.for_whom.filter((_, j) => j !== i))
  const setResult = (i: number, k: keyof MarathonForm['results'][0], v: string) =>
    setField('results', form.results.map((r, j) => j === i ? { ...r, [k]: v } : r))

  return (
    <div>
      <div style={card}>
        <span style={sectionTitle}>Основное</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div><label style={lbl}>Название</label><input style={inp} value={form.title} onChange={e => setField('title', e.target.value)} /></div>
          <div><label style={lbl}>Подзаголовок</label><textarea style={{ ...inp, height: 72, resize: 'vertical' }} value={form.subtitle} onChange={e => setField('subtitle', e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
            <div><label style={lbl}>Дата старта</label><input type="date" style={inp} value={form.start_date} onChange={e => setField('start_date', e.target.value)} /></div>
            <div><label style={lbl}>Длительность (дней)</label><input type="number" style={inp} value={form.duration_days} onChange={e => setField('duration_days', Number(e.target.value))} /></div>
          </div>
        </div>
      </div>

      <div style={card}>
        <span style={sectionTitle}>Программа</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {form.program.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 6 }}>
              <input style={{ ...inp, flex: 1 }} value={p} onChange={e => setProg(i, e.target.value)} />
              {form.program.length > 1 && <button onClick={() => rmProg(i)} style={{ ...btnSecondary, color: '#C0392B', borderColor: '#FFD5D5' }}>✕</button>}
            </div>
          ))}
        </div>
        <button onClick={addProg} style={{ ...btnSecondary, marginBottom: 0 }}>+ Добавить пункт</button>
      </div>

      <div style={card}>
        <span style={sectionTitle}>Результаты (4 карточки)</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          {form.results.map((r, i) => (
            <div key={i} style={{ background: '#FAF8FF', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: 6 }}>
                <div><label style={lbl}>Иконка</label><input style={inp} value={r.icon} onChange={e => setResult(i, 'icon', e.target.value)} /></div>
                <div><label style={lbl}>Заголовок</label><input style={inp} value={r.title} onChange={e => setResult(i, 'title', e.target.value)} /></div>
              </div>
              <div style={{ marginTop: 6 }}><label style={lbl}>Описание</label><input style={inp} value={r.desc} onChange={e => setResult(i, 'desc', e.target.value)} /></div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <span style={sectionTitle}>Для кого</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {form.for_whom.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 6 }}>
              <input style={{ ...inp, flex: 1 }} value={p} onChange={e => setWhom(i, e.target.value)} />
              {form.for_whom.length > 1 && <button onClick={() => rmWhom(i)} style={{ ...btnSecondary, color: '#C0392B', borderColor: '#FFD5D5' }}>✕</button>}
            </div>
          ))}
        </div>
        <button onClick={addWhom} style={{ ...btnSecondary, marginBottom: 0 }}>+ Добавить пункт</button>
      </div>

      <SaveBar saving={saving} msg={msg} onSave={save} />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { key: 'home', label: 'Главная' },
  { key: 'about', label: 'О себе' },
  { key: 'club', label: 'Клуб' },
  { key: 'banners', label: 'Баннеры блога' },
  { key: 'results', label: 'Результаты' },
  { key: 'marathon', label: 'Марафон' },
]

export default function PagesAdmin() {
  const [tab, setTab] = useState('home')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/admin" style={{ fontSize: 13, color: '#7B6FAA', textDecoration: 'none', padding: '8px 12px', borderRadius: 10, background: '#F0EEFF' }}>
          ← Админка
        </Link>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 700, color: '#3D2B8A', margin: 0, flex: 1 }}>
          Страницы сайта
        </h1>
        <Link href="/dashboard" style={{ fontSize: 13, color: '#4CAF78', textDecoration: 'none', padding: '8px 12px', borderRadius: 10, background: '#E8F5EE' }}>
          Клуб →
        </Link>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 24, borderBottom: '1.5px solid #EDE8FF', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-nunito)', fontSize: 14, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? '#3D2B8A' : '#7B6FAA',
              borderBottom: tab === t.key ? '2px solid #3D2B8A' : '2px solid transparent',
              transition: '.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'home' && <HomeTab />}
      {tab === 'about' && <AboutTab />}
      {tab === 'club' && <ClubTab />}
      {tab === 'banners' && <BannersTab />}
      {tab === 'results' && <ResultsTab />}
      {tab === 'marathon' && <MarathonTab />}
    </div>
  )
}
