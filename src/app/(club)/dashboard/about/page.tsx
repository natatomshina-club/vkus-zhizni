import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import VideoWithCover from '@/components/VideoWithCover'

interface OnboardingItem {
  screen: string
  video_url: string | null
  description: string | null
  sort_order: number
  title: string | null
  cover_url: string | null
}

// Labels for predefined screens
const PREDEFINED_LABELS: Record<string, string> = {
  kitchen:     '🍳 Умная кухня',
  diary:       '📓 Дневник',
  marathon:    '🏃 Марафон',
  webinars:    '🎥 Вебинары',
  body:        '💚 Я и моё тело',
  meditations: '🧘 Медитации',
  community:   '💬 Сообщество',
  favorites:   '⭐ Избранное',
  profile:     '👤 Профиль',
}

async function getOnboardingItems(device: string): Promise<OnboardingItem[]> {
  const admin = createServiceClient()
  const { data } = await admin
    .from('onboarding_content')
    .select('screen, video_url, description, sort_order, title, cover_url')
    .eq('section', 'about_club')
    .eq('device', device)
    .order('sort_order', { ascending: true })
  return data ?? []
}

export default async function AboutPage() {
  const headersList = await headers()
  const ua = headersList.get('user-agent') ?? ''
  const isMobile = /mobile|android|iphone|ipad/i.test(ua)
  const device = isMobile ? 'mobile' : 'desktop'

  const items = await getOnboardingItems(device)

  const HIDDEN_SCREENS = ['chat', 'tracker', 'victories']

  const welcomeItem = items.find(i => i.screen === 'welcome')
  const sectionItems = items.filter(i => i.screen !== 'welcome' && !HIDDEN_SCREENS.includes(i.screen))

  const hasContent = !!(welcomeItem?.description || welcomeItem?.video_url || welcomeItem?.cover_url) ||
    sectionItems.some(i => i.description || i.video_url || i.cover_url)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Mobile header */}
      <header
        className="lg:hidden flex items-center px-4 py-4 sticky top-0 z-40"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <a href="/dashboard" className="mr-3 text-xl" style={{ color: 'var(--text)' }}>←</a>
        <h1 className="text-base font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          О клубе
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8">

        <div className="hidden lg:block mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
            О клубе 🌿
          </h1>
        </div>

        {!hasContent ? (
          <div className="flex flex-col items-center text-center gap-5 py-10">
            <div className="text-6xl">🌿</div>
            <div
              className="w-full rounded-2xl px-6 py-8 flex flex-col gap-3"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <p className="text-base font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                Скоро здесь появится подробная инструкция по всем разделам клуба и как ими пользоваться
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                Следите за обновлениями 💚
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">

            {/* Welcome block — first, no section header */}
            {(welcomeItem?.description || welcomeItem?.video_url || welcomeItem?.cover_url) && (
              <div
                className="rounded-2xl p-5"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                {(welcomeItem.video_url || welcomeItem.cover_url) && (
                  <div className="rounded-xl overflow-hidden mb-4">
                    <VideoWithCover videoId={welcomeItem.video_url} coverUrl={welcomeItem.cover_url} />
                  </div>
                )}
                {welcomeItem.description && (
                  <p className="text-sm whitespace-pre-wrap"
                    style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                    {welcomeItem.description}
                  </p>
                )}
              </div>
            )}

            {/* Section cards sorted by sort_order */}
            {sectionItems.map(item => {
              if (!item.description && !item.video_url && !item.cover_url) return null
              const label = PREDEFINED_LABELS[item.screen] ?? item.title ?? item.screen
              return (
                <div key={item.screen} className="rounded-2xl p-4"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <p className="font-bold text-sm mb-3"
                    style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                    {label}
                  </p>
                  {(item.video_url || item.cover_url) && (
                    <div className="rounded-xl overflow-hidden mb-3">
                      <VideoWithCover videoId={item.video_url} coverUrl={item.cover_url} />
                    </div>
                  )}
                  {item.description && (
                    <p className="text-sm whitespace-pre-wrap"
                      style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                      {item.description}
                    </p>
                  )}
                </div>
              )
            })}

          </div>
        )}
      </div>
    </div>
  )
}
