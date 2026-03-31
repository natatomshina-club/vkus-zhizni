import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/diary/entries?date=YYYY-MM-DD
// GET /api/diary/entries?from=YYYY-MM-DD&to=YYYY-MM-DD
// GET /api/diary/entries  → defaults to last 30 days, max 90 rows
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sp = request.nextUrl.searchParams
    const date = sp.get('date')
    const from = sp.get('from')
    const to   = sp.get('to')

    let query = supabase
      .from('diary_entries')
      .select('id, meal_type, title, calories, protein, fat, carbs, source, date')
      .eq('member_id', user.id)
      .order('created_at', { ascending: true })
      .limit(90)

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'Неверный формат даты' }, { status: 400 })
      }
      query = query.eq('date', date)
    } else if (from || to) {
      if (from) query = query.gte('date', from)
      if (to)   query = query.lte('date', to)
    } else {
      // Default: last 30 days
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      query = query.gte('date', cutoff.toISOString().slice(0, 10))
    }

    const { data, error } = await query

    if (error) {
      console.error('diary entries GET error:', error)
      return NextResponse.json({ error: 'Ошибка загрузки' }, { status: 500 })
    }

    return NextResponse.json({ entries: data ?? [] })
  } catch (err) {
    console.error('diary entries GET exception:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}

// POST /api/diary/entries
// Body: { date, meal_type, title, calories, protein, fat, carbs, source }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { date, meal_type, title, calories, protein, fat, carbs, source } = body as {
      date: string
      meal_type: string
      title: string
      calories: number
      protein: number
      fat: number
      carbs: number
      source: string
    }

    if (!date || !meal_type || !title) {
      return NextResponse.json({ error: 'Обязательные поля: date, meal_type, title' }, { status: 400 })
    }

    console.log('[diary/entries POST] member_id:', user.id, '| date:', date, '| meal_type:', meal_type, '| title:', title)

    const { data, error } = await supabase
      .from('diary_entries')
      .insert({
        member_id: user.id,
        date,
        meal_type,
        title,
        calories:  calories  ?? 0,
        protein:   protein   ?? 0,
        fat:       fat       ?? 0,
        carbs:     carbs     ?? 0,
        source:    source    ?? 'manual',
      })
      .select('id, meal_type, title, calories, protein, fat, carbs, source')
      .single()

    if (error) {
      console.error('[diary/entries POST] insert error:', error)
      return NextResponse.json({ error: 'Ошибка сохранения' }, { status: 500 })
    }

    return NextResponse.json({ entry: data })
  } catch (err) {
    console.error('diary entries POST exception:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
