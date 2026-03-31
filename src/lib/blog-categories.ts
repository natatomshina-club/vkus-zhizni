export const BLOG_CATEGORIES = [
  { value: 'insulin',     label: 'Инсулин и вес' },
  { value: 'thyroid',     label: 'Щитовидная железа' },
  { value: 'hormones',    label: 'Гормоны' },
  { value: 'digestion',   label: 'Пищеварение и ЖКТ' },
  { value: 'recipes',     label: 'Рецепты' },
  { value: 'psychology',  label: 'Психология питания' },
  { value: 'supplements', label: 'Витамины и добавки' },
] as const

export type BlogCategory = typeof BLOG_CATEGORIES[number]['value']

export function getCategoryLabel(value: string | null | undefined): string {
  return BLOG_CATEGORIES.find(c => c.value === value)?.label ?? 'Без рубрики'
}
