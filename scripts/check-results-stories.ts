/**
 * Health-check: читает results_stories анонимным клиентом.
 * Проверяет, что RLS-политика на anon-чтение работает.
 *
 * Запуск: npx tsx scripts/check-results-stories.ts
 */

import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Используем тот же anon-ключ, что и публичный сайт
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ?? 'https://byykvsjamtcklwtnjkpf.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ?? 'sb_publishable_2V678YWUVeSiT0g1mUOHKg_zfOUFSVj'

// Динамический импорт чтобы не тянуть Next.js зависимости
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const { data, error } = await supabase
  .from('results_stories')
  .select('slug, name, published, photo_before_url, photo_after_url, order_index')
  .eq('published', true)
  .order('order_index')

if (error) {
  console.error('ERROR:', error.message)
  process.exit(1)
}

if (!data || data.length === 0) {
  console.error('FAIL: 0 rows returned — RLS-политика на anon-чтение не работает или таблица пуста.')
  process.exit(1)
}

console.log(`OK: ${data.length} stories found\n`)

for (const row of data) {
  const hasPhotos = !!(row.photo_before_url && row.photo_after_url)
  console.log(
    `  [${row.order_index}] ${row.slug} — ${row.name}` +
    ` | photos: ${hasPhotos ? '✓' : '✗ MISSING'}`
  )
}

const missing = data.filter(r => !r.photo_before_url || !r.photo_after_url)
if (missing.length > 0) {
  console.error(`\nWARN: ${missing.length} stories missing photo URLs`)
  process.exit(1)
}

console.log('\nAll checks passed ✓')
