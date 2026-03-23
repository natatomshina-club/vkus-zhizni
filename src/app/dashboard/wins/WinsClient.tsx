'use client'

import { useState } from 'react'
import WinInput from '@/components/WinInput'
import WinFeed, { type Win } from './components/WinFeed'
import ProgressBlock, { type TrackerSummary } from './components/ProgressBlock'
import RandomWin from './components/RandomWin'

const PAGE_SIZE = 20

interface Props {
  initialWins: Win[]
  totalCount: number
  trackerData: TrackerSummary | null
}

export default function WinsClient({ initialWins, totalCount: initialCount, trackerData }: Props) {
  const [wins, setWins] = useState<Win[]>(initialWins)
  const [totalCount, setTotalCount] = useState(initialCount)
  const [hasMore, setHasMore] = useState(initialWins.length === PAGE_SIZE)

  async function handleSave(text: string) {
    const res = await fetch('/api/wins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source: 'wins' }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string }
      throw new Error(err.error ?? 'Ошибка сохранения')
    }
    const newWin = await res.json() as Win
    setWins(prev => [newWin, ...prev])
    setTotalCount(c => c + 1)
  }

  async function handleLoadMore() {
    const res = await fetch(`/api/wins?limit=${PAGE_SIZE}&offset=${wins.length}`)
    if (!res.ok) return
    const { wins: more, hasMore: moreAvail } = await res.json() as { wins: Win[]; hasMore: boolean }
    setWins(prev => [...prev, ...more])
    setHasMore(moreAvail)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8 flex flex-col gap-5">

      {/* Desktop heading */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          Маленькие победы 🏆
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Каждый маленький шаг — это уже победа!
        </p>
      </div>

      {/* Win input */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Запиши победу
        </p>
        <WinInput onSave={handleSave} />
      </div>

      {/* Random win */}
      <RandomWin wins={wins} />

      {/* Progress block */}
      <ProgressBlock data={trackerData} />

      {/* Win feed */}
      <WinFeed
        wins={wins}
        totalCount={totalCount}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
      />

      <div className="h-4" />
    </div>
  )
}
