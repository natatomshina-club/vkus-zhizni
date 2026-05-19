import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ markedDays: [], feelingDays: [] })

  const year  = request.nextUrl.searchParams.get('year')
  const month = request.nextUrl.searchParams.get('month')
  if (!year || !month) return NextResponse.json({ markedDays: [], feelingDays: [] })

  const admin = createServiceClient()

  // Получаем member.id по email
  const { data: member } = await admin
    .from('members')
    .select('id')
    .eq('email', user.email!)
    .single()

  if (!member) return NextResponse.json({ markedDays: [], feelingDays: [] })

  const monthStr = String(month).padStart(2, '0')
  const dateFrom = `${year}-${monthStr}-01`
  const lastDay  = new Date(Number(year), Number(month), 0).getDate()
  const dateTo   = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`

  // Логируем для отладки
  console.log('calendar API: member.id =', member.id, 'dateFrom =', dateFrom, 'dateTo =', dateTo)

  const { data: entriesData, error: entriesError } = await admin
    .from('diary_entries')
    .select('date')
    .eq('member_id', member.id)
    .gte('date', dateFrom)
    .lte('date', dateTo)

  console.log('calendar API: entriesData =', entriesData, 'error =', entriesError)

  const { data: feelingsData } = await admin
    .from('diary_feelings')
    .select('date')
    .eq('member_id', member.id)
    .gte('date', dateFrom)
    .lte('date', dateTo)

  const markedDays  = [...new Set((entriesData  ?? []).map(d => parseInt(d.date.split('-')[2])))]
  const feelingDays = [...new Set((feelingsData ?? []).map(d => parseInt(d.date.split('-')[2])))]

  console.log('calendar API: markedDays =', markedDays)

  return NextResponse.json({ markedDays, feelingDays })
}
