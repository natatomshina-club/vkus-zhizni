import type { WebinarRow, WebinarAccess, WebinarSelection, WebinarState } from '@/types/webinars'

export function getMonthsInClub(createdAt: string): number {
  const ms = Date.now() - new Date(createdAt).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 30))
}

export function getStatusLabel(months: number): string {
  if (months >= 12) return '💎 Бриллиант'
  if (months >= 9)  return '💚 Легенда'
  if (months >= 6)  return '🔥 Уже своя'
  if (months >= 3)  return '⭐ Вошла во вкус'
  return '🌸 Новенькая'
}

/**
 * Cumulative quota of free webinar selections by status.
 * Returns total number allowed (not delta).
 */
export function getWebinarQuota(months: number): number {
  if (months >= 12) return Infinity // Бриллиант — всё бесплатно
  if (months >= 9)  return 7        // Легенда: 2+3+2
  if (months >= 6)  return 5        // Уже своя: 2+3
  if (months >= 3)  return 2        // Вошла во вкус: 2
  return 0                          // Новенькая
}

/**
 * Whether the member can select this webinar type for free at their status level.
 * Courses (content_type='course') are only free from 9+ months.
 */
export function canSelectType(webinar: WebinarRow, months: number): boolean {
  if (months >= 12) return true                            // Бриллиант — всё
  if (webinar.content_type === 'course') return months >= 9 // Курсы — только Легенда+
  return months >= 3                                       // Вебинары — с Вошла во вкус
}

export function getWebinarState(
  webinar: WebinarRow,
  months: number,
  access: WebinarAccess[],
  selections: WebinarSelection[]
): WebinarState {
  // Already has access
  if (access.some(a => a.webinar_id === webinar.id)) return 'has_access'

  // Pending selection
  const sel = selections.find(s => s.webinar_id === webinar.id)
  if (sel && sel.status === 'pending') return 'pending'
  if (sel && sel.status === 'granted') return 'has_access'

  const quota = getWebinarQuota(months)

  // Бриллиант — can_select immediately (will auto-grant)
  if (quota === Infinity && canSelectType(webinar, months)) return 'can_select'

  // Check type eligibility
  if (!canSelectType(webinar, months)) return 'locked'

  // Check remaining quota
  const used = selections.filter(s => s.status === 'pending' || s.status === 'granted').length
  if (used < quota) return 'can_select'

  return 'locked'
}
