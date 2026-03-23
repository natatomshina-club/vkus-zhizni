'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  FAQ_CATEGORIES,
  FAQ_CATEGORY_LABELS,
  FAQ_CATEGORY_COLORS,
} from '@/types/channel'
import type { FaqItem, FaqCategory } from '@/types/channel'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchFaq(params: {
  q?: string
  category?: string
  cursor?: string
}): Promise<{ items: FaqItem[]; hasMore: boolean }> {
  const sp = new URLSearchParams({ limit: '20' })
  if (params.q)        sp.set('q', params.q)
  if (params.category) sp.set('category', params.category)
  if (params.cursor)   sp.set('cursor', params.cursor)
  const res = await fetch(`/api/channel/faq?${sp}`)
  const data = await res.json() as { items?: FaqItem[]; hasMore?: boolean; error?: string }
  if (data.error) throw new Error(data.error)
  return { items: data.items ?? [], hasMore: data.hasMore ?? false }
}

// ── Category badge ────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: FaqCategory }) {
  const colors = FAQ_CATEGORY_COLORS[category] ?? { bg: '#F5F5F5', text: '#666' }
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
      style={{ background: colors.bg, color: colors.text, fontFamily: 'var(--font-nunito)' }}
    >
      {FAQ_CATEGORY_LABELS[category] ?? category}
    </span>
  )
}

// ── Add / Edit form ───────────────────────────────────────────────────────────

interface FaqFormProps {
  initial?: { question: string; answer: string; category: string }
  onSave: (data: { question: string; answer: string; category: FaqCategory }) => Promise<void>
  onCancel: () => void
}

