import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return null
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('keyword_suggestions')
    .select('id, keyword, cluster, query, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ suggestions: data ?? [] })
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    query: string
    keywords: { keyword: string; cluster: string }[]
  }

  if (!body.query || !Array.isArray(body.keywords) || body.keywords.length === 0) {
    return NextResponse.json({ error: 'query и keywords обязательны' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const rows = body.keywords.map(k => ({
    keyword: k.keyword,
    cluster: k.cluster,
    query: body.query,
  }))

  const { error } = await supabase.from('keyword_suggestions').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, count: rows.length })
}

export async function DELETE() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const { error } = await supabase.from('keyword_suggestions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
