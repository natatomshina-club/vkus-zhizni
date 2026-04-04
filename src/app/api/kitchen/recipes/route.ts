import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculatePortion, getMealTarget, selectRecipes } from '@/lib/recipeCalculator'
import { expandProducts } from '@/lib/productUtils'

const VALID_CATEGORIES = ['завтрак', 'обед_ужин', 'салат', 'десерт', 'суп'] as const
type Category = (typeof VALID_CATEGORIES)[number]

const FIXED_CATEGORIES = ['салат', 'суп', 'десерт'] as const

interface RecipeResult {
  recipe_id: string | number
  title: string
  category: string
  steps: string[]
  tip_tags: string[]
  ingredients: Array<{
    name: string
    grams: number
    calories: number
    protein: number
    fat: number
    carbs: number
  }>
  extra_products: string[]
  total: { calories: number; protein: number; fat: number; carbs: number }
  macros_ok: { protein: boolean; fat: boolean }
  requires_macro_calculation: boolean
  servings: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { category, meals_per_day, user_products } = body as {
      category: Category
      meals_per_day?: 2 | 3
      user_products: string[]
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Неверная категория' }, { status: 400 })
    }

    const isFixed = (FIXED_CATEGORIES as readonly string[]).includes(category)

    if (!isFixed && meals_per_day !== 2 && meals_per_day !== 3) {
      return NextResponse.json({ error: 'meals_per_day должен быть 2 или 3' }, { status: 400 })
    }

    // 1. Профиль + счётчик запросов
    const { data: member } = await supabase
      .from('members')
      .select('kbju_protein, kbju_fat, kbju_carbs, kbju_calories, kitchen_requests_today, kitchen_date, status')
      .eq('id', user.id)
      .single()

    if (!member?.kbju_protein) {
      return NextResponse.json(
        { error: 'no_kbju', message: 'Заполни профиль — нужен расчёт КБЖУ' },
        { status: 400 }
      )
    }

    // 2. Лимит с дневным сбросом
    const today = new Date().toISOString().split('T')[0]
    const isTrial = member.status === 'trial' || !member.status
    const limit = isTrial ? 3 : 10
    const requestsToday = member.kitchen_date === today ? (member.kitchen_requests_today ?? 0) : 0

    if (requestsToday >= limit) {
      return NextResponse.json({ error: 'limit_reached', limit }, { status: 429 })
    }

    // 3. Цель на приём (только для завтрак/обед_ужин)
    const target = isFixed ? null : getMealTarget(
      { protein: member.kbju_protein, fat: member.kbju_fat, carbs: member.kbju_carbs },
      meals_per_day!
    )

    // 4. Все рецепты категории
    const { data: allRecipes } = await supabase
      .from('recipes')
      .select('id, title, category, tags, tip_tags')
      .eq('category', category)
      .eq('is_active', true)

    if (!allRecipes || allRecipes.length === 0) {
      await supabase.from('members')
        .update({ kitchen_requests_today: requestsToday + 1, kitchen_date: today })
        .eq('id', user.id)
      return NextResponse.json({ recipes: [], tip: null, requests_left: limit - requestsToday - 1, empty: true })
    }

    // 5. Выбираем 3 рецепта по тегам (с расширением синонимов)
    const expandedProducts = expandProducts(user_products ?? [])
    const recipeIds = selectRecipes(allRecipes, expandedProducts, category, [], 3)

    if (recipeIds.length === 0) {
      await supabase.from('members')
        .update({ kitchen_requests_today: requestsToday + 1, kitchen_date: today })
        .eq('id', user.id)
      return NextResponse.json({ recipes: [], tip: null, requests_left: limit - requestsToday - 1, empty: true })
    }

    // 6. Полные данные рецептов с ингредиентами
    const { data: fullRecipes, error: fullErr } = await supabase
      .from('recipes')
      .select(`
        id, title, category, steps, tip_tags, servings,
        recipe_ingredients (
          nutrition_id, ingredient_name, role, base_grams, is_always_available,
          nutrition ( id, name, calories, protein, fat, carbs )
        )
      `)
      .in('id', recipeIds)

