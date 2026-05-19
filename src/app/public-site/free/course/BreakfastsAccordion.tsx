'use client'
import { useState, useRef } from 'react'

declare global {
  interface Window { ym?: (id: number, action: string, goal: string) => void }
}

type Recipe = {
  name: string
  meta: string
  kbju: { kcal: number; protein: number; fat: number; carbs: number }
  ingredients: Array<{ item: string; amount: string }>
  steps: string[]
}

const RECIPES: Recipe[] = [
  {
    name: 'Яичные маффины с куриной печенью и зеленью',
    meta: '25 мин · запекание · русская',
    kbju: { kcal: 529, protein: 42.9, fat: 35.9, carbs: 11.0 },
    ingredients: [
      { item: 'яйцо куриное', amount: '180г' },
      { item: 'брокколи', amount: '120г' },
      { item: 'куриная печень', amount: '80г' },
      { item: 'масло гхи', amount: '10г' },
      { item: 'петрушка', amount: '10г' },
    ],
    steps: [
      'Куриную печень нарежьте кусочками, обжарьте на масле гхи 4-5 минут. Солите только в конце.',
      'Взбейте яйца с солью и перцем.',
      'В силиконовые формочки разлейте яйца, добавьте кусочки печени и петрушку.',
      'Запекайте при 180°C 12-15 минут до застывания.',
      'Брокколи обжарьте на оливковом масле 3-4 минуты, подавайте рядом.',
    ],
  },
  {
    name: 'Омлет с сыром и болгарским перцем',
    meta: '12 мин · жарка · русская',
    kbju: { kcal: 558, protein: 34.0, fat: 42.8, carbs: 10.0 },
    ingredients: [
      { item: 'яйцо куриное', amount: '180г' },
      { item: 'айсберг', amount: '60г' },
      { item: 'болгарский перец', amount: '100г' },
      { item: 'сыр российский', amount: '40г' },
      { item: 'масло гхи', amount: '10г' },
    ],
    steps: [
      'Болгарский перец нарежьте соломкой, обжарьте на масле гхи 2 минуты.',
      'Взбейте яйца с солью, добавьте натёртый сыр.',
      'Залейте перец яичной смесью, готовьте на среднем огне 3-4 минуты.',
      'Сложите омлет пополам, подавайте с айсбергом.',
    ],
  },
  {
    name: 'Яичные блинчики с творогом',
    meta: '20 мин · жарка · русская',
    kbju: { kcal: 549, protein: 41.2, fat: 40.7, carbs: 4.7 },
    ingredients: [
      { item: 'яйцо куриное', amount: '180г' },
      { item: 'сметана 10%', amount: '30г' },
      { item: 'творог 5%', amount: '100г' },
      { item: 'масло гхи', amount: '12г' },
      { item: 'зелёный лук', amount: '15г' },
    ],
    steps: [
      'Взбейте яйца с щепоткой соли.',
      'Жарьте тонкие блинчики на масле гхи по 1 минуте с каждой стороны.',
      'Творог смешайте со сметаной, зелёным луком и укропом.',
      'Начините блинчики творогом и сверните конвертом.',
      'Можно подать тёплыми или дать остыть, вкусно по-разному.',
    ],
  },
  {
    name: 'Шакшука (яйца в томатном соусе)',
    meta: '20 мин · сковорода · ближневосточная',
    kbju: { kcal: 486, protein: 26.4, fat: 36.4, carbs: 15.4 },
    ingredients: [
      { item: 'яйцо куриное', amount: '180г' },
      { item: 'помидор', amount: '200г' },
      { item: 'болгарский перец', amount: '100г' },
      { item: 'масло оливковое', amount: '15г' },
    ],
    steps: [
      'Обжарьте перец и чеснок на масле 5 минут.',
      'Добавьте нарезанные помидоры и зиру, тушите 7 минут.',
      'Сделайте ямки в соусе, разбейте яйца.',
      'Накройте крышкой, готовьте 5 минут, желток оставьте жидким.',
      'Посыпьте кинзой.',
    ],
  },
  {
    name: 'Сырники из творога без муки',
    meta: '25 мин · жарка · русская',
    kbju: { kcal: 592, protein: 50.6, fat: 40.6, carbs: 5.6 },
    ingredients: [
      { item: 'творог 5%', amount: '200г' },
      { item: 'яйцо куриное', amount: '60г' },
      { item: 'сыр пармезан', amount: '20г' },
      { item: 'сметана 10%', amount: '30г' },
      { item: 'масло гхи', amount: '15г' },
    ],
    steps: [
      'Творог разомните вилкой или протрите через сито.',
      'Добавьте яйца, пармезан, ванилин, щепотку соли, перемешайте.',
      'Влажными руками сформируйте лепёшки.',
      'Обжарьте на масле гхи по 2-3 минуты с каждой стороны.',
      'Подавайте со сметаной.',
    ],
  },
  {
    name: 'Творог с морковью и сметаной',
    meta: '7 мин · без готовки · русская',
    kbju: { kcal: 406, protein: 36.6, fat: 24.3, carbs: 10.4 },
    ingredients: [
      { item: 'творог 5%', amount: '200г' },
      { item: 'морковь', amount: '80г' },
      { item: 'сметана 15%', amount: '40г' },
      { item: 'масло сливочное', amount: '10г' },
    ],
    steps: [
      'Творог выложите в миску.',
      'Морковь натрите на мелкой тёрке.',
      'Смешайте творог, морковь и сметану.',
      'Добавьте соль или эритрит по вкусу: солёный или сладкий вариант.',
      'Посыпьте зеленью по желанию.',
    ],
  },
  {
    name: 'Фарш куриный с яйцом и капустой',
    meta: '20 мин · жарка · русская',
    kbju: { kcal: 551, protein: 43.5, fat: 37.9, carbs: 11.1 },
    ingredients: [
      { item: 'фарш куриный', amount: '150г' },
      { item: 'капуста белокочанная', amount: '150г' },
      { item: 'яйцо куриное', amount: '120г' },
      { item: 'масло гхи', amount: '12г' },
    ],
    steps: [
      'Фарш куриный обжарьте на масле гхи, разбивая, до готовности.',
      'Добавьте нашинкованную капусту, тушите 5 минут.',
      'Посолите, поперчите, добавьте паприку.',
      'Сделайте углубления, вбейте яйца.',
      'Накройте крышкой на 4 минуты.',
      'Посыпьте зеленью.',
    ],
  },
  {
    name: 'Кабачковые оладьи с куриным фаршем',
    meta: '30 мин · сковорода · русская',
    kbju: { kcal: 132, protein: 9.5, fat: 9.5, carbs: 1.7 },
    ingredients: [
      { item: 'фарш куриный', amount: '33г' },
      { item: 'кабачок', amount: '33г' },
      { item: 'яйцо куриное', amount: '20г' },
      { item: 'сыр российский', amount: '5г' },
      { item: 'топлёное масло', amount: '3г' },
    ],
    steps: [
      'Натрите кабачок на тёрке, хорошо отожмите сок.',
      'Смешайте фарш, кабачок, яйца, сыр.',
      'Добавьте чеснок и укроп, посолите.',
      'Жарьте на топлёном масле по 3-4 минуты с каждой стороны.',
      'Подайте горячими со сметаной.',
    ],
  },
]

