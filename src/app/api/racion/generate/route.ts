import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyFreeToken } from '@/lib/jwt'

const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

type RawIng = {
  ingredient_name: string
  role: string
  base_grams: number
  nutrition: { calories: number; protein: number; fat: number; carbs: number } | { calories: number; protein: number; fat: number; carbs: number }[] | null
}

type Recipe = {
  id: number
  title: string
  category: string
  kbju: { calories: number; protein: number; fat: number; carbs: number }
}

function calcRecipeKbju(rawIngs: RawIng[]): { calories: number; protein: number; fat: number; carbs: number } {
  let cal = 0, prot = 0, fat = 0, carbs = 0
  for (const ing of rawIngs) {
    if (ing.role === 'spice') continue
    const n = Array.isArray(ing.nutrition) ? (ing.nutrition[0] ?? null) : ing.nutrition
    if (!n) continue
    const r = ing.base_grams / 100
    cal   += r * n.calories
    prot  += r * n.protein
    fat   += r * n.fat
    carbs += r * n.carbs
  }
  return {
    calories: Math.round(cal),
    protein:  Math.round(prot * 10) / 10,
    fat:      Math.round(fat * 10) / 10,
    carbs:    Math.round(carbs * 10) / 10,
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function POST(req: NextRequest) {
  // Verify racion_token cookie
  const token = req.cookies.get('racion_token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const payload = await verifyFreeToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { gender, age, height, weight, activity, goal } = body as {
    gender: 'female' | 'male'
    age: number
    height: number
    weight: number
    activity: string
    goal: 'lose' | 'maintain' | 'gain'
  }

  if (!gender || !age || !height || !weight || !activity || !goal) {
    return NextResponse.json({ error: 'Все параметры обязательны' }, { status: 400 })
  }

  // Mifflin-St Jeor BMR
  const bmr = gender === 'female'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5

  const multiplier = ACTIVITY_MULTIPLIERS[activity] ?? 1.375
  const tdee = bmr * multiplier

  // Goal adjustment
  const dailyCalories = Math.round(
    goal === 'lose' ? tdee * 0.85 :
    goal === 'gain' ? tdee * 1.1 :
    tdee
  )

  // Macros: ~30% protein, 40% fat, 30% carbs (Вкус Жизни method — low fast carbs, high protein+fat)
  const dailyProtein = Math.round(weight * 1.5)  // 1.5g per kg
  const dailyFat     = Math.round((dailyCalories * 0.38) / 9)
  const dailyCarbs   = Math.round((dailyCalories - dailyProtein * 4 - dailyFat * 9) / 4)

  // Fetch recipes with nutrition data
  const supabase = createServiceClient()
  const { data: rawRecipes } = await supabase
    .from('recipes')
    .select(`
      id, title, category,
      recipe_ingredients (
        ingredient_name, role, base_grams,
        nutrition ( calories, protein, fat, carbs )
      )
    `)
    .in('category', ['breakfast', 'lunch', 'dinner', 'soup', 'salad'])
    .limit(200)

  // Group by category and calculate КБЖУ
  const byCategory: Record<string, Recipe[]> = { breakfast: [], lunch: [], dinner: [], soup: [], salad: [] }

  for (const r of rawRecipes ?? []) {
    const ings = (r.recipe_ingredients as unknown as RawIng[]) ?? []
    const kbju = calcRecipeKbju(ings)
    if (kbju.calories > 0) {
      byCategory[r.category as string]?.push({
        id: r.id as number,
        title: r.title as string,
        category: r.category as string,
        kbju,
      })
    }
  }

  // If not enough recipes in specific categories, fall back
  const breakfasts = shuffle(byCategory.breakfast)
  const lunches    = shuffle([...byCategory.lunch, ...byCategory.soup])
  const dinners    = shuffle([...byCategory.dinner, ...byCategory.salad])

  // Build 7-day plan
  const days = DAY_NAMES.map((dayName, i) => {
    const breakfast = breakfasts.length > 0 ? breakfasts[i % breakfasts.length] : null
    const lunch     = lunches.length > 0    ? lunches[i % lunches.length]       : null
    const dinner    = dinners.length > 0    ? dinners[i % dinners.length]        : null

    const meals = [
      breakfast ? { meal_type: 'Завтрак', ...breakfast } : null,
      lunch     ? { meal_type: 'Обед',    ...lunch }     : null,
      dinner    ? { meal_type: 'Ужин',    ...dinner }    : null,
    ].filter((m): m is NonNullable<typeof m> => m !== null)

    const dayTotal = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.kbju.calories,
        protein:  Math.round((acc.protein  + m.kbju.protein)  * 10) / 10,
        fat:      Math.round((acc.fat      + m.kbju.fat)      * 10) / 10,
        carbs:    Math.round((acc.carbs    + m.kbju.carbs)    * 10) / 10,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    )

    return {
      day_number: i + 1,
      day_name: dayName,
      meals,
      day_total: dayTotal,
    }
  })

  return NextResponse.json({
    targets: {
      calories: dailyCalories,
      protein:  dailyProtein,
      fat:      dailyFat,
      carbs:    dailyCarbs,
    },
    days,
  })
}
