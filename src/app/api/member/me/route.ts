import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()
    const { data } = await admin
      .from('members')
      .select('id,email,name,full_name,role,status,subscription_status,trial_ends_at,age,weight,height,goal_weight,health_conditions,allergies,kbju_calories,kbju_protein,kbju_fat,kbju_carbs,kitchen_requests_today,created_at')
      .eq('email', user.email)
      .single()

    if (!data) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    return NextResponse.json({ member: data })
  } catch (e) {
    console.error('[/api/member/me]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
