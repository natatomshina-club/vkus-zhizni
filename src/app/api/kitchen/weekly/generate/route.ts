import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { calculatePortion, getMealTarget, selectRecipes, type MealTargetMacros } from '@/lib/recipeCalculator'
import { expandProducts } from '@/lib/productUtils'

const DAY_NAMES = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье']

// ── Типы ────────────────────────────────────────────────────────────────────
interface PlanIngredient {
  name: string
  grams: number
  calories: number
  protein: number
  fat: number
  carbs: number
  is_user_product: boolean
}

interface PlanMeal {
  meal_type: 'завтрак' | 'обед' | 'ужин' | 'суп' | 'салат'
  recipe_id: number | string
  title: string
  steps: string[]
  ingredients: PlanIngredient[]
  total: { calories: number; protein: number; fat: number; carbs: number }
  requires_shopping: string[]
  servings: number
  portions_to_cook: number
  is_repeat?: boolean
  repeat_from_day?: number
  repeat_meal_type?: string
}

interface PlanDessert {
  recipe_id: number
  title: string
  steps: string[]
  ingredients: PlanIngredient[]
  total: { calories: number; protein: number; fat: number; carbs: number }
  servings: number
}

interface PlanDay {
  day_number: number
  day_name: string
  cook_group: number
  is_cook_day: boolean
  cook_group_days: string
  meals: PlanMeal[]
  day_total: { calories: number; protein: number; fat: number; carbs: number }
}

type RawIng = {
  ingredient_name: string
  role: string
  base_grams: number
  is_always_available: boolean
  nutrition:
    | { calories: number; protein: number; fat: number; carbs: number }
    | { calories: number; protein: number; fat: number; carbs: number }[]
    | null
}

// ── fetchFullRecipe ──────────────────────────────────────────────────────────
async function fetchFullRecipe(supabase: ReturnType<typeof createServiceClient>, id: number) {
  const { data } = await supabase
    .from('recipes')
    .select(`
      id, title, category, steps, servings,
      recipe_ingredients (
        nutrition_id, ingredient_name, role, base_grams, is_always_available,
        nutrition ( id, name, calories, protein, fat, carbs )
      )
    `)
    .eq('id', id)
    .single()
  return data
}

// ── calcBaseKbju — суммировать КБЖУ из base_grams ───────────────────────────
function calcBaseKbju(
  rawIngs: RawIng[],
  expandedProducts: string[]
): { ings: PlanIngredient[]; totCal: number; totProt: number; totFat: number; totCarb: number } {
  const userLower = expandedProducts.map(p => p.toLowerCase())
  const ings: PlanIngredient[] = []
  let totCal = 0, totProt = 0, totFat = 0, totCarb = 0

  for (const ing of rawIngs) {
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
      is_user_product: userLower.some(u =>
        u.includes(ing.ingredient_name.toLowerCase()) ||
        ing.ingredient_name.toLowerCase().includes(u)
      ),
    })
  }
  return { ings, totCal, totProt, totFat, totCarb }
}

// ── buildBaseKbjuMeal — построить PlanMeal из base_grams (суп, салат) ────────
function buildBaseKbjuMeal(
  raw: Awaited<ReturnType<typeof fetchFullRecipe>>,
  expandedProducts: string[],
  mealType: 'суп' | 'салат'
): PlanMeal | null {
  if (!raw) return null
  const rawIngs = (raw.recipe_ingredients as unknown as RawIng[]) ?? []
  const { ings, totCal, totProt, totFat, totCarb } = calcBaseKbju(rawIngs, expandedProducts)
  const servings = Math.max(1, (raw.servings as number | null) ?? 1)

  const portionKbju = {
    calories: Math.round(totCal  / servings),
    protein:  Math.round(totProt / servings * 10) / 10,
    fat:      Math.round(totFat  / servings * 10) / 10,
    carbs:    Math.round(totCarb / servings * 10) / 10,
  }
  const requires_shopping = ings
    .filter(i => !i.is_user_product)
    .map(i => `${i.name} — ${i.grams}г`)

  return {
    meal_type: mealType,
    recipe_id: raw.id as number,
    title: raw.title as string,
    steps: (raw.steps as string[] | null) ?? [],
    ingredients: ings,
    total: portionKbju,
    requires_shopping,
    servings,
    portions_to_cook: 1,
  }
}

