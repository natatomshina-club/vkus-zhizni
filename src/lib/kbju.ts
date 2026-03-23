export type ActivityLevel =
  | 'sedentary'
  | 'standing'
  | 'light_training'
  | 'intense_training'

export interface KBJUInput {
  weight: number   // кг
  height: number   // см
  age: number      // лет
  activity: ActivityLevel
}

export interface KBJUResult {
  calories: number
  protein: number
  fat: number
  carbs: number
  _debug?: {
    hb: number
    msj: number
    bmr: number
    tdee: number
  }
}

const ACTIVITY_COEF: Record<ActivityLevel, number> = {
  sedentary:        1.2,
  standing:         1.25,
  light_training:   1.3,
  intense_training: 1.4,
}

function getProtein(height: number, activity: ActivityLevel, age: number): number {
  const isTall = height >= 160 // 160–180
  const isSedentary = activity === 'sedentary' || activity === 'standing'

  if (isTall) {
    if (isSedentary)       return age < 40 ? 75 : 80
    if (activity === 'light_training')   return 90
    if (activity === 'intense_training') return 100
  } else {
    // 145–159
    if (isSedentary)       return age < 40 ? 65 : 75
    if (activity === 'light_training')   return 80
    if (activity === 'intense_training') return 90
  }

  return 80 // fallback
}

export function calculateKBJU(input: KBJUInput, debug = false): KBJUResult {
  const { weight, height, age, activity } = input

  // Шаг 1 — BMR (без округлений промежуточных)
  const hb  = 447.6 + (9.2 * weight) + (3.1 * height) - (4.3 * age)
  const msj = (9.99 * weight) + (6.25 * height) - (4.62 * age) - 161
  const bmr = (hb + msj) / 2

  // Шаг 2 — TDEE
  const coef = ACTIVITY_COEF[activity]
  const tdee = bmr * coef

  // Шаг 3 — Калории для похудения
  const calories = Math.round(tdee * 0.825)

  // Шаг 4 — Белок
  const protein = getProtein(height, activity, age)

  // Шаг 5 — Углеводы (фиксировано)
  const carbs = 80

  // Шаг 6 — Жиры
  const fatRaw = (calories - protein * 4 - carbs * 4) / 9
  const fat = Math.max(70, Math.min(100, Math.round(fatRaw)))

  const result: KBJUResult = { calories, protein, fat, carbs }

  if (debug) {
    result._debug = { hb, msj, bmr, tdee }
  }

  return result
}
