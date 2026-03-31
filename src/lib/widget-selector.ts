export function selectWidget(mainKeyword: string, clusterName: string): string {
  const text = (mainKeyword + ' ' + clusterName).toLowerCase()

  if (/щитовид|гипотиреоз|аит|тиреоид|ттг/.test(text))   return 'thyroid_test'
  if (/инсулин|резистент|диабет|сахар|глюкоз/.test(text))  return 'ir_test'
  if (/усталост|энерги|депресс|апати|сонлив/.test(text))   return 'eating_test'
  if (/рассчит|сколько|килограмм|план|прогноз/.test(text)) return 'calc_3months'
  if (/вес|похудет|диет|стройн|калори|срыв/.test(text))    return 'why_test'

  return 'ir_test' // дефолт
}
