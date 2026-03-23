import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import KitchenClient from '@/components/KitchenClient'

export default async function KitchenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: member } = await supabase
    .from('members')
    .select('status, kbju_calories, kbju_protein, kbju_fat, kbju_carbs, kitchen_requests_today, kitchen_date')
    .eq('id', user.id)
    .single()

  const isTrial = member?.status === 'trial' || !member?.status
  const maxRequests = isTrial ? 3 : 10
  const today = new Date().toISOString().split('T')[0]
  const initialRequestsToday =
    member?.kitchen_date === today ? (member?.kitchen_requests_today ?? 0) : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Mobile header */}
      <header
        className="lg:hidden flex items-center px-4 py-4 sticky top-0 z-40"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <a href="/dashboard" className="mr-3 text-xl" style={{ color: 'var(--text)' }}>←</a>
        <h1 className="text-base font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          Умная кухня
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <div className="hidden lg:block mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
            Умная кухня 🍳
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            Скажи что есть — система подберёт рецепты точно под твои КБЖУ
          </p>
        </div>

        <KitchenClient
          userId={user.id}
          isTrial={isTrial}
          maxRequests={maxRequests}
          initialRequestsToday={initialRequestsToday}
          kbjuCalories={member?.kbju_calories ?? null}
          kbjuProtein={member?.kbju_protein ?? null}
          kbjuFat={member?.kbju_fat ?? null}
          kbjuCarbs={member?.kbju_carbs ?? null}
        />

        <div className="h-8" />
      </div>
    </div>
  )
}
