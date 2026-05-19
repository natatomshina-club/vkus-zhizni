import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import DiaryClient from '@/components/DiaryClient'

export default async function DiaryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const today = new Date().toISOString().split('T')[0]
  const [year, month] = today.split('-').map(Number)
  const monthStr = String(month).padStart(2, '0')

  const dateFrom = `${year}-${monthStr}-01`
  const lastDay  = new Date(year, month, 0).getDate()
  const dateTo   = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`

  // Service client + email lookup — bypasses RLS, uses correct members.id
  const supabaseAdmin = createServiceClient()
  const { data: member } = await supabaseAdmin
    .from('members')
    .select('id, kbju_calories, kbju_protein, kbju_fat, kbju_carbs')
    .eq('email', user.email!)
    .single()

  const memberId = member?.id ?? user.id

  const [
    { data: entries },
    { data: water },
    { data: markedRaw },
    { data: feelingsToday },
    { data: feelingsMonthRaw },
  ] = await Promise.all([
    supabaseAdmin.from('diary_entries')
      .select('id, meal_type, title, calories, protein, fat, carbs, source, servings')
      .eq('member_id', memberId)
      .eq('date', today)
      .order('created_at', { ascending: true }),
    supabaseAdmin.from('diary_water')
      .select('glasses_count')
      .eq('member_id', memberId)
      .eq('date', today)
      .maybeSingle(),
    supabaseAdmin.from('diary_entries')
      .select('date')
      .eq('member_id', memberId)
      .gte('date', dateFrom)
      .lte('date', dateTo),
    supabaseAdmin.from('diary_feelings')
      .select('mood, digestion, energy, note')
      .eq('member_id', memberId)
      .eq('date', today)
      .maybeSingle(),
    supabaseAdmin.from('diary_feelings')
      .select('date')
      .eq('member_id', memberId)
      .gte('date', dateFrom)
      .lte('date', dateTo),
  ])

  const markedDays = [
    ...new Set((markedRaw ?? []).map((d: { date: string }) => parseInt(d.date.split('-')[2])))
  ]
  const initialNoteDays = [
    ...new Set((feelingsMonthRaw ?? []).map((d: { date: string }) => parseInt(d.date.split('-')[2])))
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
        userId={memberId}
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
        initialFeelings={{
          mood:      (feelingsToday as { mood?: string } | null)?.mood      ?? '',
          digestion: (feelingsToday as { digestion?: string[] } | null)?.digestion ?? [],
          energy:    (feelingsToday as { energy?: string[] } | null)?.energy    ?? [],
          note:      (feelingsToday as { note?: string } | null)?.note      ?? '',
        }}
        initialNoteDays={initialNoteDays}
      />
    </div>
  )
}
