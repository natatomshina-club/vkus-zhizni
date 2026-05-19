import DiagnosticForm from './DiagnosticForm'

export default function DiagnosticSection() {
  return (
    <>
      {/* Intro text */}
      <section id="diagnostic" className="diag-intro">
        <div className="diag-intro__inner">
          <h2 className="section-title">
            Как попасть <em>в клуб</em>
          </h2>
          <span className="section-label">— АНКЕТА</span>
          <h3 className="diag-subtitle">
            Почему через анкету,<br className="brk-mobile" /> а не сразу запись
          </h3>

          <div className="diag-intro__body">
            <p>
              В клуб я беру не всех. Не потому что хочу казаться важной, а потому что
              работаю с каждой почти один на один. <strong>Личная стратегия</strong> под ваши анализы и
              диагнозы, разбор БАДов, личный чат со мной весь год. На это нужно время и
              силы, и я не могу размазать себя на сто человек.
            </p>
            <p>
              Поэтому я хочу понимать заранее, с чем вы приходите и{' '}
              <strong>готовы ли вы вкладываться в своё здоровье</strong> — сдавать анализы,
              пить БАДы по схеме, менять привычки. Без этого даже самая лучшая программа
              не даст результата.
            </p>
            <p>
              Эта диагностика для того, чтобы вы сами себе ответили на несколько важных
              вопросов. Если после неё вы поймёте что готовы —{' '}
              <strong className="is-orange">я с вами свяжусь</strong>,
              расскажу про условия и отвечу на ваши вопросы.
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="diag-section">
        <div className="diag-section__inner">
          <div className="diag-card">
            <DiagnosticForm />
          </div>
        </div>
      </section>
    </>
  )
}
