import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FavoritesClient from '@/components/FavoritesClient'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: recipes, count } = await supabase
    .from('saved_recipes')
    .select('id, title, description, meal_type, ingredients, steps, time_minutes, kbju_calories, kbju_protein, kbju_fat, kbju_carbs, created_at', { count: 'exact' })
    .eq('member_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Mobile header */}
      <header
        className="lg:hidden flex items-center px-4 py-4 sticky top-0 z-40"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <a href="/dashboard" className="mr-3 text-xl" style={{ color: 'var(--text)' }}>←</a>
        <h1 className="text-base font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          Избранные рецепты
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <div className="hidden lg:block mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
            Избранные рецепты ⭐
          </h1>
        </div>

        <FavoritesClient
          userId={user.id}
          initialRecipes={recipes ?? []}
          totalCount={count ?? 0}
          maxCount={50}
        />
      </div>
    </div>
  )
}
