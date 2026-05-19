import type { Metadata } from 'next'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Вкус Жизни — клуб похудения для женщин 35–60 | Наталья Томшина',
  description: 'Метаболическое питание после 40. Не диета, а год пошагово с поддержкой нутрициолога. 2–3 кг в месяц, без надрыва.',
  alternates: {
    canonical: 'https://nata-tomshina.ru/',
  },
  openGraph: {
    title: 'Вкус Жизни — клуб похудения для женщин 35–60',
    description: 'Метаболическое питание после 40. Не диета, а год пошагово с поддержкой нутрициолога.',
    url: 'https://nata-tomshina.ru/',
    type: 'website',
  },
}

export default function HomePage() {
  return (
    <>
      <PublicNav currentPage="/" />
      <main className="hp-main">

        {/* Блок 1: Hero */}
        <section className="hp-hero">
          <div className="hp-hero__inner">
            <div className="hp-pill">● Школа осознанного питания</div>
            <h1 className="hp-hero__title">
              После 40 твоё тело — <em>другое</em>.<br />
              Значит, и метод похудения должен быть <em>другим</em>.
            </h1>
            <p className="hp-hero__lead">
              Не «ешь меньше». Не «больше силы воли». А питание, которое работает
              с твоей физиологией. Я расскажу, почему старые методы перестали
              давать результат — и что делать вместо них.
            </p>
            <div className="hp-hero__author">
              <strong>Наталья Томшина</strong>, интегративный нутрициолог · 46 лет · Сама через это прошла.<br />
              Основатель клуба «Вкус Жизни». Помогаю женщинам 35–60.
            </div>
            <a href="/free" className="hp-btn hp-btn--orange hp-btn--xl">
              Получить бесплатный курс
            </a>
          </div>
        </section>

        {/* Блок 2: Узнаёшь себя */}
        <section className="hp-recognition">
          <div className="hp-section__inner">
            <h2 className="hp-section__title">Узнаёшь себя?</h2>
            <ul className="hp-recognition__list">
              <li>Ешь меньше, чем в тридцать. А весы ползут вверх.</li>
              <li>Пробовала диеты. Работало. Потом всё вернулось.</li>
              <li>Врач говорит «анализы в норме». А ты себя в норме не чувствуешь.</li>
              <li>В спортзал ходишь. Толку ноль. Иногда ещё и хуже.</li>
              <li>Думаешь: может, это просто возраст и надо смириться?</li>
            </ul>
            <div className="hp-recognition__answer">
              <h3 className="hp-recognition__answer-title">Нет. Не надо.</h3>
              <p>
                После 35 в теле реально меняется многое. Гормональный фон, скорость
                обмена веществ, реакция на еду, на стресс, на тренировки. То, что
                работало в 25, теперь даёт обратный эффект. Это не ты сломалась.
                Просто правила игры поменялись.
              </p>
              <p>
                И ещё. Изнуряющие тренировки здесь не нужны. Честно. Для многих
                женщин после 40 они вообще мешают — гонят кортизол вверх, и тело
                начинает копить, а не отдавать. Я объясню, что реально работает
                для твоего тела.
              </p>
              <a href="/blog/pohudenie/" className="hp-recognition__link">
                → Читать подробно: Как похудеть без вреда после 40 лет
              </a>
            </div>
          </div>
        </section>

        {/* Блок 3: Кто я */}
        <section className="hp-about">
          <div className="hp-about__inner">
            <div className="hp-about__photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/authors/natalia.jpg" alt="Наталья Томшина — нутрициолог" />
            </div>
            <div className="hp-about__content">
              <div className="hp-about__kicker">Кто я</div>
              <h2 className="hp-about__title">
                Привет, я Наталья.<br />
                Мне 46, и я сама через всё это прошла.
              </h2>
              <p>
                Я нутрициолог с интегративным подходом. Это значит — я не смотрю
                на вес как на отдельную проблему. Я смотрю на всю картину: как
                спишь, как реагируешь на стресс, как работают гормоны, что
                показывают анализы. Потому что лишний вес после 40 — это не про
                «переедание». За ним стоит что-то ещё. И вот это «ещё» мы
                разбираем вместе.
              </p>
              <p>
                Мой метод называется <em>метаболическое питание</em>. Это не список
                запрещённых продуктов. Это про то, как есть нормально и сытно, без
                ощущения что наказываешь себя, и при этом тело начинает работать
                на тебя, а не против.
              </p>
              <blockquote className="hp-about__quote">
                Я не говорю «делай так». Я объясняю — почему.
              </blockquote>
              <p>
                Когда понимаешь свою физиологию, тебя не собьёт ни праздник, ни
                отпуск, ни три недели стресса на работе. Ты просто знаешь, как
                работает твоё тело.
              </p>
              <p>
                Вот почему у моих девочек результат держится годами. А не
                возвращается через три месяца с довеском.
              </p>
            </div>
          </div>
        </section>

        {/* Блок 4: Кому подходит */}
        <section className="hp-fit">
          <div className="hp-section__inner">
            <h2 className="hp-section__title">Это твоё место, если...</h2>
            <div className="hp-fit__columns">
              <div className="hp-fit__col hp-fit__col--green">
                <div className="hp-fit__badge hp-fit__badge--ok">✓ Подходит</div>
                <ul>
                  <li>Тебе 35–60, и тело ведёт себя «как чужое»</li>
                  <li>Пробовала диеты — каждый раз откат</li>
                  <li>Есть диагнозы: ИР, гипотиреоз, СПКЯ, климакс</li>
                  <li>Хочешь понять свой организм, а не просто получить меню</li>
                  <li>Готова к темпу 2–3 кг в месяц — зато навсегда</li>
                  <li>Без изнуряющих тренировок — движение да, насилие над телом нет</li>
                </ul>
              </div>
              <div className="hp-fit__col hp-fit__col--wine">
                <div className="hp-fit__badge hp-fit__badge--no">✕ Не сейчас</div>
                <ul>
                  <li>Нужно минус 10 кг к отпуску через месяц</li>
                  <li>Хочется просто заплатить и чтобы само</li>
                  <li>Жёсткие запреты кажутся единственным рабочим методом</li>
                </ul>
                <p className="hp-fit__note">
                  Это нормально. Просто мой формат тогда не твой — и я это уважаю.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Блок 5: Три двери */}
        <section className="hp-doors">
          <div className="hp-section__inner hp-doors__inner">
            <h2 className="hp-section__title">Не знаешь с чего начать? Вот три двери:</h2>
            <div className="hp-doors__grid">
              <a href="/results" className="hp-door hp-door--rose">
                <div className="hp-door__icon">📖</div>
                <h3 className="hp-door__title">Истории женщин</h3>
                <div className="hp-door__sub">«Я думала, в моём возрасте уже не получится»</div>
                <p className="hp-door__desc">
                  Климакс, инсулинорезистентность, вес после родов, последняя
                  попытка после 10 диет. Реальные истории из Клуба, без прикрас.
                  Возможно, узнаешь себя.
                </p>
                <span className="hp-door__cta">Читать истории →</span>
              </a>
              <a href="/blog" className="hp-door hp-door--blue">
                <div className="hp-door__icon">📚</div>
                <h3 className="hp-door__title">Статьи по симптомам</h3>
                <p className="hp-door__desc">
                  Засыпаешь после еды? Вес стоит, хотя всё делаешь правильно?
                  Разбираю просто, без терминов.
                </p>
                <span className="hp-door__cta">В библиотеку →</span>
              </a>
              <a href="/free" className="hp-door hp-door--orange">
                <div className="hp-door__icon">🎁</div>
                <h3 className="hp-door__title">Бесплатный мини-курс</h3>
                <p className="hp-door__desc">
                  С чего стоит начать похудение каждой женщине после 35. Без
                  этой базы любая диета — стрельба вслепую.
                </p>
                <span className="hp-door__cta">Получить на email →</span>
              </a>
            </div>
          </div>
        </section>

        {/* Блок 6: Финальный CTA */}
        <section className="hp-final">
          <div className="hp-final__inner">
            <h2 className="hp-final__title">
              Год рядом. Без гонки.<br />
              Без ощущения, что ты на диете.
            </h2>
            <p className="hp-final__lead">
              Клуб «Вкус Жизни» — это не курс на месяц, после которого ты снова
              одна со своими вопросами. Это год. Пошагово, с поддержкой
              нутрициолога, профильных специалистов и женщин, которые идут рядом.
            </p>
            <div className="hp-final__highlight">
              2–3 кг в месяц. Без надрыва. Зато навсегда.
            </div>
            <blockquote className="hp-final__quote">
              <p>Я просто вернула себе вкус жизни.</p>
              <footer>— из отзывов участниц Клуба</footer>
            </blockquote>
            <a href="/club" className="hp-btn hp-btn--green hp-btn--xl">
              Узнать о клубе «Вкус Жизни»
            </a>
          </div>
        </section>

      </main>
      <PublicFooter />
    </>
  )
}
