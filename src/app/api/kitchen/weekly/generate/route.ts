import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { calculatePortion, getMealTarget, selectRecipes, type MealTargetMacros } from '@/lib/recipeCalculator'
import { expandProducts, filterVeggies } from '@/lib/productUtils'
import { classifyProteins, buildProteinSchedule } from '@/lib/weeklyPlanHelper'

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
  meal_type: 'завтрак' | 'обед' | 'ужин' | 'салат' | 'салат_белковый'
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
        nutrition_id, ingredient_name, role, base_grams, is_always_available, is_scalable_veggie,
        nutrition ( id, name, calories, protein, fat, carbs )
      )
    `)
    .eq('id', id)
    .single()
  return data
}

// ── calcBaseKbju ─────────────────────────────────────────────────────────────
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

// ── buildBaseKbjuMeal ─────────────────────────────────────────────────────────
function buildBaseKbjuMeal(
  raw: Awaited<ReturnType<typeof fetchFullRecipe>>,
  expandedProducts: string[],
  mealType: 'салат'
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

// ── buildMeal ─────────────────────────────────────────────────────────────────
function buildMeal(
  portionResult: ReturnType<typeof calculatePortion>,
  mealType: 'завтрак' | 'обед' | 'ужин' | 'салат_белковый',
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

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { meals_per_day, include_salads, user_products } = body as {
      meals_per_day:   2 | 3
      include_salads:  boolean
      user_products:   string[]
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

    console.log(`[weekly/generate] user=${user.id} meals=${meals_per_day} salads=${include_salads}`)

    // ── 1. Member ─────────────────────────────────────────────────────────────
    const { data: member, error: memberErr } = await supabase
      .from('members')
      .select('kbju_protein, kbju_fat, kbju_carbs, kbju_calories, full_name, subscription_status')
      .eq('id', user.id)
      .single()

    if (memberErr) console.error('[weekly/generate] member error:', memberErr.message)
    if (!member?.kbju_protein) {
      return NextResponse.json({ error: 'no_kbju', message: 'Заполни профиль — нужен расчёт КБЖУ' }, { status: 400 })
    }
    console.log(`[weekly/generate] kbju: cal=${member.kbju_calories} P=${member.kbju_protein} F=${member.kbju_fat} C=${member.kbju_carbs}`)

    const isTrial = member.subscription_status === 'trial' || !member.subscription_status
    const memberMacros = { protein: member.kbju_protein, fat: member.kbju_fat, carbs: member.kbju_carbs }

    // ── 2. Лимит ──────────────────────────────────────────────────────────────
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
    const expandedProds = expandProducts(user_products ?? [])

    // ── 3. Белковое расписание ────────────────────────────────────────────────
    const proteins = classifyProteins(user_products ?? [])
    const allInputProteins = [
      ...proteins.meat, ...proteins.offal, ...proteins.minced,
      ...proteins.freshFish, ...proteins.smokedFish,
    ]
    const proteinSchedule = allInputProteins.length > 0
      ? buildProteinSchedule(proteins, meals_per_day as 2 | 3)
      : []

    if (proteinSchedule.length > 0) {
      console.log(`[weekly/generate] protein schedule: ${proteinSchedule.map(d => `d${d.day}:${d.meal1Protein}/${d.meal2Protein}`).join(' ')}`)
    }

    // ── 4. Загрузить рецепты ──────────────────────────────────────────────────
    const [
      { data: bfRecipes,           error: bfErr },
      { data: mainRecipes,         error: mainErr },
      { data: saladWithIngs,       error: saladErr },
      { data: proteinSaladRecipes, error: proteinSaladErr },
      { data: dessertRecipes,      error: dessertErr },
    ] = await Promise.all([
      svc.from('recipes').select('id, title, category, tags, protein_tag').eq('category', 'завтрак').eq('is_active', true),
      svc.from('recipes').select('id, title, category, tags, protein_tag').eq('category', 'обед_ужин').eq('is_active', true),
      include_salads
        ? svc.from('recipes').select('id, title, category, tags, protein_tag, recipe_ingredients(role)').eq('category', 'салат').eq('is_active', true)
        : Promise.resolve({ data: [] as { id: number; title: string; category: string; tags: string[]; protein_tag: string | null; recipe_ingredients: { role: string }[] }[], error: null }),
      include_salads
        ? svc.from('recipes').select('id, title, category, tags, protein_tag').eq('category', 'салат_белковый').eq('is_active', true)
        : Promise.resolve({ data: [] as { id: number; title: string; category: string; tags: string[]; protein_tag: string | null }[], error: null }),
      svc.from('recipes').select('id, title, category, tags, protein_tag').eq('category', 'десерт').eq('is_active', true),
    ])

    if (bfErr)           console.error('[weekly/generate] bfErr:', bfErr.message)
    if (mainErr)         console.error('[weekly/generate] mainErr:', mainErr.message)
    if (saladErr)        console.error('[weekly/generate] saladErr:', saladErr?.message)
    if (proteinSaladErr) console.error('[weekly/generate] proteinSaladErr:', proteinSaladErr?.message)
    if (dessertErr)      console.error('[weekly/generate] dessertErr:', dessertErr?.message)

    // Только овощные салаты (без ингредиентов с role='protein')
    const saladCandidates = (saladWithIngs ?? [])
      .filter(r => {
        const ings = (r.recipe_ingredients as { role: string }[]) ?? []
        return !ings.some(i => i.role === 'protein')
      })
      .map(r => ({
        id: r.id as number,
        title: r.title as string,
        category: r.category as string,
        tags: (r.tags as string[]) ?? [],
        protein_tag: (r.protein_tag as string | null) ?? null,
      }))

    // Белковые салаты (calculatePortion, заменяют обед)
    const proteinSaladCandidates = (proteinSaladRecipes ?? []).map(r => ({
      id:          r.id as number,
      title:       r.title as string,
      category:    r.category as string,
      tags:        (r.tags as string[]) ?? [],
      protein_tag: (r.protein_tag as string | null) ?? null,
    }))

    console.log(`[weekly/generate] recipes: завтрак=${bfRecipes?.length ?? 0} обед=${mainRecipes?.length ?? 0} салат=${saladCandidates.length} салат_бел=${proteinSaladCandidates.length} десерт=${dessertRecipes?.length ?? 0}`)

    // ── 4b. Карта главных овощей (первый veggie с is_always_available=false) ──
    const allCandidateIds = [
      ...(bfRecipes?.map(r => r.id as number) ?? []),
      ...(mainRecipes?.map(r => r.id as number) ?? []),
      ...proteinSaladCandidates.map(r => r.id),
    ]
    const recipeVeggieMap = new Map<number, string>()
    if (allCandidateIds.length > 0) {
      const { data: veggieIngData } = await svc
        .from('recipe_ingredients')
        .select('recipe_id, ingredient_name')
        .in('recipe_id', allCandidateIds)
        .eq('role', 'veggie')
        .eq('is_always_available', false)
        .order('id', { ascending: true })
      for (const ing of veggieIngData ?? []) {
        if (!recipeVeggieMap.has(ing.recipe_id as number)) {
          recipeVeggieMap.set(ing.recipe_id as number, (ing.ingredient_name as string).toLowerCase())
        }
      }
    }

    // Трекер разнообразия овощей по всей неделе (Баг 4)
    const veggieUsage = new Map<string, number>()
    const userVeggies = filterVeggies(user_products ?? [])
    if (userVeggies.length > 0) {
      console.log(`[weekly/generate] userVeggies: ${userVeggies.join(', ')}`)
    }

    // ── 5. Типы дней по салатам ──────────────────────────────────────────────
    // 2-разовое: vegSalad=[1,3,5] proteinSalad=[2,6] noSalad=[4,7]
    // 3-разовое: vegSalad=[1,3,6] proteinSalad=[2,5] noSalad=[4,7]
    const vegSaladDays     = include_salads
      ? (meals_per_day === 2 ? [1, 3, 5] : [1, 3, 6])
      : []
    const proteinSaladDays = (include_salads && proteinSaladCandidates.length > 0)
      ? (meals_per_day === 2 ? [2, 6] : [2, 5])
      : []

    // ── 6. Основной цикл по дням ─────────────────────────────────────────────
    const allDays: PlanDay[] = []
    const usedBfIds:           number[] = []
    const usedMainIds:         number[] = []
    const usedVegSaladIds:     number[] = []
    const usedProteinSaladIds: number[] = []

    async function tryBuildMeal(
      candidateIds: number[],
      mealType: 'завтрак' | 'обед' | 'ужин' | 'салат_белковый',
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
          return buildMeal(portion, mealType, expandedProds, 1)
        } catch (e) {
          console.error(`[weekly/generate] calculatePortion id=${id} (${mealType}):`, (e as Error).message)
        }
      }
      console.warn(`[weekly/generate] нет рецепта для слота: ${mealType}`)
      return null
    }

    for (let dayNum = 1; dayNum <= 7; dayNum++) {
      const isVegSaladDay     = vegSaladDays.includes(dayNum)
      const isProteinSaladDay = proteinSaladDays.includes(dayNum)
      const dayProtein        = proteinSchedule.length > 0 ? proteinSchedule[dayNum - 1] : null

      // ── Овощной салат (добавка к обеду, КБЖУ вычитается из цели) ──
      let vegSaladMeal: PlanMeal | null = null
      if (isVegSaladDay && saladCandidates.length > 0) {
        const [saladId] = selectRecipes(saladCandidates, expandedProds, 'салат', usedVegSaladIds, 1)
        if (saladId) {
          usedVegSaladIds.push(saladId)
          const raw = await fetchFullRecipe(svc, saladId)
          vegSaladMeal = raw ? buildBaseKbjuMeal(raw, expandedProds, 'салат') : null
        }
      }

      // ── КБЖУ цели ──
      const fullTarget  = getMealTarget(memberMacros, meals_per_day as 2 | 3)
      const groupTarget = vegSaladMeal
        ? getMealTarget({
            protein: Math.max(5, memberMacros.protein - vegSaladMeal.total.protein),
            fat:     Math.max(5, memberMacros.fat     - vegSaladMeal.total.fat),
            carbs:   Math.max(5, memberMacros.carbs   - vegSaladMeal.total.carbs),
          }, meals_per_day as 2 | 3)
        : fullTarget

      // ── Белки по слотам ──
      const meal1Raw = dayProtein?.meal1Protein ? [dayProtein.meal1Protein] : (user_products ?? [])
      const meal2Raw = dayProtein?.meal2Protein ? [dayProtein.meal2Protein] : (user_products ?? [])

      // ── Завтрак ──
      const bfCands = selectRecipes(bfRecipes ?? [], expandedProds, 'завтрак', usedBfIds, 5, undefined, meal1Raw, recipeVeggieMap, veggieUsage)
      if (bfCands[0]) usedBfIds.push(bfCands[0])
      const bfPool = bfCands.length > 0 ? bfCands : usedBfIds.slice(0, 3)
      const bfMeal = await tryBuildMeal(bfPool, 'завтрак', groupTarget)

      const bfVeggie = bfMeal ? (recipeVeggieMap.get(bfMeal.recipe_id as number) ?? null) : null
      if (bfVeggie) veggieUsage.set(bfVeggie, (veggieUsage.get(bfVeggie) ?? 0) + 1)

      // ── Обед / Белковый салат ──
      let lunch:  PlanMeal | null = null
      let dinner: PlanMeal | null = null

      if (isProteinSaladDay) {
        // Белковый салат (calculatePortion) заменяет обед
        const psCands = selectRecipes(proteinSaladCandidates, expandedProds, 'салат_белковый', usedProteinSaladIds, 5, undefined, meal2Raw, recipeVeggieMap, veggieUsage)
        if (psCands[0]) usedProteinSaladIds.push(psCands[0])
        const psPool = psCands.length > 0 ? psCands : usedProteinSaladIds.slice(0, 3)
        lunch = await tryBuildMeal(psPool, 'салат_белковый', fullTarget)

        if (meals_per_day === 3) {
          // При 3-разовом: ужин — отдельный обед_ужин рецепт с другим овощем
          const lunchVeggiePs = lunch ? (recipeVeggieMap.get(lunch.recipe_id as number) ?? null) : null
          const dinnerCands = selectRecipes(mainRecipes ?? [], expandedProds, 'обед_ужин', usedMainIds, 5, undefined, meal2Raw, recipeVeggieMap, veggieUsage)
          if (dinnerCands[0]) usedMainIds.push(dinnerCands[0])
          const dinnerPool = dinnerCands.filter(id => {
            const v = recipeVeggieMap.get(id) ?? null
            return !v || (v !== bfVeggie && v !== lunchVeggiePs)
          })
          dinner = await tryBuildMeal(dinnerPool.length > 0 ? dinnerPool : dinnerCands, 'ужин', fullTarget)
          const dv = dinner ? (recipeVeggieMap.get(dinner.recipe_id as number) ?? null) : null
          if (dv) veggieUsage.set(dv, (veggieUsage.get(dv) ?? 0) + 1)
        }
      } else {
        // Обычный обед (обед_ужин)
        const mainCands = selectRecipes(mainRecipes ?? [], expandedProds, 'обед_ужин', usedMainIds, meals_per_day === 3 ? 6 : 5, undefined, meal2Raw, recipeVeggieMap, veggieUsage)
        if (mainCands[0]) usedMainIds.push(mainCands[0])
        if (meals_per_day === 3 && mainCands[1]) usedMainIds.push(mainCands[1])
        const mainPool = mainCands.length > 0 ? mainCands : usedMainIds.slice(0, 5)
        const mainPoolFiltered = bfVeggie
          ? mainPool.filter(id => (recipeVeggieMap.get(id) ?? null) !== bfVeggie)
          : mainPool
        const finalMainPool = mainPoolFiltered.length > 0 ? mainPoolFiltered : mainPool

        if (meals_per_day === 3) {
          lunch  = await tryBuildMeal(finalMainPool, 'обед', groupTarget)
          dinner = lunch ? { ...lunch, meal_type: 'ужин' as const } : null
        } else {
          lunch = await tryBuildMeal(finalMainPool, 'обед', groupTarget)
        }
      }

      // Track lunch veggie
      const lunchVeggie = lunch ? (recipeVeggieMap.get(lunch.recipe_id as number) ?? null) : null
      if (lunchVeggie) veggieUsage.set(lunchVeggie, (veggieUsage.get(lunchVeggie) ?? 0) + 1)

      // ── Собрать день ──
      const meals: PlanMeal[] = []
      if (bfMeal)       meals.push(bfMeal)
      if (lunch)        meals.push(lunch)
      if (dinner)       meals.push(dinner)
      if (vegSaladMeal) meals.push(vegSaladMeal)

      const dayTotal = meals.reduce((acc, m) => ({
        calories: acc.calories + m.total.calories,
        protein:  acc.protein  + m.total.protein,
        fat:      acc.fat      + m.total.fat,
        carbs:    acc.carbs    + m.total.carbs,
      }), { calories: 0, protein: 0, fat: 0, carbs: 0 })

      console.log(
        `[weekly/generate] день ${dayNum}: блюд=${meals.length}` +
        ` cal=${Math.round(dayTotal.calories)}/${member.kbju_calories}` +
        ` carbs=${Math.round(dayTotal.carbs)}/${member.kbju_carbs}` +
        ` (${meals.map(m => m.meal_type).join('+')})`
      )

      allDays.push({
        day_number:      dayNum,
        day_name:        DAY_NAMES[dayNum - 1],
        cook_group:      dayNum,
        is_cook_day:     true,
        cook_group_days: DAY_NAMES[dayNum - 1],
        meals,
        day_total: {
          calories: Math.round(dayTotal.calories),
          protein:  Math.round(dayTotal.protein  * 10) / 10,
          fat:      Math.round(dayTotal.fat       * 10) / 10,
          carbs:    Math.round(dayTotal.carbs     * 10) / 10,
        },
      })
    }

    // ── 8. Десерты ────────────────────────────────────────────────────────────
    const bonus_desserts: PlanDessert[] = []
    if (dessertRecipes && dessertRecipes.length > 0) {
      const dessertIds  = selectRecipes(dessertRecipes, expandedProds, 'десерт', [], 3)
      const dessertRaws = await Promise.all(dessertIds.map(id => fetchFullRecipe(svc, id)))
      for (const raw of dessertRaws) {
        if (!raw) continue
        const rawIngs = (raw.recipe_ingredients as unknown as RawIng[]) ?? []
        const { ings, totCal, totProt, totFat, totCarb } = calcBaseKbju(rawIngs, expandedProds)
        const servings = Math.max(1, (raw.servings as number | null) ?? 1)
        bonus_desserts.push({
          recipe_id: raw.id as number,
          title:     raw.title as string,
          steps:     (raw.steps as string[] | null) ?? [],
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
    const ingMap = new Map<string, { name: string; grams: number; is_user: boolean }>()

    const addIngredients = (ingredients: PlanIngredient[]) => {
      for (const ing of ingredients) {
        const key = ing.name.toLowerCase()
        const ex  = ingMap.get(key)
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
      include_soups:      false,
      cook_mode:          'daily',
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