const KBJU_CONFIG = [
  { key: 'kcal' as const,     label: 'Ккал',   color: '#B84500', bg: '#FEF0E8', unit: ''  },
  { key: 'protein' as const,  label: 'Белки',  color: '#1F5A33', bg: '#E8F5EE', unit: 'г' },
  { key: 'fat' as const,      label: 'Жиры',   color: '#F77D27', bg: '#FFF4E8', unit: 'г' },
  { key: 'carbs' as const,    label: 'Углев.', color: '#5B7A8A', bg: '#EEF3F7', unit: 'г' },
]

export default function BreakfastsAccordion() {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  function handleOpen() {
    setIsOpen(true)
  }

  function handleClose() {
    setIsOpen(false)
    window.ym?.(108262096, 'reachGoal', 'course_lesson1_breakfasts_close_bottom')
    setTimeout(() => {
      triggerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  return (
    <div style={{ marginTop: 'var(--space-5)' }}>

      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        className="bfrd-trigger"
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-4) var(--space-5)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-green)',
          background: 'linear-gradient(180deg, rgba(99,186,108,0.04), rgba(99,186,108,0.08))',
          cursor: 'pointer',
          transition: 'all 0.2s ease-out',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>🍳</span>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(15px, 1.3vw, 17px)',
            fontWeight: 600,
            color: 'var(--color-ink)',
          }}>
            Примеры завтраков
          </span>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--color-ink-soft)',
            background: 'var(--grad-green-pill)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            marginLeft: 4,
          }}>
            8 рецептов
          </span>
        </div>
        <svg
          width="18"
          height="18"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.3s ease',
            color: 'var(--color-green-dark)',
          }}
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Animated container */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          opacity: isOpen ? 1 : 0,
          transition: 'grid-template-rows 0.4s ease-out, opacity 0.3s ease-out',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              marginTop: 'var(--space-4)',
              background: 'var(--color-cream)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
            }}
            className="bfrd-inner"
          >
            {/* Lead text */}
            <p style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 'clamp(14px, 1.2vw, 16px)',
              color: 'var(--color-ink-soft)',
              lineHeight: 1.6,
              margin: '0 0 var(--space-6)',
              maxWidth: 580,
            }}>
              8 рецептов для жиросжигающего завтрака. Все продукты из обычного магазина.
              Выбирайте любой и пробуйте уже завтра.
            </p>

            {/* Recipe grid */}
            <div className="bfrd-grid">
              {RECIPES.map((recipe, idx) => (
                <RecipeCard key={idx} recipe={recipe} />
              ))}
            </div>

            {/* Bottom actions */}
            <div style={{
              marginTop: 'var(--space-8)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-4)',
              paddingTop: 'var(--space-6)',
              borderTop: '1px solid var(--color-border)',
            }}>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                color: 'var(--color-ink-soft)',
                lineHeight: 1.6,
                textAlign: 'center',
                margin: 0,
                maxWidth: 480,
              }}>
                Хотите ещё больше рецептов и персональный рацион?
              </p>
              <a
                href="https://nata-tomshina.ru/club"
                onClick={() => window.ym?.(108262096, 'reachGoal', 'course_lesson1_breakfasts_to_club')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: 'var(--space-3) var(--space-8)',
                  background: 'var(--grad-orange-btn)',
                  borderRadius: 'var(--radius-full)',
                  color: '#fff',
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(247,125,39,0.3)',
                }}
              >
                Посмотреть клуб →
              </a>
              <button
                onClick={handleClose}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: 'var(--space-2) var(--space-5)',
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--color-ink-soft)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M4 10L8 6L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Свернуть рецепты
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .bfrd-trigger:hover {
          background: linear-gradient(180deg, rgba(99,186,108,0.08), rgba(99,186,108,0.12)) !important;
          border-color: var(--color-green-dark) !important;
        }
        .bfrd-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-5);
        }
        @media (max-width: 1023px) {
          .bfrd-grid { grid-template-columns: 1fr; }
          .bfrd-inner { padding: var(--space-5) !important; }
        }
        @media (max-width: 767px) {
          .bfrd-inner { padding: var(--space-4) !important; }
        }
      `}</style>
    </div>
  )
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <article style={{
      background: 'var(--color-white)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      borderLeft: '4px solid var(--color-green)',
      boxShadow: 'var(--shadow-card)',
      padding: 'var(--space-5) var(--space-5) var(--space-6)',
    }} className="bfrd-card">

      {/* Name */}
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(17px, 1.4vw, 19px)',
        fontWeight: 600,
        color: 'var(--color-ink)',
        lineHeight: 1.25,
        margin: 0,
      }}>
        {recipe.name}
      </h3>

      {/* Meta */}
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        color: 'var(--color-ink-soft)',
        marginTop: 6,
      }}>
        {recipe.meta}
      </div>

      {/* КБЖУ table */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        marginTop: 'var(--space-4)',
      }}>
        {KBJU_CONFIG.map((cell, i) => (
          <div
            key={cell.key}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '8px 4px',
              borderRight: i < 3 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 700,
              color: cell.color,
              background: cell.bg,
              padding: '2px 6px',
              borderRadius: 4,
              letterSpacing: '0.03em',
              whiteSpace: 'nowrap',
            }}>
              {cell.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-ink)',
              textAlign: 'center',
            }}>
              {recipe.kbju[cell.key]}{cell.unit}
            </div>
          </div>
        ))}
      </div>

      {/* Ingredients */}
      <div style={{ marginTop: 'var(--space-5)' }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-green-dark)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--space-2)',
        }}>
          Ингредиенты:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {recipe.ingredients.map((ing, i) => (
            <div
              key={i}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                color: 'var(--color-ink)',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <span style={{ color: 'var(--color-green)', fontSize: 9, flexShrink: 0 }}>●</span>
              <span>{ing.item} — {ing.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div style={{ marginTop: 'var(--space-5)' }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-green-dark)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--space-2)',
        }}>
          Приготовление:
        </div>
        <ol style={{
          margin: 0,
          paddingLeft: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {recipe.steps.map((step, i) => (
            <li
              key={i}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                color: 'var(--color-ink)',
                lineHeight: 1.6,
              }}
            >
              {step}
            </li>
          ))}
        </ol>
      </div>

    </article>
  )
}
