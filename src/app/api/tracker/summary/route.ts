import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Run in parallel: member's initial_weight + first measurement (for body start) + last measurement (current)
    const [{ data: member }, { data: firstRows }, { data: lastRows }] = await Promise.all([
      supabase
        .from('members')
        .select('initial_weight')
        .eq('id', user.id)
        .single(),
      supabase
        .from('measurements')
        .select('waist, hips, chest')
        .eq('member_id', user.id)
        .order('date', { ascending: true })
        .limit(1),
      supabase
        .from('measurements')
        .select('weight, waist, hips, chest')
        .eq('member_id', user.id)
        .order('date', { ascending: false })
        .limit(1),
    ])

    const first = firstRows?.[0] ?? null
    const last  = lastRows?.[0]  ?? null

    const initialWeight = (member as { initial_weight?: number | null } | null)?.initial_weight ?? null

    function bodyPair(key: 'waist' | 'hips' | 'chest') {
      const start   = first?.[key] as number | null | undefined
      const current = last?.[key]  as number | null | undefined
      if (start == null || current == null) return null
      return { start, current }
    }

    return NextResponse.json({
      weight: (initialWeight != null && last?.weight != null)
        ? { start: initialWeight, current: last.weight }
        : null,
      waist: bodyPair('waist'),
      hips:  bodyPair('hips'),
      chest: bodyPair('chest'),
    })
  } catch (e) {
    console.error('[api/tracker/summary GET]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
