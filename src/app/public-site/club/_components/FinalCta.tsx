const TG_LINK = 'https://t.me/NataTomshina?text=%D0%9D%D0%B0%D1%82%D0%B0%D0%BB%D1%8C%D1%8F%2C%20%D0%B7%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5.%20%D0%A5%D0%BE%D1%87%D1%83%20%D0%BF%D0%BE%D0%BF%D0%B0%D1%81%D1%82%D1%8C%20%D0%B2%20%D0%9A%D0%BB%D1%83%D0%B1'

export default function FinalCta() {
  return (
    <section className="final-cta">
      <div className="final-cta__inner">
        <h2 className="final-cta__title">
          Хватит воевать<br />
          с <em>собственным телом</em>
        </h2>
        <p className="final-cta__lead">
          Вы заслуживаете чувствовать себя лёгкой, энергичной и здоровой.
          Год вместе. С результатом, который останется навсегда.
        </p>
        <p className="final-cta__price">
          <strong>67 000 ₽</strong> за год · Рассрочка без процентов
        </p>
        <p className="final-cta__quote">
          «Я вернула себе вкус жизни» — так говорят участницы Клуба
        </p>
        <a href={TG_LINK} target="_blank" rel="noopener noreferrer" className="btn btn--orange btn--xl">
          Записаться в клуб
        </a>
      </div>
    </section>
  )
}
