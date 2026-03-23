'use client'

import { useState } from 'react'

export interface Win {
  id: string
  result: string
  source: string
  created_at: string
}

interface Props {
  wins: Win[]
  totalCount: number
  hasMore: boolean
  onLoadMore: () => Promise<void>
}

const BORDER_COLORS = ['#7C5CFC', '#2A9D5C', '#FFD93D', '#FF9F43', '#FF6B9D']

function formatDateRu(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function WinFeed({ wins, totalCount, hasMore, onLoadMore }: Props) {
  const [loadingMore, setLoadingMore] = useState(false)

  async function handleLoadMore() {
    setLoadingMore(true)
    await onLoadMore()
    setLoadingMore(false)
  }

  if (wins.length === 0) {
    return (
      <div
        className="rounded-2xl px-6 py-10 flex flex-col items-center text-center gap-3"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <span className="text-4xl">🏆</span>
        <p className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
          Пока нет записанных побед
        </p>
        <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Добавь первую — любой маленький шаг уже победа!
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
        {totalCount} {totalCount === 1 ? 'запись' : totalCount < 5 ? 'записи' : 'записей'}
      </p>

      <div className="flex flex-col gap-3">
        {wins.map((win, idx) => (
          <div
            key={win.id}
            className="rounded-2xl px-4 py-4"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderLeft: `4px solid ${BORDER_COLORS[idx % 5]}`,
            }}
          >
            <p className="text-sm leading-snug" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
              {win.result}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-[11px]" style={{ color: 'var(--pale)', fontFamily: 'var(--font-nunito)' }}>
                {formatDateRu(win.created_at)}
              </p>
              {win.source === 'dashboard' && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'var(--pur-light)', color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
                >
                  с Главной
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="w-full mt-4 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50"
          style={{
            minHeight: 48,
            fontFamily: 'var(--font-nunito)',
            color: 'var(--pur)',
            borderColor: 'var(--pur-br)',
            background: 'var(--pur-light)',
          }}
        >
          {loadingMore ? 'Загружаем...' : 'Показать ещё'}
        </button>
      )}
    </div>
  )
}
