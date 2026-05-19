export default function YearNotLong() {
  return (
    <section className="year">
      <div className="year__inner">
        <h2 className="section-title">
          «Год — это <em className="is-orange">слишком долго</em>»<br />
          думают те, кто 10 лет худеет рывками
        </h2>

        <div className="year__quote-card">
          <div className="year__quote-mark">&ldquo;</div>
          <p className="year__quote-text">
            Год — это не долго. <strong>Долго</strong> — это десять лет рывков, после которых
            вы в той же точке. Только тяжелее и с болячками.
          </p>
        </div>

        <h3 className="year__list-title">
          За год — <em>реальные изменения</em>, а не временный скачок
        </h3>

        <ul className="year__list">
          <li>Организм перестраивается на новый метаболизм</li>
          <li>Уходят сопутствующие диагнозы — гипертония, ИР, гепатоз, преддиабет</li>
          <li>Вес становится не главной метрикой — а просто следствием</li>
          <li>Меняется отношение к еде. Навсегда</li>
        </ul>
      </div>
    </section>
  )
}
