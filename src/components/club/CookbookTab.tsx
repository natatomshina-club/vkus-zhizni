'use client'

import { useState, useEffect } from 'react'

interface CookbookRecipe {
  id: string
  title: string
  category: string
  photo_urls: string[]
  video_url: string | null
  ingredients: string | null
  servings: number | null
  calories: number | null
  protein: number | null
  fat: number | null
  carbs: number | null
  instructions: string | null
  tags: string[]
  sort_order: number
}

const CATEGORIES = [
  { value: '',              label: 'Все' },
  { value: 'breakfast',     label: 'Завтраки',                  emoji: '🌅' },
  { value: 'soup',          label: 'Супы',                      emoji: '🥣' },
  { value: 'salad_side',    label: 'Гарниры/Салаты',            emoji: '🥗' },
  { value: 'main',          label: 'Горячее',                   emoji: '🍳' },
  { value: 'savory_baking', label: 'Несладкая выпечка',         emoji: '🥐' },
  { value: 'sweet_baking',  label: 'Сладкая выпечка',           emoji: '🧁' },
  { value: 'snacks',        label: 'Закуски',                   emoji: '🫙' },
  { value: 'sauces',        label: 'Соусы',                     emoji: '🫕' },
]

const TAGS = [
  { value: '',           label: 'Все теги' },
  { value: 'keto',       label: 'Кето' },
  { value: 'nup',        label: 'НУП' },
  { value: 'dairy_free', label: 'Безмолочные' },
  { value: 'aip',        label: 'АИП' },
]

const TAG_LABELS: Record<string, string> = {
  keto: 'Кето', nup: 'НУП', dairy_free: 'Безмолочные', aip: 'АИП',
}

const CAT_EMOJI: Record<string, string> = {
  breakfast: '🌅', soup: '🥣', salad_side: '🥗', main: '🍳',
  savory_baking: '🥐', sweet_baking: '🧁', snacks: '🫙', sauces: '🫕',
}

const CAT_LABEL: Record<string, string> = {
  breakfast: 'Завтраки', soup: 'Супы', salad_side: 'Гарниры/Салаты',
  main: 'Горячее', savory_baking: 'Несладкая выпечка',
  sweet_baking: 'Сладкая выпечка', snacks: 'Закуски', sauces: 'Соусы',
}

function KinescopeEmbed({ url }: { url: string }) {
  const match = url.match(/kinescope\.io\/(?:embed\/)?([a-zA-Z0-9]+)/)
  const id = match?.[1]
  if (!id) return null
  return (
    <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 10, overflow: 'hidden', marginTop: 10 }}>
      <iframe
        src={`https://kinescope.io/embed/${id}`}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

