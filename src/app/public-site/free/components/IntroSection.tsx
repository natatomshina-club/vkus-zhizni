const QUESTIONS = [
  {
    title: 'Почему именно эти продукты?',
    text: 'Почему мне советуют есть каши, обезжиренный творог, варёную грудку? Кто это придумал? Где доказательства, что мне это поможет?',
  },
  {
    title: 'Как вообще работает моё тело?',
    text: 'Что происходит, когда я съедаю тот или иной продукт? Никто же не объясняет.',
  },
  {
    title: 'Почему мне нельзя жирное?',
    text: 'Все хором говорят: «избегайте жирного». А я смотрю на этикетку обезжиренного йогурта, и там сахара больше, чем во вкусняшке. Это как вообще?',
  },
  {
    title: 'Если всё так просто, почему в мире растёт эпидемия ожирения?',
    text: 'Если бы работало «ешь меньше, двигайся больше», все бы давно были стройными. А полных женщин и детей с каждым годом всё больше. Значит где-то обман, и дело в чём-то другом.',
  },
]

export default function IntroSection() {
  return (
    <section style={{
      background: 'var(--color-cream)',
      padding: 'var(--space-20) 5%',
    }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>

        {/* 1.1 Label */}
        <div style={{
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          color: 'var(--color-green-dark)',
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
        }}>
          — ОСТАНОВИТЕСЬ НА МИНУТУ
        </div>

        {/* 1.2 Heading */}
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 700,
          color: 'var(--color-ink)',
          lineHeight: 1.15,
          margin: 'var(--space-3) 0 0',
          maxWidth: 820,
        }}>
          Когда вы садитесь на очередную диету,<br />
          вы задаёте себе{' '}
          <em style={{ color: 'var(--color-green-dark)', fontStyle: 'italic' }}>эти вопросы?</em>
        </h2>

        {/* 1.3 Question cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-5)',
          marginTop: 'var(--space-10)',
        }} className="intro-grid">
          {QUESTIONS.map((q, i) => (
            <div key={i} style={{
              background: 'var(--color-white)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)',
              padding: 'var(--space-6)',
              display: 'flex',
              gap: 'var(--space-4)',
              alignItems: 'flex-start',
            }}>
              {/* Question badge */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--grad-green-btn)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#fff',
                  lineHeight: 1,
                }}>?</span>
              </div>
              {/* Text */}
              <div>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(17px, 1.4vw, 19px)',
                  fontWeight: 600,
                  color: 'var(--color-green-base)',
                  lineHeight: 1.25,
                  margin: '0 0 10px',
                }}>
                  {q.title}
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(14px, 1.1vw, 16px)',
                  color: 'var(--color-ink)',
                  lineHeight: 1.55,
                  margin: 0,
                }}>
                  {q.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 1.4 Divider heading */}
        <div style={{ marginTop: 'var(--space-16)', textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 2,
            background: 'var(--color-green)',
            borderRadius: 2,
            margin: '0 auto 16px',
          }} />
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 'clamp(22px, 3vw, 34px)',
            lineHeight: 1.2,
            color: 'var(--color-green-dark)',
            margin: '0 auto',
            maxWidth: 720,
          }}>
            Вот что я поняла, когда наконец докопалась до правды
          </h3>
        </div>

        {/* 1.5 Three paragraphs */}
        <div style={{
          maxWidth: 720,
          marginTop: 'var(--space-10)',
        }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(16px, 1.4vw, 18px)',
            color: 'var(--color-ink)',
            lineHeight: 1.65,
            margin: '0 0 var(--space-5)',
          }}>
            Старые методы не работают. Дробное питание, обезжиренное, низкокалорийное,
            «больше двигайся, меньше ешь», правильное ПП. Всё это не даёт долгосрочного
            результата. Я прошла через каждое из них. И каждый раз вес возвращался,
            ещё и с прибавкой.
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(16px, 1.4vw, 18px)',
            color: 'var(--color-ink)',
            lineHeight: 1.65,
            margin: '0 0 var(--space-5)',
          }}>
            Знаете почему? Потому что на всех диетах в вашей тарелке лежат продукты,
            которые{' '}
            <strong style={{ color: 'var(--color-orange-dark)', fontWeight: 700 }}>не дают сытости</strong>
            {' '}и{' '}
            <strong style={{ color: 'var(--color-orange-dark)', fontWeight: 700 }}>не запускают жиросжигание</strong>.
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(16px, 1.4vw, 18px)',
            color: 'var(--color-ink)',
            lineHeight: 1.65,
            margin: 0,
          }}>
            Решение оказалось простым. Поменять продукты на тарелке. На те, что{' '}
            <strong style={{ color: 'var(--color-green-dark)', fontWeight: 700 }}>насыщают надолго</strong>
            {' '}и{' '}
            <strong style={{ color: 'var(--color-green-dark)', fontWeight: 700 }}>разгоняют жиросжигание</strong>.
            {' '}Не есть меньше, не голодать, не считать калории. Просто поменять состав.
            И тело само начнёт топить свой жир, без надрыва.
          </p>
        </div>

        {/* 1.6 "Хорошая новость" dark green card */}
        <div style={{
          position: 'relative',
          background: 'var(--grad-green-card)',
          borderRadius: 'var(--radius-2xl)',
          padding: 'var(--space-12)',
          marginTop: 'var(--space-12)',
          boxShadow: 'var(--shadow-green-card)',
        }} className="intro-good-news">
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(26px, 3.5vw, 38px)',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.15,
            margin: 0,
          }}>
            Хорошая новость:<br />это просто и доступно
          </h3>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(15px, 1.3vw, 17px)',
            color: 'rgba(255,255,255,0.92)',
            lineHeight: 1.65,
            margin: 'var(--space-5) 0 0',
          }}>
            Никакой экзотики и спецпродуктов. Никакого голода и подсчётов.
            Никаких изнурительных тренировок. Обычные и доступные продукты
            из ближайшего магазина, простые правила и пара полезных привычек
            до и после еды.
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(15px, 1.3vw, 17px)',
            color: 'rgba(255,255,255,0.92)',
            lineHeight: 1.65,
            margin: 'var(--space-4) 0 0',
          }}>
            За время курса я расскажу всё по порядку:{' '}
            <strong style={{ color: 'var(--color-orange-light)', fontWeight: 700 }}>какие продукты насыщают</strong>,
            {' '}какие разгоняют аппетит и держат вас на крючке,{' '}
            <strong style={{ color: 'var(--color-orange-light)', fontWeight: 700 }}>как составить правильную тарелку</strong>,
            {' '}и как ввести всё это в жизнь плавно и без срывов.
          </p>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 15,
            color: 'rgba(255,255,255,0.65)',
            textAlign: 'right',
            margin: 'var(--space-6) 0 0',
          }}>
            — Наталья Томшина
          </p>
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .intro-grid { grid-template-columns: 1fr !important; }
          .intro-good-news { padding: var(--space-8) !important; }
        }
      `}</style>
    </section>
  )
}
