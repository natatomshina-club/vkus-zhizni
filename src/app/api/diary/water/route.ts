import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/diary/water?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const date = request.nextUrl.searchParams.get('date')
    if (!date) return NextResponse.json({ glasses_count: 0 })

    const { data } = await supabase
      .from('diary_water')
      .select('glasses_count')
      .eq('member_id', user.id)
      .eq('date', date)
      .maybeSingle()

    return NextResponse.json({ glasses_count: data?.glasses_count ?? 0 })
  } catch (err) {
    console.error('diary water GET exception:', err)
    return NextResponse.json({ glasses_count: 0 })
  }
}

// POST /api/diary/water
// Body: { date, glasses_count }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { date, glasses_count } = await request.json() as { date: string; glasses_count: number }

    if (!date || typeof glasses_count !== 'number') {
      return NextResponse.json({ error: 'Обязательные поля: date, glasses_count' }, { status: 400 })
    }

    // Check existing row
    const { data: existing } = await supabase
      .from('diary_water')
      .select('id')
      .eq('member_id', user.id)
      .eq('date', date)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('diary_water')
        .update({ glasses_count, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('diary_water')
        .insert({ member_id: user.id, date, glasses_count })
    }

    return NextResponse.json({ ok: true, glasses_count })
  } catch (err) {
    console.error('diary water POST exception:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
