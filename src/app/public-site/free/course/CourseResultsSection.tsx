'use client'
import Image from 'next/image'
import type { CSSProperties } from 'react'

const STORIES = [
  {
    name: 'Елена',
    category: 'ДИАГНОЗЫ',
    result: '−31 кг',
    period: 'за 1 год 4 месяца',
    quote: '«К 57 годам собрался полный набор: инсулинорезистентность, гипертония, гепатоз, преддиабет. И 104 кг.»',
    href: 'https://nata-tomshina.ru/results/pohudenie-21-kg-istoriya-elena',
    beforeSrc: 'https://club.nata-tomshina.ru/supabase/storage/v1/object/public/results-photos/35ea120a-a86a-4ac7-979f-40f87e757eb4/before.png',
    afterSrc: 'https://club.nata-tomshina.ru/supabase/storage/v1/object/public/results-photos/35ea120a-a86a-4ac7-979f-40f87e757eb4/after.png',
  },
  {
    name: 'Марина',
    category: 'БОЛЬШОЕ ПОХУДЕНИЕ',
    result: '−39 кг',
    period: 'ровно за год',
    quote: '«В пятом классе Ваня сказал: тебе нельзя играть в классики, пол проломишь. С этой фразы я ела 25 лет.»',
    href: 'https://nata-tomshina.ru/results/pohudenie-39-kg-za-god-istoriya-mariny',
    beforeSrc: 'https://club.nata-tomshina.ru/supabase/storage/v1/object/public/results-photos/054c0f9d-6d49-4ec5-b501-921071483339/before.png',
    afterSrc: 'https://club.nata-tomshina.ru/supabase/storage/v1/object/public/results-photos/054c0f9d-6d49-4ec5-b501-921071483339/after.png',
  },
  {
    name: 'Татьяна',
    category: '50+ ЛЕТ',
    result: '−24 кг',
    period: 'за 1 год 3 месяца',
    quote: '«Мне говорили: Таня, это климакс, смирись. Я смирилась на два года. Потом разозлилась.»',
    href: 'https://nata-tomshina.ru/results/pohudenie-24-kg-klimaks-istoriya-tatyany-52-goda',
    beforeSrc: 'https://club.nata-tomshina.ru/supabase/storage/v1/object/public/results-photos/f237e89c-59a5-424b-b10a-34299916841e/before.png',
    afterSrc: 'https://club.nata-tomshina.ru/supabase/storage/v1/object/public/results-photos/f237e89c-59a5-424b-b10a-34299916841e/after.png',
  },
  {
    name: 'Ольга',
    category: 'ОПЫТ ДИЕТ',
    result: '−28 кг',
    period: 'за 1 год 2 месяца',
    quote: '«За 20 лет я сидела на 14 разных диетах. Клуб Натальи стал пятнадцатым. И единственным, который не закончился срывом.»',
    href: 'https://nata-tomshina.ru/results/pohudenie-28-kg-posle-14-diet-istoriya-olgi',
    beforeSrc: 'https://club.nata-tomshina.ru/supabase/storage/v1/object/public/results-photos/e3e74232-4403-4ec0-8002-0194520a3ac0/before.png',
    afterSrc: 'https://club.nata-tomshina.ru/supabase/storage/v1/object/public/results-photos/e3e74232-4403-4ec0-8002-0194520a3ac0/after.png',
  },
]

const labelStyle: CSSProperties = {
  position: 'absolute',
  top: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.16em',
  color: '#fff',
  background: 'rgba(0,0,0,0.45)',
  padding: '4px 8px',
  borderRadius: 4,
  zIndex: 2,
}

export default function CourseResultsSection() {
  return (
    <section style={{
      background: 'var(--color-bg-page)',
      padding: 'var(--space-20) 5%',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        <div style={{
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          color: 'var(--color-green-dark)',
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
        }}>
          — ИСТОРИИ ПРЕОБРАЖЕНИЯ
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 700,
          color: 'var(--color-ink)',
          margin: 'var(--space-3) 0 0',
          lineHeight: 1.15,
        }}>
          Они начали так же, как вы сейчас
        </h2>

        <div
          style={{ marginTop: 'var(--space-10)' }}
          className="results-grid"
        >
          {STORIES.map(story => (
            <div
              key={story.name}
              style={{
                background: 'var(--color-white)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              className="result-card"
            >
              {/* Before / After photos */}
              <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1 / 1',
                overflow: 'hidden',
              }}>
                {/* Before photo (left half) */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '50%', height: '100%',
                  overflow: 'hidden',
                }}>
                  <span style={{ ...labelStyle, left: 8 }}>До</span>
                  <Image
                    src={story.beforeSrc}
                    alt={`${story.name} до`}
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'center top' }}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 160px"
                  />
                </div>

                {/* After photo (right half) */}
                <div style={{
                  position: 'absolute',
                  top: 0, right: 0,
                  width: '50%', height: '100%',
                  overflow: 'hidden',
                }}>
                  <span style={{ ...labelStyle, right: 8 }}>После</span>
                  <Image
                    src={story.afterSrc}
                    alt={`${story.name} после`}
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'center top' }}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 160px"
                  />
                </div>

                {/* Divider */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: '50%',
                  width: 2, height: '100%',
                  background: '#fff',
                  zIndex: 3,
                }} />
              </div>

              {/* Card body */}
              <div style={{ padding: 'var(--space-5) var(--space-6)' }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                }}>
                  {story.name}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  color: 'var(--color-green-dark)',
                  marginTop: 4,
                }}>
                  {story.category}
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(32px, 3vw, 40px)',
                  fontWeight: 700,
                  color: 'var(--color-orange)',
                  lineHeight: 1,
                  marginTop: 'var(--space-3)',
                }}>
                  {story.result}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: 'var(--color-ink-soft)',
                  marginTop: 2,
                }}>
                  {story.period}
                </div>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--color-ink)',
                  lineHeight: 1.5,
                  margin: 'var(--space-3) 0 0',
                }}>
                  {story.quote}
                </p>
                <a
                  href={story.href}
                  style={{
                    display: 'inline-block',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--color-green-dark)',
                    textDecoration: 'none',
                    marginTop: 'var(--space-4)',
                  }}
                >
                  Читать историю →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* All results button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-12)' }}>
          <a
            href="https://nata-tomshina.ru/results"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: 'var(--space-4) var(--space-8)',
              border: '2px solid var(--color-green-dark)',
              borderRadius: 'var(--radius-full)',
              background: 'transparent',
              color: 'var(--color-green-dark)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textDecoration: 'none',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--color-green-dark)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-green-dark)'
            }}
          >
            Все истории преображения →
          </a>
        </div>

      </div>

      <style>{`
        .results-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .result-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 48px rgba(40, 42, 55, 0.14) !important;
        }
        @media (max-width: 1024px) {
          .results-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .results-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
