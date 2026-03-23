import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/diary/notes?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) console.error('[diary/notes GET] auth error:', authError)
    if (!user) return NextResponse.json({ tags: [], note: '' })

    const date = request.nextUrl.searchParams.get('date')
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ tags: [], note: '' })
    }

    const { data, error } = await supabase
      .from('diary_notes')
      .select('mood_tags, free_note')
      .eq('member_id', user.id)
      .eq('date', date)
      .maybeSingle()

    if (error) {
      console.error('[diary/notes GET] supabase error:', JSON.stringify(error))
      return NextResponse.json({ tags: [], note: '' })
    }

    return NextResponse.json({ tags: data?.mood_tags ?? [], note: data?.free_note ?? '' })
  } catch (e) {
    console.error('[diary/notes GET] exception:', e)
    return NextResponse.json({ tags: [], note: '' })
  }
}

// POST /api/diary/notes
// Body: { date, tags, note }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) console.error('[diary/notes POST] auth error:', authError)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as { date?: string; tags?: string[]; note?: string }
    const { date, tags, note } = body

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error('[diary/notes POST] bad date:', date)
      return NextResponse.json({ error: 'Неверный формат даты' }, { status: 400 })
    }

    console.log('[diary/notes POST] member_id:', user.id, '| date:', date, '| tags:', tags?.length ?? 0, '| note len:', (note ?? '').length)

    const { error } = await supabase
      .from('diary_notes')
      .upsert(
        { member_id: user.id, date, mood_tags: tags ?? [], free_note: note ?? '', updated_at: new Date().toISOString() },
        { onConflict: 'member_id,date' }
      )

    if (error) {
      console.error('[diary/notes POST] upsert error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[diary/notes POST] exception:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
