'use client'
import Image from 'next/image'
import { useRef, useState, useEffect, useCallback } from 'react'

const stories = [
  {
    name: 'Светлана',
    result: '−17',
    period: 'кг за 8 месяцев',
    diagnosis: null,
    quote: 'Я не могла пройти мимо кухни, чтобы не открыть холодильник. Даже если только что поела. Я думала, что я безвольная.',
    results: [
      'Минус 17 кг за 8 месяцев, без срывов',
      'С 52-го размера на 46-й',
      'Прошли ночные набеги на холодильник',
      'Не сорвалась даже в Новый год — впервые за 20 лет',
    ],
    before: '/images/results/Sveta_befor.png',
    after:  '/images/results/Sveta_after.png',
    altBefore: 'Светлана — до',
    altAfter:  'Светлана — после',
  },
  {
    name: 'Оксана',
    result: '−16',
    period: 'кг за 7 месяцев',
    diagnosis: 'Здоровье и анализы',
    quote: 'Я ела обезжиренный творог на завтрак. Семь лет подряд. И именно им зарабатывала свой диагноз.',
    results: [
      'Минус 16 кг за 7 месяцев',
      'Тёмное пятно на шее ушло за 4 месяца',
      'HOMA-IR нормализовался',
      'С 50-го размера на 46-й',
    ],
    before: '/images/results/Oxana-befor.png',
    after:  '/images/results/Oxana-after.png',
    altBefore: 'Оксана — до',
    altAfter:  'Оксана — после',
  },
  {
    name: 'Татьяна',
    result: '−24',
    period: 'кг за 1 год 3 месяца',
    diagnosis: '50+ лет',
    quote: 'Мне говорили: «Таня, ну это же климакс, смирись». Я смирилась. На два года. Потом разозлилась.',
    results: [
      'Минус 24 кг за 1 год 3 месяца',
      'Приливы почти ушли, сон восстановился',
      'С 52-го размера на 46-й',
      'Впервые за 3 года просыпаюсь без отёков',
    ],
    before: '/images/results/Tatyana-87-befor.png',
    after:  '/images/results/Tatyana-63-after.png',
    altBefore: 'Татьяна — до',
    altAfter:  'Татьяна — после',
  },
  {
    name: 'Ольга',
    result: '−28',
    period: 'кг за 1 год 2 месяца',
    diagnosis: null,
    quote: 'За двадцать лет я сидела на четырнадцати разных диетах. Клуб Натальи стал пятнадцатым. И единственным, который не закончился срывом.',
    results: [
      'Минус 28 кг за 1 год 2 месяца',
      'С 52-го размера на 44-й',
      'Удалила папку «Похудение» в телефоне',
      'Перестала считать понедельники',
    ],
    before: '/images/results/Olga-91-befor.png',
    after:  '/images/results/Olga-68-after.png',
    altBefore: 'Ольга — до',
    altAfter:  'Ольга — после',
  },
]

type Story = typeof stories[number]

function StoryCompare({ before, after, altBefore, altAfter }: Pick<Story, 'before' | 'after' | 'altBefore' | 'altAfter'>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(50)
  const [dragging, setDragging] = useState(false)
  const [hint, setHint] = useState(true)
  const interacted = useRef(false)

  // Animate once when card enters viewport
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let done = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !done) {
        done = true
        obs.disconnect()
        timers.push(setTimeout(() => setPos(28), 300))
        timers.push(setTimeout(() => setPos(72), 850))
        timers.push(setTimeout(() => setPos(50), 1450))
      }
    }, { threshold: 0.55 })
    obs.observe(el)
    return () => { obs.disconnect(); timers.forEach(clearTimeout) }
  }, [])

  // Hide hint after 5 s
  useEffect(() => {
    const t = setTimeout(() => setHint(false), 5000)
    return () => clearTimeout(t)
  }, [])

  const pct = useCallback((clientX: number) => {
    const r = containerRef.current?.getBoundingClientRect()
    if (!r) return 50
    return Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100))
  }, [])

  const markInteracted = useCallback(() => {
    if (interacted.current) return
    interacted.current = true
    setHint(false)
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    if (containerRef.current) containerRef.current.style.touchAction = 'none'
    markInteracted()
  }, [markInteracted])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setPos(pct(e.clientX))
  }, [dragging, pct])

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
    if (containerRef.current) containerRef.current.style.touchAction = 'pan-y'
  }, [])

  const onContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('.story__compare-handle')) return
    setPos(pct(e.clientX))
    markInteracted()
  }, [pct, markInteracted])

  const ease = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  const transition = dragging ? 'none' : `clip-path 0.5s ${ease}`
  const handleTransition = dragging ? 'none' : `left 0.5s ${ease}`

  return (
    <div ref={containerRef} className="story__compare" onClick={onContainerClick}>
      {/* Before — bottom layer, always fully visible */}
      <div className="story__compare-img story__compare-before">
        <Image
          src={before}
          alt={altBefore}
          fill
          draggable={false}
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
        />
      </div>

      {/* After — top layer, clipped from the right */}
      <div
        className="story__compare-img story__compare-after"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)`, transition }}
      >
        <Image
          src={after}
          alt={altAfter}
          fill
          draggable={false}
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
        />
      </div>

      {/* Drag handle */}
      <div
        className="story__compare-handle"
        style={{ left: `${pos}%`, transition: handleTransition }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="story__compare-circle">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M8 4L3 10L8 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 4L17 10L12 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Badges — always visible in bottom corners */}
      <span className="story__tag story__tag--before">До</span>
      <span className="story__tag story__tag--after story__tag--after-right">После</span>

      {/* Drag hint — fades out after 5 s or first touch */}
      {hint && <div className="story__compare-hint">← Перетащите →</div>}
    </div>
  )
}

export default function Stories() {
  return (
    <section className="stories" id="results">
      <div className="stories__inner">
        <span className="section-label">— Истории —</span>
        <h2 className="section-title">
          Они тоже думали,<br /><em>что не получится</em>
        </h2>
        <p className="section-intro">…а потом вернули себе вкус жизни.</p>

        <div className="stories-grid">
          {stories.map((s) => (
            <article key={s.name} className="story">
              <StoryCompare
                before={s.before}
                after={s.after}
                altBefore={s.altBefore}
                altAfter={s.altAfter}
              />
              <div className="story__body">
                <div className="story__top">
                  <div className="story__name">{s.name}</div>
                  <div className="story__result">
                    <span className="story__result-num">{s.result}</span>{s.period}
                  </div>
                </div>
                {s.diagnosis && <span className="story__diagnosis">{s.diagnosis}</span>}
                <blockquote className="story__quote">{s.quote}</blockquote>
                <ul className="story__results">
                  {s.results.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div className="stories__more">
          <a href="/results" className="btn btn--ghost btn--lg">Все истории преображения →</a>
        </div>
      </div>
    </section>
  )
}
