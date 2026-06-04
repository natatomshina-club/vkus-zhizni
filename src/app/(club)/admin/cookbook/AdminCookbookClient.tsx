'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface CookbookRecipe {
  id: string
  title: string
  category: string
  photo_urls: string[]
  video_url: string | null
  ingredients: string | null
  servings: number | null
  calories: number | null
  protein: number | null
  fat: number | null
  carbs: number | null
  instructions: string | null
  tags: string[]
  is_published: boolean
  sort_order: number
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'breakfast',     label: 'Завтраки' },
  { value: 'soup',          label: 'Супы' },
  { value: 'salad_side',    label: 'Гарниры/Салаты' },
  { value: 'main',          label: 'Горячее/Основные блюда' },
  { value: 'savory_baking', label: 'Несладкая выпечка' },
  { value: 'sweet_baking',  label: 'Сладкая выпечка' },
  { value: 'snacks',        label: 'Закуски/Заготовки/Соленья' },
  { value: 'sauces',        label: 'Соусы/Заправки' },
]

const TAGS: { value: string; label: string }[] = [
  { value: 'keto',       label: 'Кето' },
  { value: 'nup',        label: 'НУП' },
  { value: 'dairy_free', label: 'Безмолочные' },
  { value: 'aip',        label: 'АИП' },
]

const INPUT: React.CSSProperties = {
  padding: '8px 10px', borderRadius: 8, fontSize: 13,
  border: '1px solid #DDD5FF', outline: 'none',
  fontFamily: 'var(--font-nunito)', color: 'var(--text)',
  background: '#fff', boxSizing: 'border-box', width: '100%',
}

const BTN_PUR: React.CSSProperties = {
  padding: '9px 18px', background: 'var(--pur)', color: '#fff',
  border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'var(--font-nunito)',
}

const BTN_RED: React.CSSProperties = {
  padding: '5px 10px', background: '#FFF0F0', color: '#C0392B',
  border: '1px solid #FFD0D0', borderRadius: 8, fontSize: 11, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'var(--font-nunito)',
}

const BTN_GHOST: React.CSSProperties = {
  padding: '5px 10px', background: '#F0F0F0', color: '#555',
  border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'var(--font-nunito)',
}

function categoryLabel(v: string) {
  return CATEGORIES.find(c => c.value === v)?.label ?? v
}

