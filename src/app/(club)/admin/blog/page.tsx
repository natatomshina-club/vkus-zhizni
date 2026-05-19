'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { BLOG_CATEGORIES } from '@/lib/blog-categories'
import { SILO_CONFIG } from '@/lib/silo-config'

// ─── Types ───────────────────────────────────────────────────────────────────

interface BlogPost {
  id: string; slug: string; title: string; excerpt: string | null
  content: string | null; cover_image_url: string | null; is_published: boolean
  published_at: string | null; meta_title: string | null; meta_description: string | null
  created_at: string; category: string | null; subcategory: string | null; widget_type: string | null
}

interface KeywordResult { keyword: string; cluster: string }
interface QueueItem { id: string; keyword: string; cluster_id: string | null; status: 'pending' | 'used'; created_at: string }
interface QueueCluster { cluster_id: string; keywords: QueueItem[] }
interface SuggestionEntry { id: string; keyword: string; cluster: string; query: string; created_at: string }
interface SuggestionGroup { query: string; keywords: KeywordResult[]; created_at: string }

interface SeoTopic {
  id: string; title: string; status: 'new' | 'in_progress' | 'done'
  clusters_count: number; articles_count: number; created_at: string
}
interface SeoCluster {
  id: string; topic_id: string; cluster_name: string; keywords: string[]
  main_keyword: string; status: 'available' | 'in_progress' | 'used'
  article_id: string | null; created_at: string
  topic?: { title: string }
}
interface TopicGroup { topicId: string; topicTitle: string; clusters: SeoCluster[] }

