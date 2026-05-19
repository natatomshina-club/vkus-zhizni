'use client'

import { useState } from 'react'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'

type FilterKey = 'all' | 'weight' | 'health' | 'thyroid' | 'age50' | 'energy' | 'pills'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Все истории' },
  { key: 'weight', label: 'Большое похудение' },
  { key: 'health', label: 'Здоровье и анализы' },
  { key: 'thyroid', label: 'Щитовидная железа' },
  { key: 'age50', label: '50+ лет' },
  { key: 'energy', label: 'Энергия и усталость' },
  { key: 'pills', label: 'Отменили таблетки' },
]

export interface StoryCard {
  id: string
  slug: string
  name: string
  metric_main: string | null
  metric_label: string | null
  tag_label: string | null
  tag_filter: string[]
  summary_quote: string | null
  check_items: string[]
  photo_before_url: string | null
  photo_after_url: string | null
}

export default function ResultsClient({ stories }: { stories: StoryCard[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  const visible = activeFilter === 'all'
    ? stories
    : stories.filter(s => Array.isArray(s.tag_filter) && s.tag_filter.includes(activeFilter))

  return (
    <>
      <PublicNav currentPage="/results" />
      <main className="rs-main">

        {/* 1. Hero */}
        <section className="rs-hero">
          <div className="rs-hero__inner">
            <Breadcrumbs items={[
              { label: 'Главная', href: '/' },
              { label: 'Истории преображения' },
            ]} />
            <div className="rs-kicker">— Истории преображения</div>
            <h1 className="rs-hero__title">
              Разные женщины. Разные пути.<br />
              Одно <em>общее</em> — они вернули себе вкус жизни.
            </h1>
            <p className="rs-hero__lead">
              Здесь нет «до и после» в привычном смысле. Это истории о том, что действительно меняется, когда женщина перестаёт воевать с собой и начинает разбираться со своим телом.
            </p>
          </div>
        </section>

        {/* 2. Фильтры */}
        <section className="rs-filters">
          <div className="rs-filters__inner">
            <div className="rs-filters__label">Фильтр:</div>
            <div className="rs-filters__list">
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFilter(key)}
                  className={`rs-filter-pill${activeFilter === key ? ' rs-filter-pill--active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Карточки */}
        <section className="rs-stories">
          <div className="rs-stories__inner">
            <div className="rs-stories__grid">
              {visible.length === 0 ? (
                <p className="rs-stories__empty">Нет историй по этому фильтру</p>
              ) : (
                visible.map(s => (
                  <article key={s.id} className="rs-card">
                    {(s.photo_before_url || s.photo_after_url) && (
                      <div className="rs-card__photos">
                        {s.photo_before_url && (
                          <div className="rs-card__photo">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={s.photo_before_url}
                              alt={`${s.name} — до`}
                              loading="lazy"
                            />
                            <div className="rs-card__photo-label rs-card__photo-label--before">До</div>
                          </div>
                        )}
                        {s.photo_after_url && (
                          <div className="rs-card__photo">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={s.photo_after_url}
                              alt={`${s.name} — после`}
                              loading="lazy"
                            />
                            <div className="rs-card__photo-label rs-card__photo-label--after">После</div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="rs-card__body">
                      <header className="rs-card__header">
                        <div className="rs-card__identity">
                          <h3 className="rs-card__name">{s.name}</h3>
                          {s.tag_label && <span className="rs-card__tag">{s.tag_label}</span>}
                        </div>
                        {(s.metric_main || s.metric_label) && (
                          <div className="rs-card__result">
                            {s.metric_main && <div className="rs-card__result-num">{s.metric_main}</div>}
                            {s.metric_label && <div className="rs-card__result-label">{s.metric_label}</div>}
                          </div>
                        )}
                      </header>

                      {s.summary_quote && (
                        <blockquote className="rs-card__quote">
                          {s.summary_quote}
                        </blockquote>
                      )}

                      {Array.isArray(s.check_items) && s.check_items.length > 0 && (
                        <ul className="rs-card__checks">
                          {s.check_items.map((check, i) => (
                            <li key={i} className="rs-card__check">✓ {check}</li>
                          ))}
                        </ul>
                      )}

                      <Link href={`/results/${s.slug}`} className="rs-card__more">
                        Читать историю полностью →
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        {/* 4. Финальный CTA — переиспользует стили .hp-final с Главной */}
        <section className="hp-final">
          <div className="hp-final__inner">
            <h2 className="hp-final__title">
              Год рядом. Без гонки.<br />
              Без ощущения, что ты на диете.
            </h2>
            <p className="hp-final__lead">
              Клуб «Вкус Жизни» — это не курс на месяц, после которого ты снова одна со своими вопросами. Это год. Пошагово, с поддержкой нутрициолога, профильных специалистов и женщин, которые идут рядом.
            </p>
            <div className="hp-final__highlight">
              2–3 кг в месяц. Без надрыва. Зато навсегда.
            </div>
            <blockquote className="hp-final__quote">
              <p>Я просто вернула себе вкус жизни.</p>
              <footer>— из отзывов участниц Клуба</footer>
            </blockquote>
            <Link href="/club" className="hp-btn hp-btn--green hp-btn--xl">
              Узнать о клубе «Вкус Жизни»
            </Link>
          </div>
        </section>

      </main>
      <PublicFooter />
    </>
  )
}
