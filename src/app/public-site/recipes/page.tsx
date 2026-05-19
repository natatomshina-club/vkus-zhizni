'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabasePublic } from '@/lib/supabase/public'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { RECIPES_CONFIG } from '@/lib/silo-config'

interface Recipe {
  id: string; slug: string; title: string; excerpt: string | null
  cover_image_url: string | null; published_at: string | null; category: string | null
}

const RECIPE_KEYS = Object.keys(RECIPES_CONFIG)

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createSupabasePublic()
    supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, cover_image_url, published_at, category')
      .eq('is_published', true)
      .in('category', RECIPE_KEYS)
      .order('published_at', { ascending: false })
      .limit(9)
      .then(({ data }) => {
        setRecipes((data ?? []) as Recipe[])
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ background: '#FFFAF5', minHeight: '100vh' }}>
      <PublicNav currentPage="/recipes" />

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg, #1A4E1A 0%, #2D7A3A 100%)', padding: '48px 5% 52px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Рецепты' }]} dark />
          <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(24px,4vw,40px)', fontWeight: 700, color: '#fff', margin: '12px 0 8px' }}>
            🍽️ Рецепты
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', margin: 0 }}>
            Вкусные рецепты для гормонального баланса — без сахара и быстрых углеводов
          </p>
        </div>
      </div>

      {/* CATEGORY CARDS */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 5% 0' }}>
        <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: '#2D7A3A', textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 20px' }}>
          Разделы рецептов
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 56 }}>
          {Object.entries(RECIPES_CONFIG).map(([key, cat]) => (
            <Link key={key} href={`/recipes/${key}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 8, transition: '0.2s' }}>
                <span style={{ fontSize: 32 }}>{cat.emoji}</span>
                <p style={{ fontFamily: 'var(--font-unbounded)', fontSize: 13, fontWeight: 700, color: '#1A3A1A', margin: 0 }}>{cat.label}</p>
                <p style={{ fontSize: 12, color: '#2D7A3A', margin: 0 }}>Смотреть →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* POPULAR RECIPES */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 5% 64px' }}>
        <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#1A3A1A', margin: '0 0 28px' }}>
          Популярные рецепты
        </h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#5A7A5A' }}>Загрузка...</div>
        ) : recipes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍳</div>
            <p style={{ color: '#5A7A5A', fontSize: 16 }}>Рецепты скоро появятся</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 24 }}>
            {recipes.map(recipe => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.category ?? 'other'}/${recipe.slug}`}
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
              >
                <article style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1.5px solid #C8E6C9', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {recipe.cover_image_url ? (
                    <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={recipe.cover_image_url} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ aspectRatio: '4/3', background: '#E8F5E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                      {recipe.category ? RECIPES_CONFIG[recipe.category as keyof typeof RECIPES_CONFIG]?.emoji ?? '🍽️' : '🍽️'}
                    </div>
                  )}
                  <div style={{ padding: '16px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {recipe.category && RECIPES_CONFIG[recipe.category as keyof typeof RECIPES_CONFIG] && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#2D7A3A', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6, display: 'block' }}>
                        {RECIPES_CONFIG[recipe.category as keyof typeof RECIPES_CONFIG].label}
                      </span>
                    )}
                    <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: '#1A3A1A', margin: '0 0 8px', lineHeight: 1.4 }}>
                      {recipe.title}
                    </h2>
                    {recipe.excerpt && <p style={{ fontSize: 13, color: '#5A7A5A', margin: 0, lineHeight: 1.6, flex: 1 }}>{recipe.excerpt}</p>}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  )
}
