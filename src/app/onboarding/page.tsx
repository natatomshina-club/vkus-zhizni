import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingForm from '@/components/OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Header card */}
        <div
          className="rounded-3xl px-6 py-7 mb-6 text-center"
          style={{ background: 'linear-gradient(135deg, var(--pur) 0%, #9B7CFF 100%)' }}
        >
          <p className="text-3xl mb-3">🌿</p>
          <h1
            className="text-xl font-bold text-white leading-snug"
            style={{ fontFamily: 'var(--font-unbounded)' }}
          >
            Давай познакомимся! 👋
          </h1>
          <p
            className="text-sm text-white/80 mt-2 leading-relaxed"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            Заполни анкету — Наташа рассчитает твой личный КБЖУ
            и составит питание по методу гормонального баланса
          </p>
        </div>

        <OnboardingForm userId={user.id} />
      </div>
    </div>
  )
}
