import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const CSV_PATH = path.resolve(process.cwd(), 'клубные_Геткурс.csv')

if (!fs.existsSync(CSV_PATH)) {
  console.error(`CSV file not found: ${CSV_PATH}`)
  process.exit(1)
}

const text = fs.readFileSync(CSV_PATH, 'utf-8')

// Detect delimiter
const firstLine = text.split('\n')[0] ?? ''
const semicolons = (firstLine.match(/;/g) ?? []).length
const commas = (firstLine.match(/,/g) ?? []).length
const delimiter = semicolons >= commas ? ';' : ','

const records = parse(text, {
  delimiter,
  columns: true,
  skip_empty_lines: true,
  trim: true,
  bom: true,
}) as Record<string, string>[]

const emails = records
  .map(r => (r['Email'] ?? r['email'] ?? r['E-mail'] ?? '').toLowerCase().trim())
  .filter(e => e.includes('@'))

console.log(`CSV: ${records.length} строк, ${emails.length} валидных email`)

if (emails.length === 0) {
  console.log('Нет email для обновления.')
  process.exit(0)
}

async function main() {
  const BATCH = 100
  let updated = 0
  let notFound = 0

  for (let i = 0; i < emails.length; i += BATCH) {
    const batch = emails.slice(i, i + BATCH)

    const { data, error } = await supabase
      .from('subscribers')
      .update({ source: 'getcourse_club' })
      .in('email', batch)
      .select('email')

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH) + 1} error:`, error.message)
    } else {
      const batchUpdated = data?.length ?? 0
      updated += batchUpdated
      notFound += batch.length - batchUpdated
      process.stdout.write(`\rОбновлено: ${updated} / ${emails.length}`)
    }
  }

  console.log(`\n\nГотово:`)
  console.log(`  ✅ Обновлено: ${updated}`)
  console.log(`  ⚠️  Не найдено в subscribers: ${notFound}`)
}

main().catch(e => { console.error(e); process.exit(1) })
