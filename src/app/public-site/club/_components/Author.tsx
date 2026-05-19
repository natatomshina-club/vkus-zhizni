'use client'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function Author() {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!lightboxSrc) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxSrc(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightboxSrc])

  return (
    <section className="author">
      <div className="author__inner">
        <div className="author__photo-wrap author__photo-wrap--before">
          <div className="author__photo-frame">
            <span className="story__tag story__tag--before">До</span>
            <Image
              src="/images/befor-1.png"
              alt="Наталья Томшина — до"
              fill
              sizes="(max-width: 768px) 85vw, 280px"
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
            />
          </div>
          <div className="story__result author__weight">
            <span className="story__result-num">81</span> кг
          </div>
          <button
            className="author__cert"
            onClick={() => setLightboxSrc('/images/Ketogenic.jpg')}
            aria-label="Открыть сертификат"
          >
            <Image
              src="/images/Ketogenic.jpg"
              alt="Ketogenic Living Coach Certification"
              width={560}
              height={400}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </button>
          <p className="author__cert-caption">Ketogenic Living Coach · 2019</p>
        </div>

        <div className="author__content">
          <span className="section-label" style={{ textAlign: 'left' }}>— Меня зовут Наталья —</span>
          <h2 className="author__title">
            46 лет.<br />
            <em>Сама через всё это прошла.</em>
          </h2>

          <p className="author__text">
            Я не пришла в нутрициологию из академии. Я пришла туда <strong>из собственного тупика</strong>.
            Прошла гормональные качели, набор веса после 35, после рождения двоих детей.
          </p>
          <p className="author__text">
            Много лет я делала «всё правильно»: считала калории, ела по 5–6 раз в день
            маленькими порциями, избегала жирного. Я чувствовала себя уставшей,
            раздражительной и постоянно хотела сладкого.
          </p>
          <p className="author__text">
            Когда я начала изучать, <strong>как инсулин управляет жировым обменом</strong>,
            как питание влияет на гормоны щитовидной железы, как связаны усталость, сахар
            и тяга к сладкому — всё встало на свои места.
          </p>
          <p className="author__text">
            Я создала клуб, потому что увидела одно: <strong>женщинам после 40 не нужна ещё
            одна диета.</strong> Им нужен метод под их физиологию и живая поддержка.
          </p>

          <div className="author__quote-card">
            <p className="author__quote-text">
              Лишний вес — это не слабость характера. Это гормональный сигнал. Как только
              вы начнёте работать с причиной, а не следствием — всё меняется.
            </p>
            <div className="author__timeline">
              <dl>
                <dt>2017</dt>
                <dd>Начала практиковать метаболическое питание, первые результаты у себя</dd>
                <dt>2018</dt>
                <dd>Первые клиентки, запуск марафонов по похудению</dd>
                <dt>2020</dt>
                <dd>Основание закрытого клуба «Вкус Жизни»</dd>
                <dt>2026</dt>
                <dd>Более 4000 женщин прошли обучение и изменили здоровье</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="author__photo-wrap author__photo-wrap--after">
          <div className="author__photo-frame">
            <span className="story__tag story__tag--after">После</span>
            <Image
              src="/images/after.png"
              alt="Наталья Томшина — после"
              fill
              sizes="(max-width: 768px) 85vw, 280px"
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
            />
          </div>
          <div className="story__result author__weight">
            <span className="story__result-num">58</span> кг
          </div>
          <button
            className="author__cert"
            onClick={() => setLightboxSrc('/images/Nutr_Health.jpg')}
            aria-label="Открыть сертификат"
          >
            <Image
              src="/images/Nutr_Health.jpg"
              alt="British Nutrition Foundation — Exploring nutrition and health"
              width={560}
              height={400}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </button>
          <p className="author__cert-caption">British Nutrition Foundation · 2020</p>
        </div>
      </div>

      {lightboxSrc && (
        <div className="author__lightbox" onClick={() => setLightboxSrc(null)}>
          <button
            className="author__lightbox-close"
            onClick={e => { e.stopPropagation(); setLightboxSrc(null) }}
            aria-label="Закрыть"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt="Сертификат"
            className="author__lightbox-img"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}