function RecipeCard({ recipe }: { recipe: CookbookRecipe }) {
  const [open, setOpen] = useState(false)
  const hasKbju = recipe.calories || recipe.protein || recipe.fat || recipe.carbs

  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Photo or placeholder */}
      {recipe.photo_urls?.[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recipe.photo_urls[0]}
          alt={recipe.title}
          style={{ width: '100%', height: 180, objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          height: 120, background: 'linear-gradient(135deg, #F0EEFF 0%, #E8F4FF 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48,
        }}>
          {CAT_EMOJI[recipe.category] ?? '🍽'}
        </div>
      )}

      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Title */}
        <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: 0, fontFamily: 'var(--font-nunito)', lineHeight: 1.3 }}>
          {recipe.title}
        </p>

        {/* Category + tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: '#F0EEFF', color: 'var(--pur)',
          }}>
            {CAT_EMOJI[recipe.category]} {CAT_LABEL[recipe.category] ?? recipe.category}
          </span>
          {recipe.tags.map(t => (
            <span key={t} style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: '#E8F8F0', color: '#27AE60',
            }}>
              {TAG_LABELS[t] ?? t}
            </span>
          ))}
        </div>

        {/* КБЖУ */}
        {hasKbju && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {recipe.calories && (
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                🔥 {recipe.calories} ккал
              </span>
            )}
            {recipe.protein && (
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                Б {recipe.protein}
              </span>
            )}
            {recipe.fat && (
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                Ж {recipe.fat}
              </span>
            )}
            {recipe.carbs && (
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                У {recipe.carbs}
              </span>
            )}
          </div>
        )}

        {/* Expand button */}
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            marginTop: 'auto', padding: '8px', borderRadius: 10,
            background: open ? 'var(--pur)' : 'var(--pur-lt)',
            color: open ? '#fff' : 'var(--pur)',
            border: `1px solid ${open ? 'var(--pur)' : 'var(--pur-br)'}`,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-nunito)', width: '100%',
          }}
        >
          {open ? '▲ Скрыть' : '📖 Показать рецепт'}
        </button>

        {/* Expanded content */}
        {open && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {recipe.servings && (
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, fontFamily: 'var(--font-nunito)' }}>
                🍽 Порций: {recipe.servings}
              </p>
            )}

            {recipe.ingredients && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px', fontFamily: 'var(--font-nunito)' }}>
                  Ингредиенты
                </p>
                <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, whiteSpace: 'pre-line', lineHeight: 1.7, fontFamily: 'var(--font-nunito)' }}>
                  {recipe.ingredients}
                </p>
              </div>
            )}

            {recipe.instructions && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px', fontFamily: 'var(--font-nunito)' }}>
                  Приготовление
                </p>
                <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, whiteSpace: 'pre-line', lineHeight: 1.7, fontFamily: 'var(--font-nunito)' }}>
                  {recipe.instructions}
                </p>
              </div>
            )}

            {/* Second photo */}
            {recipe.photo_urls?.[1] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={recipe.photo_urls[1]}
                alt=""
                style={{ width: '100%', borderRadius: 10, objectFit: 'cover', maxHeight: 200 }}
              />
            )}

            {recipe.video_url && <KinescopeEmbed url={recipe.video_url} />}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CookbookTab() {
  const [recipes, setRecipes]   = useState<CookbookRecipe[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')

  useEffect(() => {
    fetch('/api/cookbook')
      .then(r => r.json())
      .then((d: { recipes?: CookbookRecipe[]; error?: string }) => {
        if (d.error) setError(d.error)
        else setRecipes(d.recipes ?? [])
      })
      .catch(() => setError('Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = recipes.filter(r => {
    if (catFilter && r.category !== catFilter) return false
    if (tagFilter && !r.tags.includes(tagFilter)) return false
    return true
  })

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    border: `1px solid ${active ? 'var(--pur)' : 'var(--border)'}`,
    background: active ? 'var(--pur)' : 'var(--card)',
    color: active ? '#fff' : 'var(--text)',
    cursor: 'pointer', fontFamily: 'var(--font-nunito)', whiteSpace: 'nowrap' as const,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCatFilter(c.value)} style={chipStyle(catFilter === c.value)}>
            {c.emoji ? `${c.emoji} ` : ''}{c.label}
          </button>
        ))}
      </div>

      {/* Tag filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {TAGS.map(t => (
          <button key={t.value} onClick={() => setTagFilter(t.value)} style={chipStyle(tagFilter === t.value)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontFamily: 'var(--font-nunito)', fontSize: 14 }}>
          Загружаю рецепты...
        </p>
      )}

      {!loading && error && (
        <div style={{ background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: 12, padding: 16, color: '#C0392B', fontSize: 13, fontFamily: 'var(--font-nunito)' }}>
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-nunito)' }}>
          <p style={{ fontSize: 36, margin: '0 0 12px' }}>📖</p>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            {catFilter || tagFilter ? 'Нет рецептов с такими фильтрами' : 'Рецепты скоро появятся'}
          </p>
        </div>
      )}

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {filtered.map(r => <RecipeCard key={r.id} recipe={r} />)}
      </div>
    </div>
  )
}
