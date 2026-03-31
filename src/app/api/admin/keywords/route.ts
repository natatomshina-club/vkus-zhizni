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

interface KeywordItem {
  keyword: string
  cluster: string
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY не настроен' }, { status: 500 })

  const body = await request.json() as { query?: string }
  const query = body.query?.trim()
  if (!query) return NextResponse.json({ error: 'Укажите query' }, { status: 400 })

  const prompt = `Ты SEO-специалист по русскоязычной нутрициологической нише.
Для блога нутрициолога-женщины сгенерируй 30 ключевых запросов на тему "${query}".

Самостоятельно определи 4-6 смысловых кластеров которые логично объединяют запросы по этой теме.
Название кластера — короткое (2-3 слова), отражает суть группы.

Требования к запросам:
- Только русский язык
- 3-7 слов (длинный хвост)
- Информационный интент: как, почему, что есть, можно ли, стоит ли
- Реальные запросы которые женщины 30-50 лет вводят в Яндекс
- НЕ использовать: кето, лоукарб, LCHF, кетоз
- Заменять на: питание для гормонального баланса, белковое питание, умное питание

Верни ТОЛЬКО JSON без markdown:
[{"keyword": "...", "cluster": "название кластера"}]`

  console.log('[keywords] ANTHROPIC_API_KEY present:', !!apiKey, '| key prefix:', apiKey.slice(0, 7) + '...')
  console.log('[keywords] Query:', query)

  const anthropic = new Anthropic({ apiKey })

  let message: Awaited<ReturnType<typeof anthropic.messages.create>>
  try {
    message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })
    console.log('[keywords] Anthropic response — stop_reason:', message.stop_reason, '| usage:', JSON.stringify(message.usage))
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e)
    const errStack = e instanceof Error ? e.stack : undefined
    console.error('[keywords] Anthropic API call failed:', errMsg)
    if (errStack) console.error('[keywords] Stack:', errStack)
    // Surface Anthropic SDK error details if available
    const detail = (e as Record<string, unknown>)
    console.error('[keywords] Full error object:', JSON.stringify(detail, null, 2))
    return NextResponse.json({
      error: `Anthropic API ошибка: ${errMsg}`,
      detail: errMsg,
      type: detail?.type ?? null,
      status: detail?.status ?? null,
    }, { status: 502 })
  }

  const text = message.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')

  console.log('[keywords] Raw Claude output (first 500 chars):', text.slice(0, 500))

  // Strip possible markdown fences
  const jsonStr = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  let keywords: KeywordItem[]
  try {
    keywords = JSON.parse(jsonStr)
    console.log('[keywords] Parsed', keywords.length, 'items')
  } catch (parseErr) {
    console.error('[keywords] JSON parse failed:', parseErr instanceof Error ? parseErr.message : parseErr)
    console.error('[keywords] Full raw text from Claude:', text)
    return NextResponse.json({
      error: `Не удалось разобрать JSON из ответа Claude: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      raw: text,
    }, { status: 502 })
  }

  // Validate
  const result = keywords
    .filter(k => k.keyword && typeof k.keyword === 'string' && k.cluster && typeof k.cluster === 'string')
    .map(k => ({
      keyword: k.keyword.trim(),
      cluster: k.cluster.trim(),
    }))

  console.log('[keywords] Returning', result.length, 'keywords')
  return NextResponse.json({ keywords: result, total: result.length })
}

export async function DELETE(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as { cluster_id?: string }
  if (!body.cluster_id) return NextResponse.json({ error: 'cluster_id обязателен' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('keyword_queue')
    .delete()
    .eq('cluster_id', body.cluster_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
