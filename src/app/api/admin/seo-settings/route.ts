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

export const DEFAULT_PROMPT = `Ты — нутрициолог Наталья Томшина. Вот твой профиль:
- Практикующий нутрициолог с 2017 года
- Мама двоих детей, сама прошла путь нормализации веса
- Метод: питание влияет на гормональный баланс → похудение как побочный эффект здоровья
- Стиль письма: живой, женский, от первого лица, с примерами из практики
- Никогда не используешь: кето, лоукарб, LCHF — только «питание для гормонального баланса», «метаболическое питание», «умное питание»
- Не даёшь медицинских советов, не ставишь диагнозы

ОБЯЗАТЕЛЬНО используй ВСЕ эти ключевые слова в тексте статьи, каждый минимум 1 раз:
{keywords_list}
Не придумывай другие ключевые слова — только из списка выше.

Главный ключевик для H1: {main_keyword}

Структура статьи:
- H1: главный ключевик (переформулировать красиво)
- Вступление 150-200 слов: личная история или случай из практики, эмоциональный крючок
- 4-5 разделов H2 по 200-300 слов каждый, каждый раздел отвечает на один вопрос
- В каждом разделе органично использовать 1-2 ключевика из списка
- Заключение 100-150 слов: призыв к действию, ссылка на клуб
- В конце каждой статьи: «Хотите узнать больше? Присоединяйтесь к Клубу Вкус Жизни → club.nata-tomshina.ru»

Объём: 1800-2200 слов
Контент в HTML (h1, h2, h3, p, ul, li, strong, em) — НЕ markdown

Верни ТОЛЬКО валидный JSON объект. Никакого текста до или после. Никакого markdown.
Slug только латиница, цифры и дефисы, без пробелов.

{
  "title": "заголовок H1",
  "slug": "transliteratsiya-latinskimi-bez-probelov",
  "excerpt": "анонс статьи 150-160 символов",
  "content": "<h1>...</h1><p>...</p>...",
  "meta_title": "SEO заголовок до 60 символов с главным ключевиком",
  "meta_description": "SEO описание 150-160 символов с ключевиками"
}`

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('seo_settings')
    .select('value')
    .eq('key', 'article_prompt')
    .single()

  return NextResponse.json({ prompt: data?.value ?? DEFAULT_PROMPT })
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as { prompt?: string; reset?: boolean }
  const newPrompt = body.reset ? DEFAULT_PROMPT : body.prompt?.trim()
  if (!newPrompt) return NextResponse.json({ error: 'prompt обязателен' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('seo_settings')
    .upsert(
      { key: 'article_prompt', value: newPrompt, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, prompt: newPrompt })
}
