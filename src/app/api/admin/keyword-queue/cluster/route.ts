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

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    keywords: { keyword: string; cluster: string }[]
    cluster_id: string
  }

  if (!body.cluster_id || !Array.isArray(body.keywords) || body.keywords.length === 0) {
    return NextResponse.json({ error: 'cluster_id и keywords обязательны' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const rows = body.keywords.map(k => ({
    keyword: k.keyword.trim(),
    cluster_id: body.cluster_id,
    status: 'pending' as const,
  }))

  const { data, error } = await supabase
    .from('keyword_queue')
    .insert(rows)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data, count: data?.length ?? 0 })
}
