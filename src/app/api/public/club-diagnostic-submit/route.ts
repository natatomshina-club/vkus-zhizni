import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

const PROBLEMS_MAP: Record<string, string> = {
  weight: 'Лишний вес, который никуда не уходит',
  fatigue: 'Постоянная усталость, нет сил',
  sweets: 'Тяга к сладкому, срывы по вечерам',
  swelling: 'Отёки по утрам, тяжесть, вздутие',
  sleep: 'Проблемы со сном, тревожность',
  analyses: 'Анализы стали хуже, или появились диагнозы',
  aging: 'Ощущение что «постарела», тело не своё',
}

const METHODS_MAP: Record<string, string> = {
  calories: 'Считала калории, держала дефицит',
  diets: 'Сидела на разных диетах (кето, дюкан, минус 60 и т.д.)',
  frequent_meals: 'Дробное питание, 5-6 раз в день',
  gym: 'Спортзал, бег, фитнес',
  marathons: 'Марафоны похудения у разных тренеров',
  bads: 'Пила БАДы по советам блогеров',
  doctors: 'Ходила к врачам, но мне сказали «всё в норме»',
  nothing: 'Ничего серьёзного не пробовала, просто плыву по течению',
}

const RESULT_MAP: Record<string, string> = {
  returned_with_extra: 'Вес уходил, но возвращался с прибавкой',
  short_term: 'Уходил на короткое время, потом снова накапливался',
  nothing: 'Вообще не уходил, как ни старалась',
  exhausted: 'Уходил, но я ходила измотанная, голодная и несчастная',
}

const MOTIVATION_MAP: Record<string, string> = {
  fast_date: 'Найти быстрое решение и сбросить вес к определённой дате',
  causes_forever: 'Разобраться в причинах и решить проблему навсегда',
  health_first: 'Восстановить здоровье, а вес уйдёт как побочный эффект',
  where_to_start: 'Просто понять с чего начать — голова кругом',
}

const READINESS_MAP: Record<string, string> = {
  ready_full: 'Да, готова сдать анализы, разобраться с дефицитами, пить БАДы по схеме',
  ready_with_help: 'Готова, но нужны конкретные рекомендации — самой страшно',
  understand_first: 'Хочу разобраться сначала, что вообще делать',
  not_ready: 'Пока не готова на серьёзный шаг, но интересно узнать подробнее',
}

function tr(map: Record<string, string>, key: string): string {
  return map[key] ?? key
}

function trList(map: Record<string, string>, keys: string[]): string {
  return keys.map(k => `• ${tr(map, k)}`).join('\n')
}

function validate(body: Record<string, unknown>): string | null {
  const VALID_AGE = ['35-45', '46-55', '56-65', '65+']
  if (!VALID_AGE.includes(body.age_range as string)) return 'Укажите возраст'

  if (!Array.isArray(body.problems) || (body.problems as string[]).length === 0) return 'Укажите что беспокоит'
  if (!Array.isArray(body.tried_methods) || (body.tried_methods as string[]).length === 0) return 'Укажите что пробовали'
  if (!body.tried_result) return 'Укажите результат'
  if (!body.motivation) return 'Укажите что важнее'
  if (!body.readiness) return 'Укажите готовность'

  const name = (body.name as string | undefined)?.trim() ?? ''
  if (name.length < 2) return 'Укажите имя (минимум 2 символа)'

  const tg = (body.contact_tg as string | undefined)?.trim() ?? ''
  const wa = (body.contact_wa as string | undefined)?.trim() ?? ''
  if (!tg && !wa) return 'Укажите хотя бы один способ связи — Telegram или WhatsApp'

  const email = (body.contact_email as string | undefined)?.trim() ?? ''
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Некорректный email'

  const comment = (body.comment as string | undefined) ?? ''
  if (comment.length > 2000) return 'Комментарий слишком длинный'

  return null
}

