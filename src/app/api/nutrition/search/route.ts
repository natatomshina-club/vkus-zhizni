import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('nutrition')
    .select('name')
    .or(`name.ilike.%${q}%,name_alt.ilike.%${q}%`)
    .limit(8)

  if (error) {
    console.error('Nutrition search error:', error)
    return NextResponse.json({ results: [] })
  }

  const results = (data ?? []).map((row: { name: string }) => row.name)
  return NextResponse.json({ results })
}
