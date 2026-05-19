const TG_LINK = 'https://t.me/NataTomshina?text=%D0%9D%D0%B0%D1%82%D0%B0%D0%BB%D1%8C%D1%8F%2C%20%D0%B7%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5.%20%D0%A5%D0%BE%D1%87%D1%83%20%D0%BF%D0%BE%D0%BF%D0%B0%D1%81%D1%82%D1%8C%20%D0%B2%20%D0%9A%D0%BB%D1%83%D0%B1'

const includes = [
  'Год доступа ко всей платформе и инструментам',
  'Метаболическое питание из простых продуктов',
  'Личная стратегия от меня под вашу ситуацию',
  'Разбор анализов лично от меня',
  'Персональная схема БАДов',
  'Личный чат со мной весь год',
  'Ежемесячные мини-марафоны',
  'Вебинары о женском здоровье',
  'Карта помощи на любые ситуации',
  'Живое сообщество женщин',
]

export default function Pricing() {
  return (
    <section className="pricing" id="pricing">
      <div className="pricing__inner">
        <span className="section-label section-label--orange">— Стоимость —</span>
        <h2 className="pricing__title">
          Один тариф.<br className="brk-mobile" /> <em>Всё включено.</em>
        </h2>

        <div className="tariff">
          <div className="tariff__main">
            <div className="tariff__badge">
              <span>● Годовая программа</span>
            </div>
            <h3 className="tariff__name">
              Клуб <em>«Вкус Жизни»</em>
            </h3>
            <p className="tariff__period">365 дней пошагово · с поддержкой 24/7</p>

            <div className="tariff__includes-title">Что входит</div>
            <ul className="tariff__list">
              {includes.map((item) => <li key={item}>{item}</li>)}
            </ul>

            <div className="tariff__bonus-pill">
              <div className="tariff__bonus-top">
                <span className="tariff__bonus-icon">🎁</span>
                <div>
                  <div className="tariff__bonus-title">Бонусные вебинары и курсы по женскому здоровью</div>
                  <div className="tariff__bonus-value">на сумму более 88 000 ₽</div>
                </div>
              </div>
              <a href="#bonus-webinars" className="tariff__bonus-link">Посмотреть полный список →</a>
            </div>
          </div>

          <div className="tariff__price-side">
            <div className="tariff__price-label">— Стоимость года —</div>
            <div className="tariff__price-value">67 000<sub>₽</sub></div>
            <div className="tariff__price-perday">≈ 184 ₽ в день</div>
            <a href={TG_LINK} target="_blank" rel="noopener noreferrer" className="btn btn--orange btn--xl">
              Записаться в клуб
            </a>
          </div>
        </div>

        <div className="installment">
          <div className="installment__icon">💳</div>
          <div>
            <div className="installment__title">Рассрочка без процентов</div>
            <p className="installment__desc">
              Если не получается оплатить сразу — делим платёж на удобные части через
              банк-партнёр (Тинькофф). <strong>Все проценты по рассрочке мы берём на себя.</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