async function sendTelegram(data: Record<string, unknown>, id: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.error('[telegram] Missing env vars: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set')
    return
  }

  const name = data.name as string
  const tg = (data.contact_tg as string) || ''
  const wa = (data.contact_wa as string) || ''
  const email = (data.contact_email as string) || ''
  const comment = (data.comment as string) || '—'
  const dateTime = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })

  const contactLines = [
    tg ? `Telegram: ${tg}` : '',
    wa ? `WhatsApp: ${wa}` : '',
    email ? `Email: ${email}` : '',
  ].filter(Boolean).join('\n')

  const message = [
    `🌿 <b>Новая анкета — Клуб «Вкус Жизни»</b>`,
    ``,
    `👤 Имя: ${name}`,
    `📅 Возраст: ${data.age_range}`,
    ``,
    `💬 <b>Связь:</b>`,
    contactLines,
    ``,
    `🔥 <b>Что беспокоит:</b>`,
    trList(PROBLEMS_MAP, data.problems as string[]),
    ``,
    `🔧 <b>Что уже пробовала:</b>`,
    trList(METHODS_MAP, data.tried_methods as string[]),
    ``,
    `📊 <b>Результат от того что пробовала:</b>`,
    tr(RESULT_MAP, data.tried_result as string),
    ``,
    `🎯 <b>Что важнее сейчас:</b>`,
    tr(MOTIVATION_MAP, data.motivation as string),
    ``,
    `✅ <b>Готовность:</b>`,
    tr(READINESS_MAP, data.readiness as string),
    ``,
    `📝 <b>Комментарий:</b>`,
    comment,
    ``,
    `⏰ ${dateTime}`,
    `🔗 ID: ${id}`,
  ].join('\n')

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    })
    if (!tgRes.ok) {
      const errBody = await tgRes.text()
      console.error('[telegram] API error:', { status: tgRes.status, body: errBody, tokenPresent: !!token, chatId })
    } else {
      console.log('[telegram] notification sent, id:', id)
    }
  } catch (err) {
    console.error('[telegram] fetch error:', err)
  }
}

// In-memory simple rate limit: 1 request per IP per 60s
const rateLimitMap = new Map<string, number>()

export async function POST(request: Request) {
  const hdrs = await headers()
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    hdrs.get('x-real-ip') ??
    'unknown'

  const userAgent = hdrs.get('user-agent') ?? ''

  // Rate limit
  const now = Date.now()
  const lastTime = rateLimitMap.get(ip) ?? 0
  if (now - lastTime < 60_000) {
    return NextResponse.json({ error: 'Слишком частые запросы. Подождите минуту.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }

  const validationError = validate(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const supabase = createServiceClient()

  const row = {
    age_range: body.age_range as string,
    problems: body.problems as string[],
    tried_methods: body.tried_methods as string[],
    tried_result: body.tried_result as string,
    motivation: body.motivation as string,
    readiness: body.readiness as string,
    name: (body.name as string).trim(),
    contact_tg: ((body.contact_tg as string) || '').trim() || null,
    contact_wa: ((body.contact_wa as string) || '').trim() || null,
    contact_email: ((body.contact_email as string) || '').trim() || null,
    comment: ((body.comment as string) || '').trim() || null,
    user_agent: userAgent,
    ip,
    source: 'klub_landing',
    status: 'new',
  }

  const { data: inserted, error: dbError } = await supabase
    .from('klub_diagnostics')
    .insert(row)
    .select('id')
    .single()

  if (dbError) {
    console.error('[club-diagnostic] DB error:', dbError)
    return NextResponse.json({ error: 'Ошибка сохранения. Попробуйте ещё раз.' }, { status: 500 })
  }

  // Mark rate limit only after successful DB save
  rateLimitMap.set(ip, now)

  // Cleanup old entries (prevent unbounded growth)
  if (rateLimitMap.size > 5000) {
    const cutoff = now - 120_000
    for (const [k, v] of rateLimitMap) {
      if (v < cutoff) rateLimitMap.delete(k)
    }
  }

  // Telegram — non-blocking, failure doesn't affect response
  sendTelegram(body, inserted.id)

  return NextResponse.json({ success: true })
}