    if (fullErr || !fullRecipes) {
      console.error('Full recipes error:', fullErr)
      return NextResponse.json({ error: 'Ошибка загрузки рецептов' }, { status: 500 })
    }

    // 7. Пересчёт порций
    const results: RecipeResult[] = []
    for (const raw of fullRecipes) {
      try {
        const recipeServings = (raw.servings as number | null) ?? 1
        const tipTags = (raw.tip_tags as string[] | null) ?? []

        if (isFixed) {
          // Считаем КБЖУ напрямую по base_grams / servings
          const ings: RecipeResult['ingredients'] = []
          let totCal = 0, totProt = 0, totFat = 0, totCarb = 0

          type RawIng = {
            ingredient_name: string
            role: string
            base_grams: number
            nutrition: { calories: number; protein: number; fat: number; carbs: number } | { calories: number; protein: number; fat: number; carbs: number }[] | null
          }
          for (const ing of (raw.recipe_ingredients as unknown as RawIng[]) ?? []) {
            if (ing.role === 'spice') continue
            const n = Array.isArray(ing.nutrition) ? (ing.nutrition[0] ?? null) : ing.nutrition
            if (!n) continue
            const ratio = ing.base_grams / 100
            totCal  += ratio * n.calories
            totProt += ratio * n.protein
            totFat  += ratio * n.fat
            totCarb += ratio * n.carbs
            ings.push({
              name:     ing.ingredient_name,
              grams:    ing.base_grams,
              calories: Math.round(ratio * n.calories),
              protein:  Math.round(ratio * n.protein * 10) / 10,
              fat:      Math.round(ratio * n.fat * 10) / 10,
              carbs:    Math.round(ratio * n.carbs * 10) / 10,
            })
          }

          results.push({
            recipe_id:                raw.id as string | number,
            title:                    raw.title as string,
            category:                 raw.category as string,
            steps:                    (raw.steps as string[] | null) ?? [],
            tip_tags:                 tipTags,
            ingredients:              ings,
            extra_products:           [],
            total: {
              calories: Math.round(totCal  / recipeServings),
              protein:  Math.round((totProt / recipeServings) * 10) / 10,
              fat:      Math.round((totFat  / recipeServings) * 10) / 10,
              carbs:    Math.round((totCarb / recipeServings) * 10) / 10,
            },
            macros_ok:                { protein: false, fat: false },
            requires_macro_calculation: false,
            servings:                 recipeServings,
          })
        } else {
          const portion = calculatePortion(
            {
              id:          raw.id,
              title:       raw.title,
              category:    raw.category,
              steps:       raw.steps ?? [],
              ingredients: (raw.recipe_ingredients ?? []) as unknown as Parameters<typeof calculatePortion>[0]['ingredients'],
            },
            target!,
            user_products ?? []
          )
          results.push({
            ...portion,
            tip_tags:                 tipTags,
            requires_macro_calculation: true,
            servings:                 recipeServings,
          } as RecipeResult)
        }
      } catch (e) {
        console.error(`Ошибка расчёта рецепта ${raw.id}:`, e)
      }
    }

    // 8. Совет по приготовлению
    const allTipTags = fullRecipes.flatMap(r => (r.tip_tags as string[] | null) ?? [])
    let tip: string | null = null
    if (allTipTags.length > 0) {
      const { data: tipData } = await supabase
        .from('cooking_tips')
        .select('tip_short')
        .in('tag', allTipTags)
        .eq('is_active', true)
        .limit(1)
        .single()
      tip = tipData?.tip_short ?? null
    }

    // 9. Инкремент счётчика
    await supabase.from('members')
      .update({ kitchen_requests_today: requestsToday + 1, kitchen_date: today })
      .eq('id', user.id)

    return NextResponse.json({
      recipes: results,
      tip,
      requests_left: limit - requestsToday - 1,
    })

  } catch (err) {
    console.error('Kitchen recipes error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
