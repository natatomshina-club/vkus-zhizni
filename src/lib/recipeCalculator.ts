// ============================================================
// lib/recipeCalculator.ts  v4
// Динамический подбор граммовок под КБЖУ участницы
// ============================================================

import { getInputProteins, normalizeRu, OFFAL_KEYWORDS } from './productUtils'

export interface NutritionRow {
  id: number
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface RecipeIngredientRow {
  nutrition_id: number
  ingredient_name: string
  role: 'protein' | 'fat' | 'veggie' | 'oil' | 'spice'
  base_grams: number
  is_always_available: boolean
  is_scalable_veggie: boolean
  nutrition: NutritionRow
}

export interface MealTargetMacros {
  protein: number
  fat: number
  carbs: number
}

export interface RecipePortionResult {
  recipe_id: number
  title: string
  category: string
  steps: string[]
  time_minutes?: number | null
  cooking_method?: string | null
  ingredients: {
    name: string; grams: number; nutrition_id?: number
    calories: number; protein: number; fat: number; carbs: number
  }[]
  total: { calories: number; protein: number; fat: number; carbs: number }
  extra_products: string[]
  macros_ok: { protein: boolean; fat: boolean; carbs: boolean }
}

const TOLERANCE = 2.0

// Лимиты жирных ингредиентов для категории салат_белковый (nutrition_id → max граммы)
const FAT_CAPS_PROTEIN_SALAD: Record<number, number> = {
  125: 30,   // масло оливковое
  506: 30,   // масло гхи (вариант 1)
  591: 30,   // масло гхи (вариант 2)
  124: 40,   // кетомайонез
  101: 60,   // сметана 20%
  100: 60,   // сметана 15%
}

export function calculatePortion(
  recipe: { id: number; title: string; category: string; steps: string[]; ingredients: RecipeIngredientRow[] },
  target: MealTargetMacros,
  userProducts: string[] = []
): RecipePortionResult {

  const proteinSource = recipe.ingredients.find(i => i.role === 'protein')
  const oilSources    = recipe.ingredients.filter(i => i.role === 'oil')
  const oilSource     = oilSources[0] ?? null
  const extraOils     = oilSources.slice(1)
  const fixed         = recipe.ingredients.filter(i => i.role === 'fat' || i.role === 'veggie')

  if (!proteinSource) throw new Error(`Рецепт ${recipe.id}: нет ингредиента с role='protein'`)

  // Шаг 1: белок от фиксированных ингредиентов
  const fixedMacros = sumMacros(fixed.map(i => ({ n: i.nutrition, grams: i.base_grams })))

  // Шаг 2: граммы белкового продукта под оставшийся белок
  const proteinNeeded = Math.max(target.protein - fixedMacros.protein, 5)
  const EGG_IDS = [86, 87]
  const EGG_WEIGHT: Record<number, number> = { 86: 60, 87: 12 }

  let proteinGrams = Math.round(proteinNeeded / proteinSource.nutrition.protein * 100)

  if (EGG_IDS.includes(proteinSource.nutrition_id)) {
    const eggWeight = EGG_WEIGHT[proteinSource.nutrition_id] ?? 60
    const eggCount = Math.max(1, Math.round(proteinGrams / eggWeight))
    proteinGrams = eggCount * eggWeight
  }

  // Шаг 3: жир без основного масла
  const withoutOil = [
    { n: proteinSource.nutrition, grams: proteinGrams },
    ...fixed.map(i => ({ n: i.nutrition, grams: i.base_grams })),
    ...extraOils.map(i => ({ n: i.nutrition, grams: i.base_grams })),
  ]
  const macrosWithoutOil = sumMacros(withoutOil)

  // Шаг 4: граммы масла под оставшийся жир
  let oilGrams = 0
  if (oilSource) {
    const fatNeeded = target.fat - macrosWithoutOil.fat
    if (fatNeeded > 0) oilGrams = Math.round(fatNeeded / (oilSource.nutrition.fat / 100))
    // Пункт 5: лимит масла в белковых салатах
    if (recipe.category === 'салат_белковый') {
      const cap = FAT_CAPS_PROTEIN_SALAD[oilSource.nutrition_id]
      if (cap !== undefined && oilGrams > cap) oilGrams = cap
    }
  }

  // Шаг 5: финальный состав
  const finalList: Array<{ name: string; n: NutritionRow; grams: number; nutrition_id: number }> = [
    { name: proteinSource.ingredient_name, n: proteinSource.nutrition, grams: proteinGrams, nutrition_id: proteinSource.nutrition_id },
    ...fixed.map(i => ({ name: i.ingredient_name, n: i.nutrition, grams: i.base_grams, nutrition_id: i.nutrition_id })),
  ]
  if (oilSource) {
    finalList.push({ name: oilSource.ingredient_name, n: oilSource.nutrition, grams: Math.max(0, oilGrams), nutrition_id: oilSource.nutrition_id })
  }
  for (const oil of extraOils) {
    finalList.push({ name: oil.ingredient_name, n: oil.nutrition, grams: oil.base_grams, nutrition_id: oil.nutrition_id })
  }

  // Пункт 5: лимиты жирных ингредиентов роль='fat' в белковых салатах
  if (recipe.category === 'салат_белковый') {
    for (const item of finalList) {
      const cap = FAT_CAPS_PROTEIN_SALAD[item.nutrition_id]
      if (cap !== undefined && item.grams > cap) {
        item.grams = cap
      }
    }
  }

  let totals = sumMacros(finalList.map(i => ({ n: i.n, grams: i.grams })))

  // Шаг 6: уменьшаем масштабируемые овощи если углеводы превышают цель
  if (totals.carbs > target.carbs + TOLERANCE) {
    const originalCarbs = totals.carbs
    const scalableVeggies = recipe.ingredients
      .filter(i => i.role === 'veggie' && i.is_scalable_veggie)
      .sort((a, b) => b.nutrition.carbs - a.nutrition.carbs)

    const reductions: string[] = []

    for (const sv of scalableVeggies) {
      const excess = totals.carbs - (target.carbs + TOLERANCE)
      if (excess <= 0) break

      const carbs_per_gram = sv.nutrition.carbs / 100
      if (carbs_per_gram <= 0) continue

      const item = finalList.find(f => f.name === sv.ingredient_name)
      if (!item) continue

      const currentGrams = item.grams
      const minGrams = sv.base_grams * 0.3
      const gramsToReduce = excess / carbs_per_gram
      const newGrams = Math.max(currentGrams - gramsToReduce, minGrams)

      if (newGrams < currentGrams) {
        reductions.push(`${sv.ingredient_name} ${Math.round(currentGrams)}→${Math.round(newGrams)}г`)
        item.grams = Math.round(newGrams)
        totals = sumMacros(finalList.map(i => ({ n: i.n, grams: i.grams })))
      }

      if (totals.carbs <= target.carbs + TOLERANCE) break
    }

    if (reductions.length > 0) {
      console.log(
        `[calculatePortion] recipe=${recipe.id} carbs reduced: ${reductions.join(', ')},` +
        ` totals.carbs ${Math.round(originalCarbs * 10) / 10}→${Math.round(totals.carbs * 10) / 10}`
      )
    }
  }

  // Шаг 7: что нужно докупить
  const userLower = userProducts.map(p => p.toLowerCase())
  const extra_products: string[] = []
  for (const ing of recipe.ingredients.filter(i => i.role !== 'spice' && !i.is_always_available)) {
    const found = userLower.some(u =>
      u.includes(ing.ingredient_name.toLowerCase()) ||
      ing.ingredient_name.toLowerCase().includes(u)
    )
    if (!found) {
      const g = finalList.find(f => f.name === ing.ingredient_name)?.grams ?? ing.base_grams
      extra_products.push(`${ing.ingredient_name} — ${g}г`)
    }
  }

  return {
    recipe_id: recipe.id,
    title: recipe.title,
    category: recipe.category,
    steps: recipe.steps,
    ingredients: finalList.map(i => {
      const f = i.grams / 100
      return {
        name: i.name, grams: i.grams, nutrition_id: i.nutrition_id,
        calories: Math.round(i.n.calories * f),
        protein:  Math.round(i.n.protein  * f * 10) / 10,
        fat:      Math.round(i.n.fat      * f * 10) / 10,
        carbs:    Math.round(i.n.carbs    * f * 10) / 10,
      }
    }),
    total: {
      calories: Math.round(totals.calories),
      protein:  Math.round(totals.protein * 10) / 10,
      fat:      Math.round(totals.fat     * 10) / 10,
      carbs:    Math.round(totals.carbs   * 10) / 10,
    },
    macros_ok: {
      protein: Math.abs(totals.protein - target.protein) <= TOLERANCE,
      fat:     Math.abs(totals.fat     - target.fat)     <= TOLERANCE,
      carbs:   totals.carbs <= target.carbs + TOLERANCE,
    },
    extra_products,
  }
}

export function getMealTarget(
  daily: { protein: number; fat: number; carbs: number },
  mealsPerDay: 2 | 3
): MealTargetMacros {
  return {
    protein: Math.round(daily.protein / mealsPerDay),
    fat:     Math.round(daily.fat     / mealsPerDay),
    carbs:   Math.round(daily.carbs   / mealsPerDay),
  }
}

type RecipeIngredientForMatch = {
  recipe_id: number
  ingredient_name: string
  role: string
  is_always_available: boolean
}

function isExactMatch(
  recipeId: number,
  allIngredients: RecipeIngredientForMatch[],
  userRaw: string[]
): boolean {
  const userLower = userRaw.map(u => u.toLowerCase())
  const required = allIngredients.filter(i =>
    i.recipe_id === recipeId &&
    i.role !== 'spice' &&
    !i.is_always_available
  )
  return required.every(ing =>
    userLower.some(u =>
      u.includes(ing.ingredient_name.toLowerCase()) ||
      ing.ingredient_name.toLowerCase().includes(u)
    )
  )
}

export function selectRecipes(
  recipes: Array<{ id: number; tags: string[]; category: string; protein_tag?: string | null }>,
  userTags: string[],
  category: string,
  excludeIds: number[] = [],
  count = 3,
  allIngredients?: RecipeIngredientForMatch[],
  userRaw?: string[],
  recipeVeggieMap?: Map<number, string>,
  veggieUsage?: Map<string, number>,
  proteinUsage?: Map<string, number>,
  offalUsage?: Map<string, number>,
): number[] {
  const userLower = userTags.map(t => t.toLowerCase())

  // Пункт 1: жёсткий фильтр по белку — строгое равенство через normalizeRu
  let candidateRecipes = recipes.filter(r => r.category === category && !excludeIds.includes(r.id))

  if (userRaw && userRaw.length > 0) {
    const inputProteins = getInputProteins(userRaw)
    if (inputProteins.length > 0) {
      const ipNorm = inputProteins.map(p => normalizeRu(p))
      const proteinFiltered = candidateRecipes.filter(r => {
        const ptNorm = r.protein_tag ? normalizeRu(r.protein_tag) : null

        // Пункт 3: лимит субпродуктов
        if (ptNorm && offalUsage && OFFAL_KEYWORDS.has(ptNorm)) {
          if ((offalUsage.get(ptNorm) ?? 0) >= 2) return false
        }

        // Точное совпадение protein_tag
        if (ptNorm && ipNorm.some(p => ptNorm === p)) return true

        // Фалбек: точное совпадение тегов
        return r.tags.some(tag => ipNorm.some(p => normalizeRu(tag) === p))
      })
      if (proteinFiltered.length > 0) candidateRecipes = proteinFiltered
    }
  }

  const scored = candidateRecipes.map(r => {
    // Общий скоринг по тегам (fuzzy — только для приоритизации)
    let score = r.tags.filter(tag =>
      userLower.some(u => tag.toLowerCase().includes(u) || u.includes(tag.toLowerCase()))
    ).length

    // Пункт 1: бонус за совпадение белка (строгое)
    if (r.protein_tag) {
      const ptNorm = normalizeRu(r.protein_tag)
      let proteinMatches = false
      if (userRaw && userRaw.length > 0) {
        const slotProteins = getInputProteins(userRaw)
        proteinMatches = slotProteins.some(p => normalizeRu(p) === ptNorm)
      } else {
        proteinMatches = userLower.some(u => normalizeRu(u) === ptNorm)
      }
      if (proteinMatches) score += 10

      // Пункт 2: бонус +50 за ещё не использованный белок
      if (proteinUsage) {
        const usage = proteinUsage.get(ptNorm) ?? 0
        if (usage === 0) score += 50
      }
    }

    // Разнообразие овощей: +50 за ни разу не использованный, -10 за 2+ раз
    if (recipeVeggieMap && veggieUsage) {
      const veggie = recipeVeggieMap.get(r.id)
      if (veggie) {
        const usage = veggieUsage.get(veggie) ?? 0
        if (usage === 0) score += 50
        else if (usage >= 2) score -= 10
      }
    }

    return { id: r.id, score }
  })

  const withScore = scored.filter(r => r.score > 0).map(r => ({
    ...r,
    exact: allIngredients && userRaw
      ? isExactMatch(r.id, allIngredients, userRaw)
      : false,
  }))

  withScore.sort((a, b) => {
    if (a.exact && !b.exact) return -1
    if (!a.exact && b.exact) return 1
    return b.score - a.score || Math.random() - 0.5
  })

  const withoutScore = scored.filter(r => r.score === 0).sort(() => Math.random() - 0.5)

  return [...withScore, ...withoutScore].slice(0, count).map(r => r.id)
}

function sumMacros(items: Array<{ n: NutritionRow; grams: number }>) {
  return items.reduce(
    (acc, { n, grams }) => {
      const f = grams / 100
      return {
        calories: acc.calories + n.calories * f,
        protein:  acc.protein  + n.protein  * f,
        fat:      acc.fat      + n.fat      * f,
        carbs:    acc.carbs    + n.carbs    * f,
      }
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  )
}
