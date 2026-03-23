import Link from 'next/link'

const rations = [
  {
    title: 'Рацион 2-разового питания',
    desc: 'Плотный завтрак и сытный обед/ужин. Идеально если нет времени готовить часто.',
    icon: '🍽️',
    tag: 'Популярный',
    tagColor: { bg: 'var(--pur-light)', color: 'var(--pur)' },
  },
  {
    title: 'Рацион 3-разового питания',
    desc: 'Классическое распределение: завтрак, обед, ужин. Равномерная нагрузка на ЖКТ.',
    icon: '🥗',
    tag: 'Базовый',
    tagColor: { bg: 'var(--grn-light)', color: '#1A5C3A' },
  },
  {
    title: 'Рацион из курицы',
    desc: 'Бюджетный и удобный протеин. Разные способы приготовления на каждый день.',
    icon: '🍗',
    tag: 'Бюджетный',
    tagColor: { bg: 'var(--yel-light)', color: '#8B6000' },
  },
  {
    title: 'Рацион из говядины',
    desc: 'Богатый железом и цинком. Для тех кто хочет максимум питательности.',
    icon: '🥩',
    tag: 'Питательный',
    tagColor: { bg: 'var(--ora-light)', color: '#A04000' },
  },
  {
    title: 'Рацион без желчного пузыря',
    desc: 'Без жирного и жареного. Мягкая термообработка, дробное питание, поддержка пищеварения.',
    icon: '🌿',
    tag: 'Здоровье ЖКТ',
    tagColor: { bg: '#FFF0F0', color: '#C0392B' },
  },
  {
    title: 'Рацион при заболеваниях ЖКТ',
    desc: 'При гастрите, ГЭРБ, СРК. Щадящие блюда без раздражителей.',
    icon: '💊',
    tag: 'Лечебный',
    tagColor: { bg: '#FFF0F0', color: '#C0392B' },
  },
  {
    title: 'Бюджетный рацион до 1000₽/нед',
    desc: 'Полноценное питание без дорогих продуктов. Яйца, курица, сезонные овощи.',
    icon: '💰',
    tag: 'Эконом',
    tagColor: { bg: 'var(--yel-light)', color: '#8B6000' },
  },
  {
    title: 'После праздников — мягкий выход',
    desc: 'Помогает восстановиться без стресса. Лёгкие блюда на 3–5 дней.',
    icon: '🌸',
    tag: 'Восстановление',
    tagColor: { bg: 'var(--grn-light)', color: '#1A5C3A' },
  },
]

export default function RationsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Mobile header */}
      <header
        className="lg:hidden flex items-center px-4 py-4 sticky top-0 z-40"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <Link href="/dashboard/kitchen" className="mr-3 text-xl" style={{ color: 'var(--text)' }}>←</Link>
        <h1 className="text-base font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          Примеры рационов
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        {/* Title */}
        <div className="mb-6">
          <div className="hidden lg:flex items-center gap-2 mb-1">
            <Link href="/dashboard/kitchen" className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              ← Умная кухня
            </Link>
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
            📋 Примеры рационов
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            Готовые планы питания от Натальи — скачай и используй
          </p>
        </div>

        {/* Info banner */}
        <div
          className="rounded-2xl px-4 py-3.5 mb-6 flex gap-3 items-start"
          style={{ background: 'var(--pur-light)' }}
        >
          <span className="text-xl shrink-0">👩‍⚕️</span>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
            Каждый рацион составлен по методу гормонального баланса: белок + некрахмалистые овощи + полезные жиры. Выбери подходящий и адаптируй под свои продукты.
          </p>
        </div>

        {/* Rations grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rations.map(({ title, desc, icon, tag, tagColor }) => (
            <div
              key={title}
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-3xl leading-none">{icon}</span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: tagColor.bg, color: tagColor.color, fontFamily: 'var(--font-nunito)' }}
                >
                  {tag}
                </span>
              </div>

              <div>
                <p className="text-sm font-bold leading-snug" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
                  {title}
                </p>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ fontFamily: 'var(--font-nunito)', color: 'var(--muted)' }}>
                  {desc}
                </p>
              </div>

              <button
                disabled
                className="w-full py-2 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 cursor-not-allowed"
                style={{
                  fontFamily: 'var(--font-nunito)',
                  borderColor: 'var(--border)',
                  color: 'var(--muted)',
                  background: 'var(--bg)',
                }}
                title="Скоро будет доступно"
              >
                📄 Скачать PDF
              </button>
            </div>
          ))}
        </div>

        {/* Coming soon note */}
        <p
          className="text-xs text-center mt-6"
          style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
        >
          PDF-версии рационов появятся в ближайшее время 💜
        </p>

        <div className="h-6" />
      </div>
    </div>
  )
}
