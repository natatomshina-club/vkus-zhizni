import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import KitchenClient from '@/components/KitchenClient'

export default async function KitchenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const headersList = await headers()
  const ua = headersList.get('user-agent') ?? ''
  const isMobile = /mobile|android|iphone|ipad/i.test(ua)
  const device = isMobile ? 'mobile' : 'desktop'

  const admin = createServiceClient()

  const [{ data: member }, { data: helpRows }] = await Promise.all([
    admin
      .from('members')
      .select('id, subscription_status, kbju_calories, kbju_protein, kbju_fat, kbju_carbs, kitchen_requests_today, kitchen_date')
      .eq('email', user.email!)
      .single(),
    admin
      .from('onboarding_content')
      .select('video_url, description, cover_url')
      .eq('section', 'kitchen')
      .eq('screen', 'main')
      .eq('device', device)
      .maybeSingle(),
  ])

  const isTrial = member?.subscription_status !== 'active'
  const maxRequests = isTrial ? 3 : 10
  const today = new Date().toISOString().split('T')[0]
  const initialRequestsToday =
    member?.kitchen_date === today ? (member?.kitchen_requests_today ?? 0) : 0

  const helpDescription = helpRows?.description ?? null
  const helpVideoId = helpRows?.video_url ?? null
  const helpCoverUrl = helpRows?.cover_url ?? null

  return (
    <div className="min-h-screen" style={{ background: '#F0EEFF' }}>
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
            Укажи продукты — система подберёт рецепты точно под твои КБЖУ
          </p>
        </div>

        <KitchenClient
          userId={member?.id ?? user.id}
          isTrial={isTrial}
          maxRequests={maxRequests}
          initialRequestsToday={initialRequestsToday}
          kbjuCalories={member?.kbju_calories ?? null}
          kbjuProtein={member?.kbju_protein ?? null}
          kbjuFat={member?.kbju_fat ?? null}
          kbjuCarbs={member?.kbju_carbs ?? null}
          helpDescription={helpDescription}
          helpVideoId={helpVideoId}
          helpCoverUrl={helpCoverUrl}
        />

        <div className="h-8" />
      </div>
    </div>
  )
}
