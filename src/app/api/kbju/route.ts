import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateKBJU, type ActivityLevel } from '@/lib/kbju'

const VALID_ACTIVITIES = new Set<ActivityLevel>([
  'sedentary',
  'standing',
  'light_training',
  'intense_training',
])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { weight, height, age, activity } = body

    // Валидация
    if (weight == null || height == null || age == null || activity == null) {
      return NextResponse.json(
        { error: 'Все поля обязательны: weight, height, age, activity' },
        { status: 400 },
      )
    }
    if (typeof weight !== 'number' || weight <= 0) {
      return NextResponse.json({ error: 'weight должен быть числом > 0' }, { status: 400 })
    }
    if (typeof height !== 'number' || height <= 0) {
      return NextResponse.json({ error: 'height должен быть числом > 0' }, { status: 400 })
    }
    if (typeof age !== 'number' || age <= 0) {
      return NextResponse.json({ error: 'age должен быть числом > 0' }, { status: 400 })
    }
    if (!VALID_ACTIVITIES.has(activity)) {
      return NextResponse.json(
        { error: `activity должен быть одним из: ${[...VALID_ACTIVITIES].join(', ')}` },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = calculateKBJU({ weight, height, age, activity })

    // Сохранить в members
    await supabase
      .from('members')
      .update({
        kbju_calories:  result.calories,
        kbju_protein:   result.protein,
        kbju_fat:       result.fat,
        kbju_carbs:     result.carbs,
        activity_level: activity,
      })
      .eq('id', user.id)

    return NextResponse.json({
      calories: result.calories,
      protein:  result.protein,
      fat:      result.fat,
      carbs:    result.carbs,
    })
  } catch (err) {
    console.error('КБЖУ calculate error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
