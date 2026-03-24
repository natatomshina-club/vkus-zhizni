import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from '@/components/ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: member } = await supabase
    .from('members')
    .select(`
      id, email, name, full_name, age, weight, height, goal_weight, initial_weight,
      activity_level, activity_coef, health_conditions, allergies,
      status, trial_ends_at, created_at,
      kbju_calories, kbju_protein, kbju_fat, kbju_carbs,
      avatar_url, birth_date
    `)
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Mobile header */}
      <header
        className="lg:hidden flex items-center px-4 py-4 sticky top-0 z-40"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <a href="/dashboard" className="mr-3 text-xl" style={{ color: 'var(--text)' }}>←</a>
        <h1 className="text-base font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          Профиль
        </h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <div className="hidden lg:block mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
            Мой профиль
          </h1>
        </div>

        <ProfileClient
          userId={user.id}
          userEmail={user.email ?? ''}
          member={member}
        />
      </div>
    </div>
  )
}
