import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/diary/entries/[id]/servings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { servings } = body as { servings: number }

    if (typeof servings !== 'number' || servings < 0.5 || servings > 10) {
      return NextResponse.json({ error: 'Недопустимое значение порций (0.5 – 10)' }, { status: 400 })
    }
    if (Math.round(servings * 2) !== servings * 2) {
      return NextResponse.json({ error: 'Значение должно быть кратно 0.5' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('diary_entries')
      .update({ servings })
      .eq('id', id)
      .eq('member_id', user.id)
      .select('id, meal_type, title, calories, protein, fat, carbs, source, servings')
      .single()

    if (error) {
      console.error('diary servings PATCH error:', error)
      return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 })
    }

    return NextResponse.json({ entry: data })
  } catch (err) {
    console.error('diary servings PATCH exception:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