// ── buildMeal — построить PlanMeal из calculatePortion ──────────────────────
function buildMeal(
  portionResult: ReturnType<typeof calculatePortion>,
  mealType: 'завтрак' | 'обед' | 'ужин',
  expandedProducts: string[],
  portionsToCook: number
): PlanMeal {
  const userLower = expandedProducts.map(p => p.toLowerCase())
  const ingredients: PlanIngredient[] = portionResult.ingredients.map(ing => ({
    ...ing,
    grams:    ing.grams    * portionsToCook,
    calories: Math.round(ing.calories * portionsToCook),
    protein:  Math.round(ing.protein  * portionsToCook * 10) / 10,
    fat:      Math.round(ing.fat      * portionsToCook * 10) / 10,
    carbs:    Math.round(ing.carbs    * portionsToCook * 10) / 10,
    is_user_product: userLower.some(u =>
      u.includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(u)
    ),
  }))

  return {
    meal_type: mealType,
    recipe_id: portionResult.recipe_id,
    title: portionResult.title,
    steps: portionResult.steps,
    ingredients,
    total: {
      calories: Math.round(portionResult.total.calories),
      protein:  Math.round(portionResult.total.protein * 10) / 10,
      fat:      Math.round(portionResult.total.fat     * 10) / 10,
      carbs:    Math.round(portionResult.total.carbs   * 10) / 10,
    },
    requires_shopping: portionResult.extra_products,
    servings: 1,
    portions_to_cook: portionsToCook,
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { meals_per_day, include_soups, include_salads, cook_mode, user_products } = body as {
      meals_per_day: 2 | 3
      include_soups: boolean
      include_salads: boolean
      cook_mode: 'daily' | 'every2days'
      user_products: string[]
    }

    if (![2, 3].includes(meals_per_day)) {
      return NextResponse.json({ error: 'meals_per_day должен быть 2 или 3' }, { status: 400 })
    }

    // week_start = ближайший понедельник
    const today = new Date()
    const dow = today.getDay()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() + (dow === 1 ? 0 : dow === 0 ? 1 : 8 - dow))
    const weekStartStr = weekStart.toISOString().split('T')[0]

    console.log(`[weekly/generate] user=${user.id} meals=${meals_per_day} cook=${cook_mode} soups=${include_soups} salads=${include_salads}`)

    // ── 1. Member ────────────────────────────────────────────────────────────
    const { data: member, error: memberErr } = await supabase
      .from('members')
      .select('kbju_protein, kbju_fat, kbju_carbs, kbju_calories, full_name, status')
      .eq('id', user.id)
      .single()

    if (memberErr) console.error('[weekly/generate] member error:', memberErr.message)
    if (!member?.kbju_protein) {
      return NextResponse.json({ error: 'no_kbju', message: 'Заполни профиль — нужен расчёт КБЖУ' }, { status: 400 })
    }
    console.log(`[weekly/generate] kbju: cal=${member.kbju_calories} P=${member.kbju_protein} F=${member.kbju_fat} C=${member.kbju_carbs}`)

    const isTrial = member.status === 'trial' || !member.status
    const memberMacros = { protein: member.kbju_protein, fat: member.kbju_fat, carbs: member.kbju_carbs }

    // ── 2. Лимит ─────────────────────────────────────────────────────────────
    const { data: latestPlan, error: planErr } = await supabase
      .from('weekly_plans')
      .select('id, created_at')
      .eq('member_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (planErr) console.error('[weekly/generate] plan check error:', planErr.message)

    if (latestPlan) {
      if (isTrial) {
        return NextResponse.json({ error: 'trial_limit', message: 'В триале доступен 1 рацион' }, { status: 429 })
      }
      const ago7d = Date.now() - 7 * 24 * 60 * 60 * 1000
      if (new Date(latestPlan.created_at).getTime() > ago7d) {
        const next = new Date(new Date(latestPlan.created_at).getTime() + 7 * 24 * 60 * 60 * 1000)
        return NextResponse.json({ error: 'cooldown', next_available: next.toISOString() }, { status: 429 })
      }
    }

    const svc = createServiceClient()
    const expandedProducts = expandProducts(user_products ?? [])

    // ── 3. Загрузить рецепты ──────────────────────────────────────────────────
    const [
      { data: bfRecipes,      error: bfErr },
      { data: mainRecipes,    error: mainErr },
      { data: soupRecipes,    error: soupErr },
      { data: saladWithIngs,  error: saladErr },
      { data: dessertRecipes, error: dessertErr },
    ] = await Promise.all([
      svc.from('recipes').select('id, title, category, tags').eq('category', 'завтрак').eq('is_active', true),
      svc.from('recipes').select('id, title, category, tags').eq('category', 'обед_ужин').eq('is_active', true),
      include_soups
        ? svc.from('recipes').select('id, title, category, tags').eq('category', 'суп').eq('is_active', true)
        : Promise.resolve({ data: [] as { id: number; title: string; category: string; tags: string[] }[], error: null }),
      include_salads
        ? svc.from('recipes').select('id, title, category, tags, recipe_ingredients(role)').eq('category', 'салат').eq('is_active', true)
        : Promise.resolve({ data: [] as { id: number; title: string; category: string; tags: string[]; recipe_ingredients: { role: string }[] }[], error: null }),
      svc.from('recipes').select('id, title, category, tags').eq('category', 'десерт').eq('is_active', true),
    ])

    if (bfErr)      console.error('[weekly/generate] bfErr:', bfErr.message)
    if (mainErr)    console.error('[weekly/generate] mainErr:', mainErr.message)
    if (soupErr)    console.error('[weekly/generate] soupErr:', soupErr?.message)
    if (saladErr)   console.error('[weekly/generate] saladErr:', saladErr?.message)
    if (dessertErr) console.error('[weekly/generate] dessertErr:', dessertErr?.message)

    // Только овощные салаты (без ингредиентов с role='protein')
    const saladCandidates = (saladWithIngs ?? [])
      .filter(r => {
        const ings = (r.recipe_ingredients as { role: string }[]) ?? []
        return !ings.some(i => i.role === 'protein')
      })
      .map(r => ({ id: r.id as number, title: r.title as string, category: r.category as string, tags: (r.tags as string[]) ?? [] }))

    console.log(`[weekly/generate] recipes: завтрак=${bfRecipes?.length ?? 0} обед=${mainRecipes?.length ?? 0} суп=${soupRecipes?.length ?? 0} салат=${saladCandidates.length} десерт=${dessertRecipes?.length ?? 0}`)

    // ── 4. Один суп на неделю ─────────────────────────────────────────────────
    let soupMeal: PlanMeal | null = null
    let soupMacros: MealTargetMacros = { protein: 0, fat: 0, carbs: 0 }

    if (include_soups && soupRecipes && soupRecipes.length > 0) {
      const [soupId] = selectRecipes(soupRecipes, expandedProducts, 'суп', [], 1)
      if (soupId) {
        const raw = await fetchFullRecipe(svc, soupId)
        soupMeal = buildBaseKbjuMeal(raw, expandedProducts, 'суп')
        if (soupMeal) {
          soupMacros = { protein: soupMeal.total.protein, fat: soupMeal.total.fat, carbs: soupMeal.total.carbs }
          console.log(`[weekly/generate] суп: "${soupMeal.title}" servings=${soupMeal.servings} cal=${soupMeal.total.calories}`)
        }
      }
    }

    // ── 5. Группы дней ────────────────────────────────────────────────────────
    type DayGroup = { groupNum: number; days: number[]; groupLabel: string }

    const dayGroups: DayGroup[] = cook_mode === 'every2days'
      ? [
          { groupNum: 1, days: [1, 2], groupLabel: 'Понедельник + Вторник' },
          { groupNum: 2, days: [3, 4], groupLabel: 'Среда + Четверг' },
          { groupNum: 3, days: [5, 6], groupLabel: 'Пятница + Суббота' },
          { groupNum: 4, days: [7],    groupLabel: 'Воскресенье' },
        ]
      : Array.from({ length: 7 }, (_, i) => ({
          groupNum: i + 1,
          days: [i + 1],
          groupLabel: DAY_NAMES[i],
        }))

    // ── 6. Пре-выбрать салаты для каждой группы ───────────────────────────────
    // Суп — только дни 1-2; салат — остальные дни (или все, если без супа)
    type GroupSaladInfo = { groupNum: number; saladId: number }
    const saladSelections: GroupSaladInfo[] = []
    const usedSaladIds: number[] = []

    if (include_salads && saladCandidates.length > 0) {
      for (const group of dayGroups) {
        const isSoupGroup = include_soups && group.days.some(d => d <= 2)
        if (!isSoupGroup) {
          const [saladId] = selectRecipes(saladCandidates, expandedProducts, 'салат', usedSaladIds, 1)
          if (saladId) {
            usedSaladIds.push(saladId)
            saladSelections.push({ groupNum: group.groupNum, saladId })
          }
        }
      }
    }

    // Параллельная загрузка уникальных салатов
    const uniqueSaladIds = [...new Set(saladSelections.map(s => s.saladId))]
    const saladRaws = await Promise.all(uniqueSaladIds.map(id => fetchFullRecipe(svc, id)))
    const saladRawById = new Map(uniqueSaladIds.map((id, i) => [id, saladRaws[i]]))

    const saladByGroup = new Map<number, PlanMeal>()
    for (const { groupNum, saladId } of saladSelections) {
      const raw = saladRawById.get(saladId)
      if (raw) {
        const meal = buildBaseKbjuMeal(raw, expandedProducts, 'салат')
        if (meal) saladByGroup.set(groupNum, meal)
      }
    }

    console.log(`[weekly/generate] салаты: ${saladSelections.map(s => s.saladId).join(', ')}`)

    // ── 7. Основной цикл — строим план ────────────────────────────────────────
    const allDays: PlanDay[] = []
    const usedBfIds: number[] = []
    const usedMainIds: number[] = []

    // tryBuildMeal — перебрать кандидатов, вернуть первый рабочий
    async function tryBuildMeal(
      candidateIds: number[],
      mealType: 'завтрак' | 'обед' | 'ужин',
      portionsToCook: number,
      target: MealTargetMacros
    ): Promise<PlanMeal | null> {
      for (const id of candidateIds) {
        const raw = await fetchFullRecipe(svc, id)
        if (!raw) continue
        try {
          const portion = calculatePortion(
            {
              id:          raw.id as number,
              title:       raw.title as string,
              category:    raw.category as string,
              steps:       (raw.steps as string[]) ?? [],
              ingredients: raw.recipe_ingredients as unknown as Parameters<typeof calculatePortion>[0]['ingredients'],
            },
            target,
            user_products ?? []
          )
          if (!portion) continue
          return buildMeal(portion, mealType, expandedProducts, portionsToCook)
        } catch (e) {
          console.error(`[weekly/generate] calculatePortion id=${id} (${mealType}):`, (e as Error).message)
        }
      }
      console.warn(`[weekly/generate] нет рецепта для слота: ${mealType}`)
      return null
    }

    for (const group of dayGroups) {
      const portionsToCook = group.days.length  // 1 (daily) или 2 (every2days)
      const isSoupGroup = include_soups && group.days.some(d => d <= 2)
      const saladMeal = saladByGroup.get(group.groupNum) ?? null

      // ── Рассчитать mealTarget для этой группы ──
      let groupTarget: MealTargetMacros

      if (isSoupGroup && meals_per_day === 2) {
        // Суп — дополнительный, вычесть из суточного
        groupTarget = getMealTarget({
          protein: Math.max(5, memberMacros.protein - soupMacros.protein),
          fat:     Math.max(5, memberMacros.fat     - soupMacros.fat),
          carbs:   Math.max(5, memberMacros.carbs   - soupMacros.carbs),
        }, 2)
      } else if (isSoupGroup && meals_per_day === 3) {
        // Суп заменяет обед — цель на приём = суточное / 3 (без вычета)
        groupTarget = getMealTarget(memberMacros, 3)
      } else if (saladMeal) {
        // Салат — дополнительный, вычесть из суточного
        groupTarget = getMealTarget({
          protein: Math.max(5, memberMacros.protein - saladMeal.total.protein),
          fat:     Math.max(5, memberMacros.fat     - saladMeal.total.fat),
          carbs:   Math.max(5, memberMacros.carbs   - saladMeal.total.carbs),
        }, meals_per_day as 2 | 3)
      } else {
        // Базовый день
        groupTarget = getMealTarget(memberMacros, meals_per_day as 2 | 3)
      }

      // ── Выбрать кандидатов и построить основные блюда ──
      const bfCands  = selectRecipes(bfRecipes ?? [],   expandedProducts, 'завтрак',   usedBfIds,   5)
      const mainCands = selectRecipes(mainRecipes ?? [], expandedProducts, 'обед_ужин', usedMainIds, meals_per_day === 3 ? 6 : 5)

      if (bfCands[0])   usedBfIds.push(bfCands[0])
      if (mainCands[0]) usedMainIds.push(mainCands[0])
      if (meals_per_day === 3 && mainCands[1]) usedMainIds.push(mainCands[1])

      const bfPool   = bfCands.length   > 0 ? bfCands   : usedBfIds.slice(0, 3)
      const mainPool = mainCands.length > 0 ? mainCands : usedMainIds.slice(0, 5)

      // Для дня с супом (3-разовое) суп заменяет обед → нужны завтрак + ужин
      const bfMeal = await tryBuildMeal(bfPool, 'завтрак', portionsToCook, groupTarget)

      let lunch: PlanMeal | null = null
      let dinner: PlanMeal | null = null

      if (isSoupGroup && meals_per_day === 3) {
        // Суп = обед; строим только ужин
        dinner = await tryBuildMeal(mainPool, 'ужин', portionsToCook, groupTarget)
      } else if (meals_per_day === 3) {
        lunch  = await tryBuildMeal(mainPool,             'обед', portionsToCook, groupTarget)
        dinner = await tryBuildMeal(mainPool.slice(1).concat(mainPool), 'ужин', portionsToCook, groupTarget)
          ?? (lunch ? { ...lunch, meal_type: 'ужин' as const } : null)
      } else {
        // 2-разовое
        lunch = await tryBuildMeal(mainPool, 'обед', portionsToCook, groupTarget)
      }

      // ── Собрать дни группы ──
      for (let di = 0; di < group.days.length; di++) {
        const dayNum = group.days[di]
        const isCookDay = di === 0
        const meals: PlanMeal[] = []

        // Основные приёмы
        if (isCookDay) {
          if (bfMeal)  meals.push(bfMeal)
          if (lunch)   meals.push(lunch)
          if (dinner)  meals.push(dinner)
        } else {
          // Повторный день (только в every2days)
          const repeatOf = group.days[0]
          if (bfMeal)  meals.push({ ...bfMeal,  ingredients: [], steps: [], portions_to_cook: 1, is_repeat: true, repeat_from_day: repeatOf, repeat_meal_type: 'завтрак' })
          if (lunch)   meals.push({ ...lunch,   ingredients: [], steps: [], portions_to_cook: 1, is_repeat: true, repeat_from_day: repeatOf, repeat_meal_type: 'обед' })
          if (dinner)  meals.push({ ...dinner,  ingredients: [], steps: [], portions_to_cook: 1, is_repeat: true, repeat_from_day: repeatOf, repeat_meal_type: 'ужин' })
        }

        // Суп — независимо от cook/repeat:
        //   день 1 → варим (полные ингредиенты)
        //   день 2 → ♻️ из кастрюли
        //   дни 3-7 → без супа
        if (soupMeal) {
          if (dayNum === 1) {
            meals.push(soupMeal)
          } else if (dayNum === 2) {
            meals.push({
              ...soupMeal,
              ingredients: [],
              steps: [],
              is_repeat: true,
              repeat_from_day: 1,
              repeat_meal_type: 'суп',
            })
          }
        }

        // Салат — ВСЕГДА свежий (никогда не is_repeat)
        if (saladMeal) {
          meals.push({ ...saladMeal, portions_to_cook: 1 })
        }

        // Итог дня — суммируем КБЖУ ВСЕХ приёмов (завтрак + обед + ужин + суп + салат)
        const dayTotal = meals.reduce((acc, m) => {
          // Для повторных блюд берём оригинал
          const t = m.is_repeat
            ? (m.repeat_meal_type === 'завтрак' ? bfMeal?.total
              : m.repeat_meal_type === 'ужин'   ? dinner?.total
              : m.repeat_meal_type === 'суп'    ? soupMeal?.total
              : lunch?.total) ?? m.total
            : m.total
          return {
            calories: acc.calories + t.calories,
            protein:  acc.protein  + t.protein,
            fat:      acc.fat      + t.fat,
            carbs:    acc.carbs    + t.carbs,
          }
        }, { calories: 0, protein: 0, fat: 0, carbs: 0 })

        console.log(
          `[weekly/generate] день ${dayNum}: блюд=${meals.length}` +
          ` cal=${Math.round(dayTotal.calories)}/${member.kbju_calories}` +
          ` carbs=${Math.round(dayTotal.carbs)}/${member.kbju_carbs}` +
          ` (${meals.map(m => m.meal_type + (m.is_repeat ? '♻️' : '')).join('+')})`
        )

        allDays.push({
          day_number: dayNum,
          day_name: DAY_NAMES[dayNum - 1],
          cook_group: group.groupNum,
          is_cook_day: isCookDay,
          cook_group_days: group.groupLabel,
          meals,
          day_total: {
            calories: Math.round(dayTotal.calories),
            protein:  Math.round(dayTotal.protein  * 10) / 10,
            fat:      Math.round(dayTotal.fat      * 10) / 10,
            carbs:    Math.round(dayTotal.carbs    * 10) / 10,
          },
        })
      }
    }

    // ── 8. Десерты ────────────────────────────────────────────────────────────
    const bonus_desserts: PlanDessert[] = []
    if (dessertRecipes && dessertRecipes.length > 0) {
      const dessertIds = selectRecipes(dessertRecipes, expandedProducts, 'десерт', [], 3)
      const dessertRaws = await Promise.all(dessertIds.map(id => fetchFullRecipe(svc, id)))
      for (const raw of dessertRaws) {
        if (!raw) continue
        const rawIngs = (raw.recipe_ingredients as unknown as RawIng[]) ?? []
        const { ings, totCal, totProt, totFat, totCarb } = calcBaseKbju(rawIngs, expandedProducts)
        const servings = Math.max(1, (raw.servings as number | null) ?? 1)
        bonus_desserts.push({
          recipe_id: raw.id as number,
          title: raw.title as string,
          steps: (raw.steps as string[] | null) ?? [],
          ingredients: ings,
          total: {
            calories: Math.round(totCal  / servings),
            protein:  Math.round(totProt / servings * 10) / 10,
            fat:      Math.round(totFat  / servings * 10) / 10,
            carbs:    Math.round(totCarb / servings * 10) / 10,
          },
          servings,
        })
      }
      console.log(`[weekly/generate] десерты: ${bonus_desserts.map(d => d.title).join(', ')}`)
    }

    // ── 9. Summary ────────────────────────────────────────────────────────────
    const summary = {
      avg_calories: Math.round(allDays.reduce((s, d) => s + d.day_total.calories, 0) / 7),
      avg_protein:  Math.round(allDays.reduce((s, d) => s + d.day_total.protein,  0) / 7 * 10) / 10,
      avg_fat:      Math.round(allDays.reduce((s, d) => s + d.day_total.fat,      0) / 7 * 10) / 10,
      avg_carbs:    Math.round(allDays.reduce((s, d) => s + d.day_total.carbs,    0) / 7 * 10) / 10,
    }

    const plan_json = { days: allDays, summary, bonus_desserts }

    // ── 10. Список продуктов ──────────────────────────────────────────────────
    // Салаты никогда не is_repeat → считаются для каждого дня когда присутствуют
    const ingMap = new Map<string, { name: string; grams: number; is_user: boolean }>()

    const addIngredients = (ingredients: PlanIngredient[]) => {
      for (const ing of ingredients) {
        const key = ing.name.toLowerCase()
        const ex = ingMap.get(key)
        if (ex) ex.grams += ing.grams
        else ingMap.set(key, { name: ing.name, grams: ing.grams, is_user: ing.is_user_product })
      }
    }

    for (const day of allDays) {
      for (const meal of day.meals) {
        if (meal.is_repeat) continue
        addIngredients(meal.ingredients)
      }
    }
    for (const dessert of bonus_desserts) {
      addIngredients(dessert.ingredients)
    }

    const have: { name: string; total_grams: number }[] = []
    const buy:  { name: string; total_grams: number }[] = []
    for (const item of ingMap.values()) {
      const entry = { name: item.name, total_grams: Math.round(item.grams) }
      if (item.is_user) have.push(entry)
      else              buy.push(entry)
    }

    console.log(`[weekly/generate] plan done: days=${allDays.length} avg_cal=${summary.avg_calories} desserts=${bonus_desserts.length}`)

    // ── 11. Сохранить ─────────────────────────────────────────────────────────
    const insertPayload = {
      member_id:          user.id,
      week_start:         weekStartStr,
      meals_per_day,
      include_soups,
      cook_mode,
      plan_json,
      shopping_list_json: { have, buy },
      user_products:      user_products ?? [],
      member_name:        member.full_name ?? '',
      kbju_calories:      member.kbju_calories,
      kbju_protein:       member.kbju_protein,
      kbju_fat:           member.kbju_fat,
      kbju_carbs:         member.kbju_carbs,
    }

    const { data: saved, error: saveErr } = await svc
      .from('weekly_plans')
      .insert(insertPayload)
      .select('id')
      .single()

    if (saveErr) {
      console.error('[weekly/generate] INSERT error:', saveErr.code, saveErr.message)
      return NextResponse.json({ error: 'Ошибка сохранения рациона', detail: saveErr.message }, { status: 500 })
    }

    console.log('[weekly/generate] saved id:', saved.id)
    return NextResponse.json({ plan_id: saved.id })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[weekly/generate] unhandled error:', msg)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера', detail: msg }, { status: 500 })
  }
}
