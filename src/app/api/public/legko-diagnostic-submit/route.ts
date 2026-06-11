import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// legko quiz shows "35–45 лет" etc, DB constraint expects '35-45' etc
const AGE_MAP: Record<string, string> = {
  '35–45 лет': '35-45',
  '46–55 лет': '46-55',
  '56–65 лет': '56-65',
  'больше 65 лет': '65+',
}

function validate(body: Record<string, unknown>): string | null {
  if (!AGE_MAP[body.age_range as string]) return 'Укажите возраст'
  if (!Array.isArray(body.problems) || (body.problems as string[]).length === 0) return 'Укажите что беспокоит'
  if (!body.davnost) return 'Укажите как давно беспокоит'
  if (!body.preparaty) return 'Укажите про препараты'
  if (!body.tried) return 'Укажите что пробовали'
  if (!body.readiness) return 'Укажите готовность'
  const name = ((body.name as string) ?? '').trim()
  if (name.length < 2) return 'Укажите имя (минимум 2 символа)'
  const contact = ((body.contact as string) ?? '').trim()
  if (!contact) return 'Укажите способ связи'
  return null
}

async function sendTelegram(body: Record<string, unknown>, id: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const name = body.name as string
  const contact = body.contact as string
  const problems = (body.problems as string[]).map(p => `• ${p}`).join('\n')
  const dateTime = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })

  const message = [
    `🌿 <b>Новая анкета — «Лёгкость перемен»</b>`,
    ``,
    `👤 Имя: ${name}`,
    `💬 Контакт: ${contact}`,
    ``,
    `🔥 <b>Что беспокоит:</b>`,
    problems,
    ``,
    `⏳ <b>Давность:</b> ${body.davnost}`,
    `💊 <b>Препараты:</b> ${body.preparaty}`,
    `🔧 <b>Что пробовали:</b> ${body.tried}`,
    `✅ <b>Готовность:</b> ${body.readiness}`,
    ``,
    `⏰ ${dateTime}`,
    `🔗 ID: ${id}`,
  ].join('\n')

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    })
  } catch {
    // Non-critical
  }
}

const rateLimitMap = new Map<string, number>()

export async function POST(request: Request) {
  const hdrs = await headers()
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    hdrs.get('x-real-ip') ??
    'unknown'
  const userAgent = hdrs.get('user-agent') ?? ''

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

  // Build labeled comment with all answers for easy reading in admin
  const commentLines = [
    `Возраст: ${body.age_range}`,
    `Что беспокоит: ${(body.problems as string[]).join('; ')}`,
    `Давность: ${body.davnost}`,
    `Препараты: ${body.preparaty}`,
    `Что пробовали: ${body.tried}`,
    `Готовность: ${body.readiness}`,
    `Контакт (как удобно): ${body.contact}`,
  ].join('\n')

  const row = {
    age_range: AGE_MAP[body.age_range as string],
    problems: body.problems as string[],
    // Map legko-specific fields into existing columns with labeled values
    tried_result: `Давность: ${body.davnost}`,
    motivation: `Препараты: ${body.preparaty}`,
    tried_methods: [body.tried as string],
    readiness: body.readiness as string,
    name: ((body.name as string)).trim(),
    contact_tg: ((body.contact as string)).trim(),
    contact_wa: null,
    contact_email: null,
    comment: commentLines,
    user_agent: userAgent,
    ip,
    source: 'legko_landing',
    status: 'new',
  }

  const supabase = createServiceClient()
  const { data: inserted, error: dbError } = await supabase
    .from('klub_diagnostics')
    .insert(row)
    .select('id')
    .single()

  if (dbError) {
    console.error('[legko-diagnostic] DB error:', dbError)
    return NextResponse.json({ error: 'Ошибка сохранения. Попробуйте ещё раз.' }, { status: 500 })
  }

  rateLimitMap.set(ip, now)
  if (rateLimitMap.size > 5000) {
    const cutoff = now - 120_000
    for (const [k, v] of rateLimitMap) if (v < cutoff) rateLimitMap.delete(k)
  }

  sendTelegram(body, inserted.id)

  return NextResponse.json({ success: true })
}
