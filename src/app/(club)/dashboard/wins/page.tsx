import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WinsClient from './WinsClient'
import type { Win } from './components/WinFeed'
import type { TrackerSummary } from './components/ProgressBlock'

const PAGE_SIZE = 20

export default async function WinsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [
    { data: winsData },
    { count: totalCount },
    { data: measurements },
  ] = await Promise.all([
    supabase
      .from('wins')
      .select('id, result, source, created_at')
      .eq('member_id', user.id)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE),
    supabase
      .from('wins')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', user.id),
    supabase
      .from('measurements')
      .select('date, weight, waist, hips, chest')
      .eq('member_id', user.id)
      .order('date', { ascending: true }),
  ])

  const wins: Win[] = (winsData ?? []) as Win[]

  // Build tracker summary
  let trackerData: TrackerSummary | null = null
  if (measurements && measurements.length > 0) {
    const first = measurements[0]
    const last = measurements[measurements.length - 1]

    function pair(key: 'weight' | 'waist' | 'hips' | 'chest') {
      const start = first[key] as number | null
      const current = last[key] as number | null
      if (start === null || current === null) return null
      return { start, current }
    }

    trackerData = {
      weight: pair('weight'),
      waist:  pair('waist'),
      hips:   pair('hips'),
      chest:  pair('chest'),
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Mobile header */}
      <header
        className="lg:hidden flex items-center px-4 py-4 sticky top-0 z-40"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <a href="/dashboard" className="mr-3 text-xl" style={{ color: 'var(--text)' }}>←</a>
        <h1 className="text-base font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          Маленькие победы
        </h1>
      </header>

      <WinsClient
        initialWins={wins}
        totalCount={totalCount ?? 0}
        trackerData={trackerData}
      />
    </div>
  )
}
