import Link from 'next/link'

export default function OnboardingIndexPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header
        className="lg:hidden flex items-center px-4 py-4 sticky top-0 z-40"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <a href="/admin" className="mr-3 text-xl" style={{ color: 'var(--text)' }}>←</a>
        <h1 className="text-base font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          Обучающие материалы
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <div className="hidden lg:flex items-center gap-3 mb-6">
          <a href="/admin" className="text-lg" style={{ color: 'var(--muted)' }}>← Назад</a>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
            Обучающие материалы 📚
          </h1>
        </div>

        <p className="text-sm mb-6" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Управляйте текстами и видео-инструкциями, которые видят участницы на страницах клуба.
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/admin/onboarding/about"
            className="rounded-2xl p-5 flex items-start gap-4 hover:opacity-80 transition-opacity"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', textDecoration: 'none' }}
          >
            <div className="text-3xl shrink-0">🌿</div>
            <div>
              <p className="font-bold text-base mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                О клубе
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                Инструкции по всем разделам клуба: питание, кухня, дневник, марафон, вебинары и т.д.
                Разные тексты для мобильного и десктопа.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/onboarding/kitchen"
            className="rounded-2xl p-5 flex items-start gap-4 hover:opacity-80 transition-opacity"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', textDecoration: 'none' }}
          >
            <div className="text-3xl shrink-0">🍳</div>
            <div>
              <p className="font-bold text-base mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                Умная кухня
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                Блок «Как пользоваться Умной Кухней?» — текст и видео в аккордеоне на странице кухни.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
