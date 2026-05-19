import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const t0 = Date.now()

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.log(`[me] getSession took ${Date.now() - t0}ms`)

    const t1 = Date.now()
    const admin = createServiceClient()
    const { data } = await admin
      .from('members')
      .select('id,email,name,full_name,first_name,role,status,subscription_status,trial_ends_at,age,weight,height,goal_weight,health_conditions,allergies,kbju_calories,kbju_protein,kbju_fat,kbju_carbs,kitchen_requests_today,created_at,subscription_started_at,tour_completed')
      .eq('email', session.user.email)
      .single()
    console.log(`[me] db query took ${Date.now() - t1}ms, total ${Date.now() - t0}ms`)

    if (!data) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    return NextResponse.json({ member: data })
  } catch (e) {
    console.error('[/api/member/me]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
