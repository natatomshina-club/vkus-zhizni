import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/diary/feelings/2026-04-04
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ mood: '', digestion: [], energy: [], note: '' })

    const { date } = await params

    const supabaseAdmin = createServiceClient()
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('id')
      .eq('email', user.email!)
      .single()
    if (!member) return NextResponse.json({ mood: '', digestion: [], energy: [], note: '' })

    const { data } = await supabaseAdmin
      .from('diary_feelings')
      .select('mood, digestion, energy, note')
      .eq('member_id', member.id)
      .eq('date', date)
      .maybeSingle()

    return NextResponse.json({
      mood:      data?.mood      ?? '',
      digestion: data?.digestion ?? [],
      energy:    data?.energy    ?? [],
      note:      data?.note      ?? '',
    })
  } catch (err) {
    console.error('diary feelings GET exception:', err)
    return NextResponse.json({ mood: '', digestion: [], energy: [], note: '' })
  }
}

// POST /api/diary/feelings/2026-04-04
// Body: { mood, digestion, energy, note }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { date } = await params

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Неверный формат даты' }, { status: 400 })
    }

    const supabaseAdmin = createServiceClient()
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('id')
      .eq('email', user.email!)
      .single()
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const { mood, digestion, energy, note } = await request.json() as {
      mood?:      string
      digestion?: string[]
      energy?:    string[]
      note?:      string
    }

    const { error } = await supabaseAdmin
      .from('diary_feelings')
      .upsert(
        {
          member_id:  member.id,
          date,
          mood:       mood       ?? '',
          digestion:  digestion  ?? [],
          energy:     energy     ?? [],
          note:       note       ?? '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'member_id,date' }
      )

    if (error) {
      console.error('[diary/feelings POST] upsert error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('diary feelings POST exception:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
