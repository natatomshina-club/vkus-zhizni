import { describe, it, expect } from 'vitest'
import { calculateKBJU } from '../kbju'

describe('calculateKBJU', () => {
  it('Кейс 1: 35 лет, 72 кг, 165 см, light_training → 1554 ккал, 90 б, 97 ж, 80 у', () => {
    const result = calculateKBJU({ weight: 72, height: 165, age: 35, activity: 'light_training' })
    expect(result.calories).toBe(1554)
    expect(result.protein).toBe(90)
    expect(result.fat).toBe(97)
    expect(result.carbs).toBe(80)
  })

  it('Кейс 2: 45 лет, 60 кг, 162 см, sedentary → 1264 ккал, 80 б, 70 ж, 80 у', () => {
    const result = calculateKBJU({ weight: 60, height: 162, age: 45, activity: 'sedentary' }, true)
    // Проверяем промежуточные значения
    expect(result._debug!.hb).toBeCloseTo(1308.3, 1)
    expect(result._debug!.msj).toBeCloseTo(1243.0, 1)
    expect(result._debug!.bmr).toBeCloseTo(1275.65, 2)
    expect(result._debug!.tdee).toBeCloseTo(1530.78, 1)
    // Финальные: round(1530.78 × 0.825) = round(1262.89) = 1263
    expect(result.calories).toBe(1263)
    expect(result.protein).toBe(80)
    expect(result.fat).toBe(70)  // зажат снизу: (1263-320-320)/9 = 69.2 → 70
    expect(result.carbs).toBe(80)
  })

  it('Кейс 3: 28 лет, 55 кг, 155 см, intense_training → 1468 ккал, 90 б, 88 ж, 80 у', () => {
    const result = calculateKBJU({ weight: 55, height: 155, age: 28, activity: 'intense_training' }, true)
    expect(result._debug!.hb).toBeCloseTo(1313.7, 1)
    expect(result._debug!.msj).toBeCloseTo(1227.84, 2)
    expect(result._debug!.bmr).toBeCloseTo(1270.77, 2)
    expect(result._debug!.tdee).toBeCloseTo(1779.08, 1)
    expect(result.calories).toBe(1468)
    expect(result.protein).toBe(90)
    expect(result.fat).toBe(88)
    expect(result.carbs).toBe(80)
  })

  it('fat зажимается снизу до 70', () => {
    // Заведомо малокалорийный результат → fat < 70
    const result = calculateKBJU({ weight: 45, height: 148, age: 60, activity: 'sedentary' })
    expect(result.fat).toBeGreaterThanOrEqual(70)
  })

  it('fat зажимается сверху до 100', () => {
    // Высококалорийный результат → fat > 100
    const result = calculateKBJU({ weight: 100, height: 180, age: 20, activity: 'intense_training' })
    expect(result.fat).toBeLessThanOrEqual(100)
  })

  it('carbs всегда 80', () => {
    const activities = ['sedentary', 'standing', 'light_training', 'intense_training'] as const
    for (const activity of activities) {
      expect(calculateKBJU({ weight: 65, height: 165, age: 30, activity }).carbs).toBe(80)
    }
  })

  it('protein для рост 145–159, standing, возраст < 40 → 65', () => {
    const result = calculateKBJU({ weight: 55, height: 155, age: 30, activity: 'standing' })
    expect(result.protein).toBe(65)
  })

  it('protein для рост 145–159, standing, возраст >= 40 → 75', () => {
    const result = calculateKBJU({ weight: 55, height: 155, age: 40, activity: 'standing' })
    expect(result.protein).toBe(75)
  })

  it('protein для рост 160–180, sedentary, возраст < 40 → 75', () => {
    const result = calculateKBJU({ weight: 65, height: 170, age: 35, activity: 'sedentary' })
    expect(result.protein).toBe(75)
  })

  it('protein для рост 160–180, sedentary, возраст >= 40 → 80', () => {
    const result = calculateKBJU({ weight: 65, height: 170, age: 40, activity: 'sedentary' })
    expect(result.protein).toBe(80)
  })
})
