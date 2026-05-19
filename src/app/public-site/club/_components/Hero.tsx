import { getClubMode } from '@/lib/club-mode'

export default function Hero() {
  const mode = getClubMode()
  const ctaHref = mode === 'diagnostic' ? '#diagnostic' : '#pricing'

  return (
    <section className="hero">
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__inner">
        <div className="hero__pill">
          <span className="dot">●</span>
          <span>Годовая программа для женщин 35–60 лет</span>
        </div>
        <h1 className="hero__title">
          Без гонки.<br />
          <em>Без ощущения,<br />что сидишь на диете.</em>
        </h1>
        <p className="hero__lead">
          Клуб «Вкус Жизни» — это не марафон и не курс на месяц,
          после которого вы снова одна со своими вопросами. Это год.
          Пошагово, с поддержкой нутрициолога и женщин, которые идут рядом.
        </p>
        <p className="hero__tempo">
          Минус 2–3 кг в месяц. Без надрыва. Зато навсегда.
        </p>
        <div className="hero__cta">
          <a href={ctaHref} className="btn btn--orange btn--xl">Записаться в клуб</a>
          <a href="#roadmap" className="btn btn--ghost btn--lg">Как устроен клуб →</a>
        </div>
        <div className="hero__trust">
          <span className="hero__stars" aria-label="Рейтинг 5 из 5">
            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
          </span>
          <span><strong>9 из 10</strong> рекомендуют подругам</span>
        </div>
      </div>
    </section>
  )
}
