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
    topic_id?: string
    main_keyword?: string
    keywords?: string[]
    cluster_name?: string
  }

  if (!body.topic_id || !body.main_keyword) {
    return NextResponse.json({ error: 'topic_id и main_keyword обязательны' }, { status: 400 })
  }

  const main = body.main_keyword.trim()
  const keywords = (body.keywords ?? [main]).map((k: string) => k.trim()).filter(Boolean)
  const clusterName = body.cluster_name?.trim() || main

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('seo_clusters')
    .insert({
      topic_id: body.topic_id,
      main_keyword: main,
      keywords,
      cluster_name: clusterName,
      status: 'available',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Ensure topic status is at least in_progress
  await supabase
    .from('seo_topics')
    .update({ status: 'in_progress' })
    .eq('id', body.topic_id)
    .eq('status', 'new')

  return NextResponse.json({ cluster: data })
}
