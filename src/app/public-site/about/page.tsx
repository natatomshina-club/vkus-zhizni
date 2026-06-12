import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'

export const metadata: Metadata = {
  title: 'Наталья Томшина — нутрициолог · Об авторе | Вкус Жизни',
  description: 'Наталья Томшина — нутрициолог, основатель клуба «Вкус Жизни». С 2017 года в практике, 4000+ участниц. Метаболическое питание для женщин 35–60.',
  alternates: {
    canonical: 'https://nata-tomshina.ru/about',
  },
  openGraph: {
    title: 'Наталья Томшина — нутрициолог',
    description: 'Метаболическое питание для женщин 35–60. С 2017 года в практике.',
    url: 'https://nata-tomshina.ru/about',
    type: 'profile',
  },
}

const ABOUT_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Наталья Томшина',
  url: 'https://nata-tomshina.ru/about',
  image: 'https://nata-tomshina.ru/images/natalia.jpg',
  jobTitle: 'Интегративный нутрициолог',
  description: 'Помогаю женщинам 35–60 лет восстановить гормональный баланс и нормализовать вес через метаболическое питание.',
  worksFor: {
    '@type': 'Organization',
    name: 'Клуб «Вкус Жизни»',
    url: 'https://nata-tomshina.ru',
  },
  knowsAbout: [
    'Нутрициология',
    'Метаболическое питание',
    'Гормональные нарушения',
    'Инсулинорезистентность',
    'Менопауза',
    'Гипотиреоз',
    'СПКЯ',
  ],
  hasCredential: [
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'certificate',
      name: 'Нутрициолог',
    },
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'certificate',
      name: 'Управление весом',
    },
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'certificate',
      name: 'Витаминология и нутрициология',
    },
  ],
  sameAs: [
    'https://t.me/NataTomshina',
    'https://instagram.com/nata.tomshina',
    'https://youtube.com/@natatomshina',
  ],
}

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_SCHEMA) }}
      />
      <PublicNav currentPage="/about" />
      <main className="ab-main">

        {/* 1. Hero */}
        <section className="ab-hero">
          <div className="ab-hero__inner">
            <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Об авторе' }]} />
            <div className="ab-hero__content">
              <div className="ab-hero__text">
                <div className="ab-kicker">— Об авторе</div>
                <h1 className="ab-hero__title">
                  Наталья <em>Томшина</em>
                </h1>
                <p className="ab-hero__sub">Нутрициолог · Основатель клуба «Вкус Жизни»</p>
                <div className="ab-hero__pills">
                  <span className="ab-pill">С 2017 года в практике</span>
                  <span className="ab-pill">Мама двоих детей</span>
                  <span className="ab-pill">Нутрициолог</span>
                  <span className="ab-pill ab-pill--accent">4000+ участниц</span>
                </div>
                <div className="ab-hero__actions">
                  <Link href="/club" className="hp-btn hp-btn--green hp-btn--xl">
                    Узнать о клубе «Вкус Жизни»
                  </Link>
                  <Link href="/results" className="ab-link-arrow">
                    Результаты участниц →
                  </Link>
                </div>
              </div>
              <div className="ab-hero__photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/natalia.jpg"
                  alt="Наталья Томшина — нутрициолог"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. История + до-после */}
        <section className="ab-story">
          <div className="ab-story__inner">
            <div className="ab-kicker">— История</div>
            <h2 className="ab-story__title">Я сама прошла этот путь</h2>

            <div className="ab-story__columns">
              <div className="ab-story__text">
                <p>Я не пришла в нутрициологию из академии. Я пришла туда <strong>из собственного тупика.</strong></p>
                <p>Много лет я делала «всё правильно»: считала калории, ела по 5–6 раз в день маленькими порциями, избегала жирного. После рождения детей вес никуда не уходил, несмотря на все усилия. Я чувствовала себя уставшей, раздражительной, и постоянно хотела сладкого.</p>
                <p><em>«Всё в норме»</em> — говорили врачи. Анализы были в референсных значениях. Но я понимала — что-то не так на более глубоком уровне.</p>
                <p>Когда я начала изучать, <strong>как инсулин управляет жировым обменом,</strong> как питание влияет на гормоны щитовидной железы, как связаны усталость, сахар и тяга к сладкому — всё встало на свои места.</p>
                <p>Я изменила подход к питанию. Убрала перекусы, добавила правильные жиры, поставила белок в основу каждого приёма пищи. Через две недели ушла дневная сонливость. Через месяц — постоянный голод. Тело начало работать так, как должно.</p>
                <p>С 2017 года я живу в этой системе. И каждый год помогаю тысячам женщин — от 30 до 70+ лет — сделать то же самое. Не через насилие над собой, а через понимание биохимии своего тела.</p>
              </div>

              <aside className="ab-story__quote-card">
                <blockquote className="ab-story__quote">
                  Лишний вес — это не слабость характера. Это гормональный сигнал. Как только вы начнёте работать с причиной, а не следствием — всё меняется.
                </blockquote>
                <div className="ab-story__quote-author">
                  <strong>Наталья Томшина</strong>
                  <span>Нутрициолог, основатель «Вкус Жизни»</span>
                </div>
                <ol className="ab-timeline">
                  <li>
                    <span className="ab-timeline__year">2017</span>
                    <span className="ab-timeline__text">Начала практиковать метаболическое питание, первые результаты у себя</span>
                  </li>
                  <li>
                    <span className="ab-timeline__year">2018</span>
                    <span className="ab-timeline__text">Первые клиентки, запуск марафонов по похудению</span>
                  </li>
                  <li>
                    <span className="ab-timeline__year">2020</span>
                    <span className="ab-timeline__text">Основание закрытого клуба «Вкус Жизни»</span>
                  </li>
                  <li>
                    <span className="ab-timeline__year">2026</span>
                    <span className="ab-timeline__text">Более 4000 женщин прошли обучение и изменили здоровье</span>
                  </li>
                </ol>
              </aside>
            </div>

            {/* До-После */}
            <div className="ab-before-after">
              <h3 className="ab-before-after__title">Мои собственные результаты</h3>
              <div className="ab-before-after__grid">
                <figure className="ab-ba-photo">
                  <div className="ab-ba-photo__label">До</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/befor.png" alt="До метаболического питания — 82 кг" loading="lazy" />
                  <figcaption className="ab-ba-photo__weight">82 кг</figcaption>
                </figure>
                <figure className="ab-ba-photo">
                  <div className="ab-ba-photo__label ab-ba-photo__label--after">После</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/after.png" alt="После метаболического питания — 56 кг" loading="lazy" />
                  <figcaption className="ab-ba-photo__weight ab-ba-photo__weight--after">56 кг</figcaption>
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Три принципа */}
        <section className="ab-principles">
          <div className="ab-section__inner">
            <div className="ab-kicker">— Подход</div>
            <h2 className="ab-section__title">Три принципа, которые работают</h2>
            <p className="ab-section__lead">
              Почему обычные диеты дают временный результат — и что происходит, когда работаешь с причиной.
            </p>
            <div className="ab-principles__grid">
              <div className="ab-principle">
                <div className="ab-principle__num">01</div>
                <h3 className="ab-principle__title">Гормоны управляют весом, а не калории</h3>
                <p>Когда инсулин постоянно высок — тело накапливает жир, что бы вы ни ели. Нормализуем инсулин через питание — тело само начинает использовать собственные запасы.</p>
              </div>
              <div className="ab-principle">
                <div className="ab-principle__num">02</div>
                <h3 className="ab-principle__title">Сытость — это физиология, не сила воли</h3>
                <p>Голод и тяга к сладкому — не слабость. Это сигналы гормонов грелина и инсулина. Когда организм получает нутритивно плотную еду — эти сигналы выключаются сами.</p>
              </div>
              <div className="ab-principle">
                <div className="ab-principle__num">03</div>
                <h3 className="ab-principle__title">Это образ жизни, а не временная диета</h3>
                <p>Участницы клуба держат результат годами — потому что не «сидят на диете», а живут в системе питания, которая им комфортна и не требует постоянного контроля.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Метод работает (8 карточек) */}
        <section className="ab-conditions">
          <div className="ab-section__inner">
            <div className="ab-kicker">— Для кого</div>
            <h2 className="ab-section__title">Метод работает, даже если у вас…</h2>
            <p className="ab-section__lead">
              Большинство участниц приходят с одним или несколькими из этих состояний.
            </p>
            <div className="ab-conditions__grid">
              <article className="ab-condition ab-condition--green">
                <h3>Гипотиреоз / АИТ</h3>
                <p>Питание даёт щитовидке нужные нутриенты вместо того, чтобы её «выключать»</p>
              </article>
              <article className="ab-condition ab-condition--green">
                <h3>Инсулинорезистентность</h3>
                <p>Снижение инсулина — это и есть лечение корня проблемы</p>
              </article>
              <article className="ab-condition ab-condition--green">
                <h3>Диабет 2 типа / преддиабет</h3>
                <p>Участницы снижают сахар и инсулин, врачи отменяют таблетки</p>
              </article>
              <article className="ab-condition ab-condition--green">
                <h3>Менопауза / СПКЯ</h3>
                <p>Питание берёт на себя роль «протектора» в период гормональной перестройки</p>
              </article>
              <article className="ab-condition ab-condition--rose">
                <h3>«Ветеран диет»</h3>
                <p>Все перепробовали, вес возвращается — потому что работали со следствием</p>
              </article>
              <article className="ab-condition ab-condition--rose">
                <h3>Хроническая усталость</h3>
                <p>Клеточный голод при инсулинорезистентности — причина «состояния мумии»</p>
              </article>
              <article className="ab-condition ab-condition--cream">
                <h3>Возраст 50–70+ лет</h3>
                <p>Тамара — минус 18 кг в 62 года с гипотиреозом. Возраст не ограничение</p>
              </article>
              <article className="ab-condition ab-condition--cream">
                <h3>Вес 100+ кг</h3>
                <p>Рекорд клуба — минус 83 кг. Начинала с 185 кг</p>
              </article>
            </div>
          </div>
        </section>

        {/* 5. Образование */}
        <section className="ab-education">
          <div className="ab-section__inner">
            <div className="ab-kicker">— Образование</div>
            <h2 className="ab-section__title">Сертификаты и дипломы</h2>
            <div className="ab-education__card">
              <div className="ab-education__columns">
                <div className="ab-education__list">
                  <h3>Профессиональное образование</h3>
                  <ul>
                    <li><strong>Нутрициолог</strong> — диплом об окончании профессионального курса</li>
                    <li><strong>Управление весом</strong> — специализированный сертификат</li>
                    <li><strong>Витаминология и нутрициология</strong> — дополнительная специализация</li>
                  </ul>
                </div>
                <div className="ab-education__certs">
                  <a href="/images/sert-1.png" target="_blank" rel="noopener noreferrer" className="ab-cert">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/sert-1.png" alt="Сертификат нутрициолога" loading="lazy" />
                  </a>
                  <a href="/images/sert-2.png" target="_blank" rel="noopener noreferrer" className="ab-cert">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/sert-2.png" alt="Сертификат управление весом" loading="lazy" />
                  </a>
                  <a href="/images/sert-3.png" target="_blank" rel="noopener noreferrer" className="ab-cert">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/sert-3.png" alt="Сертификат витаминология" loading="lazy" />
                  </a>
                </div>
              </div>
              <p className="ab-education__disclaimer">
                Рекомендации по питанию не заменяют медицинскую консультацию при наличии серьёзных заболеваний.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Финальный CTA */}
        <section className="ab-final">
          <div className="ab-final__inner">
            <h2 className="ab-final__title">
              Хотите узнать, как это работает именно для вас?
            </h2>
            <p className="ab-final__lead">
              Пошагово, с поддержкой нутрициолога, профильных специалистов и женщин, которые идут рядом.
            </p>
            <div className="ab-final__highlight">
              2–3 кг в месяц. Без надрыва. Зато навсегда.
            </div>
            <Link href="/club" className="hp-btn hp-btn--green hp-btn--xl">
              Верните себе Вкус Жизни
            </Link>
          </div>
        </section>

      </main>
      <PublicFooter />
    </>
  )
}
