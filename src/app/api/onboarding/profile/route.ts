import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* empty body is ok */ }
  console.log('[Onboarding/profile] received for:', user.email, JSON.stringify(body))

  const admin = createServiceClient()
  const { error } = await admin
    .from('members')
    .update({
      full_name:               body.full_name ?? body.name,
      name:                    body.name,
      first_name:              body.first_name ?? null,
      age:                     body.age,
      weight:                  body.weight,
      start_weight:            body.start_weight,
      height:                  body.height,
      goal_weight:             body.goal_weight,
      activity_level:          body.activity_level,
      health_conditions:       body.health_conditions,
      allergies:               body.allergies,
      kbju_calories:           body.kbju_calories,
      kbju_protein:            body.kbju_protein,
      kbju_fat:                body.kbju_fat,
      kbju_carbs:              body.kbju_carbs,
      kbju_protein_system:     body.kbju_protein,
      kbju_carbs_system:       body.kbju_carbs,
      kbju_manual:             false,
      agreed_terms_at:         body.agreed_terms_at,
      agreed_disclaimer_at:    body.agreed_disclaimer_at,
      agreed_personal_data_at: body.agreed_personal_data_at,
      onboarding_completed:    true,
    })
    .eq('email', user.email)

  console.log('[Onboarding/profile] update result:', { error: error ? error.message : null })

  if (error) {
    console.error('[Onboarding/profile] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
