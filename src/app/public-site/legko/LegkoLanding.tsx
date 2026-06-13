'use client'

import { useState } from 'react'
import styles from './legko.module.css'

type QuizAnswers = {
  age_range: string
  problems: string[]
  davnost: string
  preparaty: string
  tried: string
  readiness: string
}

const TOTAL_STEPS = 7

export default function LegkoLanding() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [quizStep, setQuizStep] = useState(1)
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({})
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [quizDone, setQuizDone] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const flash = () => {
    setFlashing(true)
    setTimeout(() => setFlashing(false), 300)
  }

  const selectSingle = (field: keyof QuizAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }))
  }

  const toggleMulti = (value: string) => {
    setAnswers(prev => {
      const current = (prev.problems ?? [])
      return {
        ...prev,
        problems: current.includes(value) ? current.filter(v => v !== value) : [...current, value],
      }
    })
  }

  const handleNext = async () => {
    if (quizStep === 1 && !answers.age_range) { flash(); return }
    if (quizStep === 2 && (!answers.problems || answers.problems.length === 0)) { flash(); return }
    if (quizStep === 3 && !answers.davnost) { flash(); return }
    if (quizStep === 4 && !answers.preparaty) { flash(); return }
    if (quizStep === 5 && !answers.tried) { flash(); return }
    if (quizStep === 6 && !answers.readiness) { flash(); return }
    if (quizStep === 7) {
      if (!name.trim() || !contact.trim()) { flash(); return }
      setQuizDone(true)
      fetch('/api/public/legko-diagnostic-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...answers, name, contact }),
      }).catch(() => {/* non-blocking */})
      return
    }
    setQuizStep(s => s + 1)
  }

  const progressWidth = quizDone ? '100%' : `${(quizStep / TOTAL_STEPS) * 100}%`

  return (
    <div className={styles.legko}>
      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header className={styles.stickyNav}>
        <div className={styles.navInner}>
          <a className={styles.brand} href="https://nata-tomshina.ru/">
            Наталья Томшина
            <small>интегративный нутрициолог</small>
          </a>
          <nav className={`${styles.navLinks}${menuOpen ? ' ' + styles.open : ''}`}>
            <a href="#need" onClick={() => setMenuOpen(false)}>Для кого</a>
            <a href="#program" onClick={() => setMenuOpen(false)}>Программа</a>
            <a href="#learning" onClick={() => setMenuOpen(false)}>Как проходит</a>
            <a href="#results" onClick={() => setMenuOpen(false)}>Результаты</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>Вопросы</a>
            <a className={styles.navCta} href="#anketa" onClick={() => setMenuOpen(false)}>
              Пройти диагностику
            </a>
          </nav>
          <button
            className={styles.burger}
            aria-label="Меню"
            onClick={() => setMenuOpen(m => !m)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className={styles.hero} id="top">
        <div className={styles.wrap}>
          <div className={styles.heroGrid}>
            <div>
              <div className={styles.tagline}>3-месячный практикум</div>
              <div className={styles.subH}>Программа восстановления женского здоровья</div>
              <h1 className={styles.heroH1}>Лёгкость<br />перемен</h1>
              <p className={styles.lead}>Новая жизнь без боли и дискомфорта от заболеваний ЖКТ.</p>
              <div className={styles.heroCta}>
                <a className="hp-btn hp-btn--orange hp-btn--lg" href="#anketa">Пройти диагностику</a>
                <a className="hp-btn hp-btn--green hp-btn--lg" href="#anketa">Консультация с Натальей</a>
              </div>
            </div>
            <div>
              <div className={styles.heroArt}>
                <div className={styles.heroArtHeart}>
                  <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 165C100 165 20 120 20 65C20 38 40 22 62 22C80 22 92 33 100 48C108 33 120 22 138 22C160 22 180 38 180 65C180 120 100 165 100 165Z" fill="white" fillOpacity="0.55" stroke="currentColor" strokeWidth="3"/>
                    <path d="M64 70c12 6 20 18 22 32M136 70c-12 6-20 18-22 32" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity=".7"/>
                  </svg>
                </div>
              </div>
              <div className={styles.authorCard}>
                <div className={styles.acLabel}>Автор программы</div>
                <div className={styles.acName}>Наталья Томшина</div>
                <ul>
                  <li>интегративный нутрициолог</li>
                  <li>основатель Клуба Стройных и Здоровых «Вкус Жизни»</li>
                  <li>более 4000 учениц</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ────────────────────────────────────────────────────── */}
      <section className={styles.benefits}>
        <div className={styles.wrap}>
          <div className={styles.bgrid}>
            <div className={`${styles.bcard} ${styles.bcardDark}`}>
              <h3>За время курса уйдёт или ослабнет боль, тяжесть, вздутие, изжога, дискомфорт после еды, нормализуется стул</h3>
              <p>При соблюдении рекомендаций из курса в течение 2–4 месяцев ситуация улучшится ещё значительнее.</p>
            </div>
            <div className={`${styles.bcard} ${styles.bcardLight}`}>
              <h3>Снизите зависимость от лекарственных препаратов, подавляющих симптомы. Сможете отказаться от них полностью в будущем</h3>
              <p>Значительные улучшения в анализах — уже на курсе.</p>
            </div>
            <div className={`${styles.bcard} ${styles.bcardLight}`}>
              <h3>Построите систему правильного питания и станете независимы от диет</h3>
              <p>Здоровое снижение веса без стресса и голодовок — на 5–11 кг за время курса.</p>
            </div>
            <div className={`${styles.bcard} ${styles.bcardDark}`}>
              <h3>Восстановите силы и энергию, которую вы потеряли</h3>
              <p>Восстановится сон, вам станет легко вставать по утрам, перестанете чувствовать постоянную усталость и апатию.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEED ────────────────────────────────────────────────────────── */}
      <section className={styles.need} id="need">
        <div className={styles.wrap}>
          <h2 className={styles.sectionTitleCap}>Вам точно нужно на программу, если…</h2>
          <div style={{ height: 14 }} />

          <div className={styles.needRow}>
            <div className={styles.needPhoto}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5 6 5c2 0 3.2 1.2 4 2.5C10.8 6.2 12 5 14 5c3.5 0 5 4 3.5 7-1.2 2.2-3.5 4.3-5.5 6z"/></svg>
            </div>
            <ul className={styles.checkList}>
              <li>У вас постоянные боли в животе, нарушение стула, тяжесть после еды, отсутствие энергии не дают нормально жить</li>
              <li>Вы вынуждены принимать:
                <ul>
                  <li>ИПП (омез, нексиум, париет, ренни)</li>
                  <li>слабительные</li>
                  <li>антибиотики</li>
                </ul>
              </li>
              <li>Вес только растёт, несмотря на диеты</li>
              <li>Чувствуете, что состояние ухудшается, и понимаете, что дальше лучше не тянуть</li>
            </ul>
          </div>

          <div className={styles.needRow}>
            <div className={styles.needPhoto}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>
            </div>
            <ul className={styles.checkList}>
              <li>Обошли много врачей, испробовали разные схемы и препараты, но всё это дало только временные улучшения</li>
              <li>Ищете эффективную методику лечения, без постоянных затрат на медикаменты</li>
            </ul>
          </div>

          <div className={styles.needRow}>
            <div className={styles.needPhoto}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.5 2.5 2.2 4 2.2S15 15.5 16 14M9 9.5h.01M15 9.5h.01"/></svg>
            </div>
            <ul className={styles.checkList}>
              <li>Хотите похудеть без ущерба для здоровья и жёстких диет</li>
              <li>Мечтаете о дне, когда сможете спокойно есть за праздничным столом, не боясь обострений и прибавки в весе</li>
            </ul>
          </div>

          <div className={styles.pullquote}>
            <span className={styles.q}>&#8220;</span> Каждый день, когда вы откладываете заботу о себе — это упущенный шанс на качественную и полноценную жизнь. <span className={styles.q}>&#8221;</span>
          </div>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <a className="hp-btn hp-btn--orange hp-btn--xl" href="#anketa">
              Пройти диагностику и узнать, подходит ли вам программа
            </a>
          </div>
        </div>
      </section>

      {/* ── WORK WITH ───────────────────────────────────────────────────── */}
      <section id="program">
        <div className={styles.wrap}>
          <h2 className={styles.sectionTitleCap}>С чем будем работать на программе?</h2>
          <div style={{ height: 18 }} />
          <div className={styles.cols2}>
            <div className={`${styles.workCard} ${styles.workCardFill}`}>
              <span className={styles.workTag}>Болезни</span>
              <ul className={styles.workList}>
                <li>Раздражённый и воспалённый кишечник</li>
                <li>Синдром избыточного бактериального / грибкового и паразитарного роста</li>
                <li>Геморрой, варикоз</li>
                <li>ГЭРБ</li>
                <li>Хеликобактер</li>
                <li>Болезни жёлчного пузыря (камни, полипы, сладжи, удалённый ЖП, дискинезия, холецистит)</li>
                <li>Жировой гепатоз</li>
                <li>Тонзиллит, пародонтоз</li>
                <li>Миомы, эндометриоз</li>
                <li>Гипотиреоз</li>
                <li>Атеросклероз, высокий холестерин</li>
                <li>Аллергии и пищевые непереносимости</li>
              </ul>
            </div>
            <div className={`${styles.workCard} ${styles.workCardSoft}`}>
              <span className={styles.workTag}>Симптомы</span>
              <ul className={styles.workList}>
                <li>изжога / вздутие / отрыжка</li>
                <li>запор / расстройство стула</li>
                <li>дискомфорт и тяжесть после еды, боль в правом подреберье</li>
                <li>неприятный запах изо рта / кислый или горький привкус во рту</li>
                <li>высыпания и воспаления на коже</li>
                <li>отсутствие энергии</li>
                <li>лишний вес</li>
                <li>обильные болезненные менструации, нестабильный цикл</li>
                <li>непереносимость и аллергия на продукты</li>
                <li>сухость кожи на пятках / локтях / лице</li>
              </ul>
            </div>
          </div>

          <div className={styles.important}>
            <span className={styles.importantTag}>ВАЖНО!</span>
            <p>Программа адаптирована для тех, у кого удалён жёлчный пузырь.</p>
          </div>

          <div className={styles.contra}>
            <span className={styles.workTag}>Противопоказания</span>
            <ul className={styles.contraList}>
              <li>Онкология</li>
              <li>Обострения хронических болезней (язва желудка и 12-перстной кишки, НЯК, болезнь Крона, холецистит)</li>
              <li>Беременность / лактация</li>
              <li>Вы принимаете антидепрессанты, психотропные препараты</li>
              <li>Вы не готовы менять своё питание и образ жизни</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 5 STEPS ─────────────────────────────────────────────────────── */}
      <section className={styles.stepsSection}>
        <div className={styles.wrap}>
          <h2 className={styles.sectionTitleCap}>Программа состоит из 5 взаимосвязанных шагов</h2>
          <p className={styles.centerNarrow}>Работа именно в такой последовательности позволяет восстановить большинство органов и систем в организме.</p>
          <div className={styles.stepTrack}>
            {[
              { n: 'Ступень 1', h: 'Противовоспалительное питание', p: 'снижает нагрузку на иммунную и эндокринную системы' },
              { n: 'Ступень 2', h: 'Заживление слизистых', p: 'закладывает фундамент для дальнейшей работы с желудком и жёлчным' },
              { n: 'Ступень 3', h: 'Улучшение пищеварения', p: 'благотворно влияет на щитовидную железу, усвоение макро- и микронутриентов' },
              { n: 'Ступень 4', h: 'Восполнение дефицитов', p: 'витаминов и минералов — увеличивает уровень энергии и защитные функции' },
              { n: 'Ступень 5', h: 'Восстановление систем', p: 'жёлчный, печень, щитовидная железа возвращаются к нормальной работе' },
            ].map(s => (
              <div key={s.n} className={styles.step}>
                <div className={styles.stepNum}>{s.n}</div>
                <h4>{s.h}</h4>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES ─────────────────────────────────────────────────────── */}
      <section>
        <div className={styles.wrap}>

          <div className={styles.moduleCard}>
            <span className={styles.mtab}>Модуль 1</span>
            <span className={styles.mtitle}>Работа с питанием — лечение через питание</span>
            <p><b>Все участники в начале программы получают:</b></p>
            <ul className={styles.dotList}>
              <li>Противовоспалительный Протокол Питания, который поможет снять воспаление в кишечнике и общую воспалительную нагрузку на организм</li>
              <li>Чек-лист и пошаговую схему подбора ферментов и добавок для поддержки пищеварения</li>
            </ul>
            <div className={styles.resultBox}>
              <span className={styles.rbHead}>В результате (уже через 2 недели):</span>
              <ul className={styles.leafList}>
                <li>вы будете знать, что есть именно вам</li>
                <li>начнёте питаться разнообразно</li>
                <li>уйдёт газообразование, вздутие, изжога, нормализуется стул</li>
              </ul>
              <p style={{ margin: '12px 0 0', color: 'var(--color-green-deep)', fontSize: '0.97rem' }}>Вы перестанете травмировать себя неподходящей едой и создадите свой здоровый рацион.</p>
            </div>
          </div>

          <div className={styles.moduleCard}>
            <span className={styles.mtab}>Модуль 2</span>
            <span className={styles.mtitle}>Восстановление слизистой</span>
            <p>Это не просто мера по улучшению пищеварения, но и ключ к общему укреплению здоровья. Слизистая едина на протяжении всего организма (ротовая полость, пищевод, желудок, кишечник).</p>
            <p>Невозможно полноценное выздоровление, если в каком-то отделе есть очаг воспаления и патогенная флора.</p>
            <ul className={styles.dotList}>
              <li>С помощью специальных добавок произведём заживление слизистой желудка и кишечника. Избавимся от хеликобактера (без антибиотиков)</li>
              <li>Наведём порядок в ротовой полости: пошаговая методика и добавки для лечения тонзиллита, пародонтита</li>
            </ul>
            <div className={styles.resultBox}>
              <span className={styles.rbHead}>В результате у вас:</span>
              <ul className={styles.leafList}>
                <li>существенно уменьшаются очаги хронического воспаления на слизистых</li>
                <li>улучшается усвоение питательных веществ, витаминов и минералов</li>
                <li>поднимется уровень энергии, работоспособности</li>
                <li>улучшается качество кожи и волос</li>
                <li>повысится устойчивость к болезням и общая защита организма</li>
              </ul>
            </div>
          </div>

          <div className={styles.moduleCard}>
            <span className={styles.mtab}>Модуль 3</span>
            <span className={styles.mtitle}>Работа со стрессом</span>
            <p>Стресс влияет не только на нервную систему, но и на ЖКТ (ухудшает пищеварение и способствует воспалению), щитовидную железу, гормональную систему и иммунитет.</p>
            <p>Поэтому в каждом модуле курса есть уроки для расслабления и восстановления нервной системы и качества сна.</p>
            <ul className={styles.dotList}>
              <li>Вы получите схемы аптечных и растительных добавок (для разных жизненных ситуаций и стадий стресса), дыхательные техники и практики расслабления</li>
            </ul>
            <div className={styles.resultBox}>
              <span className={styles.rbHead}>В результате:</span>
              <ul className={styles.leafList}>
                <li>вы станете спокойнее: снизится уровень тревожности</li>
                <li>будете легко засыпать, глубоко и качественно высыпаться</li>
                <li>у вас появится ощущение тонуса и жизненной энергии</li>
                <li>избавитесь от судорог в ногах и синдрома беспокойных ног</li>
                <li>перестанете срываться и кричать на детей / близких / подчинённых</li>
              </ul>
            </div>
          </div>

          <div className={styles.moduleCard}>
            <span className={styles.mtab}>Модуль 4</span>
            <span className={styles.mtitle}>Улучшение работы жёлчного пузыря. Восстановление функций печени</span>
            <ul className={styles.dotList}>
              <li>У вас будет пошаговый алгоритм восстановления работы жёлчного пузыря, улучшения качества желчи</li>
              <li>Схема растворения сладжей и камней. Рекомендации для улучшения пищеварения людям без жёлчного</li>
              <li>Схема поддержки печени при жировом гепатозе, инсулинорезистентности и повышенной токсической нагрузке</li>
            </ul>
            <div className={styles.resultBox}>
              <span className={styles.rbHead}>В результате у вас:</span>
              <ul className={styles.leafList}>
                <li>очистится кишечник от патогенов: бактерий, грибов и паразитов</li>
                <li>уйдут вздутия и нормализуется стул</li>
                <li>уйдёт неприятный запах изо рта</li>
                <li>улучшится состояние кожи</li>
                <li>уменьшится эндометриоз, полипы, миомы</li>
                <li>снизятся высокие показатели в анализах печени</li>
                <li>снизится холестерин</li>
              </ul>
            </div>
          </div>

          <div className={styles.moduleCard}>
            <span className={styles.mtab}>Модуль 5</span>
            <span className={styles.mtitle}>Восстановление работы щитовидной железы</span>
            <p>В организме всё взаимосвязано. И щитовидная железа не ломается сама по себе.</p>
            <p>На её работу влияет: питание, дефициты минералов/витаминов, белка (в результате нарушения пищеварения), стресс, вирусная/аутоиммунная нагрузка.</p>
            <p>Поэтому стандартные назначения гормонов от эндокринолога в поликлинике не помогают улучшить состояние щитовидной железы.</p>
            <p>В уроках мы проведём диагностические тесты на работу щитовидки, определим и восполним дефициты.</p>
            <div className={styles.resultBox}>
              <span className={styles.rbHead}>В результате у вас:</span>
              <ul className={styles.leafList}>
                <li>снизится аутоиммунная нагрузка</li>
                <li>снизятся дозировки гормонов</li>
                <li>снизится утомляемость</li>
                <li>увеличится работоспособность и уровень жизненной энергии</li>
              </ul>
            </div>
          </div>

          <div className={styles.schemes}>
            <div className={styles.schemesIc}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M5 3h9l5 5v13H5z"/><path d="M9 13h6M9 17h6"/>
              </svg>
            </div>
            <div>
              <b>Все схемы включают:</b>
              <p>Аптечные препараты, растительные добавки с подробным описанием действия и получаемых от них эффектов, дозировки и длительность курса.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── RESULTS ─────────────────────────────────────────────────────── */}
      <section className={styles.livesSection} id="results">
        <div className={styles.wrap}>
          <h2 className={styles.sectionTitleCap}>Как меняется жизнь участниц программы</h2>
          <p className={styles.centerNarrow}>Раньше они годами ходили по разным врачам, потратили уйму времени и денег. Лучше становилось только на короткий период, т.к. устранялись лишь симптомы, а не причина. А теперь…</p>

          <div className={styles.chat}>
            <div className={styles.bubbleRow}><div className={styles.ava}>М</div><div className={styles.bubble}>Могу точно сказать, что наконец-то появилась энергия. Нет больше тяжести в желудке после приёма белковой пищи. Общее самочувствие стало намного лучше. Бонусом за два месяца ушло 11 кг веса.</div></div>
            <div className={styles.bubbleRowRight}><div className={styles.ava}>А</div><div className={styles.bubble}>Я стала спокойнее, нет перепадов настроения, появились силы, энергии ощутимо больше. Ушла зависимость от еды, появилось пищевое спокойствие. Я сплю ночами и это нереально здорово!</div></div>
            <div className={styles.bubbleRow}><div className={styles.ava}>И</div><div className={styles.bubble}>Курс превзошёл все мои ожидания! Ушли мигрени, вздутие, боли в суставах. Я перестала отекать, стала более активной и потеряла 5,5 кг. Нет вздутий даже после квашеной капусты!</div></div>
            <div className={styles.bubbleRowRight}><div className={styles.ava}>Н</div><div className={styles.bubble}>Стал лучше стул, вес пошёл вниз 5 кг за месяц. В таком весе последний раз была давно. А самое главное — во время менструации стало меньше сгустков.</div></div>
            <div className={styles.bubbleRow}><div className={styles.ava}>С</div><div className={styles.bubble}>Оказывается, всё так просто, когда знаешь, с чего начать. Почему врачи не знают этого? Теперь я знаю, что было причиной и как не допустить обострений в дальнейшем.</div></div>
          </div>

          <p className={styles.noteStrong}>Практически каждая участница отмечает — <b>бонусом пришло снижение веса.</b><br/>Если ваш ЖКТ работает неправильно, ни одна диета не принесёт долгосрочный результат!</p>

          {/* Case: Елена */}
          <div className={styles.caseStudy}>
            <div className={styles.caseName}>Елена</div>
            <div className={styles.ba}>
              <div className={`${styles.baCol} ${styles.baColBefore}`}>
                <h4>До</h4>
                <p style={{ margin: '0 0 12px', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Елена пришла на курс с жалобами:</p>
                <ul className={styles.baList}>
                  <li>отсутствие энергии</li>
                  <li>проблемы с ЖКТ (вздутие, боли, неустойчивый стул)</li>
                  <li>боли в правом боку</li>
                </ul>
              </div>
              <div className={`${styles.baCol} ${styles.baColAfter}`}>
                <h4>После</h4>
                <ul className={styles.baList}>
                  <li>появилась энергия, желание жить</li>
                  <li>забыла про боли в боку</li>
                  <li>улучшилась работа кишечника: нет вздутия и болей</li>
                  <li>бонусом на курсе снизила вес на 10 кг</li>
                </ul>
              </div>
            </div>
            <div className={styles.videoPh}>
              <iframe
                src="https://kinescope.io/embed/7e7a79ef-1b63-4a75-a5cc-750dd3d9850b"
                title="Видео-отзыв Елены — программа «Лёгкость перемен»"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                loading="lazy"
                className={styles.videoIframe}
              />
            </div>
          </div>

          {/* Case: Людмила */}
          <div className={styles.caseStudy}>
            <div className={styles.caseName}>Людмила</div>
            <div className={styles.ba}>
              <div className={`${styles.baCol} ${styles.baColBefore}`}>
                <h4>До</h4>
                <p style={{ margin: '0 0 12px', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>До курса Людмила жаловалась на:</p>
                <ul className={styles.baList}>
                  <li>низкий уровень энергии (энергии почти ноль)</li>
                  <li>отёки</li>
                  <li>вздутие и аллергию непонятно на что</li>
                  <li>плаксивость, нервозность, проблемы с засыпанием</li>
                  <li>лишний вес</li>
                  <li>спазмы и боли в животе, боку</li>
                </ul>
              </div>
              <div className={`${styles.baCol} ${styles.baColAfter}`}>
                <h4>После</h4>
                <ul className={styles.baList}>
                  <li>наконец-то появилась энергия</li>
                  <li>стала спокойнее</li>
                  <li>сон улучшился</li>
                  <li>ушли боли в боку</li>
                  <li>за 3 месяца — минус 13 кг</li>
                </ul>
              </div>
            </div>
            <div className={styles.videoPh}>
              <iframe
                src="https://kinescope.io/embed/bc2da89c-42ad-4ac0-840d-ba0b5b6cbd32"
                title="Видео-отзыв Людмилы — программа «Лёгкость перемен»"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                loading="lazy"
                className={styles.videoIframe}
              />
            </div>
          </div>

          {/* Case: Татьяна */}
          <div className={styles.caseStudy}>
            <div className={styles.caseName}>Татьяна</div>
            <div className={styles.ba}>
              <div className={`${styles.baCol} ${styles.baColBefore}`}>
                <h4>До</h4>
                <ul className={styles.baList}>
                  <li>взвесь в жёлчном, утолщение стенок ЖП</li>
                  <li>холецистит</li>
                  <li>проблемы с пищеварением: вздутие, отрыжка, боли на всё</li>
                  <li>по анализам повышены антитела к щитовидке (АТ ТГ и АТ ТПО)</li>
                  <li>усталость, сонливость, нервозность, раздражительность, плохо засыпала, выраженный ПМС</li>
                  <li>сильная тяга на сладкое</li>
                </ul>
              </div>
              <div className={`${styles.baCol} ${styles.baColAfter}`}>
                <h4>После</h4>
                <ul className={styles.baList}>
                  <li>стенки жёлчного — норма, нет взвеси</li>
                  <li>антитела снизились в 2 раза</li>
                  <li>начала есть многие продукты, нет тяжести, вздутие реже</li>
                  <li>прошла тяга на сладкое</li>
                  <li>появилась энергия</li>
                </ul>
              </div>
            </div>
            <div className={styles.videoPh}>
              <iframe
                src="https://kinescope.io/embed/2a0112ca-9dbc-4af9-b541-28fc0a36565c"
                title="Видео-отзыв Татьяны — программа «Лёгкость перемен»"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                loading="lazy"
                className={styles.videoIframe}
              />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <a className="hp-btn hp-btn--orange hp-btn--xl" href="#anketa">Хочу такие же результаты</a>
          </div>
        </div>
      </section>

      {/* ── LEARNING ────────────────────────────────────────────────────── */}
      <section id="learning">
        <div className={styles.wrap}>
          <h2 className={styles.sectionTitleCap}>Как проходит обучение?</h2>
          <div style={{ height: 20 }} />
          {[
            {
              svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 20h8M12 17v3"/></svg>,
              text: 'Удобная платформа. Можно учиться как с телефона, так и с компьютера.',
            },
            {
              svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
              text: 'Служба заботы всегда на связи! Если у вас возникнут технические или организационные сложности, ваш вопрос в течение нескольких часов решит служба заботы.',
            },
            {
              svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>,
              text: 'Уроки открываются согласно расписанию (2 урока в неделю). Длительность уроков: 20–40 минут. Уроки можно смотреть в записи в любое удобное для вас время.',
            },
            {
              svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h7l2 2h7v12H4z"/><path d="M8 12h8M8 15h5"/></svg>,
              text: 'К каждому уроку — дополнительные текстовые материалы (конспект, схемы, добавки, диагностические тесты).',
            },
            {
              svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 5L2 12l7 2 2 7 3-5 5 4z"/></svg>,
              text: 'Ответы на вопросы — на платформе курса под уроками и в закрытом Телеграм-чате.',
            },
          ].map((row, i) => (
            <div key={i} className={styles.learnRow}>
              <div className={styles.learnIc}>{row.svg}</div>
              <p>{row.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ANKETA ──────────────────────────────────────────────────────── */}
      <section className={styles.anketa} id="anketa">
        <div className={styles.wrap}>
          <div className={styles.whyAnketa}>
            <span className={styles.eyebrow}>Как попасть на программу</span>
            <h2 className={styles.sectionTitleCap} style={{ marginBottom: 18 }}>Почему через анкету, а не сразу оплата</h2>
            <p>На программе я работаю с каждой почти индивидуально: смотрю ваши жалобы и анализы, подбираю схемы добавок под вашу ситуацию, веду в чате. Поэтому беру не всех и хочу заранее понимать, с чем вы приходите.</p>
            <p>Эта короткая диагностика — чтобы вы сами ответили себе на несколько важных вопросов. Если после неё вы поймёте, что готовы, — <b>я свяжусь с вами лично</b>, расскажу про условия и отвечу на ваши вопросы.</p>
          </div>

          <div className={styles.quiz}>
            <div className={styles.qProgress}>
              <div className={styles.qProgressBar} style={{ width: progressWidth }} />
            </div>
            {!quizDone && (
              <div className={styles.qCount}>Вопрос {quizStep} из {TOTAL_STEPS}</div>
            )}

            <div className={flashing ? styles.quizFlash : ''}>
              {/* Step 1 — age */}
              {!quizDone && quizStep === 1 && (
                <div>
                  <div className={styles.qStepTitle}>Кратко о вас</div>
                  {['35–45 лет', '46–55 лет', '56–65 лет', 'больше 65 лет'].map(v => (
                    <button
                      key={v}
                      type="button"
                      className={`${styles.qOpt}${answers.age_range === v ? ' ' + styles.qOptSel : ''}`}
                      onClick={() => selectSingle('age_range', v)}
                    >
                      {v === '35–45 лет' ? 'Мне 35–45 лет' : v === '46–55 лет' ? 'Мне 46–55 лет' : v === '56–65 лет' ? 'Мне 56–65 лет' : 'Мне больше 65'}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2 — problems (multi) */}
              {!quizDone && quizStep === 2 && (
                <div>
                  <div className={styles.qStepTitle}>Что беспокоит вас сильнее всего?</div>
                  <div className={styles.qMultiHint}>Можно выбрать несколько</div>
                  {[
                    ['ЖКТ: боль, тяжесть, вздутие, изжога', 'Боль, тяжесть, вздутие, изжога, проблемы со стулом'],
                    ['жёлчный / печень', 'Жёлчный пузырь или печень (камни, сладжи, гепатоз, удалён ЖП)'],
                    ['лишний вес', 'Лишний вес, который не уходит на диетах'],
                    ['усталость, нет энергии', 'Постоянная усталость, нет энергии, плохой сон'],
                    ['щитовидка / гормоны', 'Щитовидная железа, гормоны, цикл'],
                    ['кожа, аллергии', 'Кожа, высыпания, аллергии и непереносимости'],
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      className={`${styles.qOpt}${(answers.problems ?? []).includes(val) ? ' ' + styles.qOptSel : ''}`}
                      onClick={() => toggleMulti(val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 3 — давность */}
              {!quizDone && quizStep === 3 && (
                <div>
                  <div className={styles.qStepTitle}>Как давно вас это беспокоит?</div>
                  {[
                    ['менее года', 'Меньше года'],
                    ['1–3 года', 'От года до трёх лет'],
                    ['более 3 лет', 'Больше трёх лет'],
                    ['много лет, то лучше то хуже', 'Много лет — то лучше, то хуже'],
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      className={`${styles.qOpt}${answers.davnost === val ? ' ' + styles.qOptSel : ''}`}
                      onClick={() => selectSingle('davnost', val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 4 — препараты */}
              {!quizDone && quizStep === 4 && (
                <div>
                  <div className={styles.qStepTitle}>Принимаете ли вы препараты для симптомов?</div>
                  {[
                    ['ИПП / от изжоги', 'Да — ИПП, от изжоги (омез, нексиум, ренни и т.п.)'],
                    ['слабительные / ферменты', 'Да — слабительные или ферменты'],
                    ['несколько препаратов постоянно', 'Принимаю несколько препаратов постоянно'],
                    ['не принимаю', 'Сейчас ничего не принимаю'],
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      className={`${styles.qOpt}${answers.preparaty === val ? ' ' + styles.qOptSel : ''}`}
                      onClick={() => selectSingle('preparaty', val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 5 — что пробовали */}
              {!quizDone && quizStep === 5 && (
                <div>
                  <div className={styles.qStepTitle}>Что вы уже пробовали?</div>
                  {[
                    ['обошла много врачей', 'Обошла много врачей — помогает лишь на время'],
                    ['разные диеты', 'Перепробовала разные диеты, вес возвращается'],
                    ['БАДы сама', 'Пробовала добавки сама, без системы'],
                    ['ничего серьёзного', 'Серьёзно ещё ничем не занималась'],
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      className={`${styles.qOpt}${answers.tried === val ? ' ' + styles.qOptSel : ''}`}
                      onClick={() => selectSingle('tried', val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 6 — готовность */}
              {!quizDone && quizStep === 6 && (
                <div>
                  <div className={styles.qStepTitle}>Готовы ли вы менять питание и образ жизни?</div>
                  {[
                    ['да, готова вкладываться', 'Да, готова сдавать анализы и идти по схеме'],
                    ['готова, но нужна поддержка', 'Готова, но мне важна поддержка и сопровождение'],
                    ['пока сомневаюсь', 'Пока сомневаюсь — хочу разобраться подробнее'],
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      className={`${styles.qOpt}${answers.readiness === val ? ' ' + styles.qOptSel : ''}`}
                      onClick={() => selectSingle('readiness', val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 7 — contacts */}
              {!quizDone && quizStep === 7 && (
                <div>
                  <div className={styles.qStepTitle}>Куда мне написать вам?</div>
                  <p className={styles.qContactHint}>Оставьте имя и удобный контакт — я свяжусь с вами лично, расскажу про условия и отвечу на вопросы.</p>
                  <input
                    className={styles.qField}
                    type="text"
                    placeholder="Ваше имя"
                    autoComplete="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                  <input
                    className={styles.qField}
                    type="text"
                    placeholder="Telegram / WhatsApp / телефон"
                    autoComplete="tel"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                  />
                </div>
              )}

              {/* Done screen */}
              {quizDone && (
                <div className={styles.qDone}>
                  <div className={styles.tick}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h3>Спасибо! Анкета отправлена</h3>
                  <p>Я лично посмотрю ваши ответы и свяжусь с вами в ближайшее время. Если хотите — можете написать мне прямо сейчас.</p>
                  <div className={styles.ask} style={{ marginTop: 22 }}>
                    <a className={styles.tgBtn} href="https://t.me/NataTomshina" target="_blank" rel="noopener noreferrer">Telegram</a>
                    <a className={styles.waBtn} href="https://wa.me/79646516995" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                  </div>
                </div>
              )}
            </div>

            {!quizDone && (
              <div className={styles.qNav}>
                <button
                  type="button"
                  className={styles.qBack}
                  disabled={quizStep === 1}
                  onClick={() => setQuizStep(s => s - 1)}
                >
                  ← Назад
                </button>
                <button
                  type="button"
                  className="hp-btn hp-btn--green hp-btn--lg"
                  onClick={handleNext}
                >
                  {quizStep === TOTAL_STEPS ? 'Отправить анкету' : 'Далее →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className={styles.faqSection} id="faq">
        <div className={styles.wrap}>
          <h2 className={styles.sectionTitle}>Ответы на вопросы</h2>
          <div style={{ height: 20 }} />
          {[
            {
              q: 'Нужно ли сдавать анализы перед курсом?',
              a: 'В начале курса вы заполняете небольшую анкету, и мы определяем минимальный список необходимых именно вам анализов, чтобы не сдавать ничего лишнего.',
            },
            {
              q: 'Сколько времени нужно на уроки и задания?',
              a: '2–3 урока по 20–40 минут в неделю. Вам точно хватит времени на изучение уроков, а переход на рацион занимает столько же времени, сколько вы тратите на обычную еду ежедневно.',
            },
            {
              q: 'Подойдёт ли мне программа, если у меня удалён жёлчный пузырь?',
              a: 'Да. Программа адаптирована для тех, у кого удалён жёлчный пузырь — внутри есть отдельные рекомендации по пищеварению для этой ситуации.',
            },
            {
              q: 'Что если курс мне не подойдёт?',
              a: 'Если в течение 7 дней после старта вы поймёте, что метод вам не подходит, — обсудим всё индивидуально. Я заинтересована в вашем результате, а не просто в участии.',
            },
            {
              q: 'Могу ли я проходить курс, если живу в другой стране?',
              a: 'Да, конечно. Курс проходит в онлайн-формате. Также на курсе будут предложены аналоги российских нутрицевтиков, которые можно приобрести на iHerb.',
            },
          ].map((item, i) => (
            <div key={i} className={styles.faqItem}>
              <button
                className={`${styles.faqQ}${openFaq === i ? ' ' + styles.faqQOpen : ''}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {item.q}
              </button>
              <div className={`${styles.faqA}${openFaq === i ? ' ' + styles.faqAOpen : ''}`}>
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL ───────────────────────────────────────────────────────── */}
      <section className={styles.final}>
        <div className={styles.wrap}>
          <h2>Хватит откладывать заботу о себе</h2>
          <p>Вы заслуживаете жить без боли, тяжести и постоянной усталости. Пройдите короткую диагностику — и я подскажу, подходит ли вам программа.</p>
          <a className="hp-btn hp-btn--orange hp-btn--xl" href="#anketa">Заполнить анкету</a>
          <div style={{ marginTop: 34 }}>
            <div className={styles.eyebrow} style={{ marginBottom: 8 }}>Остались вопросы?</div>
            <p style={{ marginBottom: 10 }}>Задайте их лично Наталье:</p>
            <div className={styles.ask}>
              <a className={styles.tgBtn} href="https://t.me/NataTomshina" target="_blank" rel="noopener noreferrer">Telegram</a>
              <a className={styles.waBtn} href="https://wa.me/79646516995" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── DISCLAIMER ──────────────────────────────────────────────────── */}
      <div className={styles.disclaimer}>
        <div className={styles.wrap}>
          <p>Информация на странице носит образовательный характер и не заменяет консультацию врача. Наталья Томшина — нутрициолог, не врач, не ставит диагнозы и не назначает лечение.</p>
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        © Наталья Томшина · Программа «Лёгкость перемен» · Клуб «Вкус Жизни»
      </footer>
    </div>
  )
}
