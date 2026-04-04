import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import WeeklyPlanForm from '@/components/WeeklyPlanForm'

export default async function WeeklyKitchenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: member }, { data: latestPlan }] = await Promise.all([
    supabase.from('members')
      .select('kbju_calories, kbju_protein, kbju_fat, kbju_carbs, status')
      .eq('id', user.id)
      .single(),
    supabase.from('weekly_plans')
      .select('id, created_at, meals_per_day, cook_mode, include_soups')
      .eq('member_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const isTrial = member?.status === 'trial' || !member?.status
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  const hasActivePlan = latestPlan && (Date.now() - new Date(latestPlan.created_at).getTime() < sevenDaysMs)
  const nextAvailable = latestPlan
    ? new Date(new Date(latestPlan.created_at).getTime() + sevenDaysMs)
    : null
  const canCreate = !hasActivePlan && !(isTrial && latestPlan)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/kitchen"
          className="w-9 h-9 flex items-center justify-center rounded-full text-lg"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          ←
        </Link>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          Рацион на неделю
        </h1>
      </div>

      {/* Карточка активного плана */}
      {latestPlan && (
        <div className="rounded-2xl px-4 py-4 mb-6"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                {hasActivePlan ? 'Текущий рацион' : 'Последний рацион'}
              </p>
              <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                {latestPlan.meals_per_day} приёма · {latestPlan.cook_mode === 'every2days' ? 'на 2 дня' : 'каждый день'}
                {latestPlan.include_soups ? ' · с супами' : ''}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                Создан {new Date(latestPlan.created_at).toLocaleDateString('ru-RU')}
              </p>
              {hasActivePlan && nextAvailable && (
                <p className="text-xs mt-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                  Следующий рацион можно создать: {nextAvailable.toLocaleDateString('ru-RU')}
                </p>
              )}
            </div>
            <Link href={`/dashboard/kitchen/weekly/${latestPlan.id}`}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: '#E8845A', color: '#fff', fontFamily: 'var(--font-nunito)' }}>
              Открыть
            </Link>
          </div>
        </div>
      )}

      {/* Форма или заблокированная кнопка */}
      {canCreate ? (
        <WeeklyPlanForm
          kbjuCalories={member?.kbju_calories ?? null}
          kbjuProtein={member?.kbju_protein ?? null}
          kbjuFat={member?.kbju_fat ?? null}
          kbjuCarbs={member?.kbju_carbs ?? null}
        />
      ) : (
        <div className="rounded-2xl px-4 py-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
            {isTrial
              ? '🔒 В триале доступен 1 рацион на неделю'
              : '🔒 Новый рацион будет доступен через 7 дней'}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            {nextAvailable
              ? `Следующий рацион можно создать: ${nextAvailable.toLocaleDateString('ru-RU')}`
              : 'Рацион на неделю уже создан.'}
          </p>
        </div>
      )}
    </div>
  )
}
