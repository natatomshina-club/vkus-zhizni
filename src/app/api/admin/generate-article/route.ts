import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

// Default prompt template — used when seo_settings has no custom prompt
// Placeholders: {main_keyword}, {keywords_list}
const DEFAULT_ARTICLE_PROMPT = `Напиши SEO-статью для блога на тему: {main_keyword}

Ключевые запросы кластера (используй ВСЕ минимум по 1 разу):
{keywords_list}

Аудитория: женщины 30-50 лет, хотят похудеть без жёстких диет и поправить здоровье и самочувствие
Тон: дружелюбный, живой, как советует подруга-эксперт, от первого лица
Объём: СТРОГО 1200-1500 слов. Считай слова. Не больше.

Структура — РОВНО 4 раздела H2, не больше:
- H1 + вступление: 100-120 слов
- H2 раздел 1: 250-300 слов
- H2 раздел 2: 250-300 слов
- H2 раздел 3: 250-300 слов
- H2 раздел 4: 250-300 слов
- Заключение: 80-100 слов

Итого: ~1300 слов. Стоп. Больше не писать.
Каждый раздел раскрывает ТОЛЬКО свою тему — не смешивай темы между разделами.
1-2 маркированных или нумерованных списка в любом из разделов.
Заключение заканчивается: «Хотите больше? Присоединяйтесь к Клубу Вкус Жизни → https://nata-tomshina.ru/join»

Голос автора:
- Пишешь от лица Натальи: «я», «мои клиентки», «в моей практике»
- 1-2 примера из практики («Ко мне обратилась женщина 43 лет...»)
- НЕ использовать: кето, лоукарб, LCHF, кетоз
- Вместо них: питание для гормонального баланса, метаболическое питание
- Раскрывай ТОЛЬКО тему ключевиков — не упоминай гормоны если это не тема статьи
- Конкретные цифры, сроки, примеры продуктов

Чего избегать:
- Не начинай с «В современном мире», «Ни для кого не секрет»
- Не перечисляй ключи подряд
- Не пассивный залог

Верни ТОЛЬКО в таком формате, без другого текста:
<title>H1 заголовок</title>
<slug>slug-latinitsey-cherez-defis</slug>
<excerpt>анонс 150-160 символов с главным ключом</excerpt>
<meta_title>до 60 символов с главным ключом</meta_title>
<meta_description>150-160 символов</meta_description>
<content>
весь HTML контент статьи здесь
</content>`


type ImageSpec = {
  position: 'cover' | 'after_intro' | 'mid_article' | 'conclusion'
  prompt_en: string
  alt: string
}

type GeneratedImage = ImageSpec & { url: string }

type ArticleBaseFields = {
  title: string
  slug: string
  excerpt: string
  meta_title: string
  meta_description: string
  content: string
}

