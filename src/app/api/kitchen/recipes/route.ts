import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculatePortion, getMealTarget, selectRecipes } from '@/lib/recipeCalculator'

const VALID_CATEGORIES = ['завтрак', 'обед_ужин', 'салат', 'десерт', 'суп'] as const
type Category = (typeof VALID_CATEGORIES)[number]

// ── Словарь синонимов продуктов ──────────────────────────────────────────────
const PRODUCT_SYNONYMS: Record<string, string[]> = {
  // Говядина
  'говядина':         ['говядина', 'говяжий фарш', 'фарш говяжий', 'говяжье филе'],
  'говяжий фарш':     ['говядина', 'говяжий фарш', 'фарш говяжий'],
  'фарш говяжий':     ['говядина', 'говяжий фарш'],
  'говяжья вырезка':  ['говядина'],
  'стейк':            ['говядина'],

  // Курица
  'курица':           ['курица', 'куриная грудка', 'куриное бедро', 'куриный фарш', 'фарш куриный'],
  'куриная грудка':   ['курица', 'куриная грудка'],
  'куриная грудка без кожи': ['курица', 'куриная грудка'],
  'грудка куриная':   ['курица', 'куриная грудка'],
  'куриное бедро':    ['курица', 'куриное бедро'],
  'куриный фарш':     ['курица', 'куриный фарш', 'фарш куриный'],
  'фарш куриный':     ['курица', 'куриный фарш'],
  'курятина':         ['курица'],

  // Индейка
  'индейка':          ['индейка', 'фарш индейки'],
  'грудка индейки':   ['индейка'],
  'фарш индейки':     ['индейка'],

  // Свинина
  'свинина':          ['свинина', 'свиная шея', 'карбонат'],
  'свиная шея':       ['свинина'],
  'карбонат':         ['свинина'],
  'свиной фарш':      ['свинина'],

  // Рыба лососёвые
  'лосось':       ['лосось', 'семга', 'сёмга', 'форель', 'кета', 'кижуч', 'нерка', 'горбуша'],
  'семга':        ['лосось', 'семга', 'сёмга'],
  'сёмга':        ['лосось', 'семга', 'сёмга'],
  'форель':       ['форель', 'лосось'],
  'кета':         ['кета', 'лосось'],
  'кижуч':        ['кижуч', 'лосось'],
  'нерка':        ['нерка', 'лосось'],
  'горбуша':      ['горбуша'],
  'красная рыба': ['лосось', 'семга', 'сёмга', 'форель', 'кета'],

  // Белая рыба
  'минтай':   ['минтай'],
  'скумбрия': ['скумбрия'],
  'палтус':   ['палтус'],
  'треска':   ['минтай', 'треска'],
  'рыба':     ['минтай', 'горбуша', 'скумбрия', 'лосось', 'семга'],

  // Яйца
  'яйца': ['яйца', 'яйцо'],
  'яйцо': ['яйца', 'яйцо'],

  // Творог
  'творог':        ['творог'],
  'творожный сыр': ['творог'],

  // Субпродукты
  'куриная печень':   ['куриная печень'],
  'печень':           ['куриная печень', 'говяжья печень'],
  'говяжья печень':   ['говяжья печень'],
  'куриные сердца':   ['куриные сердца', 'сердечки'],
  'сердечки':         ['куриные сердца'],
  'куриные желудки':  ['куриные желудки'],
  'желудки':          ['куриные желудки'],
  'кролик':           ['кролик'],
}

function expandProducts(userProducts: string[]): string[] {
  const expanded = new Set<string>()
  for (const product of userProducts) {
    const lower = product.toLowerCase().trim()
    expanded.add(lower)
    if (PRODUCT_SYNONYMS[lower]) {
      PRODUCT_SYNONYMS[lower].forEach(s => expanded.add(s))
    }
    for (const [key, synonyms] of Object.entries(PRODUCT_SYNONYMS)) {
      if (lower.includes(key) || key.includes(lower)) {
        synonyms.forEach(s => expanded.add(s))
      }
    }
    expanded.add(lower.split(' ')[0])
  }
  return Array.from(expanded)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { category, meals_per_day, user_products } = body as {
      category: Category
      meals_per_day: 2 | 3
      user_products: string[]
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Неверная категория' }, { status: 400 })
    }
    if (meals_per_day !== 2 && meals_per_day !== 3) {
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

    // 3. Цель на приём
    const target = getMealTarget(
      { protein: member.kbju_protein, fat: member.kbju_fat, carbs: member.kbju_carbs },
      meals_per_day
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
        id, title, category, steps, tip_tags,
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
    const results = []
    for (const raw of fullRecipes) {
      try {
            results.push(calculatePortion(
          {
            id:          raw.id,
            title:       raw.title,
            category:    raw.category,
            steps:       raw.steps ?? [],
            ingredients: (raw.recipe_ingredients ?? []) as unknown as Parameters<typeof calculatePortion>[0]['ingredients'],
          },
          target,
          user_products ?? []
        ))
      } catch (e) {
        console.error(`Ошибка расчёта рецепта ${raw.id}:`, e)
      }
    }

    // 8. Совет по приготовлению
    const allTipTags = fullRecipes.flatMap(r => r.tip_tags ?? [])
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
