import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DiaryClient from '@/components/DiaryClient'

export default async function DiaryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const today = new Date().toISOString().split('T')[0]
  const [year, month] = today.split('-').map(Number)
  const monthStr = String(month).padStart(2, '0')

  const dateFrom = `${year}-${monthStr}-01`
  const dateTo   = `${year}-${monthStr}-31`

  const [
    { data: member },
    { data: entries },
    { data: water },
    { data: markedRaw },
    { data: noteToday },
    { data: noteMonthRaw },
  ] = await Promise.all([
    supabase.from('members')
      .select('kbju_calories, kbju_protein, kbju_fat, kbju_carbs')
      .eq('id', user.id)
      .single(),
    supabase.from('diary_entries')
      .select('id, meal_type, title, calories, protein, fat, carbs, source')
      .eq('member_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: true }),
    supabase.from('diary_water')
      .select('glasses_count')
      .eq('member_id', user.id)
      .eq('date', today)
      .maybeSingle(),
    supabase.from('diary_entries')
      .select('date')
      .eq('member_id', user.id)
      .gte('date', dateFrom)
      .lte('date', dateTo),
    supabase.from('diary_notes')
      .select('tags, note')
      .eq('member_id', user.id)
      .eq('date', today)
      .maybeSingle(),
    supabase.from('diary_notes')
      .select('date')
      .eq('member_id', user.id)
      .gte('date', dateFrom)
      .lte('date', dateTo),
  ])

  const markedDays = [
    ...new Set((markedRaw ?? []).map((d: { date: string }) => parseInt(d.date.split('-')[2])))
  ]
  const initialNoteDays = [
    ...new Set((noteMonthRaw ?? []).map((d: { date: string }) => parseInt(d.date.split('-')[2])))
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Mobile header */}
      <header
        className="lg:hidden flex items-center px-4 py-4 sticky top-0 z-40"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <a href="/dashboard" className="mr-3 text-xl" style={{ color: 'var(--text)' }}>←</a>
        <h1 className="text-base font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          Дневник питания
        </h1>
      </header>

      <DiaryClient
        userId={user.id}
        today={today}
        kbju={{
          calories: member?.kbju_calories ?? null,
          protein:  member?.kbju_protein  ?? null,
          fat:      member?.kbju_fat      ?? null,
          carbs:    member?.kbju_carbs    ?? null,
        }}
        initialEntries={entries ?? []}
        initialWater={water?.glasses_count ?? 0}
        initialMarkedDays={markedDays}
        initialYear={year}
        initialMonth={month}
        initialNote={{ tags: (noteToday?.tags ?? []) as string[], note: noteToday?.note ?? '' }}
        initialNoteDays={initialNoteDays}
      />
    </div>
  )
}
