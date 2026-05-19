import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WeeklyPlanView from '@/components/WeeklyPlanView'

export default async function WeeklyPlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { id } = await params

  const { data: plan, error } = await supabase
    .from('weekly_plans')
    .select('*')
    .eq('id', id)
    .eq('member_id', user.id)
    .single()

  if (error || !plan) notFound()

  return <WeeklyPlanView plan={plan as Parameters<typeof WeeklyPlanView>[0]['plan']} userId={user.id} />
}