const CLUSTER_PALETTE = [
  { bg: '#EDE9FF', color: '#5B3FD4' },
  { bg: '#FFF0F5', color: '#C0395A' },
  { bg: '#E8FFF4', color: '#1A6B44' },
  { bg: '#FFF8E0', color: '#7A5500' },
  { bg: '#E8F4FF', color: '#1A4A8A' },
  { bg: '#FFF3E0', color: '#8A4A00' },
]
function clusterColor(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) & 0xFFFF
  return CLUSTER_PALETTE[h % CLUSTER_PALETTE.length]
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid var(--border)', borderRadius: 10,
  padding: '9px 12px', fontSize: 14, color: 'var(--text)', background: '#FAF8FF',
  outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4,
}
const btnPrimary: React.CSSProperties = {
  padding: '8px 20px', borderRadius: 10, background: 'var(--pur)', color: '#fff',
  fontFamily: 'var(--font-nunito)', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--border)',
  background: 'none', fontFamily: 'var(--font-nunito)', fontSize: 13, fontWeight: 600,
  color: 'var(--pur)', cursor: 'pointer',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(text: string): string {
  const map: Record<string, string> = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',
    к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
    х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  }
  return text.toLowerCase().split('').map(c => map[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

const emptyForm = {
  title: '', slug: '', excerpt: '', content: '', cover_image_url: '',
  meta_title: '', meta_description: '', is_published: false,
  category: '', subcategory: '', widget_type: '',
}

// ─── Tab components ───────────────────────────────────────────────────────────

// ── ARTICLES TAB ─────────────────────────────────────────────────────────────

function ArticlesTab() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [toggling, setToggling] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/blog')
    if (res.ok) {
      const { posts: p } = await res.json() as { posts: BlogPost[] }
      setPosts(p ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function startEdit(p: BlogPost) {
    setEditId(p.id); setShowCreate(false)
    setForm({ title: p.title, slug: p.slug, excerpt: p.excerpt ?? '', content: p.content ?? '',
      cover_image_url: p.cover_image_url ?? '', meta_title: p.meta_title ?? '',
      meta_description: p.meta_description ?? '', is_published: p.is_published,
      category: p.category ?? '', subcategory: p.subcategory ?? '', widget_type: p.widget_type ?? '' })
    setSaveErr('')
  }

  function cancelForm() {
    setEditId(null); setShowCreate(false); setForm({ ...emptyForm }); setSaveErr('')
  }

  function handleTitleChange(v: string) {
    setForm(f => ({ ...f, title: v, slug: editId ? f.slug : toSlug(v) }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.slug.trim()) { setSaveErr('Заголовок и slug обязательны'); return }
    setSaving(true); setSaveErr('')
    const res = await fetch(editId ? `/api/admin/blog/${editId}` : '/api/admin/blog', {
      method: editId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, keep_published_at: !!editId }),
    })
    const data = await res.json() as { post?: BlogPost; error?: string }
    setSaving(false)
    if (data.error) { setSaveErr(data.error); return }
    cancelForm(); load()
  }

  async function handleToggle(post: BlogPost) {
    setToggling(post.id)
    await fetch(`/api/admin/blog/${post.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !post.is_published }),
    })
    setToggling(null); load()
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
    setDeleting(false); setDeleteId(null); load()
  }

  const isFormOpen = showCreate || !!editId

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        {!isFormOpen && (
          <button style={btnPrimary}
            onClick={() => { setShowCreate(true); setEditId(null); setForm({ ...emptyForm }); setSaveErr('') }}>
            + Новая статья
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSave}
          style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-nunito)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {editId ? 'Редактировать' : 'Новая статья'}
            </h2>
            <button type="button" onClick={cancelForm}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13 }}>
              Отмена
            </button>
          </div>
          <div><label style={labelStyle}>Заголовок *</label>
            <input style={inputStyle} value={form.title} required onChange={e => handleTitleChange(e.target.value)} placeholder="Заголовок статьи" />
          </div>
          <div><label style={labelStyle}>Slug *</label>
            <input style={inputStyle} value={form.slug} required onChange={e => setForm(f => ({ ...f, slug: e.target.value.replace(/[^a-z0-9-]/g, '') }))} />
          </div>
          <div><label style={labelStyle}>Краткое описание</label>
            <textarea style={{ ...inputStyle, height: 72, resize: 'vertical' }} value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="150 символов для карточки..." />
          </div>
          <div><label style={labelStyle}>URL обложки</label>
            <input style={inputStyle} value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} placeholder="https://..." />
          </div>
          <div><label style={labelStyle}>Контент (HTML)</label>
            <textarea style={{ ...inputStyle, height: 320, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="<p>Текст статьи...</p>" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Meta title</label>
              <input style={inputStyle} value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} placeholder="SEO заголовок" />
            </div>
            <div><label style={labelStyle}>Meta description</label>
              <input style={inputStyle} value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} placeholder="SEO описание" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>SILO Раздел</label>
              <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value, subcategory: '' }))}>
                <option value="">— Без раздела —</option>
                {Object.entries(SILO_CONFIG).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.emoji} {cat.label}</option>
                ))}
                {BLOG_CATEGORIES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div><label style={labelStyle}>Подраздел</label>
              <select style={inputStyle} value={form.subcategory} onChange={e => setForm(f => ({ ...f, subcategory: e.target.value }))}>
                <option value="">— Без подраздела —</option>
                {form.category && SILO_CONFIG[form.category as keyof typeof SILO_CONFIG]
                  ? Object.entries(SILO_CONFIG[form.category as keyof typeof SILO_CONFIG].subcategories).map(([key, label]) => (
                    <option key={key} value={key}>{label as string}</option>
                  ))
                  : null
                }
              </select>
            </div>
            <div><label style={labelStyle}>Виджет</label>
              <select style={inputStyle} value={form.widget_type} onChange={e => setForm(f => ({ ...f, widget_type: e.target.value }))}>
                <option value="">— Авто —</option>
                <option value="none">Без виджета</option>
                <option value="ir_test">Тест: Инсулинорезистентность</option>
                <option value="why_test">Тест: Почему не худею</option>
                <option value="thyroid_test">Тест: Щитовидная железа</option>
                <option value="eating_test">Тест: Пищевые привычки</option>
                <option value="calc_3months">Калькулятор: план на 3 месяца</option>
              </select>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: 'var(--pur)' }} />
            <span style={{ fontFamily: 'var(--font-nunito)', fontSize: 14, color: 'var(--text)' }}>Опубликовать</span>
          </label>
          {saveErr && <p style={{ color: '#C0392B', fontSize: 13, margin: 0 }}>{saveErr}</p>}
          <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1, alignSelf: 'flex-start' }}>
            {saving ? 'Сохранение...' : editId ? 'Сохранить' : 'Создать'}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Загрузка...</p>
      ) : posts.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Статей пока нет</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {posts.map(post => (
            <div key={post.id}>
              <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: post.is_published ? '#4CAF78' : '#ccc', display: 'inline-block' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontFamily: 'var(--font-nunito)', fontSize: 15, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</p>
                  <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-nunito)', fontSize: 12, color: 'var(--muted)' }}>/{post.slug} · {formatDate(post.published_at)}{post.category ? ` · ${BLOG_CATEGORIES.find(c => c.value === post.category)?.label ?? post.category}` : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handleToggle(post)} disabled={toggling === post.id}
                    style={{ ...btnSecondary, color: post.is_published ? '#C0392B' : '#4CAF78', opacity: toggling === post.id ? 0.5 : 1 }}>
                    {post.is_published ? 'Снять' : 'Опубл.'}
                  </button>
                  <button onClick={() => startEdit(post)} style={btnSecondary}>Изменить</button>
                  <button onClick={() => setDeleteId(post.id)} style={{ ...btnSecondary, color: '#C0392B', borderColor: '#FFD5D5' }}>Удалить</button>
                </div>
              </div>
              {deleteId === post.id && (
                <div style={{ background: '#FFF5F5', border: '1.5px solid #FFD5D5', borderRadius: 12, padding: '12px 18px', marginTop: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#C0392B', flex: 1 }}>Удалить «{post.title}»?</p>
                  <button onClick={() => handleDelete(post.id)} disabled={deleting}
                    style={{ padding: '6px 16px', borderRadius: 8, background: '#C0392B', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}>
                    {deleting ? '...' : 'Удалить'}
                  </button>
                  <button onClick={() => setDeleteId(null)} style={{ ...btnSecondary, color: 'var(--muted)' }}>Отмена</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── KEYWORDS TAB ──────────────────────────────────────────────────────────────

function ClusterBadge({ cluster }: { cluster: string }) {
  const c = clusterColor(cluster)
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color, whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {cluster}
    </span>
  )
}

function KeywordsTab() {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<KeywordResult[]>([])
  const [searchErr, setSearchErr] = useState('')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [queueLoading, setQueueLoading] = useState(true)
  const [addingCluster, setAddingCluster] = useState<string | null>(null)
  const [addingKw, setAddingKw] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingClusterId, setDeletingClusterId] = useState<string | null>(null)
  const [blogTitles, setBlogTitles] = useState<string[]>([])
  const [history, setHistory] = useState<SuggestionGroup[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [clearingHistory, setClearingHistory] = useState(false)

  const loadQueue = useCallback(async () => {
    setQueueLoading(true)
    const res = await fetch('/api/admin/keyword-queue')
    if (res.ok) {
      const { items } = await res.json() as { items: QueueItem[] }
      setQueue(items ?? [])
    }
    setQueueLoading(false)
  }, [])

  const loadHistory = useCallback(async () => {
    const res = await fetch('/api/admin/keyword-suggestions')
    if (!res.ok) return
    const { suggestions } = await res.json() as { suggestions: SuggestionEntry[] }
    // Group by query, preserving order (newest first)
    const map = new Map<string, SuggestionGroup>()
    for (const s of (suggestions ?? [])) {
      if (!map.has(s.query)) {
        map.set(s.query, { query: s.query, keywords: [], created_at: s.created_at })
      }
      map.get(s.query)!.keywords.push({ keyword: s.keyword, cluster: s.cluster })
    }
    setHistory(Array.from(map.values()))
  }, [])

  useEffect(() => {
    loadQueue()
    loadHistory()
    fetch('/api/admin/blog').then(r => r.json()).then(({ posts }: { posts: { title: string }[] }) => {
      setBlogTitles((posts ?? []).map(p => p.title.toLowerCase()))
    })
  }, [loadQueue, loadHistory])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || searching) return
    setSearching(true); setSearchErr(''); setResults([])
    const res = await fetch('/api/admin/keywords', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim() }),
    })
    const data = await res.json() as { keywords?: KeywordResult[]; error?: string }
    setSearching(false)
    if (data.error) { setSearchErr(data.error); return }
    const kws = data.keywords ?? []
    setResults(kws)
    // Save to history
    if (kws.length > 0) {
      fetch('/api/admin/keyword-suggestions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), keywords: kws }),
      }).then(() => loadHistory())
    }
  }

  async function addSingleToQueue(kw: KeywordResult) {
    setAddingKw(kw.keyword)
    await fetch('/api/admin/keyword-queue', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: kw.keyword }),
    })
    setAddingKw(null); loadQueue()
  }

  async function addClusterToQueue(clusterName: string, keywords: KeywordResult[]) {
    setAddingCluster(clusterName)
    const cluster_id = crypto.randomUUID()
    await fetch('/api/admin/keyword-queue/cluster', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cluster_id, keywords: keywords.map(k => ({ keyword: k.keyword, cluster: k.cluster })) }),
    })
    setAddingCluster(null); loadQueue()
  }

  async function removeFromQueue(id: string) {
    setDeletingId(id)
    await fetch(`/api/admin/keyword-queue?id=${id}`, { method: 'DELETE' })
    setDeletingId(null); loadQueue()
  }

  async function deleteCluster(cluster_id: string) {
    setDeletingClusterId(cluster_id)
    await fetch('/api/admin/keywords', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cluster_id }),
    })
    setDeletingClusterId(null); loadQueue()
  }

  async function clearHistory() {
    if (!confirm('Очистить всю историю подбора?')) return
    setClearingHistory(true)
    await fetch('/api/admin/keyword-suggestions', { method: 'DELETE' })
    setHistory([]); setClearingHistory(false)
  }

  // Duplicate detection
  const queueKeywords = new Set(queue.map(q => q.keyword))
  const clusterIdsInQueue = new Set(queue.filter(q => q.cluster_id).map(q => q.cluster_id!))

  function isUsedInBlog(keyword: string): boolean {
    const kw = keyword.toLowerCase()
    return blogTitles.some(t => t.includes(kw) || kw.includes(t.split(' ').slice(0, 3).join(' ')))
  }

  function kwStatus(kw: KeywordResult): 'queue' | 'blog' | 'free' {
    if (queueKeywords.has(kw.keyword)) return 'queue'
    if (isUsedInBlog(kw.keyword)) return 'blog'
    return 'free'
  }

  function isClusterInQueue(keywords: KeywordResult[]): boolean {
    return keywords.every(k => queueKeywords.has(k.keyword))
  }

  // Display: results grouped by cluster (dynamic — Claude picks cluster names)
  const uniqueClusters = [...new Set(results.map(r => r.cluster))]
  const clusterGroups = uniqueClusters.map(cl => ({
    cluster: cl,
    keywords: results.filter(r => r.cluster === cl),
  }))

  // Queue grouped by cluster_id for display
  const queueClusters: QueueCluster[] = []
  const seen = new Set<string>()
  for (const item of queue) {
    if (item.cluster_id && !seen.has(item.cluster_id)) {
      seen.add(item.cluster_id)
      queueClusters.push({ cluster_id: item.cluster_id, keywords: queue.filter(q => q.cluster_id === item.cluster_id) })
    }
  }
  const soloItems = queue.filter(q => !q.cluster_id)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
      {/* Left */}
      <div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input style={{ ...inputStyle, flex: 1 }} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Введите тему, например: питание при гормональном дисбалансе" />
          <button type="submit" disabled={searching || !query.trim()}
            style={{ ...btnPrimary, flexShrink: 0, opacity: searching || !query.trim() ? 0.5 : 1 }}>
            {searching ? '⏳ Генерация...' : '✨ Подобрать ключевики'}
          </button>
        </form>

        {searchErr && <p style={{ color: '#C0392B', fontSize: 13, marginBottom: 12 }}>{searchErr}</p>}

        {/* Results grouped by cluster */}
        {clusterGroups.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {clusterGroups.map(({ cluster, keywords }) => {
              const c = clusterColor(cluster)
              const allInQueue = isClusterInQueue(keywords)
              return (
                <div key={cluster} style={{ background: '#fff', border: `1.5px solid ${c.bg}`, borderRadius: 14, overflow: 'hidden' }}>
                  {/* Cluster header */}
                  <div style={{ padding: '10px 16px', background: c.bg, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ClusterBadge cluster={cluster} />
                    <span style={{ fontSize: 13, color: c.color, fontWeight: 600 }}>{keywords.length} ключевиков</span>
                    <button
                      onClick={() => addClusterToQueue(cluster, keywords)}
                      disabled={addingCluster === cluster || allInQueue}
                      style={{
                        marginLeft: 'auto', padding: '4px 14px', borderRadius: 8,
                        border: `1.5px solid ${c.color}`, background: allInQueue ? c.bg : 'white',
                        fontSize: 12, fontWeight: 700, cursor: allInQueue ? 'default' : 'pointer',
                        color: allInQueue ? c.color : c.color,
                        opacity: addingCluster === cluster ? 0.5 : 1,
                      }}
                    >
                      {allInQueue ? '✓ Весь кластер в очереди' : addingCluster === cluster ? '...' : '+ Добавить кластер'}
                    </button>
                  </div>
                  {/* Keywords */}
                  {keywords.map((kw, i) => {
                    const status = kwStatus(kw)
                    return (
                      <div key={i} style={{ padding: '9px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ flex: 1, fontSize: 14, color: status !== 'free' ? 'var(--muted)' : 'var(--text)' }}>{kw.keyword}</span>
                        {status === 'blog' && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#9B8FCC', background: '#F0EEFF', padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>
                            Статья есть
                          </span>
                        )}
                        <button
                          onClick={() => status === 'free' && addSingleToQueue(kw)}
                          disabled={addingKw === kw.keyword || status !== 'free'}
                          style={{
                            padding: '4px 12px', borderRadius: 8, border: '1.5px solid var(--border)',
                            background: status === 'queue' ? '#F0FFF4' : 'none',
                            fontSize: 12, fontWeight: 600, flexShrink: 0,
                            cursor: status === 'free' ? 'pointer' : 'default',
                            color: status === 'queue' ? '#4CAF78' : status === 'blog' ? '#ccc' : 'var(--pur)',
                            opacity: addingKw === kw.keyword ? 0.5 : 1,
                          }}
                        >
                          {status === 'queue' ? '✓' : status === 'blog' ? '—' : '+ В очередь'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {!searching && results.length === 0 && !searchErr && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
            Введите тему — Claude подберёт 30 ключевиков по 5 кластерам
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <button onClick={() => setShowHistory(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--pur)', fontWeight: 600, padding: 0 }}>
                {showHistory ? '▾' : '▸'} История подбора ({history.length} запросов)
              </button>
              <button onClick={clearHistory} disabled={clearingHistory}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--muted)', padding: 0 }}>
                {clearingHistory ? '...' : 'Очистить'}
              </button>
            </div>
            {showHistory && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((group, i) => (
                  <div key={i} style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '8px 14px', background: '#F8F5FF', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1 }}>«{group.query}»</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {new Date(group.created_at).toLocaleDateString('ru-RU')} · {group.keywords.length} кл.
                      </span>
                      <button onClick={() => { setResults(group.keywords); setQuery(group.query) }}
                        style={{ ...btnSecondary, padding: '3px 10px', fontSize: 11 }}>
                        Загрузить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: queue */}
      <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 14, overflow: 'hidden', position: 'sticky', top: 24 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: '#F8F5FF' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            Очередь ({queue.filter(q => q.status === 'pending').length})
          </p>
        </div>
        {queueLoading ? (
          <p style={{ padding: 16, color: 'var(--muted)', fontSize: 13 }}>Загрузка...</p>
        ) : queue.length === 0 ? (
          <p style={{ padding: 16, color: 'var(--muted)', fontSize: 13 }}>Очередь пуста</p>
        ) : (
          <div style={{ maxHeight: 560, overflowY: 'auto' }}>
            {/* Cluster groups */}
            {queueClusters.map(cl => (
              <div key={cl.cluster_id} style={{ borderBottom: '2px solid var(--border)' }}>
                <div style={{ padding: '6px 12px', background: '#F8F5FF', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>КЛАСТЕР · {cl.keywords.length} кл.</span>
                  <button
                    onClick={() => deleteCluster(cl.cluster_id)}
                    disabled={deletingClusterId === cl.cluster_id}
                    style={{ marginLeft: 'auto', background: 'none', border: '1px solid #FFCDD2', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#C0392B', cursor: 'pointer', opacity: deletingClusterId === cl.cluster_id ? 0.4 : 1 }}>
                    {deletingClusterId === cl.cluster_id ? '...' : '✕ Удалить кластер'}
                  </button>
                </div>
                {cl.keywords.map(item => (
                  <div key={item.id} style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: item.status === 'used' ? '#ccc' : '#7C5CFC' }} />
                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text)', lineHeight: 1.3 }}>{item.keyword}</span>
                    <button onClick={() => removeFromQueue(item.id)} disabled={deletingId === item.id}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 15, lineHeight: 1, padding: '2px 4px', opacity: deletingId === item.id ? 0.4 : 1 }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ))}
            {/* Solo items */}
            {soloItems.map(item => (
              <div key={item.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: item.status === 'used' ? '#ccc' : '#9B8FCC' }} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', lineHeight: 1.3 }}>{item.keyword}</span>
                <button onClick={() => removeFromQueue(item.id)} disabled={deletingId === item.id}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 15, lineHeight: 1, padding: '2px 4px', opacity: deletingId === item.id ? 0.4 : 1 }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── TOPICS TAB ───────────────────────────────────────────────────────────────

function ClusterRow({ cluster, onDelete }: { cluster: SeoCluster; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)
  const statusColor: Record<string, string> = { available: '#4CAF78', in_progress: '#E8A000', used: '#aaa' }
  const statusLabel: Record<string, string> = { available: 'Доступен', in_progress: 'В работе', used: 'Использован' }

  async function del() {
    setDeleting(true)
    await fetch('/api/admin/seo-clusters', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cluster.id }),
    })
    setDeleting(false); onDelete()
  }

  return (
    <div style={{ padding: '10px 18px 10px 36px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{cluster.cluster_name}</p>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text)' }}>{cluster.main_keyword}</strong>
          {cluster.keywords.filter(k => k !== cluster.main_keyword).map((k, i) => (
            <span key={i}> · {k}</span>
          ))}
        </p>
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 12, flexShrink: 0,
        background: (statusColor[cluster.status] ?? '#aaa') + '22',
        color: statusColor[cluster.status] ?? '#aaa',
      }}>
        {statusLabel[cluster.status] ?? cluster.status}
      </span>
      <button onClick={del} disabled={deleting}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 14, padding: '2px 4px', flexShrink: 0, opacity: deleting ? 0.4 : 1 }}>
        ✕
      </button>
    </div>
  )
}

function TopicsTab() {
  const [topics, setTopics] = useState<SeoTopic[]>([])
  const [clustersByTopic, setClustersByTopic] = useState<Record<string, SeoCluster[]>>({})
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [genErr, setGenErr] = useState<Record<string, string>>({})
  const [addingCluster, setAddingCluster] = useState<string | null>(null) // topic_id with open form
  const [clusterForm, setClusterForm] = useState({ mainKeyword: '', extraKeywords: '', clusterName: '' })
  const [savingCluster, setSavingCluster] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/seo-topics')
    if (res.ok) {
      const { topics: t, clusters: c } = await res.json() as { topics: SeoTopic[]; clusters: Record<string, SeoCluster[]> }
      setTopics(t ?? [])
      setClustersByTopic(c ?? {})
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function addTopic() {
    if (!newTitle.trim() || adding) return
    setAdding(true)
    await fetch('/api/admin/seo-topics', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titles: [newTitle.trim()] }),
    })
    setNewTitle(''); setAdding(false); load()
  }

  async function addBulk() {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length || adding) return
    setAdding(true)
    await fetch('/api/admin/seo-topics', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titles: lines }),
    })
    setBulkText(''); setShowBulk(false); setAdding(false); load()
  }

  async function deleteTopic(id: string) {
    if (!confirm('Удалить тему и все её кластеры?')) return
    setDeleting(id)
    await fetch('/api/admin/seo-topics', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDeleting(null); load()
  }

  async function generateClusters(topic: SeoTopic) {
    setGenerating(topic.id)
    setGenErr(e => ({ ...e, [topic.id]: '' }))
    const res = await fetch('/api/admin/seo-clusters', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_id: topic.id, topic_title: topic.title }),
    })
    const data = await res.json() as { clusters?: SeoCluster[]; error?: string }
    if (data.error) {
      setGenErr(e => ({ ...e, [topic.id]: data.error! }))
    } else {
      setExpanded(prev => new Set([...prev, topic.id]))
    }
    setGenerating(null); load()
  }

  async function saveManualCluster(topicId: string) {
    const main = clusterForm.mainKeyword.trim()
    if (!main) return
    const extra = clusterForm.extraKeywords.split('\n').map(l => l.trim()).filter(Boolean)
    const keywords = [main, ...extra]
    const clusterName = clusterForm.clusterName.trim() || main
    setSavingCluster(true)
    await fetch('/api/admin/seo-clusters/manual', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_id: topicId, main_keyword: main, keywords, cluster_name: clusterName }),
    })
    setSavingCluster(false)
    setAddingCluster(null)
    setClusterForm({ mainKeyword: '', extraKeywords: '', clusterName: '' })
    load()
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const topicStatusColor: Record<string, string> = { new: '#9B8FCC', in_progress: '#E8A000', done: '#4CAF78' }
  const topicStatusLabel: Record<string, string> = { new: 'Новая', in_progress: 'В работе', done: 'Готово' }

  return (
    <div>
      {/* Add area */}
      <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: showBulk ? 12 : 0 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTopic()}
            placeholder="Название темы, например: питание при гипотиреозе"
          />
          <button onClick={addTopic} disabled={!newTitle.trim() || adding}
            style={{ ...btnPrimary, flexShrink: 0, opacity: !newTitle.trim() || adding ? 0.5 : 1 }}>
            {adding && !showBulk ? '...' : '+ Добавить тему'}
          </button>
          <button onClick={() => setShowBulk(v => !v)} style={{ ...btnSecondary, flexShrink: 0 }}>
            {showBulk ? 'Свернуть' : 'Добавить список'}
          </button>
        </div>

        {showBulk && (
          <div>
            <textarea
              style={{ ...inputStyle, height: 120, resize: 'vertical', marginBottom: 8 }}
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={'питание при диабете 2 типа\nпродукты для иммунитета\nкак похудеть после 40...'}
            />
            <button
              onClick={addBulk}
              disabled={!bulkText.trim() || adding}
              style={{ ...btnPrimary, opacity: !bulkText.trim() || adding ? 0.5 : 1 }}
            >
              {adding ? '...' : `+ Добавить ${bulkText.split('\n').filter(l => l.trim()).length} тем`}
            </button>
          </div>
        )}
      </div>

      {/* Topics list */}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Загрузка...</p>
      ) : topics.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: 40 }}>
          Тем пока нет — добавьте первую выше
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {topics.map(topic => {
            const topicClusters = clustersByTopic[topic.id] ?? []
            const isExpanded = expanded.has(topic.id)
            const isGenerating = generating === topic.id
            const err = genErr[topic.id]
            const available = topicClusters.filter(c => c.status === 'available').length

            return (
              <div key={topic.id} style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                {/* Topic row */}
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => toggleExpand(topic.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, padding: '0 4px', flexShrink: 0 }}
                  >
                    {isExpanded ? '▾' : '▸'}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{topic.title}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                      {topic.clusters_count} кластеров · {available} доступно · {topic.articles_count} статей
                    </p>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, flexShrink: 0,
                    background: (topicStatusColor[topic.status] ?? '#aaa') + '22',
                    color: topicStatusColor[topic.status] ?? '#aaa',
                  }}>
                    {topicStatusLabel[topic.status] ?? topic.status}
                  </span>
                  <button
                    onClick={() => generateClusters(topic)}
                    disabled={isGenerating}
                    style={{ ...btnPrimary, fontSize: 13, padding: '7px 14px', opacity: isGenerating ? 0.5 : 1, flexShrink: 0 }}
                  >
                    {isGenerating ? '⏳ Генерация...' : '✨ Сгенерировать кластеры'}
                  </button>
                  <button
                    onClick={() => deleteTopic(topic.id)}
                    disabled={deleting === topic.id}
                    style={{ ...btnSecondary, color: '#C0392B', borderColor: '#FFD5D5', fontSize: 13, padding: '7px 12px', flexShrink: 0, opacity: deleting === topic.id ? 0.5 : 1 }}
                  >
                    {deleting === topic.id ? '...' : 'Удалить'}
                  </button>
                </div>

                {err && (
                  <p style={{ margin: '0 18px 10px', fontSize: 12, color: '#C0392B', background: '#FFF5F5', padding: '8px 12px', borderRadius: 8 }}>
                    {err}
                  </p>
                )}

                {/* Clusters */}
                {isExpanded && (
                  <div style={{ borderTop: '1.5px solid var(--border)', background: '#FAF8FF' }}>
                    {topicClusters.length === 0 && addingCluster !== topic.id && (
                      <p style={{ padding: '12px 18px', margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                        Нет кластеров — нажмите «Сгенерировать кластеры» или добавьте вручную
                      </p>
                    )}
                    {topicClusters.map(cl => (
                      <ClusterRow key={cl.id} cluster={cl} onDelete={load} />
                    ))}

                    {/* Manual add form */}
                    {addingCluster === topic.id ? (
                      <div style={{ padding: '14px 18px', borderTop: topicClusters.length > 0 ? '1px solid var(--border)' : undefined, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--pur)' }}>НОВЫЙ КЛАСТЕР</p>
                        <div>
                          <label style={labelStyle}>Главный ключевик *</label>
                          <input
                            style={inputStyle}
                            value={clusterForm.mainKeyword}
                            onChange={e => setClusterForm(f => ({ ...f, mainKeyword: e.target.value }))}
                            placeholder="питание при гипотиреозе у женщин"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Дополнительные ключевики (каждый с новой строки)</label>
                          <textarea
                            style={{ ...inputStyle, height: 96, resize: 'vertical' }}
                            value={clusterForm.extraKeywords}
                            onChange={e => setClusterForm(f => ({ ...f, extraKeywords: e.target.value }))}
                            placeholder={'что есть при гипотиреозе\nпродукты для щитовидной железы\nкак похудеть при гипотиреозе'}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Название кластера (необязательно)</label>
                          <input
                            style={inputStyle}
                            value={clusterForm.clusterName}
                            onChange={e => setClusterForm(f => ({ ...f, clusterName: e.target.value }))}
                            placeholder="автоматически = главный ключевик"
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => saveManualCluster(topic.id)}
                            disabled={savingCluster || !clusterForm.mainKeyword.trim()}
                            style={{ ...btnPrimary, fontSize: 13, padding: '7px 16px', opacity: savingCluster || !clusterForm.mainKeyword.trim() ? 0.5 : 1 }}
                          >
                            {savingCluster ? '...' : 'Сохранить'}
                          </button>
                          <button
                            onClick={() => { setAddingCluster(null); setClusterForm({ mainKeyword: '', extraKeywords: '', clusterName: '' }) }}
                            style={{ ...btnSecondary, fontSize: 13 }}
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '10px 18px' }}>
                        <button
                          onClick={() => { setAddingCluster(topic.id); setClusterForm({ mainKeyword: '', extraKeywords: '', clusterName: '' }) }}
                          style={{ background: 'none', border: '1.5px dashed var(--border)', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: 'var(--pur)', cursor: 'pointer', fontFamily: 'var(--font-nunito)', fontWeight: 600 }}
                        >
                          + Добавить кластер вручную
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── GENERATOR TAB ────────────────────────────────────────────────────────────

type ArticleImage = { position: string; url: string; alt: string; prompt_en: string }
type ArticleData = {
  title: string; slug: string; excerpt: string; content: string
  meta_title: string; meta_description: string
  cover_image_url?: string; images?: ArticleImage[]
}

function GeneratorTab({ onSaved }: { onSaved: () => void }) {
  const [topicGroups, setTopicGroups] = useState<TopicGroup[]>([])
  const [selectedClusterId, setSelectedClusterId] = useState('')
  const [manualKeyword, setManualKeyword] = useState('')
  const [wordCount, setWordCount] = useState('1800')
  const [generating, setGenerating] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [genProgress, setGenProgress] = useState<string[]>([])
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [artImages, setArtImages] = useState<ArticleImage[]>([])
  const [regenLoading, setRegenLoading] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [genErr, setGenErr] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', slug: '', excerpt: '', content: '', meta_title: '', meta_description: '', cover_image_url: '' })
  const streamRef = useRef<HTMLDivElement>(null)

  const loadClusters = useCallback(() => {
    fetch('/api/admin/seo-clusters?status=available')
      .then(r => r.json())
      .then(({ clusters }: { clusters: SeoCluster[] }) => {
        const map: Record<string, TopicGroup> = {}
        for (const cl of clusters ?? []) {
          const tid = cl.topic_id
          if (!map[tid]) {
            map[tid] = { topicId: tid, topicTitle: cl.topic?.title ?? tid, clusters: [] }
          }
          map[tid].clusters.push(cl)
        }
        setTopicGroups(Object.values(map))
      })
  }, [])

  useEffect(() => { loadClusters() }, [loadClusters])

  const allClusters = topicGroups.flatMap(g => g.clusters)
  const selectedCluster = allClusters.find(c => c.id === selectedClusterId)
  const activeKeyword = selectedCluster ? selectedCluster.main_keyword : manualKeyword

  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight
  }, [streamText])

  async function generate() {
    if (!activeKeyword || generating) return
    setGenerating(true); setStreamText(''); setArticle(null); setGenErr(''); setSavedId(null)
    setEditMode(false); setGenProgress([]); setArtImages([])

    const payload = selectedClusterId
      ? { seo_cluster_id: selectedClusterId, wordCount: parseInt(wordCount) || 1800 }
      : { keyword: manualKeyword, wordCount: parseInt(wordCount) || 1800 }

    const res = await fetch('/api/admin/generate-article', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.body) { setGenErr('Нет ответа от сервера'); setGenerating(false); return }

    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (!payload || payload === '[DONE]') continue
        try {
          const evt = JSON.parse(payload) as {
            text?: string; done?: boolean; article?: ArticleData; error?: string
            progress?: string; imageProgress?: { position: string; url: string }; raw?: string
          }
          if (evt.error) { setGenErr(evt.error + (evt.raw ? `\n\nRaw: ${evt.raw}` : '')); setGenerating(false); return }
          if (evt.text) setStreamText(prev => prev + evt.text)
          if (evt.progress) setGenProgress(prev => [...prev, evt.progress!])
          if (evt.imageProgress) {
            const pos = evt.imageProgress.position
            const label: Record<string, string> = { cover: 'Обложка', after_intro: 'После вступления', mid_article: 'Середина', conclusion: 'Заключение' }
            setGenProgress(prev => [...prev, `✅ ${label[pos] ?? pos} готова`])
          }
          if (evt.done && evt.article) {
            setArticle(evt.article)
            setEditForm({
              title: evt.article.title,
              slug: evt.article.slug,
              excerpt: evt.article.excerpt,
              content: evt.article.content,
              meta_title: evt.article.meta_title,
              meta_description: evt.article.meta_description,
              cover_image_url: evt.article.cover_image_url ?? '',
            })
            setArtImages(evt.article.images ?? [])
            setEditMode(true)
          }
        } catch { /* skip malformed */ }
      }
    }
    setGenerating(false)
  }

  async function regenImage(img: ArticleImage) {
    if (!article) return
    setRegenLoading(r => ({ ...r, [img.position]: true }))
    try {
      const res = await fetch('/api/admin/generate-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_en: img.prompt_en, position: img.position, slug: article.slug, alt: img.alt }),
      })
      const json = await res.json() as { url?: string; error?: string }
      if (json.url) {
        const oldUrl = img.url
        setArtImages(prev => prev.map(i => i.position === img.position ? { ...i, url: json.url! } : i))
        if (img.position === 'cover') {
          setEditForm(f => ({ ...f, cover_image_url: json.url! }))
        } else {
          setEditForm(f => ({ ...f, content: f.content.replace(oldUrl, json.url!) }))
        }
      } else {
        alert(json.error ?? 'Ошибка перегенерации')
      }
    } catch {
      alert('Ошибка сети')
    } finally {
      setRegenLoading(r => ({ ...r, [img.position]: false }))
    }
  }

  async function handleSave() {
    const data = editMode ? editForm : article
    if (!data) return
    setSaving(true)
    const res = await fetch('/api/admin/blog', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        is_published: false,
        main_keyword: selectedCluster?.main_keyword ?? null,
        cluster_name: selectedCluster?.cluster_name ?? null,
      }),
    })
    const json = await res.json() as { post?: { id: string }; error?: string }
    setSaving(false)
    if (json.post) {
      setSavedId(json.post.id)
      // Mark seo_cluster as used
      if (selectedClusterId) {
        await fetch('/api/admin/seo-clusters', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedClusterId, status: 'used', article_id: json.post.id }),
        })
        loadClusters()
      }
      onSaved()
    }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Controls */}
      <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Кластер *</label>
            {allClusters.length > 0 ? (
              <select
                style={inputStyle}
                value={selectedClusterId}
                onChange={e => { setSelectedClusterId(e.target.value); setManualKeyword('') }}
              >
                <option value="">— выбрать кластер —</option>
                {topicGroups.map(g => (
                  <optgroup key={g.topicId} label={g.topicTitle}>
                    {g.clusters.map(cl => (
                      <option key={cl.id} value={cl.id}>
                        📦 {cl.main_keyword} + ещё {cl.keywords.length - 1}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            ) : (
              <input style={inputStyle} value={manualKeyword} onChange={e => setManualKeyword(e.target.value)}
                placeholder="нет доступных кластеров — введите вручную" />
            )}
          </div>
          <div>
            <label style={labelStyle}>Объём (слов)</label>
            <input style={inputStyle} type="number" value={wordCount} min={500} max={4000}
              onChange={e => setWordCount(e.target.value)} />
          </div>
        </div>

        {/* Manual keyword when clusters available */}
        {allClusters.length > 0 && !selectedClusterId && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Или введите ключевое слово вручную</label>
            <input style={inputStyle} value={manualKeyword} onChange={e => setManualKeyword(e.target.value)}
              placeholder="введите ключевое слово" />
          </div>
        )}

        {/* Cluster keywords preview */}
        {selectedCluster && (
          <div style={{ background: '#F8F5FF', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
              {selectedCluster.cluster_name.toUpperCase()} — {selectedCluster.keywords.length} ключевиков
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
              <strong>{selectedCluster.main_keyword}</strong>
              {selectedCluster.keywords.filter(k => k !== selectedCluster.main_keyword).length > 0 && (
                <span style={{ color: 'var(--muted)' }}>
                  {' · '}{selectedCluster.keywords.filter(k => k !== selectedCluster.main_keyword).join(' · ')}
                </span>
              )}
            </p>
          </div>
        )}

        <button onClick={generate} disabled={generating || !activeKeyword}
          style={{ ...btnPrimary, opacity: generating || !activeKeyword ? 0.5 : 1 }}>
          {generating
            ? (genProgress.length > 0 ? '🎨 Генерируем картинки...' : '⏳ Генерируем текст...')
            : '✨ Сгенерировать статью'}
        </button>
      </div>

      {genErr && <pre style={{ color: '#C0392B', fontSize: 12, marginBottom: 12, whiteSpace: 'pre-wrap', background: '#FFF5F5', padding: 12, borderRadius: 8 }}>{genErr}</pre>}

      {/* Stream preview — text phase */}
      {(generating || streamText) && !article && genProgress.length === 0 && (
        <div ref={streamRef}
          style={{ background: '#1a1a2e', color: '#e0e0ff', borderRadius: 12, padding: 20, marginBottom: 20, height: 300, overflowY: 'auto', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {streamText || <span style={{ opacity: 0.5 }}>Генерация началась...</span>}
          {generating && <span>▌</span>}
        </div>
      )}

      {/* Image generation progress */}
      {genProgress.length > 0 && !article && (
        <div style={{ background: '#1a1a2e', color: '#e0e0ff', borderRadius: 12, padding: 20, marginBottom: 20, fontFamily: 'monospace', fontSize: 13, lineHeight: 2 }}>
          {genProgress.map((msg, i) => <div key={i}>{msg}</div>)}
          {generating && <div style={{ opacity: 0.5 }}>⏳ Ждём...</div>}
        </div>
      )}

      {/* Result */}
      {article && !editMode && (
        <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Статья готова</h3>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={() => { setEditMode(true); setEditForm(f => ({ ...f, ...article, cover_image_url: article.cover_image_url ?? '' })) }} style={btnSecondary}>Редактировать</button>
              {savedId ? (
                <span style={{ padding: '8px 16px', borderRadius: 10, background: '#F0FFF4', color: '#4CAF78', fontSize: 13, fontWeight: 700 }}>✓ Сохранено</span>
              ) : (
                <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, background: '#4CAF78', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Сохранение...' : 'Сохранить в черновики'}
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              { l: 'TITLE', v: article.title },
              { l: 'SLUG', v: article.slug },
              { l: 'META TITLE', v: article.meta_title },
              { l: 'META DESC', v: article.meta_description },
            ].map(({ l, v }) => (
              <div key={l} style={{ background: '#FAF8FF', borderRadius: 8, padding: '8px 12px' }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>{l}</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text)' }}>{v || '—'}</p>
              </div>
            ))}
          </div>
          <div><p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>EXCERPT</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>{article.excerpt || '—'}</p>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editMode && article && (
        <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Редактирование</h3>
            <button onClick={() => setEditMode(false)} style={{ marginLeft: 'auto', ...btnSecondary }}>Отмена</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={labelStyle}>Заголовок</label>
              <input style={inputStyle} value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value, slug: toSlug(e.target.value) }))} />
            </div>
            <div><label style={labelStyle}>Slug</label>
              <input style={inputStyle} value={editForm.slug} onChange={e => setEditForm(f => ({ ...f, slug: e.target.value.replace(/[^a-z0-9-]/g, '') }))} />
            </div>
            <div><label style={labelStyle}>Excerpt</label>
              <textarea style={{ ...inputStyle, height: 72, resize: 'vertical' }} value={editForm.excerpt} onChange={e => setEditForm(f => ({ ...f, excerpt: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Meta title</label>
                <input style={inputStyle} value={editForm.meta_title} onChange={e => setEditForm(f => ({ ...f, meta_title: e.target.value }))} />
              </div>
              <div><label style={labelStyle}>Meta description</label>
                <input style={inputStyle} value={editForm.meta_description} onChange={e => setEditForm(f => ({ ...f, meta_description: e.target.value }))} />
              </div>
            </div>
            <div><label style={labelStyle}>Контент (HTML)</label>
              <textarea style={{ ...inputStyle, height: 360, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
                value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} />
            </div>

            {/* Images */}
            {artImages.length > 0 && (
              <div>
                <label style={labelStyle}>КАРТИНКИ ({artImages.length})</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {artImages.map(img => {
                    const label: Record<string, string> = { cover: 'Обложка (cover)', after_intro: 'После вступления', mid_article: 'Середина статьи', conclusion: 'Перед концом' }
                    const isLoading = !!regenLoading[img.position]
                    const currentUrl = artImages.find(i => i.position === img.position)?.url ?? img.url
                    return (
                      <div key={img.position} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#FAF8FF', borderRadius: 10, padding: 12 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={currentUrl} alt={img.alt}
                          style={{ width: 120, height: img.position === 'cover' ? 120 : 68, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>{label[img.position] ?? img.position}</p>
                          <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>{img.alt}</p>
                          <button onClick={() => regenImage(img)} disabled={isLoading}
                            style={{ ...btnSecondary, fontSize: 12, padding: '5px 10px', opacity: isLoading ? 0.6 : 1 }}>
                            {isLoading ? '⏳ Генерация...' : '🔄 Перегенерировать'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              {savedId ? (
                <span style={{ padding: '8px 16px', borderRadius: 10, background: '#F0FFF4', color: '#4CAF78', fontSize: 13, fontWeight: 700 }}>✓ Сохранено</span>
              ) : (
                <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, background: '#4CAF78', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Сохранение...' : 'Сохранить в черновики'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── SETTINGS TAB ──────────────────────────────────────────────────────────────

function SettingsTab() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/seo-settings').then(r => r.json()).then(({ prompt: p }: { prompt: string }) => {
      setPrompt(p)
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setSaving(true); setSaved(false)
    const res = await fetch('/api/admin/seo-settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    if (res.ok) setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleReset() {
    if (!confirm('Сбросить промпт к стандартному?')) return
    setSaving(true)
    const res = await fetch('/api/admin/seo-settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset: true }),
    })
    const { prompt: p } = await res.json() as { prompt: string }
    setPrompt(p)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ background: '#F0EEFF', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#3D2B8A', lineHeight: 1.6 }}>
        <strong>Переменные промпта:</strong>{' '}
        <code style={{ background: '#E8E0FF', padding: '1px 6px', borderRadius: 4 }}>{'{main_keyword}'}</code> — главный ключевик,{' '}
        <code style={{ background: '#E8E0FF', padding: '1px 6px', borderRadius: 4 }}>{'{keywords_list}'}</code> — все ключи кластера через запятую,{' '}
        <code style={{ background: '#E8E0FF', padding: '1px 6px', borderRadius: 4 }}>{'{word_count}'}</code> — нужное число слов
      </div>
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Загрузка...</p>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Промпт генератора статей</label>
            <textarea
              style={{ ...inputStyle, height: 480, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}
              value={prompt} onChange={e => setPrompt(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Сохранение...' : 'Сохранить промпт'}
            </button>
            <button onClick={handleReset} disabled={saving} style={{ ...btnSecondary, color: 'var(--muted)' }}>
              Сбросить к дефолтному
            </button>
            {saved && <span style={{ fontSize: 13, color: '#4CAF78', fontWeight: 700 }}>✓ Сохранено</span>}
          </div>
        </>
      )}
    </div>
  )
}

// ─── DRAFTS TAB ──────────────────────────────────────────────────────────────

function DraftsTab() {
  const [drafts, setDrafts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [editDraft, setEditDraft] = useState<BlogPost | null>(null)
  const [form, setForm] = useState({ title: '', excerpt: '', meta_title: '', meta_description: '', content: '' })
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [publishing, setPublishing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/blog')
    if (res.ok) {
      const { posts } = await res.json() as { posts: BlogPost[] }
      setDrafts((posts ?? []).filter(p => !p.is_published))
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openEdit(d: BlogPost) {
    setEditDraft(d)
    setForm({ title: d.title, excerpt: d.excerpt ?? '', meta_title: d.meta_title ?? '', meta_description: d.meta_description ?? '', content: d.content ?? '' })
    setSaveErr('')
  }

  async function handleSave() {
    if (!editDraft) return
    setSaving(true); setSaveErr('')
    const res = await fetch(`/api/admin/blog/${editDraft.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json() as { error?: string }
    setSaving(false)
    if (data.error) { setSaveErr(data.error); return }
    setEditDraft(null)
    load()
  }

  async function handlePublish(id: string) {
    if (!confirm('Опубликовать статью? Она станет видна на сайте.')) return
    setPublishing(id)
    await fetch(`/api/admin/blog/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: true }),
    })
    setPublishing(null)
    setDrafts(prev => prev.filter(d => d.id !== id))
    showToast('Статья опубликована ✓')
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Удалить черновик «${title}»? Это действие необратимо.`)) return
    setDeleting(id)
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
    setDeleting(null)
    setDrafts(prev => prev.filter(d => d.id !== id))
  }

  const charColor = (len: number, max: number) =>
    len > max ? '#E53E3E' : len > max * 0.9 ? '#D97706' : 'var(--muted)'

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 999,
          background: '#1A5C3A', color: '#fff', padding: '12px 20px',
          borderRadius: 12, fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }}>
          {toast}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Загрузка...</p>
      ) : drafts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <p style={{ fontSize: 15 }}>Черновиков нет</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {drafts.map(d => (
            <div key={d.id} style={{
              background: '#fff', border: '1.5px solid var(--border)',
              borderRadius: 14, padding: '20px 24px',
            }}>
              {/* Title + date */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>
                  {d.title}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', paddingTop: 2 }}>
                  {formatDate(d.created_at)}
                </span>
              </div>

              {/* Excerpt */}
              {d.excerpt && (
                <p style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                  {d.excerpt}
                </p>
              )}

              {/* Meta info */}
              {(d.meta_title || d.meta_description) && (
                <div style={{ background: '#FAF8FF', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                  {d.meta_title && (
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--muted)' }}>
                      <strong>meta_title:</strong> {d.meta_title}
                    </p>
                  )}
                  {d.meta_description && (
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>
                      <strong>meta_description:</strong> {d.meta_description}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => openEdit(d)} style={btnSecondary}>
                  ✏️ Редактировать
                </button>
                <button
                  onClick={() => handlePublish(d.id)}
                  disabled={publishing === d.id}
                  style={{ ...btnPrimary, background: '#1A5C3A', opacity: publishing === d.id ? 0.6 : 1 }}
                >
                  {publishing === d.id ? 'Публикуем...' : '🚀 Опубликовать'}
                </button>
                <button
                  onClick={() => handleDelete(d.id, d.title)}
                  disabled={deleting === d.id}
                  style={{ ...btnSecondary, color: '#C0392B', borderColor: '#FECACA', opacity: deleting === d.id ? 0.6 : 1 }}
                >
                  {deleting === d.id ? 'Удаляем...' : '🗑 Удалить'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editDraft && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 16,
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '28px 32px',
            width: '100%', maxWidth: 680, maxHeight: '90dvh', overflowY: 'auto',
            fontFamily: 'var(--font-nunito)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-unbounded)' }}>
                ✏️ Редактировать черновик
              </h2>
              <button onClick={() => setEditDraft(null)} style={{ background: '#F0EEFF', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: 'var(--pur)' }}>✕</button>
            </div>

            <label style={labelStyle}>Заголовок</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ ...inputStyle, marginBottom: 14 }} />

            <label style={labelStyle}>Анонс (excerpt)</label>
            <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical', marginBottom: 14 }} />

            <label style={labelStyle}>
              meta_title&nbsp;
              <span style={{ color: charColor(form.meta_title.length, 60) }}>
                {form.meta_title.length}/60
              </span>
            </label>
            <input value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} style={{ ...inputStyle, marginBottom: 14 }} />

            <label style={labelStyle}>
              meta_description&nbsp;
              <span style={{ color: charColor(form.meta_description.length, 160) }}>
                {form.meta_description.length}/160
              </span>
            </label>
            <textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical', marginBottom: 14 }} />

            <label style={labelStyle}>HTML контент</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={12} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, marginBottom: 14 }} />

            {saveErr && <p style={{ color: '#E53E3E', fontSize: 13, marginBottom: 10 }}>{saveErr}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditDraft(null)} style={btnSecondary}>Отмена</button>
              <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Сохраняем...' : '💾 Сохранить черновик'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── HUBS TAB ──────────────────────────────────────────────────────────────────

interface HubRecord {
  id?: string
  category: string
  is_ready: boolean
  is_indexed: boolean
  meta_title: string | null
  meta_description: string | null
  content_html?: string | null
  updated_at?: string | null
}

const SILO_CATEGORIES = Object.keys(SILO_CONFIG) as (keyof typeof SILO_CONFIG)[]

function HubsTab() {
  const [hubs, setHubs] = useState<HubRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editCategory, setEditCategory] = useState<string | null>(null)
  const [form, setForm] = useState({ content_html: '', meta_title: '', meta_description: '', is_ready: false, is_indexed: false })
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [toggling, setToggling] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/blog-hubs')
    if (res.ok) {
      const { hubs: h } = await res.json() as { hubs: HubRecord[] }
      setHubs(h ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function getHub(category: string): HubRecord | undefined {
    return hubs.find(h => h.category === category)
  }

  async function openEdit(category: string) {
    setEditCategory(category)
    setSaveErr('')
    const existing = getHub(category)
    if (existing && existing.content_html !== undefined) {
      setForm({
        content_html: existing.content_html ?? '',
        meta_title: existing.meta_title ?? '',
        meta_description: existing.meta_description ?? '',
        is_ready: existing.is_ready,
        is_indexed: existing.is_indexed,
      })
      return
    }
    // Load full content_html from API
    setLoadingEdit(true)
    const res = await fetch(`/api/admin/blog-hubs?category=${encodeURIComponent(category)}`)
    if (res.ok) {
      const { hubs: h } = await res.json() as { hubs: HubRecord[] }
      const hub = (h ?? []).find((x: HubRecord) => x.category === category)
      setForm({
        content_html: hub?.content_html ?? '',
        meta_title: hub?.meta_title ?? '',
        meta_description: hub?.meta_description ?? '',
        is_ready: hub?.is_ready ?? false,
        is_indexed: hub?.is_indexed ?? false,
      })
    } else {
      setForm({ content_html: '', meta_title: '', meta_description: '', is_ready: false, is_indexed: false })
    }
    setLoadingEdit(false)
  }

  async function handleSave(publish?: boolean) {
    if (!editCategory) return
    setSaving(true); setSaveErr('')
    try {
      const body = {
        category: editCategory,
        content_html: form.content_html,
        meta_title: form.meta_title,
        meta_description: form.meta_description,
        is_ready: publish !== undefined ? publish : form.is_ready,
        is_indexed: form.is_indexed,
      }
      const res = await fetch('/api/admin/blog-hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { error?: string }
      if (data.error) { setSaveErr(data.error); return }
      setEditCategory(null)
      load()
      showToast(publish ? 'Хаб опубликован ✓' : 'Сохранено ✓')
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Ошибка сети')
    } finally {
      setSaving(false)
    }
  }

  async function toggleReady(category: string, current: boolean) {
    setToggling(category)
    await fetch('/api/admin/blog-hubs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, is_ready: !current }),
    })
    setToggling(null)
    load()
  }

  function fmtDate(iso: string | null | undefined) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 999,
          background: '#1A5C3A', color: '#fff', padding: '12px 20px',
          borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,.15)',
        }}>
          {toast}
        </div>
      )}

      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
        Контент хабов категорий (Pillar-статьи). Каждый хаб соответствует одному SILO в структуре блога.
      </p>

      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Загрузка...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SILO_CATEGORIES.map(catKey => {
            const cat = SILO_CONFIG[catKey]
            const hub = getHub(catKey)
            const isReady = hub?.is_ready ?? false
            const isIndexed = hub?.is_indexed ?? false
            const statusDot = !isReady ? '#ccc' : isIndexed ? '#4CAF78' : '#F5A623'
            const statusLabel = !isReady ? '🔴 Черновик' : isIndexed ? '🟢 Опубликован и индексируется' : '🟡 Опубликован, не индексируется'
            return (
              <div key={catKey} style={{
                background: '#fff', border: '1.5px solid var(--border)',
                borderRadius: 14, padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: statusDot,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                    {cat.emoji} {cat.label}
                    <code style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8, fontWeight: 400 }}>/blog/{catKey}/</code>
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                    {statusLabel} · Обновлён: {fmtDate(hub?.updated_at)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                  <button onClick={() => openEdit(catKey)} style={btnSecondary}>✏️ Редактировать</button>
                  <button
                    onClick={() => toggleReady(catKey, isReady)}
                    disabled={toggling === catKey}
                    style={{ ...btnSecondary, color: isReady ? '#C0392B' : '#4CAF78', opacity: toggling === catKey ? 0.5 : 1 }}
                  >
                    {toggling === catKey ? '...' : isReady ? 'Снять' : 'Опубликовать'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editCategory && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 16,
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '28px 32px',
            width: '100%', maxWidth: 820, maxHeight: '92dvh', overflowY: 'auto',
            fontFamily: 'var(--font-nunito)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-unbounded)' }}>
                ✏️ Хаб: {SILO_CONFIG[editCategory as keyof typeof SILO_CONFIG]?.emoji} {SILO_CONFIG[editCategory as keyof typeof SILO_CONFIG]?.label}
              </h2>
              <button onClick={() => setEditCategory(null)} style={{ background: '#F0EEFF', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: 'var(--pur)' }}>✕</button>
            </div>

            {loadingEdit ? (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Загрузка...</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>meta_title (необязательно)</label>
                    <input
                      value={form.meta_title}
                      onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                      placeholder="Переопределить SEO-заголовок"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>meta_description (необязательно)</label>
                    <input
                      value={form.meta_description}
                      onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                      placeholder="Переопределить SEO-описание"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <label style={labelStyle}>
                  HTML-контент Pillar-статьи
                  <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#9B8FCC' }}>
                    (используй маркер <code style={{ background: '#F0EEFF', padding: '1px 6px', borderRadius: 4 }}>&lt;!-- SUBCATEGORIES_PLACEHOLDER --&gt;</code> для вставки карточек подкатегорий)
                  </span>
                </label>
                <textarea
                  value={form.content_html}
                  onChange={e => setForm(f => ({ ...f, content_html: e.target.value }))}
                  placeholder="<div class=&quot;kratko-block&quot;>...</div>"
                  rows={18}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, marginBottom: 14 }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.is_ready}
                      onChange={e => setForm(f => ({ ...f, is_ready: e.target.checked, is_indexed: e.target.checked ? f.is_indexed : false }))}
                      style={{ width: 16, height: 16, accentColor: 'var(--pur)' }}
                    />
                    <span style={{ fontFamily: 'var(--font-nunito)', fontSize: 14, color: 'var(--text)' }}>
                      Опубликован — контент виден на сайте
                    </span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: form.is_ready ? 'pointer' : 'not-allowed', opacity: form.is_ready ? 1 : 0.45 }}>
                    <input
                      type="checkbox"
                      checked={form.is_indexed}
                      disabled={!form.is_ready}
                      onChange={e => setForm(f => ({ ...f, is_indexed: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: 'var(--pur)', marginTop: 2, flexShrink: 0 }}
                    />
                    <div>
                      <span style={{ fontFamily: 'var(--font-nunito)', fontSize: 14, color: 'var(--text)', display: 'block' }}>
                        Разрешить индексацию — страница попадёт в sitemap и Яндекс/Google
                      </span>
                      <span style={{ fontFamily: 'var(--font-nunito)', fontSize: 12, color: 'var(--muted)', display: 'block', marginTop: 2 }}>
                        Откройте индексацию когда под хабом накопится 8+ статей в подкатегориях
                      </span>
                    </div>
                  </label>
                </div>

                {saveErr && <p style={{ color: '#E53E3E', fontSize: 13, marginBottom: 10 }}>{saveErr}</p>}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setEditCategory(null)} style={btnSecondary}>Отмена</button>
                  <button onClick={() => handleSave()} disabled={saving} style={{ ...btnSecondary, opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Сохраняем...' : '💾 Сохранить'}
                  </button>
                  <button onClick={() => handleSave(true)} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                    {saving ? '...' : '🚀 Сохранить и опубликовать'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── SUBCATEGORY HUBS TAB ──────────────────────────────────────────────────────

interface SubHubRecord {
  id?: string
  category: string
  subcategory: string
  is_ready: boolean
  is_indexed: boolean
  meta_title: string | null
  meta_description: string | null
  content_html?: string | null
  updated_at?: string | null
}

function SubcategoryHubsTab() {
  const [hubs, setHubs] = useState<SubHubRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editKey, setEditKey] = useState<{ category: string; subcategory: string } | null>(null)
  const [form, setForm] = useState({ content_html: '', meta_title: '', meta_description: '', is_ready: false, is_indexed: false })
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [toast, setToast] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/blog-subcategory-hubs')
    if (res.ok) {
      const { hubs: h } = await res.json() as { hubs: SubHubRecord[] }
      setHubs(h ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function getHub(category: string, subcategory: string): SubHubRecord | undefined {
    return hubs.find(h => h.category === category && h.subcategory === subcategory)
  }

  async function openEdit(category: string, subcategory: string) {
    setEditKey({ category, subcategory })
    setSaveErr('')
    const existing = getHub(category, subcategory)
    if (existing && existing.content_html !== undefined) {
      setForm({
        content_html: existing.content_html ?? '',
        meta_title: existing.meta_title ?? '',
        meta_description: existing.meta_description ?? '',
        is_ready: existing.is_ready,
        is_indexed: existing.is_indexed,
      })
      return
    }
    setLoadingEdit(true)
    const res = await fetch('/api/admin/blog-subcategory-hubs')
    if (res.ok) {
      const { hubs: h } = await res.json() as { hubs: SubHubRecord[] }
      const hub = (h ?? []).find((x: SubHubRecord) => x.category === category && x.subcategory === subcategory)
      setForm({
        content_html: hub?.content_html ?? '',
        meta_title: hub?.meta_title ?? '',
        meta_description: hub?.meta_description ?? '',
        is_ready: hub?.is_ready ?? false,
        is_indexed: hub?.is_indexed ?? false,
      })
    } else {
      setForm({ content_html: '', meta_title: '', meta_description: '', is_ready: false, is_indexed: false })
    }
    setLoadingEdit(false)
  }

  async function handleSave(publish?: boolean) {
    if (!editKey) return
    setSaving(true); setSaveErr('')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    try {
      const body = {
        category: editKey.category,
        subcategory: editKey.subcategory,
        content_html: form.content_html,
        meta_title: form.meta_title,
        meta_description: form.meta_description,
        is_ready: publish !== undefined ? publish : form.is_ready,
        is_indexed: form.is_indexed,
      }
      const res = await fetch('/api/admin/blog-subcategory-hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
      }
      const data = await res.json() as { hub?: unknown; error?: string }
      if (data.error) throw new Error(data.error)
      setEditKey(null)
      load()
      showToast(publish ? 'Хаб опубликован ✓' : 'Сохранено ✓')
    } catch (err) {
      clearTimeout(timeout)
      const msg = err instanceof Error
        ? (err.name === 'AbortError' ? 'Превышено время ожидания (30 сек). Попробуйте ещё раз.' : err.message)
        : 'Ошибка сети'
      setSaveErr(msg)
    } finally {
      setSaving(false)
    }
  }

  async function toggleReady(category: string, subcategory: string, current: boolean) {
    await fetch('/api/admin/blog-subcategory-hubs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, subcategory, is_ready: !current, is_indexed: current ? false : undefined }),
    })
    load()
  }

  function fmtDate(iso: string | null | undefined) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const editCatConfig = editKey ? SILO_CONFIG[editKey.category as keyof typeof SILO_CONFIG] : null
  const editSubLabel = editKey && editCatConfig
    ? (editCatConfig.subcategories as Record<string, string>)[editKey.subcategory] ?? editKey.subcategory
    : ''

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 999,
          background: '#1A5C3A', color: '#fff', padding: '12px 20px',
          borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,.15)',
        }}>
          {toast}
        </div>
      )}

      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
        Контент хабов подкатегорий. Маркер <code style={{ background: '#F0EEFF', padding: '1px 6px', borderRadius: 4 }}>{'<!-- ARTICLES_PLACEHOLDER -->'}</code> разделяет вступление и сетку статей.
      </p>

      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Загрузка...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SILO_CATEGORIES.map(catKey => {
            const cat = SILO_CONFIG[catKey]
            const subKeys = Object.keys(cat.subcategories)
            const isCollapsed = collapsed[catKey] ?? false
            const readyCount = subKeys.filter(sk => getHub(catKey, sk)?.is_ready).length
            return (
              <div key={catKey} style={{ border: '1.5px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                {/* Category header */}
                <button
                  onClick={() => setCollapsed(c => ({ ...c, [catKey]: !isCollapsed }))}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                    background: '#F8F6FF', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{isCollapsed ? '▶' : '▼'}</span>
                  <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                  <span style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: 'var(--text)', flex: 1 }}>
                    {cat.label}
                    <code style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8, fontWeight: 400 }}>/blog/{catKey}/</code>
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {readyCount}/{subKeys.length} опубликовано
                  </span>
                </button>

                {/* Subcategory rows */}
                {!isCollapsed && (
                  <div>
                    {subKeys.map(subKey => {
                      const hub = getHub(catKey, subKey)
                      const subLabel = (cat.subcategories as Record<string, string>)[subKey]
                      const isReady = hub?.is_ready ?? false
                      const isIndexed = hub?.is_indexed ?? false
                      const statusDot = !isReady ? '#ccc' : isIndexed ? '#4CAF78' : '#F5A623'
                      const statusLabel = !isReady ? '⚫ Черновик' : isIndexed ? '🟢 Индексируется' : '🟡 Не индексируется'
                      return (
                        <div key={subKey} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                          borderTop: '1px solid var(--border)', flexWrap: 'wrap',
                        }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: statusDot }} />
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                              {subLabel}
                              <code style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8, fontWeight: 400 }}>/blog/{catKey}/{subKey}/</code>
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>
                              {statusLabel} · {fmtDate(hub?.updated_at)}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button onClick={() => openEdit(catKey, subKey)} style={{ ...btnSecondary, padding: '6px 12px', fontSize: 12 }}>
                              ✏️ Редактировать
                            </button>
                            <button
                              onClick={() => toggleReady(catKey, subKey, isReady)}
                              style={{ ...btnSecondary, padding: '6px 12px', fontSize: 12, color: isReady ? '#C0392B' : '#4CAF78' }}
                            >
                              {isReady ? 'Снять' : 'Опубликовать'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editKey && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 16,
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '28px 32px',
            width: '100%', maxWidth: 820, maxHeight: '92dvh', overflowY: 'auto',
            fontFamily: 'var(--font-nunito)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-unbounded)' }}>
                ✏️ {editCatConfig?.emoji} {editSubLabel}
                <code style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8, fontWeight: 400 }}>/blog/{editKey.category}/{editKey.subcategory}/</code>
              </h2>
              <button onClick={() => setEditKey(null)} style={{ background: '#F0EEFF', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: 'var(--pur)' }}>✕</button>
            </div>

            {loadingEdit ? (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Загрузка...</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>meta_title (необязательно, max 70 символов)</label>
                    <input
                      value={form.meta_title}
                      onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                      placeholder="Переопределить SEO-заголовок"
                      maxLength={70}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>meta_description (необязательно, max 160 символов)</label>
                    <input
                      value={form.meta_description}
                      onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                      placeholder="Переопределить SEO-описание"
                      maxLength={160}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <label style={labelStyle}>
                  HTML-контент хаба
                  <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#9B8FCC' }}>
                    (используй <code style={{ background: '#F0EEFF', padding: '1px 6px', borderRadius: 4 }}>{'<!-- ARTICLES_PLACEHOLDER -->'}</code> для вставки сетки статей)
                  </span>
                </label>
                <div style={{ fontSize: 12, color: '#6B7280', background: '#F9FAFB', borderRadius: 8, padding: '10px 14px', marginBottom: 8, lineHeight: 1.6 }}>
                  <strong>Шаблон уже добавляет автоматически:</strong> H1, теги подкатегорий, блок автора, дисклеймер «Важно», секцию «Читайте также».<br />
                  <strong>В этом поле писать только:</strong> вступительный текст, FAQ, источники.
                </div>
                <textarea
                  value={form.content_html}
                  onChange={e => setForm(f => ({ ...f, content_html: e.target.value }))}
                  placeholder="<div class=&quot;kratko-block&quot;>...</div>&#10;<!-- ARTICLES_PLACEHOLDER -->&#10;<div class=&quot;faq-block&quot;>...</div>"
                  rows={18}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, marginBottom: 14 }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.is_ready}
                      onChange={e => setForm(f => ({ ...f, is_ready: e.target.checked, is_indexed: e.target.checked ? f.is_indexed : false }))}
                      style={{ width: 16, height: 16, accentColor: 'var(--pur)' }}
                    />
                    <span style={{ fontFamily: 'var(--font-nunito)', fontSize: 14, color: 'var(--text)' }}>
                      Опубликован — контент виден на сайте
                    </span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: form.is_ready ? 'pointer' : 'not-allowed', opacity: form.is_ready ? 1 : 0.45 }}>
                    <input
                      type="checkbox"
                      checked={form.is_indexed}
                      disabled={!form.is_ready}
                      onChange={e => setForm(f => ({ ...f, is_indexed: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: 'var(--pur)', marginTop: 2, flexShrink: 0 }}
                    />
                    <div>
                      <span style={{ fontFamily: 'var(--font-nunito)', fontSize: 14, color: 'var(--text)', display: 'block' }}>
                        Разрешить индексацию — страница попадёт в sitemap
                      </span>
                      <span style={{ fontFamily: 'var(--font-nunito)', fontSize: 12, color: 'var(--muted)', display: 'block', marginTop: 2 }}>
                        Включайте только когда в подкатегории есть 8+ статей
                      </span>
                    </div>
                  </label>
                </div>

                {saveErr && <p style={{ color: '#E53E3E', fontSize: 13, marginBottom: 10 }}>{saveErr}</p>}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setEditKey(null)} style={btnSecondary}>Отмена</button>
                  <button onClick={() => handleSave()} disabled={saving} style={{ ...btnSecondary, opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Сохраняем...' : '💾 Сохранить черновик'}
                  </button>
                  <button onClick={() => handleSave(true)} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                    {saving ? '...' : '🚀 Сохранить и опубликовать'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'articles' | 'topics' | 'generator' | 'settings' | 'drafts' | 'hubs' | 'subhubs'

const TABS: { id: Tab; label: string }[] = [
  { id: 'articles', label: 'Статьи' },
  { id: 'hubs', label: 'Хабы' },
  { id: 'subhubs', label: 'Хабы подкатегорий' },
  { id: 'topics', label: 'Темы' },
  { id: 'generator', label: 'Генератор' },
  { id: 'settings', label: 'Настройки' },
  { id: 'drafts', label: 'Черновики' },
]

export default function AdminBlogPage() {
  const [tab, setTab] = useState<Tab>('articles')
  const [articlesKey, setArticlesKey] = useState(0)

  return (
    <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <Link href="/admin" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>← Админ</Link>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Блог</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-nunito)', fontSize: 14, fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? 'var(--pur)' : 'var(--muted)',
              borderBottom: tab === t.id ? '2px solid var(--pur)' : '2px solid transparent',
              marginBottom: -2, borderRadius: '8px 8px 0 0',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'articles' && <ArticlesTab key={articlesKey} />}
      {tab === 'hubs' && <HubsTab />}
      {tab === 'subhubs' && <SubcategoryHubsTab />}
      {tab === 'topics' && <TopicsTab />}
      {tab === 'generator' && <GeneratorTab onSaved={() => { setTab('articles'); setArticlesKey(k => k + 1) }} />}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'drafts' && <DraftsTab />}
    </div>
  )
}
