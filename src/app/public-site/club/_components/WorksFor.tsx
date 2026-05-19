const cards = [
  { variant: 'green',  title: 'Гипотиреоз / АИТ',        desc: 'Питание даёт щитовидке нужные нутриенты вместо того, чтобы её «выключать»' },
  { variant: 'green',  title: 'Инсулинорезистентность',   desc: 'Снижение инсулина — это и есть лечение корня проблемы' },
  { variant: 'green',  title: 'Диабет 2 / преддиабет',   desc: 'Участницы снижают сахар и инсулин, врачи отменяют таблетки' },
  { variant: 'green',  title: 'Менопауза / СПКЯ',         desc: 'Питание берёт роль «протектора» в период гормональной перестройки' },
  { variant: 'rose',   title: '«Ветеран диет»',           desc: 'Все перепробовали, вес возвращается — потому что работали со следствием' },
  { variant: 'rose',   title: 'Хроническая усталость',    desc: 'Клеточный голод при инсулинорезистентности — причина «состояния мумии»' },
  { variant: 'orange', title: 'Возраст 50–70+ лет',       desc: 'Тамара — минус 18 кг в 62 года с гипотиреозом. Возраст не ограничение' },
  { variant: 'orange', title: 'Вес 100+ кг',              desc: 'Рекорд клуба — минус 83 кг. Начинала со 185 кг' },
]

export default function WorksFor() {
  return (
    <section className="works-for">
      <div className="works-for__inner">
        <span className="section-label">— Кому подходит —</span>
        <h2 className="section-title">
          Метод работает,<br /><em>даже если у вас…</em>
        </h2>
        <p className="section-intro">
          Большинство участниц приходят с одним или несколькими из этих состояний.
        </p>

        <div className="works-grid">
          {cards.map((c) => (
            <div key={c.title} className={`work-card work-card--${c.variant}`}>
              <h3 className="work-card__title">{c.title}</h3>
              <p className="work-card__desc">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
