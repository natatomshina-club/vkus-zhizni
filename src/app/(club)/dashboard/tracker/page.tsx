import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TrackerClient from '@/components/TrackerClient'

export default async function TrackerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: member }, { data: measurements }] = await Promise.all([
    supabase
      .from('members')
      .select('weight, start_weight, goal_weight, full_name')
      .eq('id', user.id)
      .single(),
    supabase
      .from('measurements')
      .select('id, member_id, date, weight, waist, hips, chest, energy, sweet_craving, note, created_at')
      .eq('member_id', user.id)
      .order('date', { ascending: false }),
  ])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Mobile header */}
      <header
        className="lg:hidden flex items-center px-4 py-4 sticky top-0 z-40"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <a href="/dashboard" className="mr-3 text-xl" style={{ color: 'var(--text)' }}>←</a>
        <h1 className="text-base font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          Трекер замеров
        </h1>
      </header>

      <TrackerClient
        userId={user.id}
        startWeight={member?.start_weight ?? member?.weight ?? null}
        goalWeight={member?.goal_weight ?? null}
        initialMeasurements={(measurements ?? []) as any[]}
      />
    </div>
  )
}