type ArticleResult = ArticleBaseFields & {
  cover_image_url: string
  images: GeneratedImage[]
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY не настроен' }, { status: 500 })

  const body = await request.json() as {
    seo_cluster_id?: string
    cluster_id?: string
    keyword?: string
    relatedKeywords?: string[]
    wordCount?: number
  }

  console.log('Request body:', JSON.stringify(body))
  console.log('seo_cluster_id:', body.seo_cluster_id)
  console.log('cluster_id (old):', body.cluster_id)

  const supabase = createServiceClient()

  // Resolve keywords from source
  let mainKeyword: string
  let keywordsList: string

  if (body.seo_cluster_id) {
    // New flow: seo_clusters table
    const { data: cluster, error } = await supabase
      .from('seo_clusters')
      .select('main_keyword, keywords')
      .eq('id', body.seo_cluster_id)
      .single()

    console.log('[generate-article] seo_cluster keywords:', cluster?.keywords)

    if (error || !cluster) {
      return NextResponse.json({ error: 'Кластер не найден' }, { status: 400 })
    }
    mainKeyword = cluster.main_keyword as string
    keywordsList = (cluster.keywords as string[]).join(', ')
  } else if (body.cluster_id) {
    // Legacy flow: keyword_queue table
    const { data: clusterItems, error } = await supabase
      .from('keyword_queue')
      .select('keyword')
      .eq('cluster_id', body.cluster_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    console.log('[generate-article] keyword_queue items:', clusterItems?.map(k => k.keyword))

    if (error || !clusterItems?.length) {
      return NextResponse.json({ error: 'Кластер не найден или пустой' }, { status: 400 })
    }
    mainKeyword = clusterItems[0].keyword
    keywordsList = clusterItems.map(k => k.keyword).join(', ')
  } else {
    const keyword = body.keyword?.trim()
    if (!keyword) return NextResponse.json({ error: 'keyword, seo_cluster_id или cluster_id обязателен' }, { status: 400 })
    mainKeyword = keyword
    const related = (body.relatedKeywords ?? []).slice(0, 15)
    keywordsList = related.length > 0 ? [keyword, ...related].join(', ') : keyword
  }

  console.log('main_keyword:', mainKeyword)
  console.log('keywords_list:', keywordsList)

  const anthropic = new Anthropic({ apiKey })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      try {
        // ── Request 1: Article text (XML format) ─────────────────────────────
        // Load prompt template from DB (seo_settings key='article_prompt'), fallback to default
        const { data: promptSetting } = await supabase
          .from('seo_settings')
          .select('value')
          .eq('key', 'article_prompt')
          .single()
        const promptTemplate = promptSetting?.value ?? DEFAULT_ARTICLE_PROMPT
        console.log('[generate-article] Prompt from DB length:', promptTemplate.length, '| first 100:', promptTemplate.slice(0, 100))

        const articleUserPrompt = promptTemplate
          .replace(/\{main_keyword\}/g, mainKeyword)
          .replace(/\{keywords_list\}/g, keywordsList)

        const messageStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 6000,
          system: 'Ты — интегративный нутрициолог Наталья Томшина. Отвечаешь ТОЛЬКО в формате XML-тегов, без какого-либо текста до или после.',
          messages: [{ role: 'user', content: articleUserPrompt }],
        })

        let fullText = ''
        for await (const event of messageStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text
            enqueue({ text: event.delta.text })
          }
        }

        console.log('[generate-article] Raw response length:', fullText.length, '| first 200:', fullText.slice(0, 200))

        const parsed = parseArticleXML(fullText)
        if ('error' in parsed) {
          enqueue({ error: parsed.error, raw: fullText.slice(0, 1000) })
          controller.close()
          return
        }

        // ── Request 2: Image prompts ─────────────────────────────────────────
        console.log('[generate-article] Starting image prompts generation...')
        console.log('[generate-article] FAL_KEY present:', !!process.env.FAL_KEY)
        enqueue({ progress: '🖼 Создаём промпты для картинок...' })

        const h2Titles = extractH2Titles(parsed.content)
        console.log('[generate-article] H2 titles for image prompts:', h2Titles)

        const imageSpecPrompt = `На основе этой статьи создай промпты для 3 иллюстраций.
Статья: ${parsed.title}
Разделы H2: ${h2Titles.join(' | ')}

Для каждой картинки промпт должен отражать КОНКРЕТНОЕ содержание раздела.

Стиль: Polished Cartoon — яркие, дружелюбные иллюстрации с женскими силуэтами,
тёплая цветовая палитра (зелёный #4CAF78, фиолетовый #7C5CFC, кремовый #FAF8FF).
Без реалистичных фото еды. Без текста на картинке.
Горизонтальный формат 16:9 для after_intro и mid_article, квадрат для cover.

Каждый prompt_en начинается с: "Polished cartoon illustration, warm colors, "

Верни JSON массив (только JSON, никакого текста вокруг):
[
  {"position": "cover", "prompt_en": "Polished cartoon illustration, warm colors, ...", "alt": "alt на русском"},
  {"position": "after_intro", "prompt_en": "Polished cartoon illustration, warm colors, ...", "alt": "..."},
  {"position": "mid_article", "prompt_en": "Polished cartoon illustration, warm colors, ...", "alt": "..."}
]`

        let imageSpecs: ImageSpec[] = []
        try {
          const imagePromptsMsg = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1000,
            system: 'Отвечай ТОЛЬКО валидным JSON. Никакого текста вне JSON.',
            messages: [{ role: 'user', content: imageSpecPrompt }],
          })
          const imgText = imagePromptsMsg.content
            .filter(b => b.type === 'text')
            .map(b => b.text)
            .join('')
          console.log('[generate-article] Raw image prompts response:', imgText.slice(0, 500))
          imageSpecs = parseImageSpecs(imgText)
          console.log('[generate-article] Image prompts received:', imageSpecs.length, JSON.stringify(imageSpecs))
        } catch (e) {
          console.error('[generate-article] Image specs request failed:', e)
        }

        // ── Generate images via Google Gemini ────────────────────────────────
        let generatedImages: GeneratedImage[] = []
        if (imageSpecs.length > 0) {
          enqueue({ progress: `🎨 Создаём ${imageSpecs.length} картинки параллельно...` })

          const imagePromises = imageSpecs.map(async (spec) => {
            try {
              const url = await generateAndUploadImage(spec, parsed.slug, supabase)
              if (url) {
                enqueue({ imageProgress: { position: spec.position, url } })
                return { ...spec, url } as GeneratedImage
              }
              return null
            } catch (e) {
              console.error(`[generate-article] Image ${spec.position} exception:`, e)
              return null
            }
          })

          const results = await Promise.all(imagePromises)
          generatedImages = results.filter(Boolean) as GeneratedImage[]
        }

        // ── Assemble final article ───────────────────────────────────────────
        const coverImage = generatedImages.find(i => i.position === 'cover')
        const inlineImages = generatedImages.filter(i => i.position !== 'cover')
        const content = insertImagesIntoContent(parsed.content, inlineImages)

        const article: ArticleResult = {
          title: parsed.title,
          slug: parsed.slug,
          excerpt: parsed.excerpt,
          meta_title: parsed.meta_title,
          meta_description: parsed.meta_description,
          content,
          cover_image_url: coverImage?.url ?? '',
          images: generatedImages,
        }

        enqueue({ done: true, article })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Ошибка генерации'
        enqueue({ error: msg })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// ── XML parsing ──────────────────────────────────────────────────────────────

