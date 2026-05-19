'use client'

import { useState } from 'react'

const items = [
  {
    num: '01',
    title: 'Умная кухня',
    desc: 'Пишете, что есть в холодильнике — получаете блюдо. 1000+ рецептов под метаболический подход. Считает КБЖУ. Собирает рацион на неделю.',
    descShort: 'Рецепты под продукты из вашего холодильника',
    video: 'https://kinescope.io/embed/vcebnHjY5XFZeUs3SdQBQH',
  },
  {
    num: '02',
    title: 'Дневник питания',
    desc: 'Заполняется автоматически из Умной кухни. Вам не нужно ничего считать вручную.',
    descShort: 'Простой трекер без подсчёта калорий',
    video: 'https://kinescope.io/embed/p8vSMMKTePcLV17Astzoki',
  },
  {
    num: '03',
    title: 'Трекер замеров',
    desc: 'Вес, талия, бёдра, грудь, энергия, тяга к сладкому. Прогресс на графике — даже когда весы молчат.',
    descShort: 'Видеть прогресс там, где весы молчат',
    video: 'https://kinescope.io/embed/j8RSVEC8u75hxhm32baN3K',
  },
  {
    num: '04',
    title: 'Маленькие победы',
    desc: 'Раздел, где вы отмечаете то, что получилось. 30 секунд в день. Создаёт ежедневное чувство «я двигаюсь».',
    descShort: 'Не результат, а путь — каждый день',
    video: 'https://kinescope.io/embed/fq3BC6DdkJdZkTSLa64f6i',
  },
  {
    num: '05',
    title: 'Марафоны',
    desc: 'Раз в месяц — общая цель, общая поддержка. 7–10 дней с фокусом всей группы на одной теме. Усиливает результат.',
    descShort: 'Раз в месяц — общая цель, общая поддержка',
    video: 'https://kinescope.io/embed/95yBZrzUb3J9eP3MTXc4Bz',
  },
  {
    num: '06',
    title: 'Чаты сообщества',
    desc: 'Женщины, которые идут тем же путём. Поддержка 24/7, которая не критикует.',
    descShort: 'Живая поддержка 24/7 — не одна',
    video: 'https://kinescope.io/embed/i6pSdfs5hUoBFQAqBDKTaZ',
  },
]

export default function VideoTour() {
  const [active, setActive] = useState(0)

  const current = items[active]

  return (
    <section className="tour" id="platform">
      <div className="tour__inner">
        <span className="section-label">— Загляните внутрь —</span>
        <h2 className="section-title">
          Шесть инструментов,<br />чтобы было <em>легко</em>
        </h2>
        <p className="section-intro">
          Посмотрите, как работает каждый инструмент клуба.
        </p>

        <div className="tour__intro">
          <div className="tour__intro-card">
            <div className="tour__intro-title">Всё в одном месте</div>
            <p className="tour__intro-desc">
              Чаты, уроки, рецепты, замеры, видео, личное общение со мной — на одной
              платформе. Не надо метаться между Telegram, WhatsApp и Google Drive.
            </p>
          </div>
          <div className="tour__intro-card">
            <div className="tour__intro-title">С любого устройства</div>
            <p className="tour__intro-desc">
              Телефон, планшет, ноутбук, рабочий компьютер. Ничего не надо скачивать
              и устанавливать. Без VPN.
            </p>
          </div>
        </div>

        {/* Desktop: player + playlist */}
        <div className="tour__board">
          <div className="tour__main">
            <div className="tour__player">
              <iframe
                key={current.video}
                src={current.video}
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media;"
                allowFullScreen
              />
            </div>
            <div className="tour__caption">
              <div className="tour__caption-label">— Раздел {String(active + 1).padStart(2, '0')} —</div>
              <h3 className="tour__caption-title">{current.title}</h3>
              <p className="tour__caption-desc">{current.desc}</p>
            </div>
          </div>

          <div className="tour__playlist" role="list">
            {items.map((item, i) => (
              <button
                key={item.num}
                type="button"
                className={`tour__item${i === active ? ' is-active' : ''}`}
                onClick={() => setActive(i)}
              >
                <span className="tour__item-num">{item.num}</span>
                <span className="tour__item-text">
                  <span className="tour__item-title">
                    {item.title}
                    <span className="tour__item-now">Сейчас</span>
                  </span>
                  <span className="tour__item-desc">{item.descShort}</span>
                </span>
                <span className="tour__item-play" aria-hidden="true">▶</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: accordion */}
        <div className="tour__accordion">
          {items.map((item, i) => (
            <details key={item.num} className="tour-acc-item" open={i === 0}>
              <summary className="tour-acc-item__head">
                <div className="tour-acc-item__top">
                  <span className="tour-acc-item__num">{item.num}</span>
                  <div className="tour-acc-item__text">
                    <span className="tour-acc-item__title">{item.title}</span>
                    <span className="tour-acc-item__desc-short">{item.descShort}</span>
                  </div>
                </div>
                <span className="tour-acc-item__btn">
                  <span className="tour-acc-item__btn-icon">▶</span>
                  <span className="tour-acc-item__btn-text">Смотреть видео</span>
                </span>
              </summary>
              <div className="tour-acc-item__body">
                <div className="tour-acc-item__player">
                  <iframe
                    src={item.video}
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media;"
                    allowFullScreen
                  />
                </div>
                <p className="tour-acc-item__desc">{item.desc}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
