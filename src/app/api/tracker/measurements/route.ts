import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateKBJU, type ActivityLevel } from '@/lib/kbju'

function getWeekRange(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    monday: monday.toISOString().split('T')[0],
    sunday: sunday.toISOString().split('T')[0],
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('measurements')
      .select('id, member_id, date, weight, waist, hips, chest, energy, sweet_craving, note, created_at')
      .eq('member_id', user.id)
      .order('date', { ascending: false })

    if (error) {
      console.error('[tracker/measurements GET] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (e) {
    console.error('[tracker/measurements GET] exception:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as {
      date: string
      weight: number
      waist?: number | null
      hips?: number | null
      chest?: number | null
      energy: number
      sweet_craving: boolean
    }

    const { date, weight, waist, hips, chest, energy, sweet_craving } = body

    // Validate
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Неверный формат даты' }, { status: 400 })
    }
    if (typeof weight !== 'number' || weight < 30 || weight > 200) {
      return NextResponse.json({ error: 'Вес должен быть от 30 до 200 кг' }, { status: 400 })
    }
    if (typeof energy !== 'number' || energy < 1 || energy > 10) {
      return NextResponse.json({ error: 'Энергия должна быть от 1 до 10' }, { status: 400 })
    }

    // Check week duplicate
    const { monday, sunday } = getWeekRange(date)
    const { data: existing } = await supabase
      .from('measurements')
      .select('id')
      .eq('member_id', user.id)
      .gte('date', monday)
      .lte('date', sunday)
      .limit(1)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Замер за эту неделю уже внесён' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('measurements')
      .insert({
        member_id: user.id,
        date,
        weight,
        waist: waist ?? null,
        hips: hips ?? null,
        chest: chest ?? null,
        energy,
        sweet_craving: sweet_craving ?? false,
      })
      .select('id, member_id, date, weight, waist, hips, chest, energy, sweet_craving, note, created_at')
      .single()

    if (error) {
      console.error('[tracker/measurements POST] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ── Автосинхронизация: обновить вес и пересчитать КБЖУ в members ──
    let syncOk = false
    let syncError: string | undefined

    try {
      // 1. Обновить текущий вес
      const { error: weightErr } = await supabase
        .from('members').update({ weight }).eq('id', user.id)
      if (weightErr) throw new Error(`weight_update: ${weightErr.message}`)

      // 2. Получить данные для пересчёта КБЖУ
      const { data: member, error: memberErr } = await supabase
        .from('members')
        .select('height, age, activity_level')
        .eq('id', user.id)
        .single()
      if (memberErr) throw new Error(`member_fetch: ${memberErr.message}`)

      if (member?.height && member?.age && member?.activity_level) {
        const kbju = calculateKBJU({
          weight,
          height:   member.height,
          age:      member.age,
          activity: member.activity_level as ActivityLevel,
        })

        const { error: kbjuErr } = await supabase.from('members').update({
          kbju_calories: kbju.calories,
          kbju_fat:      kbju.fat,
          kbju_carbs:    kbju.carbs,
          // kbju_protein намеренно не обновляется — зависит от роста/активности, не от веса
        }).eq('id', user.id)
        if (kbjuErr) throw new Error(`kbju_update: ${kbjuErr.message}`)
      }

      syncOk = true
    } catch (syncErr) {
      syncError = String(syncErr)
      console.error('[tracker/measurements POST] sync error:', syncErr)
    }

    return NextResponse.json({ data, syncOk, ...(syncError ? { syncError } : {}) })
  } catch (e) {
    console.error('[tracker/measurements POST] exception:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
