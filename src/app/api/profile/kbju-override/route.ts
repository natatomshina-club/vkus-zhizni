import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { protein, carbs } = body as { protein: number; carbs: number }

    if (typeof protein !== 'number' || typeof carbs !== 'number') {
      return NextResponse.json({ error: 'protein и carbs обязательны' }, { status: 400 })
    }

    const admin = createServiceClient()
    const { data: member } = await admin
      .from('members')
      .select('kbju_calories, kbju_protein_system, kbju_carbs_system')
      .eq('email', user.email)
      .single()

    if (!member?.kbju_protein_system || !member?.kbju_carbs_system) {
      return NextResponse.json(
        { error: 'Сначала пройди расчёт КБЖУ в профиле' },
        { status: 400 }
      )
    }

    const { kbju_calories, kbju_protein_system, kbju_carbs_system } = member

    const minProtein = kbju_protein_system - 20
    const maxProtein = kbju_protein_system + 20
    if (!Number.isInteger(protein) || protein < minProtein || protein > maxProtein) {
      return NextResponse.json(
        { error: `Белки можно изменять в диапазоне ${minProtein}–${maxProtein} г` },
        { status: 400 }
      )
    }

    if (!Number.isInteger(carbs) || carbs < 20 || carbs > kbju_carbs_system) {
      return NextResponse.json(
        { error: `Углеводы можно снижать до 20 г, но не повышать выше ${kbju_carbs_system} г` },
        { status: 400 }
      )
    }

    const fat = Math.round((kbju_calories - protein * 4 - carbs * 4) / 9)

    await admin
      .from('members')
      .update({ kbju_protein: protein, kbju_carbs: carbs, kbju_fat: fat, kbju_manual: true })
      .eq('email', user.email)

    return NextResponse.json({ protein, carbs, fat, calories: kbju_calories, kbju_manual: true })
  } catch (err) {
    console.error('kbju-override PATCH error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
