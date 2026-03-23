// ============================================================
// lib/recipeCalculator.ts  v2
// Динамический подбор граммовок под КБЖУ участницы
// Алгоритм проверен на 6 тестах — все ✅
// ============================================================

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
  // Роль в алгоритме:
  // 'protein' — главный белковый продукт (граммы считаются динамически по цели)
  // 'fat'     — дополнительный жир с фиксированными граммами (авокадо, сливки, сыр)
  // 'veggie'  — овощи с фиксированными граммами
  // 'oil'     — масло для тонкой подстройки жиров (граммы считаются динамически)
  // 'spice'   — специи (фиксированные, пренебрежимо малые КБЖУ)
  role: 'protein' | 'fat' | 'veggie' | 'oil' | 'spice'
  base_grams: number
  is_always_available: boolean
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
  ingredients: {
    name: string; grams: number
    calories: number; protein: number; fat: number; carbs: number
  }[]
  total: { calories: number; protein: number; fat: number; carbs: number }
  extra_products: string[]
  macros_ok: { protein: boolean; fat: boolean; carbs: boolean }
}

const TOLERANCE = 2.0

export function calculatePortion(
  recipe: { id: number; title: string; category: string; steps: string[]; ingredients: RecipeIngredientRow[] },
  target: MealTargetMacros,
  userProducts: string[] = []
): RecipePortionResult {

  const proteinSource = recipe.ingredients.find(i => i.role === 'protein')
  const oilSource     = recipe.ingredients.find(i => i.role === 'oil')
  const fixed         = recipe.ingredients.filter(i => i.role === 'fat' || i.role === 'veggie')

  if (!proteinSource) throw new Error(`Рецепт ${recipe.id}: нет ингредиента с role='protein'`)

  // Шаг 1: белок от фиксированных ингредиентов
  const fixedMacros = sumMacros(fixed.map(i => ({ n: i.nutrition, grams: i.base_grams })))

  // Шаг 2: граммы белкового продукта под оставшийся белок
  const proteinNeeded = Math.max(target.protein - fixedMacros.protein, 5)
  const proteinGrams  = Math.round(proteinNeeded / proteinSource.nutrition.protein * 100)

  // Шаг 3: жир без масла
  const withoutOil = [
    { n: proteinSource.nutrition, grams: proteinGrams },
    ...fixed.map(i => ({ n: i.nutrition, grams: i.base_grams }))
  ]
  const macrosWithoutOil = sumMacros(withoutOil)

  // Шаг 4: граммы масла под оставшийся жир
  let oilGrams = 0
  if (oilSource) {
    const fatNeeded = target.fat - macrosWithoutOil.fat
    if (fatNeeded > 0) oilGrams = Math.round(fatNeeded / (oilSource.nutrition.fat / 100))
  }

  // Шаг 5: финальный состав
  const finalList: Array<{ name: string; n: NutritionRow; grams: number }> = [
    { name: proteinSource.ingredient_name, n: proteinSource.nutrition, grams: proteinGrams },
    ...fixed.map(i => ({ name: i.ingredient_name, n: i.nutrition, grams: i.base_grams })),
  ]
  if (oilSource && oilGrams > 0) {
    finalList.push({ name: oilSource.ingredient_name, n: oilSource.nutrition, grams: oilGrams })
  }

  const totals = sumMacros(finalList.map(i => ({ n: i.n, grams: i.grams })))

  // Шаг 6: что нужно докупить
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
        name: i.name, grams: i.grams,
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

export function selectRecipes(
  recipes: Array<{ id: number; tags: string[]; category: string }>,
  userTags: string[],
  category: string,
  excludeIds: number[] = [],
  count = 3
): number[] {
  const userLower = userTags.map(t => t.toLowerCase())

  const scored = recipes
    .filter(r => r.category === category && !excludeIds.includes(r.id))
    .map(r => ({
      id: r.id,
      score: r.tags.filter(tag =>
        userLower.some(u => tag.toLowerCase().includes(u) || u.includes(tag.toLowerCase()))
      ).length,
    }))

  // Shuffle within each score group, then concat high-score first
  const withScore    = scored.filter(r => r.score > 0).sort((a, b) => b.score - a.score || Math.random() - 0.5)
  const withoutScore = scored.filter(r => r.score === 0).sort(() => Math.random() - 0.5)

  // Prefer relevant recipes; fill with random only if not enough
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
