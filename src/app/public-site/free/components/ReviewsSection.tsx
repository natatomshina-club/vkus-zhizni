import StoryBeforeAfter from './StoryBeforeAfter'

const STORIES = [
  {
    name: 'Анна',
    age: '41 год',
    result: '−27 кг',
    tag: 'Энергия и усталость',
    beforeSrc: '/images/free/stories/anna-before.png',
    afterSrc: '/images/free/stories/anna-after.png',
    quote: 'Я не помню, когда начала есть по-настоящему много. Могла не помнить, что ела на ужин, но в мусорном ведре утром находила три пустые обёртки от шоколадок.',
    pills: [
      'Минус 27 кг за 11 месяцев',
      'Ушли приступы ночного переедания',
      'С 50-го размера на устойчивый 44-й',
      'Восстановился регулярный цикл',
    ],
  },
  {
    name: 'Вера',
    age: '48 лет',
    result: '−22 кг',
    tag: 'Здоровье и анализы',
    beforeSrc: '/images/free/stories/vera-before.png',
    afterSrc: '/images/free/stories/vera-after.png',
    quote: 'Я тридцать лет работаю в лаборатории. Я каждый день вижу чужой инсулин, чужой холестерин, чужую глюкозу. На свои анализы я не смотрела двадцать лет. Боялась.',
    pills: [
      'Минус 22 кг за 8 месяцев',
      'Жировой гепатоз не подтверждён на повторном УЗИ',
      'С 52-го размера на 46-й',
      'Отменены 2 из 5 препаратов (под контролем кардиолога)',
    ],
  },
  {
    name: 'Елена',
    age: '58 лет',
    result: '−31 кг',
    tag: 'Диагнозы',
    beforeSrc: '/images/free/stories/elena-before.png',
    afterSrc: '/images/free/stories/elena-after.png',
    quote: '«Джентльменский набор взрослой женщины»: инсулинорезистентность, гипертония второй степени, жировой гепатоз, преддиабет. И 104 кг.',
    pills: [
      'Минус 31 кг за 1,4 года, без откатов',
      'Отменены препараты от давления — согласовано с кардиологом',
      'Жировой гепатоз не подтверждён на последнем УЗИ',
      'HOMA-IR в норме впервые за 10 лет',
      'С 56-го размера до 46-го',
    ],
  },
  {
    name: 'Светлана',
    age: '41 год',
    result: '−17 кг',
    tag: 'РПП',
    beforeSrc: '/images/free/stories/svetlana-before.png',
    afterSrc: '/images/free/stories/svetlana-after.png',
    quote: 'Я не могла пройти мимо кухни, чтобы не открыть холодильник. Даже если только что поела. Я думала, что я безвольная.',
    pills: [
      'Минус 17 кг за 8 месяцев, без срывов',
      'С 52-го размера на 46-й',
      'Прошли ночные набеги на холодильник',
      'Не срывалась даже в Новый год впервые за 20 лет',
    ],
  },
]

export default function ReviewsSection() {
  return (
    <section style={{
      background: 'var(--color-bg-page)',
      padding: 'var(--space-20) 5%',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          color: 'var(--color-green-dark)',
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
        }}>
          — ИСТОРИИ
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 700,
          color: 'var(--color-ink)',
          margin: 'var(--space-3) 0 0',
          lineHeight: 1.15,
        }}>
          Они тоже начинали{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--color-green-dark)' }}>
            с этого курса
          </em>
        </h2>

        <div className="stories-grid" style={{ marginTop: 'var(--space-10)' }}>
          {STORIES.map(story => (
            <article
              key={story.name}
              style={{
                background: 'var(--color-white)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)',
                overflow: 'hidden',
              }}
            >
              {/* Before/After slider */}
              <StoryBeforeAfter
                beforeSrc={story.beforeSrc}
                afterSrc={story.afterSrc}
                name={story.name}
              />

              {/* Body */}
              <div style={{ padding: 'var(--space-5)' }}>

                {/* Name, age, result badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 20,
                        fontWeight: 600,
                        color: 'var(--color-ink)',
                      }}>
                        {story.name}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 13,
                        color: 'var(--color-ink-soft)',
                      }}>
                        {story.age}
                      </span>
                    </div>
                    {/* Problem tag */}
                    <div style={{
                      display: 'inline-block',
                      marginTop: 6,
                      padding: '3px 10px',
                      background: 'var(--grad-green-pill)',
                      borderRadius: 'var(--radius-full)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--color-green-dark)',
                    }}>
                      {story.tag}
                    </div>
                  </div>

                  {/* Result badge */}
                  <div style={{
                    flexShrink: 0,
                    background: 'var(--grad-orange-btn)',
                    borderRadius: 'var(--radius-full)',
                    padding: '5px 14px',
                    fontFamily: 'var(--font-display)',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#fff',
                    boxShadow: '0 3px 10px rgba(247,125,39,0.3)',
                  }}>
                    {story.result}
                  </div>
                </div>

                {/* Quote */}
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--color-ink-soft)',
                  lineHeight: 1.65,
                  margin: 'var(--space-4) 0 0',
                }}>
                  «{story.quote}»
                </p>

                {/* Check items */}
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 'var(--space-4) 0 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}>
                  {story.pills.map((pill, i) => (
                    <li key={i} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 7,
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      color: 'var(--color-ink)',
                      lineHeight: 1.45,
                    }}>
                      <span style={{
                        flexShrink: 0,
                        marginTop: 2,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: 'var(--color-green-base)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      {pill}
                    </li>
                  ))}
                </ul>

              </div>
            </article>
          ))}
        </div>

      </div>

      <style>{`
        .stories-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .stories-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 540px) {
          .stories-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
