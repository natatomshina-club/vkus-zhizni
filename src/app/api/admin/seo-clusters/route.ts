import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return null
  return user
}

function parseClustersXML(xml: string): Array<{ name: string; keywords: string[] }> {
  const matches = [...xml.matchAll(/<cluster>([\s\S]*?)<\/cluster>/gi)]
  return matches.map(m => {
    const block = m[1]
    const nameMatch = block.match(/<name>([\s\S]*?)<\/name>/i)
    const kwMatches = [...block.matchAll(/<kw>([\s\S]*?)<\/kw>/gi)]
    return {
      name: nameMatch?.[1]?.trim() ?? '',
      keywords: kwMatches.map(k => k[1].trim()).filter(Boolean),
    }
  }).filter(c => c.name && c.keywords.length > 0)
}

export async function GET(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(request.url)
  const topic_id = url.searchParams.get('topic_id')
  const status = url.searchParams.get('status')

  const supabase = createServiceClient()
  let query = supabase
    .from('seo_clusters')
    .select('*, topic:seo_topics(title)')
    .order('created_at', { ascending: true })

  if (topic_id) query = query.eq('topic_id', topic_id)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clusters: data ?? [] })
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY не настроен' }, { status: 500 })

  const body = await request.json() as { topic_id?: string; topic_title?: string }
  if (!body.topic_id || !body.topic_title) {
    return NextResponse.json({ error: 'topic_id и topic_title обязательны' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: topic } = await supabase
    .from('seo_topics')
    .select('id')
    .eq('id', body.topic_id)
    .single()

  if (!topic) return NextResponse.json({ error: 'Тема не найдена' }, { status: 404 })

  const prompt = `Ты SEO-специалист. Для нутрициологического блога на русском языке сгенерируй 4 кластера ключевых слов по теме: "${body.topic_title}"

Каждый кластер — это одна узкая подтема для отдельной статьи.
Каждый кластер содержит 5-6 низкочастотных запросов (3-7 слов) которые близки по смыслу.
Первый ключ в кластере — главный (наиболее точно описывает тему статьи).

Требования к ключам:
- Только русский язык
- Реальные запросы женщин 30-50 лет в Яндексе
- НЕ использовать: кето, лоукарб, LCHF
- Информационный интент: как, почему, что есть, можно ли

Верни ТОЛЬКО XML:
<clusters>
  <cluster>
    <name>название кластера</name>
    <keywords>
      <kw>главный ключевик</kw>
      <kw>ключевик 2</kw>
      <kw>ключевик 3</kw>
      <kw>ключевик 4</kw>
      <kw>ключевик 5</kw>
    </keywords>
  </cluster>
</clusters>`

  const anthropic = new Anthropic({ apiKey })

  let rawXml: string
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: 'Отвечай ТОЛЬКО валидным XML без какого-либо текста до или после.',
      messages: [{ role: 'user', content: prompt }],
    })
    rawXml = msg.content.filter(b => b.type === 'text').map(b => b.text).join('')
    console.log('[seo-clusters] Raw XML (first 500):', rawXml.slice(0, 500))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[seo-clusters] Claude error:', msg)
    return NextResponse.json({ error: `Claude API ошибка: ${msg}` }, { status: 502 })
  }

  const parsed = parseClustersXML(rawXml)
  console.log('[seo-clusters] Parsed clusters count:', parsed.length)

  if (!parsed.length) {
    return NextResponse.json({
      error: 'Не удалось распарсить кластеры из ответа Claude',
      raw: rawXml.slice(0, 500),
    }, { status: 502 })
  }

  // ── Duplicate detection ──────────────────────────────────────────────────
  const [{ data: existingClusters }, { data: blogPosts }] = await Promise.all([
    supabase.from('seo_clusters').select('main_keyword, keywords'),
    supabase.from('blog_posts').select('id,title,slug,seo_keywords'),
  ])

  // Build lowercase set of all existing keywords
  const existingKwSet = new Set<string>()
  for (const ec of existingClusters ?? []) {
    existingKwSet.add(String(ec.main_keyword).toLowerCase())
    for (const kw of (ec.keywords as string[])) {
      existingKwSet.add(kw.toLowerCase())
    }
  }

  // Build searchable blog text from title + seo_keywords only (no content)
  const blogText = (blogPosts ?? [])
    .map(p => ((p.title ?? '') + ' ' + (Array.isArray(p.seo_keywords) ? p.seo_keywords.join(' ') : (p.seo_keywords ?? ''))).toLowerCase())
    .join(' ')

  function isDuplicate(kw: string): boolean {
    const lower = kw.toLowerCase()
    return existingKwSet.has(lower) || blogText.includes(lower)
  }

  // ── Insert clusters ──────────────────────────────────────────────────────
  const rows = parsed.map(cl => ({
    topic_id: body.topic_id,
    cluster_name: cl.name,
    keywords: cl.keywords,
    main_keyword: cl.keywords[0],
    status: isDuplicate(cl.keywords[0]) ? 'used' : 'available',
  }))

  const { data: inserted, error } = await supabase
    .from('seo_clusters')
    .insert(rows)
    .select()

  if (error) {
    console.error('[seo-clusters] Insert error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update topic status → in_progress
  await supabase
    .from('seo_topics')
    .update({ status: 'in_progress' })
    .eq('id', body.topic_id)

  console.log('[seo-clusters] Inserted', inserted?.length, 'clusters for topic', body.topic_id)
  return NextResponse.json({ clusters: inserted, count: inserted?.length ?? 0 })
}

export async function PATCH(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as { id?: string; status?: string; article_id?: string }
  if (!body.id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })

  const supabase = createServiceClient()
  const updates: Record<string, unknown> = {}
  if (body.status !== undefined) updates.status = body.status
  if (body.article_id !== undefined) updates.article_id = body.article_id

  const { error } = await supabase.from('seo_clusters').update(updates).eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If marking as used, check if all clusters in topic are used → set topic status = done
  if (body.status === 'used') {
    const { data: cluster } = await supabase
      .from('seo_clusters')
      .select('topic_id')
      .eq('id', body.id)
      .single()

    if (cluster?.topic_id) {
      const { data: remaining } = await supabase
        .from('seo_clusters')
        .select('id')
        .eq('topic_id', cluster.topic_id)
        .eq('status', 'available')

      if (!remaining?.length) {
        await supabase
          .from('seo_topics')
          .update({ status: 'done' })
          .eq('id', cluster.topic_id)
      }
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as { id?: string }
  if (!body.id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase.from('seo_clusters').delete().eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