// ── RecipeForm ─────────────────────────────────────────
function RecipeForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: CookbookRecipe
  onSave: (r: CookbookRecipe) => void
  onCancel: () => void
}) {
  const [title, setTitle]             = useState(initial?.title ?? '')
  const [category, setCategory]       = useState(initial?.category ?? 'breakfast')
  const [tags, setTags]               = useState<string[]>(initial?.tags ?? [])
  const [photoUrls, setPhotoUrls]     = useState<string[]>(initial?.photo_urls ?? [])
  const [videoUrl, setVideoUrl]       = useState(initial?.video_url ?? '')
  const [servings, setServings]       = useState(initial?.servings?.toString() ?? '')
  const [calories, setCalories]       = useState(initial?.calories?.toString() ?? '')
  const [protein, setProtein]         = useState(initial?.protein?.toString() ?? '')
  const [fat, setFat]                 = useState(initial?.fat?.toString() ?? '')
  const [carbs, setCarbs]             = useState(initial?.carbs?.toString() ?? '')
  const [ingredients, setIngredients] = useState(initial?.ingredients ?? '')
  const [instructions, setInstructions] = useState(initial?.instructions ?? '')
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? false)
  const [sortOrder, setSortOrder]     = useState(initial?.sort_order?.toString() ?? '0')

  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [uploading, setUploading]     = useState<0 | 1>(0)

  const fileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  function toggleTag(v: string) {
    setTags(prev => prev.includes(v) ? prev.filter(t => t !== v) : [...prev, v])
  }

  async function uploadPhoto(file: File, slot: 0 | 1) {
    setUploading(slot)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/cookbook/upload', { method: 'POST', body: fd })
      const d = await res.json() as { url?: string; error?: string }
      if (res.ok && d.url) {
        const next = [...photoUrls]
        next[slot] = d.url
        setPhotoUrls(next)
      } else {
        setError(d.error ?? 'Ошибка загрузки')
      }
    } catch {
      setError('Сетевая ошибка при загрузке')
    } finally {
      setUploading(0)
    }
  }

  async function submit() {
    if (!title.trim()) { setError('Введи название'); return }
    setSaving(true)
    setError('')
    const body = {
      title: title.trim(),
      category,
      photo_urls: photoUrls.filter(Boolean),
      video_url: videoUrl.trim() || null,
      ingredients: ingredients.trim() || null,
      servings: servings ? parseInt(servings) : null,
      calories: calories ? parseInt(calories) : null,
      protein: protein ? parseFloat(protein) : null,
      fat: fat ? parseFloat(fat) : null,
      carbs: carbs ? parseFloat(carbs) : null,
      instructions: instructions.trim() || null,
      tags,
      is_published: isPublished,
      sort_order: parseInt(sortOrder) || 0,
    }
    try {
      const url = initial ? `/api/admin/cookbook/${initial.id}` : '/api/admin/cookbook'
      const method = initial ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json() as { recipe?: CookbookRecipe; error?: string }
      if (res.ok && d.recipe) {
        onSave(d.recipe)
      } else {
        setError(d.error ?? `Ошибка ${res.status}`)
      }
    } catch {
      setError('Сетевая ошибка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '16px', background: '#FAFAFF', borderTop: '1px solid #EDE8FF' }}>
      {error && (
        <p style={{ fontSize: 12, color: '#C0392B', background: '#FFF0F0', padding: '6px 10px', borderRadius: 8, marginBottom: 12 }}>
          ❌ {error}
        </p>
      )}

      {/* Title */}
      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Название *</span>
        <input value={title} onChange={e => setTitle(e.target.value)} style={INPUT} autoFocus />
      </label>

      {/* Category */}
      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Категория *</span>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...INPUT, cursor: 'pointer' }}>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </label>

      {/* Tags */}
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Теги</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TAGS.map(t => (
            <label key={t.value} style={{
              display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
              padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: tags.includes(t.value) ? 'var(--pur)' : '#F0EEFF',
              color: tags.includes(t.value) ? '#fff' : 'var(--pur)',
              border: `1px solid ${tags.includes(t.value) ? 'var(--pur)' : '#DDD5FF'}`,
            }}>
              <input
                type="checkbox"
                checked={tags.includes(t.value)}
                onChange={() => toggleTag(t.value)}
                style={{ display: 'none' }}
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      {/* Photos */}
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Фото (до 2 штук)</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {([0, 1] as const).map(slot => (
            <div key={slot}>
              {photoUrls[slot] ? (
                <div style={{ position: 'relative' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrls[slot]}
                    alt=""
                    style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid #DDD5FF' }}
                  />
                  <button
                    type="button"
                    onClick={() => { const n = [...photoUrls]; n[slot] = ''; setPhotoUrls(n) }}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none',
                      borderRadius: 4, width: 20, height: 20, fontSize: 11, cursor: 'pointer',
                    }}
                  >✕</button>
                </div>
              ) : (
                <>
                  <input
                    ref={fileRefs[slot]}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, slot) }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRefs[slot].current?.click()}
                    disabled={uploading !== 0}
                    style={{
                      width: '100%', height: 100, border: '2px dashed #DDD5FF',
                      borderRadius: 8, background: '#F8F5FF', color: 'var(--muted)',
                      fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-nunito)',
                    }}
                  >
                    {uploading === slot ? '⏳...' : `📷 Фото ${slot + 1}`}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Video */}
      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Видео Kinescope (необязательно)</span>
        <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://kinescope.io/..." style={INPUT} />
      </label>

      {/* Servings + КБЖУ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 10 }}>
        {[
          { label: 'Порции', val: servings, set: setServings },
          { label: 'Ккал', val: calories, set: setCalories },
          { label: 'Белки', val: protein, set: setProtein },
          { label: 'Жиры', val: fat, set: setFat },
          { label: 'Углев.', val: carbs, set: setCarbs },
        ].map(f => (
          <label key={f.label} style={{ display: 'block' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 3 }}>{f.label}</span>
            <input
              type="number"
              value={f.val}
              onChange={e => f.set(e.target.value)}
              style={{ ...INPUT, textAlign: 'center' }}
            />
          </label>
        ))}
      </div>

      {/* Ingredients */}
      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Ингредиенты</span>
        <textarea
          value={ingredients}
          onChange={e => setIngredients(e.target.value)}
          rows={5}
          placeholder={'300 г куриного филе\n2 ст. л. оливкового масла\n...'}
          style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }}
        />
      </label>

      {/* Instructions */}
      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Приготовление</span>
        <textarea
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          rows={6}
          placeholder={'1. Нарезать...\n2. Обжарить...\n...'}
          style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }}
        />
      </label>

      {/* Published + sort_order */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isPublished}
            onChange={e => setIsPublished(e.target.checked)}
            style={{ width: 15, height: 15, accentColor: 'var(--pur)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Опубликован</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>sort_order</span>
          <input
            type="number"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            style={{ ...INPUT, width: 70 }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={saving} style={{ ...BTN_PUR, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Сохраняю...' : '💾 Сохранить'}
        </button>
        <button onClick={onCancel} style={BTN_GHOST}>Отмена</button>
      </div>
    </div>
  )
}

// ── RecipeRow ──────────────────────────────────────────
function RecipeRow({
  recipe,
  onUpdate,
  onDelete,
}: {
  recipe: CookbookRecipe
  onUpdate: (r: CookbookRecipe) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/cookbook/${recipe.id}`, { method: 'DELETE' })
      if (res.ok) onDelete(recipe.id)
      else {
        const d = await res.json() as { error?: string }
        setDeleteError(d.error ?? `Ошибка ${res.status}`)
        setConfirmDelete(false)
      }
    } catch {
      setDeleteError('Сетевая ошибка')
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ border: '1px solid #EDE8FF', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
        background: expanded ? '#F8F5FF' : '#fff', cursor: 'pointer',
      }} onClick={() => setExpanded(v => !v)}>

        {recipe.photo_urls?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.photo_urls[0]} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#F0EEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🍽</div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {recipe.title}
          </p>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 0' }}>
            {categoryLabel(recipe.category)}
            {recipe.tags.length > 0 && ` · ${recipe.tags.join(', ')}`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: recipe.is_published ? '#E8F8F0' : '#FFF3E0',
            color: recipe.is_published ? '#27AE60' : '#F39C12',
          }}>
            {recipe.is_published ? 'Опубликован' : 'Черновик'}
          </span>
          <span style={{ fontSize: 13, color: 'var(--pale)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
        </div>
      </div>

      {expanded && (
        <>
          <RecipeForm
            initial={recipe}
            onSave={updated => { onUpdate(updated); setExpanded(false) }}
            onCancel={() => setExpanded(false)}
          />
          <div style={{ padding: '0 16px 14px', background: '#FAFAFF', display: 'flex', gap: 8, alignItems: 'center' }}>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} style={BTN_RED}>🗑 Удалить рецепт</button>
            ) : (
              <>
                <span style={{ fontSize: 12, color: '#C0392B', fontWeight: 600 }}>Удалить?</span>
                <button onClick={handleDelete} disabled={deleting} style={{ ...BTN_RED, background: '#C0392B', color: '#fff' }}>
                  {deleting ? '...' : 'Да'}
                </button>
                <button onClick={() => setConfirmDelete(false)} style={BTN_GHOST}>Нет</button>
              </>
            )}
            {deleteError && <span style={{ fontSize: 12, color: '#C0392B' }}>{deleteError}</span>}
          </div>
        </>
      )}
    </div>
  )
}

// ── AdminCookbookClient ────────────────────────────────
export default function AdminCookbookClient() {
  const [recipes, setRecipes]         = useState<CookbookRecipe[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [filterCat, setFilterCat]     = useState('')
  const [showAdd, setShowAdd]         = useState(false)

  useEffect(() => {
    fetch('/api/admin/cookbook')
      .then(r => r.json())
      .then((d: { recipes?: CookbookRecipe[]; error?: string }) => {
        if (d.error) setError(d.error)
        else setRecipes(d.recipes ?? [])
      })
      .catch(() => setError('Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filterCat ? recipes.filter(r => r.category === filterCat) : recipes

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 60px', fontFamily: 'var(--font-nunito)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link href="/admin" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: 'var(--muted)', textDecoration: 'none',
          padding: '8px 12px', borderRadius: 10, background: '#F0EEFF',
        }}>← Панель</Link>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0, flex: 1 }}>
          Кулинарная книга
        </h1>
        <button
          onClick={() => setShowAdd(v => !v)}
          style={{ ...BTN_PUR, padding: '8px 14px', fontSize: 12 }}
        >
          {showAdd ? '✕ Отмена' : '+ Добавить рецепт'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ border: '2px solid var(--pur)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '10px 14px', background: 'var(--pur-lt)' }}>
            <p style={{ fontFamily: 'var(--font-unbounded)', fontSize: 13, fontWeight: 800, color: 'var(--pur)', margin: 0 }}>Новый рецепт</p>
          </div>
          <RecipeForm
            onSave={r => { setRecipes(prev => [r, ...prev]); setShowAdd(false) }}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {[{ value: '', label: 'Все' }, ...CATEGORIES].map(c => (
          <button
            key={c.value}
            onClick={() => setFilterCat(c.value)}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: `1px solid ${filterCat === c.value ? 'var(--pur)' : '#DDD5FF'}`,
              background: filterCat === c.value ? 'var(--pur)' : '#fff',
              color: filterCat === c.value ? '#fff' : 'var(--muted)',
              cursor: 'pointer', fontFamily: 'var(--font-nunito)',
            }}
          >{c.label}</button>
        ))}
      </div>

      {loading && <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Загружаю...</p>}
      {!loading && error && (
        <div style={{ background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: 10, padding: 16, color: '#C0392B', fontSize: 13 }}>
          {error}
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 40, fontSize: 13 }}>
          {filterCat ? 'Нет рецептов в этой категории' : 'Рецептов пока нет'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(r => (
          <RecipeRow
            key={r.id}
            recipe={r}
            onUpdate={updated => setRecipes(prev => prev.map(x => x.id === updated.id ? updated : x))}
            onDelete={id => setRecipes(prev => prev.filter(x => x.id !== id))}
          />
        ))}
      </div>
    </div>
  )
}