function parseXmlField(text: string, tag: string): string {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
  return match?.[1]?.trim() ?? ''
}

function parseArticleXML(raw: string): ArticleBaseFields | { error: string } {
  const title = parseXmlField(raw, 'title')
  const slug = parseXmlField(raw, 'slug')
  const excerpt = parseXmlField(raw, 'excerpt')
  const meta_title = parseXmlField(raw, 'meta_title')
  const meta_description = parseXmlField(raw, 'meta_description')
  const content = parseXmlField(raw, 'content')

  const missing = ['title', 'slug', 'excerpt', 'meta_title', 'meta_description', 'content']
    .filter(f => !parseXmlField(raw, f))

  if (missing.length > 0) {
    console.error('[generate-article] Missing XML fields:', missing, '| raw start:', raw.slice(0, 300))
    return { error: `Не удалось распарсить поля: ${missing.join(', ')}` }
  }

  const cleanSlug = slug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  console.log('[generate-article] XML parse OK — title:', title, '| slug:', cleanSlug)

  return { title, slug: cleanSlug, excerpt, meta_title, meta_description, content }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractH2Titles(html: string): string[] {
  const matches = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)]
  return matches.map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean)
}

function parseImageSpecs(text: string): ImageSpec[] {
  const stripped = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  const start = stripped.indexOf('[')
  const end = stripped.lastIndexOf(']')
  if (start === -1 || end === -1) return []
  try {
    const arr = JSON.parse(stripped.slice(start, end + 1)) as ImageSpec[]
    return arr.filter(s => s.position && s.prompt_en && s.alt)
  } catch {
    return []
  }
}

async function generateAndUploadImage(
  spec: ImageSpec,
  slug: string,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<string | null> {
  const googleApiKey = process.env.GOOGLE_API_KEY
  if (!googleApiKey) return null

  try {
    const { GoogleGenAI, Modality } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey: googleApiKey })

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-preview-image-generation',
      contents: spec.prompt_en,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    })

    const parts = response.candidates?.[0]?.content?.parts ?? []
    const imagePart = parts.find((p: { inlineData?: { mimeType?: string; data?: string } }) => p.inlineData?.mimeType?.startsWith('image/'))
    if (!imagePart?.inlineData?.data) return null

    const buffer = Buffer.from(imagePart.inlineData.data, 'base64')
    const storagePath = `blog/${slug}/${spec.position}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })

    if (uploadError) return null

    const { data: publicUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(storagePath)

    return publicUrlData.publicUrl
  } catch (e) {
    console.error('[generate-article] Gemini image error:', e)
    return null
  }
}

function insertImagesIntoContent(
  content: string,
  images: Array<{ position: string; url: string; alt: string }>,
): string {
  let html = content
  for (const img of images) {
    const tag = `<img src="${img.url}" alt="${img.alt}" loading="lazy" class="blog-image" style="width:100%;border-radius:12px;margin:24px 0;">`
    if (img.position === 'after_intro') {
      const idx = html.indexOf('</p>')
      if (idx !== -1) html = html.slice(0, idx + 4) + '\n' + tag + '\n' + html.slice(idx + 4)
    } else if (img.position === 'mid_article') {
      let count = 0, searchIdx = 0
      while (count < 2) {
        const found = html.indexOf('</h2>', searchIdx)
        if (found === -1) break
        searchIdx = found + 5
        count++
      }
      if (count === 2) html = html.slice(0, searchIdx) + '\n' + tag + '\n' + html.slice(searchIdx)
    } else if (img.position === 'conclusion') {
      const idx = html.lastIndexOf('</h2>')
      if (idx !== -1) {
        const after = idx + 5
        html = html.slice(0, after) + '\n' + tag + '\n' + html.slice(after)
      }
    }
  }
  return html
}
