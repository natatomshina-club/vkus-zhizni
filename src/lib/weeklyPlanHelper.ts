export interface ProteinGroups {
  freshFish:  string[]
  smokedFish: string[]
  offal:      string[]
  meat:       string[]
  minced:     string[]
  eggs:       string[]
}

export interface DayProtein {
  day:          number
  meal1Protein: string
  meal1Category: 'завтрак' | 'обед_ужин'
  meal2Protein: string
  meal2Category: 'обед_ужин' | 'салат'
  meal3Protein?: string
  meal3Category?: 'обед_ужин'
  isSmokedFishBreakfast?: boolean
  isSmokedFishSalad?:     boolean
  isFreshFishDay?:        boolean
}

const FRESH_FISH_NAMES = [
  'горбуша','кета','кижуч','нерка','минтай','сибас','дорадо',
  'камбала','терпуг','карп','щука','форель','лосось','треска',
  'тилапия','палтус','скумбрия','окунь',
]

const SMOKED_MARKERS = [
  'слабосолен','малосолен','холодного копчения','горячего копчения','копчён','копченый','солён',
]

const OFFAL_MARKERS  = ['печень','сердечк','желудк','язык','сердце']
const MINCED_MARKERS = ['фарш']
const EGG_MARKERS    = ['яиц','яйц']

export function classifyProteins(userProducts: string[]): ProteinGroups {
  const r: ProteinGroups = { freshFish: [], smokedFish: [], offal: [], meat: [], minced: [], eggs: [] }

  for (const p of userProducts) {
    const lower = p.toLowerCase().trim()
    if (!lower) continue

    if (EGG_MARKERS.some(k => lower.includes(k))) {
      if (!r.eggs.includes(p)) r.eggs.push(p)
      continue
    }

    const isSmoked = SMOKED_MARKERS.some(k => lower.includes(k))
    const isFish   = FRESH_FISH_NAMES.some(k => lower.includes(k))

    if (isFish && isSmoked) {
      if (!r.smokedFish.includes(p)) r.smokedFish.push(p)
    } else if (isFish) {
      if (!r.freshFish.includes(p)) r.freshFish.push(p)
    } else if (OFFAL_MARKERS.some(k => lower.includes(k))) {
      if (!r.offal.includes(p)) r.offal.push(p)
    } else if (MINCED_MARKERS.some(k => lower.includes(k))) {
      if (!r.minced.includes(p)) r.minced.push(p)
    } else {
      if (!r.meat.includes(p)) r.meat.push(p)
    }
  }

  return r
}

// Выбрать следующий белок с защитой от 3+ повторений подряд
function pickProtein(
  rotatable: string[],
  history:   string[],
  idx:       number,
): { protein: string; nextIdx: number } {
  const n = rotatable.length
  if (n === 0) return { protein: '', nextIdx: 0 }

  let candidate = rotatable[idx % n]
  const len = history.length

  if (len >= 2 && history[len - 1] === candidate && history[len - 2] === candidate) {
    for (let offset = 1; offset < n; offset++) {
      const alt = rotatable[(idx + offset) % n]
      if (alt !== candidate) {
        return { protein: alt, nextIdx: (idx + offset + 1) % n }
      }
    }
    // только 1 уникальный белок — повторение неизбежно
  }

  return { protein: candidate, nextIdx: (idx + 1) % n }
}

export function buildProteinSchedule(
  proteins:    ProteinGroups,
  mealsPerDay: 2 | 3,
): DayProtein[] {
  // Базовые белки для ротации (мясо + субпродукты + фарш)
  const base = [...proteins.meat, ...proteins.offal, ...proteins.minced]
  // Если базовых нет, но есть свежая рыба — ротируем её
  const rotatable = base.length > 0 ? base : proteins.freshFish.slice()

  // Свежая рыба: строго дни 3 и 6, второй приём
  const freshFishDays = proteins.freshFish.length > 0 ? [3, 6] : []

  // Копчёная рыба: завтрак на день 2, «салат» на день 5
  const smokedBreakfastDay = proteins.smokedFish.length > 0 ? 2 : 0
  const smokedSaladDay     = proteins.smokedFish.length > 0 ? 5 : 0

  const schedule: DayProtein[] = []
  const m1History: string[] = []
  const m2History: string[] = []

  // Смещаем второй слот на 1 чтобы в один день не было одного и того же белка в обоих приёмах
  let m1Idx = 0
  let m2Idx = rotatable.length > 1 ? 1 : 0

  const fallback = rotatable[0] ?? proteins.smokedFish[0] ?? ''

  for (let day = 1; day <= 7; day++) {
    const isFreshFish       = freshFishDays.includes(day)
    const isSmokedBreakfast = smokedBreakfastDay === day
    const isSmokedSalad     = smokedSaladDay === day

    // ── Слот 1 ──
    let meal1Protein: string
    const meal1Category: 'завтрак' | 'обед_ужин' = 'завтрак'

    if (isSmokedBreakfast && proteins.smokedFish.length > 0) {
      meal1Protein = proteins.smokedFish[0]
    } else if (rotatable.length > 0) {
      const r = pickProtein(rotatable, m1History, m1Idx)
      meal1Protein = r.protein
      m1Idx = r.nextIdx
    } else {
      meal1Protein = fallback
    }
    m1History.push(meal1Protein)

    // ── Слот 2 ──
    let meal2Protein: string
    let meal2Category: 'обед_ужин' | 'салат' = 'обед_ужин'

    if (isFreshFish && proteins.freshFish.length > 0) {
      meal2Protein = proteins.freshFish[freshFishDays.indexOf(day) % proteins.freshFish.length]
    } else if (isSmokedSalad && proteins.smokedFish.length > 0) {
      meal2Protein = proteins.smokedFish[0]
      meal2Category = 'салат'
    } else if (rotatable.length > 0) {
      const r = pickProtein(rotatable, m2History, m2Idx)
      meal2Protein = r.protein
      m2Idx = r.nextIdx
    } else {
      meal2Protein = fallback
    }
    m2History.push(meal2Protein)

    const dp: DayProtein = {
      day,
      meal1Protein,
      meal1Category,
      meal2Protein,
      meal2Category,
      isFreshFishDay:        isFreshFish,
      isSmokedFishBreakfast: isSmokedBreakfast,
      isSmokedFishSalad:     isSmokedSalad,
    }

    if (mealsPerDay === 3) {
      dp.meal3Protein  = meal2Protein
      dp.meal3Category = 'обед_ужин'
    }

    schedule.push(dp)
  }

  return schedule
}
