import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/diary/calendar?year=2026&month=3
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const year  = request.nextUrl.searchParams.get('year')
    const month = request.nextUrl.searchParams.get('month')
    if (!year || !month) return NextResponse.json({ days: [], noteDays: [] })

    const monthStr = String(month).padStart(2, '0')
    const dateFrom = `${year}-${monthStr}-01`
    const dateTo   = `${year}-${monthStr}-31`

    const [{ data: entriesData }, { data: notesData }] = await Promise.all([
      supabase
        .from('diary_entries')
        .select('date')
        .eq('member_id', user.id)
        .gte('date', dateFrom)
        .lte('date', dateTo),
      supabase
        .from('diary_notes')
        .select('date')
        .eq('member_id', user.id)
        .gte('date', dateFrom)
        .lte('date', dateTo),
    ])

    const days     = [...new Set((entriesData ?? []).map(d => parseInt(d.date.split('-')[2])))]
    const noteDays = [...new Set((notesData   ?? []).map(d => parseInt(d.date.split('-')[2])))]

    return NextResponse.json({ days, noteDays })
  } catch (err) {
    console.error('diary calendar GET exception:', err)
    return NextResponse.json({ days: [], noteDays: [] })
  }
}
