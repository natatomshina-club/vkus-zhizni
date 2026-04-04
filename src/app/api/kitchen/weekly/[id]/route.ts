import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const { data, error } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('id', id)
      .eq('member_id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Рацион не найден' }, { status: 404 })
    }

    return NextResponse.json({ plan: data })
  } catch (err) {
    console.error('weekly plan GET error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
