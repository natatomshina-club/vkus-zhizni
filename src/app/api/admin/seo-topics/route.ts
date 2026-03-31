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

  const [{ data: topics }, { data: clusterStats }] = await Promise.all([
    supabase.from('seo_topics').select('*').order('created_at', { ascending: false }),
    supabase.from('seo_clusters').select('topic_id, status, article_id').order('created_at', { ascending: true }),
  ])

  // Compute counts dynamically (ignore stored counters, always fresh)
  const topicsWithCounts = (topics ?? []).map(t => ({
    ...t,
    clusters_count: (clusterStats ?? []).filter(c => c.topic_id === t.id).length,
    articles_count: (clusterStats ?? []).filter(c => c.topic_id === t.id && c.status === 'used').length,
  }))

  // Load full clusters for expansion
  const { data: allClusters } = await supabase
    .from('seo_clusters')
    .select('*')
    .order('created_at', { ascending: true })

  const clustersByTopic: Record<string, unknown[]> = {}
  for (const cl of allClusters ?? []) {
    if (!clustersByTopic[cl.topic_id]) clustersByTopic[cl.topic_id] = []
    clustersByTopic[cl.topic_id].push(cl)
  }

  return NextResponse.json({ topics: topicsWithCounts, clusters: clustersByTopic })
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as { titles?: string[]; title?: string }
  const titles = (body.titles ?? (body.title ? [body.title] : []))
    .map((t: string) => t.trim())
    .filter(Boolean)

  if (!titles.length) return NextResponse.json({ error: 'titles обязательны' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('seo_topics')
    .insert(titles.map(title => ({ title })))
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ topics: data })
}

export async function DELETE(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as { id?: string }
  if (!body.id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase.from('seo_topics').delete().eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
