import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()
    const { data: member } = await admin
      .from('members')
      .select('kbju_calories, kbju_protein_system, kbju_carbs_system')
      .eq('email', user.email)
      .single()

    if (!member?.kbju_protein_system || !member?.kbju_carbs_system) {
      return NextResponse.json({ error: 'Системные значения КБЖУ не найдены' }, { status: 400 })
    }

    const { kbju_calories, kbju_protein_system, kbju_carbs_system } = member
    const fat = Math.round((kbju_calories - kbju_protein_system * 4 - kbju_carbs_system * 4) / 9)

    await admin
      .from('members')
      .update({
        kbju_protein: kbju_protein_system,
        kbju_carbs:   kbju_carbs_system,
        kbju_fat:     fat,
        kbju_manual:  false,
      })
      .eq('email', user.email)

    return NextResponse.json({
      protein:     kbju_protein_system,
      carbs:       kbju_carbs_system,
      fat,
      calories:    kbju_calories,
      kbju_manual: false,
    })
  } catch (err) {
    console.error('kbju-override reset error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
