import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, 'е').trim()

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const qNorm = normalize(q)
  // Ищем и нормализованный вариант (ё→е), и оригинал (если в БД есть ё)
  const conditions = qNorm !== q.toLowerCase()
    ? `name.ilike.%${qNorm}%,name_alt.ilike.%${qNorm}%,name.ilike.%${q}%,name_alt.ilike.%${q}%`
    : `name.ilike.%${qNorm}%,name_alt.ilike.%${qNorm}%`

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('nutrition')
    .select('name')
    .or(conditions)
    .limit(8)

  if (error) {
    console.error('Nutrition search error:', error)
    return NextResponse.json({ results: [] })
  }

  const results = (data ?? []).map((row: { name: string }) => row.name)
  return NextResponse.json({ results })
}