function FaqForm({ initial, onSave, onCancel }: FaqFormProps) {
  const [question, setQuestion] = useState(initial?.question ?? '')
  const [answer,   setAnswer]   = useState(initial?.answer   ?? '')
  const [category, setCategory] = useState<FaqCategory | ''>((initial?.category as FaqCategory) ?? '')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || !answer.trim() || !category) {
      setError('Заполни все поля и выбери категорию')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ question: question.trim(), answer: answer.trim(), category })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && (
        <p className="text-xs" style={{ color: '#C0392B', fontFamily: 'var(--font-nunito)' }}>{error}</p>
      )}

      {/* Question textarea */}
      <div className="relative">
        <textarea
          placeholder="Вопрос"
          value={question}
          onChange={e => setQuestion(e.target.value.slice(0, 500))}
          rows={2}
          className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
          style={{
            fontFamily: 'var(--font-nunito)',
            borderColor: 'var(--border)',
            background: '#fff',
            color: 'var(--text)',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--pur)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        {question.length > 450 && (
          <span
            className="absolute bottom-1.5 right-2 text-[10px]"
            style={{ color: question.length > 480 ? '#C0392B' : 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
          >
            {500 - question.length}
          </span>
        )}
      </div>

      {/* Answer textarea */}
      <div className="relative">
        <textarea
          placeholder="Ответ"
          value={answer}
          onChange={e => setAnswer(e.target.value.slice(0, 3000))}
          rows={5}
          className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
          style={{
            fontFamily: 'var(--font-nunito)',
            borderColor: 'var(--border)',
            background: '#fff',
            color: 'var(--text)',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--pur)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        {answer.length > 2700 && (
          <span
            className="absolute bottom-1.5 right-2 text-[10px]"
            style={{ color: answer.length > 2900 ? '#C0392B' : 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
          >
            {3000 - answer.length}
          </span>
        )}
      </div>

      {/* Category selector */}
      <div className="flex flex-wrap gap-1.5">
        {FAQ_CATEGORIES.map(cat => {
          const active = category === cat
          const colors = FAQ_CATEGORY_COLORS[cat]
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className="text-xs px-2.5 py-1 rounded-full border transition-all"
              style={{
                fontFamily: 'var(--font-nunito)',
                background: active ? 'var(--pur)' : colors.bg,
                color:      active ? '#fff'        : colors.text,
                borderColor: active ? 'var(--pur)' : 'transparent',
                fontWeight: active ? 700 : 600,
              }}
            >
              {FAQ_CATEGORY_LABELS[cat]}
            </button>
          )
        })}
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ minHeight: 48, background: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
        >
          {saving ? 'Сохраняю...' : 'Сохранить'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 rounded-xl text-sm font-semibold"
          style={{
            minHeight: 48,
            background: 'var(--bg)',
            color: 'var(--muted)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-nunito)',
          }}
        >
          Отмена
        </button>
      </div>
    </form>
  )
}

// ── Single FAQ card (accordion) ───────────────────────────────────────────────

interface FaqCardProps {
  item: FaqItem
  isOpen: boolean
  isAdmin: boolean
  onToggle: () => void
  onUpdated: (item: FaqItem) => void
  onDeleted: (id: string) => void
}

function FaqCard({ item, isOpen, isAdmin, onToggle, onUpdated, onDeleted }: FaqCardProps) {
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Удалить этот вопрос из базы знаний?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/channel/faq/${item.id}`, { method: 'DELETE' })
      if (res.ok) onDeleted(item.id)
    } finally {
      setDeleting(false)
    }
  }

  async function handleSave(data: { question: string; answer: string; category: FaqCategory }) {
    const res = await fetch(`/api/channel/faq/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string }
      throw new Error(err.error ?? 'Ошибка')
    }
    const updated = await res.json() as FaqItem
    onUpdated(updated)
    setEditing(false)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#fff',
        boxShadow: hovered
          ? '0 4px 20px rgba(124,92,252,0.12)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        border: isOpen ? '1.5px solid var(--pur-br)' : '1.5px solid transparent',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header row — clickable */}
      <div
        className="flex items-start gap-3 px-4 py-4 cursor-pointer select-none"
        onClick={() => !editing && onToggle()}
      >
        <p
          className="flex-1 text-sm font-bold leading-snug"
          style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}
        >
          {item.question}
        </p>

        <div className="flex items-center gap-1.5 shrink-0 ml-1 mt-0.5">
          <CategoryBadge category={item.category} />

          {/* Admin buttons — visible on hover */}
          {isAdmin && hovered && !editing && (
            <>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setEditing(true) }}
                className="rounded-lg p-1 transition-all"
                style={{ background: 'var(--pur-lt)', lineHeight: 1, fontSize: 14 }}
                title="Редактировать"
              >
                ✏️
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); handleDelete() }}
                disabled={deleting}
                className="rounded-lg p-1 transition-all"
                style={{ background: '#FFEBEE', lineHeight: 1, fontSize: 14, opacity: deleting ? 0.4 : 1 }}
                title="Удалить"
              >
                🗑️
              </button>
            </>
          )}

          {/* Arrow */}
          {!editing && (
            <span
              style={{
                color: 'var(--muted)',
                fontSize: 18,
                fontWeight: 400,
                display: 'inline-block',
                transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              ›
            </span>
          )}
        </div>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div
          className="px-4 pb-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="h-px mb-4" style={{ background: 'var(--border)' }} />
          <FaqForm
            initial={{ question: item.question, answer: item.answer, category: item.category }}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {/* Expanded answer */}
      {isOpen && !editing && (
        <>
          <div className="mx-4 h-px" style={{ background: 'var(--border)' }} />
          <div className="px-4 py-4">
            <p
              className="text-sm leading-relaxed"
              style={{
                color: 'var(--muted)',
                fontFamily: 'var(--font-nunito)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {item.answer}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ChannelFAQ({ isAdmin }: { isAdmin: boolean }) {
  const [items,       setItems]       = useState<FaqItem[]>([])
  const [loading,     setLoading]     = useState(true)
  const [hasMore,     setHasMore]     = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error,       setError]       = useState('')
  const [openId,      setOpenId]      = useState<string | null>(null)
  const [search,      setSearch]      = useState('')
  const [activeCategory, setActiveCategory] = useState<FaqCategory | ''>('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input 400ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  // Load (or reload) on filter change
  const loadItems = useCallback(async () => {
    setLoading(true)
    setError('')
    setOpenId(null)
    try {
      const result = await fetchFaq({
        q: debouncedSearch || undefined,
        category: activeCategory || undefined,
      })
      setItems(result.items)
      setHasMore(result.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, activeCategory])

  useEffect(() => { loadItems() }, [loadItems])

  async function handleLoadMore() {
    if (loadingMore || items.length === 0) return
    setLoadingMore(true)
    try {
      const result = await fetchFaq({
        q: debouncedSearch || undefined,
        category: activeCategory || undefined,
        cursor: items[items.length - 1].created_at,
      })
      setItems(prev => [...prev, ...result.items])
      setHasMore(result.hasMore)
    } catch {
      // silent
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleAdd(data: { question: string; answer: string; category: FaqCategory }) {
    const res = await fetch('/api/channel/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string }
      throw new Error(err.error ?? 'Ошибка')
    }
    const created = await res.json() as FaqItem
    setItems(prev => [created, ...prev])
    setShowAddForm(false)
  }

  function handleUpdated(updated: FaqItem) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
  }

  function handleDeleted(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    if (openId === id) setOpenId(null)
  }

  // Empty state message
  const emptyText = !debouncedSearch && !activeCategory
    ? 'База знаний пока пополняется 🌿'
    : debouncedSearch
    ? 'Ничего не найдено. Попробуй другой запрос.'
    : 'В этом разделе пока нет вопросов'

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-4 pb-8">

        {/* Admin: add button */}
        {isAdmin && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="self-start text-sm font-bold text-white rounded-xl px-5"
            style={{ minHeight: 48, background: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
          >
            + Добавить вопрос
          </button>
        )}

        {/* Admin: add form */}
        {isAdmin && showAddForm && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: '#fff',
              border: '1.5px solid var(--pur-br)',
              boxShadow: '0 2px 12px rgba(124,92,252,0.1)',
            }}
          >
            <p
              className="text-sm font-bold mb-3"
              style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}
            >
              Новый вопрос в FAQ
            </p>
            <FaqForm
              onSave={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none"
          >
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по базе знаний..."
            className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm outline-none"
            style={{
              fontFamily: 'var(--font-nunito)',
              background: '#fff',
              color: 'var(--text)',
              borderColor: 'var(--border)',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--pur)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4">
          <button
            type="button"
            onClick={() => setActiveCategory('')}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0 transition-all"
            style={{
              fontFamily: 'var(--font-nunito)',
              background:   activeCategory === '' ? '#fff' : 'transparent',
              color:        activeCategory === '' ? 'var(--pur)' : 'var(--muted)',
              borderColor:  activeCategory === '' ? 'var(--pur)' : 'var(--border)',
              fontWeight:   activeCategory === '' ? 700 : 600,
            }}
          >
            Все
          </button>

          {FAQ_CATEGORIES.map(cat => {
            const active = activeCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(active ? '' : cat)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0 transition-all"
                style={{
                  fontFamily: 'var(--font-nunito)',
                  background:  active ? '#fff'        : 'transparent',
                  color:       active ? 'var(--pur)'  : 'var(--muted)',
                  borderColor: active ? 'var(--pur)'  : 'var(--border)',
                  fontWeight:  active ? 700 : 600,
                }}
              >
                {FAQ_CATEGORY_LABELS[cat]}
              </button>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-center" style={{ color: '#C0392B', fontFamily: 'var(--font-nunito)' }}>
            {error}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              Загрузка...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-center" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              {emptyText}
            </p>
          </div>
        )}

        {/* FAQ list */}
        {!loading && items.length > 0 && (
          <div className="flex flex-col gap-3">
            {items.map(item => (
              <FaqCard
                key={item.id}
                item={item}
                isOpen={openId === item.id}
                isAdmin={isAdmin}
                onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}

            {hasMore && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="self-center text-sm px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50"
                style={{
                  background: '#fff',
                  color: 'var(--pur)',
                  border: '1px solid var(--pur-br)',
                  fontFamily: 'var(--font-nunito)',
                }}
              >
                {loadingMore ? 'Загружаю...' : 'Показать ещё'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
