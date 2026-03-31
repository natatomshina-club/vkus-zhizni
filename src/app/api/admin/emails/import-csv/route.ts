import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'

export const dynamic = 'force-dynamic'

function detectDelimiter(firstLine: string): ',' | ';' {
  const semicolons = (firstLine.match(/;/g) ?? []).length
  const commas = (firstLine.match(/,/g) ?? []).length
  return semicolons >= commas ? ';' : ','
}

function parseDate(raw: string): string | null {
  if (!raw?.trim()) return null
  const trimmed = raw.trim()
  // DD.MM.YYYY HH:MM:SS (Getcourse format)
  const match = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})/)
  if (match) {
    const d = new Date(`${match[3]}-${match[2]}-${match[1]}`)
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  const d = new Date(trimmed)
  if (!isNaN(d.getTime())) return d.toISOString()
  return null
}

type ParsedRow = { email: string; name: string | null; subscribed_at: string | null }

function parseRows(text: string): ParsedRow[] {
  const firstLine = text.split('\n')[0] ?? ''
  const delimiter = detectDelimiter(firstLine)

  const records = parse(text, {
    delimiter,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[]

  return records.map(r => {
    const email = (r['Email'] ?? r['email'] ?? r['E-mail'] ?? '').toLowerCase().trim()
    const firstName = (r['Имя'] ?? r['имя'] ?? '').trim()
    const lastName = (r['Фамилия'] ?? r['фамилия'] ?? '').trim()
    const name = [firstName, lastName].filter(Boolean).join(' ') || null
    const rawDate = r['Создан'] ?? r['создан'] ?? r['Дата регистрации'] ?? ''
    const subscribed_at = parseDate(rawDate)
    return { email, name, subscribed_at }
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()
    const { data: member } = await admin.from('members').select('role').eq('email', user.email).single()
    if (member?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const mode = formData.get('mode') as string | null
    const source = (formData.get('source') as string | null) ?? 'getcourse_import'

    if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })
    if (mode !== 'preview' && mode !== 'import') {
      return NextResponse.json({ error: 'mode must be preview or import' }, { status: 400 })
    }

    const text = await file.text()
    const rows = parseRows(text)

    if (mode === 'preview') {
      return NextResponse.json({
        total: rows.length,
        preview: rows.slice(0, 5),
      })
    }

    // ── mode === 'import' ──────────────────────────────────────────

    // Load all member emails
    const { data: memberRows } = await admin.from('members').select('email')
    const memberEmails = new Set((memberRows ?? []).map(m => (m.email as string).toLowerCase()))

    // Load all subscriber emails + names
    const { data: subRows } = await admin.from('subscribers').select('email, name')
    const subMap = new Map((subRows ?? []).map(s => [s.email.toLowerCase(), s.name as string | null]))

    let imported = 0
    let skipped_members = 0
    let skipped_duplicates = 0
    let skipped_invalid = 0
    const errors: string[] = []
    const toInsert: ParsedRow[] = []

    for (const row of rows) {
      if (!row.email.includes('@')) { skipped_invalid++; continue }
      if (memberEmails.has(row.email)) { skipped_members++; continue }
      if (subMap.has(row.email)) {
        // Update name if currently null
        if (subMap.get(row.email) === null && row.name) {
          await admin.from('subscribers').update({ name: row.name }).eq('email', row.email)
        }
        skipped_duplicates++
        continue
      }
      toInsert.push(row)
    }

    const BATCH = 50
    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH)
      const { error: batchErr } = await admin.from('subscribers').insert(
        batch.map(r => ({
          email: r.email,
          name: r.name,
          source,
          status: 'active',
          ...(r.subscribed_at ? { subscribed_at: r.subscribed_at } : {}),
        }))
      )
      if (batchErr) {
        errors.push(`Batch ${Math.floor(i / BATCH) + 1}: ${batchErr.message}`)
      } else {
        imported += batch.length
      }
      if (i + BATCH < toInsert.length) {
        await new Promise(res => setTimeout(res, 100))
      }
    }

    return NextResponse.json({ imported, skipped_members, skipped_duplicates, skipped_invalid, errors })
  } catch (e) {
    console.error('[import-csv]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
