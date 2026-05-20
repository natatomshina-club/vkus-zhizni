# Техническая инфраструктура блога

Блог на `nata-tomshina.ru/blog` и раздел рецептов `/recipes` — два публичных URL-семейства на одной технической базе.

**Что описывается:** БД-таблицы, шаблоны страниц, маркеры рендеринга, флаги публикации, ISR, CSS-классы, admin-интерфейс.

**Что НЕ описывается:** SEO-стратегия SILO/Pillar/sub-pillar, семантические ядра, правила написания контента — это контентная вселенная, отдельный Vault (`Клуб разработка/БЛОГ + SEO/`). Маршрутизация и метатеги: [[02-public-site/seo-structure]].

---

## Архитектура

Два URL-семейства читают из одной таблицы `blog_posts`. Разделение через поле `category`:
- **`/blog/*`** — `category` принадлежит SILO_CONFIG (pohudenie, zdorovye, gormony, diety, bady)
- **`/recipes/*`** — `category` принадлежит RECIPES_CONFIG (pri-insulinorezistentnosti, pri-klimakse, …)

Ключи двух конфигов не пересекаются — это единственный discriminator. Поле `type` в `blog_posts` существует, но в шаблонах страниц не используется (см. ниже).

Три таблицы образуют трёхуровневую иерархию для блога:

```
blog_hubs             (/blog/[category])
  └── blog_subcategory_hubs  (/blog/[category]/[subcategory])
        └── blog_posts        (/blog/[cat]/[subcat]/[slug])
```

Рецепты (`/recipes`) используют только `blog_posts`.

---

## База данных

### `blog_posts`

Единая таблица для статей и рецептов.

| Поле | Тип | Назначение |
|---|---|---|
| `id` | uuid | PK |
| `slug` | text | URL-сегмент |
| `title` | text | Заголовок |
| `excerpt` | text | Краткое описание |
| `content` | text | HTML-тело |
| `cover_image_url` | text | Обложка |
| `is_published` | bool | Флаг публикации (единственный) |
| `published_at` | timestamptz | Выставляется автоматически |
| `meta_title` | text | SEO-заголовок |
| `meta_description` | text | SEO-описание |
| `category` | text | SILO_CONFIG-ключ (статья) или RECIPES_CONFIG-ключ (рецепт) |
| `subcategory` | text | Подкатегория (только у статей) |
| `widget_type` | text | Виджет в конце статьи (`none`, `ir_test`, `why_test`, …) |
| `main_keyword` | text | Основной ключ (SEO) |
| `cluster_name` | text | Кластер (SEO) |
| `type` | text | `'recipe'` — только в sitemap.ts, не в шаблонах |
| `created_at`, `updated_at` | timestamptz | |

Полная документация: [[02-public-site/blog-infrastructure]] (этот файл); БД-список: [[05-infrastructure/database]].

### `blog_hubs`

Pillar-страницы (`/blog/[category]`).

| Поле | Тип | Назначение |
|---|---|---|
| `id` | uuid | PK |
| `category` | text | UNIQUE, ключ из SILO_CONFIG |
| `is_ready` | bool | Контролирует рендер контента vs placeholder |
| `is_indexed` | bool | Контролирует noindex и попадание в sitemap |
| `meta_title` | text | Перекрывает дефолт из SILO_CONFIG |
| `meta_description` | text | |
| `content_html` | text | HTML с маркером `<!-- SUBCATEGORIES_PLACEHOLDER -->` |
| `updated_at` | timestamptz | |
| `updated_by` | uuid | `members.id` (email lookup ✓) |

Операция записи: upsert по `category`.

### `blog_subcategory_hubs`

Sub-pillar страницы (`/blog/[category]/[subcategory]`).

Поля аналогичны `blog_hubs` + `subcategory text`. Unique: `(category, subcategory)`. content_html содержит маркер `<!-- ARTICLES_PLACEHOLDER -->`.

---

## Шаблоны страниц

### `/blog/[category]/page.tsx` — Pillar-хаб

- `revalidate = 60`
- `generateStaticParams`: из `Object.keys(SILO_CONFIG)` — статичный список
- Читает из БД: `blog_hubs` (is_ready, content_html, meta) + `blog_posts` по category (is_published=true)
- Маркер `<!-- SUBCATEGORIES_PLACEHOLDER -->` — **обрабатывается** (partBefore + сетка подкатегорий + partAfter)
- noindex: `!(is_ready && is_indexed)`
- Если `!is_ready`: placeholder «✍️ Полный гид в разработке», content_html не рендерится
- Schema.org: `CollectionPage + BreadcrumbList` (@graph)
- Компоненты: PublicNav, Breadcrumbs, UnifiedHero(variant="pillar"), AuthorCard, PublicFooter

### `/blog/[category]/[subcategory]/page.tsx` — Sub-pillar хаб

- `revalidate = 60`
- `generateStaticParams`: из всех комбинаций SILO_CONFIG
- Читает из БД: `blog_subcategory_hubs` + `blog_posts` в subcategory (параллельно через Promise.all)
- Маркер `<!-- ARTICLES_PLACEHOLDER -->` — **обрабатывается** (contentBefore + сетка статей + contentAfter)
- noindex: `!(is_ready && is_indexed)`
- Если `!is_ready`: placeholder «✍️ Скоро появится полный гид»; если `!is_ready && маркер не найден` → contentBefore = ''
- Schema.org: `CollectionPage + BreadcrumbList` (@graph)
- Компоненты: PublicNav, Breadcrumbs, UnifiedHero(variant="hub"), related subcategory pills, Disclaimer, AuthorCard, RelatedSubcategories, PublicFooter

### `/blog/[category]/[subcategory]/[slug]/page.tsx` — Статья

- `revalidate = 60`
- `generateStaticParams`: из `blog_posts` (is_published=true, subcategory not null)
- Читает из БД: один post + related posts (3 шага: same subcategory → same category → any)
- CSS: `className="blog-content"` — стили из `blog-content.css`
- Schema.org: `BlogPosting` (inline JSON-LD)
- `widget_type`: если `'none'` → нет виджета; иначе `post.widget_type ?? selectWidget(main_keyword, cluster_name)`
- reading time: `calcReadingTime(html)` — 200 слов/мин
- Компоненты: PublicNav, Breadcrumbs, HorizontalBanner, UnifiedHero(variant="article"), BlogWidget, Disclaimer, AuthorCard, RelatedArticles, BlogSidebar(sticky), PublicFooter

### `/recipes/[category]/page.tsx` — Категория рецептов

- `revalidate = 60`
- `generateStaticParams`: из `Object.keys(RECIPES_CONFIG)` — статичный список
- Читает из БД: `blog_posts` WHERE `category={recipe_cat}` AND `is_published=true` (фильтр по category, не по type)
- `dynamicParams = true`, `dynamic = 'force-dynamic'`
- Нет canonical, нет Schema.org (R98 — только для slug, но и для category-page тоже)
- CSS: inline стили в JSX (не blog-content.css)

### `/recipes/[category]/[slug]/page.tsx` — Рецепт

- `revalidate = 60`
- `generateStaticParams`: из `blog_posts` WHERE `category IN RECIPES_CONFIG keys` AND `is_published=true`
- Читает из БД: `blog_posts` WHERE `slug=slug` AND `is_published=true` (нет фильтра по type)
- CSS: `className="recipe-content"` + инлайн `<style>` в компоненте — **не из blog-content.css**
- Schema.org: `Recipe` ✓
- Нет canonical в generateMetadata (R98)
- Компоненты: PublicNav, Breadcrumbs, HorizontalBanner, PublicFooter

---

## Маркеры рендеринга

### `<!-- SUBCATEGORIES_PLACEHOLDER -->` (в blog_hubs.content_html)

Используется на Pillar-странице. Код в `[category]/page.tsx`:

```js
const splitIdx = contentHtml.indexOf('<!-- SUBCATEGORIES_PLACEHOLDER -->')
const partBefore = splitIdx >= 0 ? contentHtml.slice(0, splitIdx) : contentHtml
const partAfter  = splitIdx >= 0 ? contentHtml.slice(splitIdx + marker.length) : ''
```

**Результат рендера:** `partBefore` → сетка подкатегорий (группированная для pohudenie, простая для остальных) → `partAfter`.  
Если маркер не найден — весь content_html → `partBefore`, `partAfter` = ''.  
Если `!is_ready` — content_html не рендерится, показывается placeholder.

**Маркер никогда не попадёт на страницу как текст.**

### `<!-- ARTICLES_PLACEHOLDER -->` (в blog_subcategory_hubs.content_html)

Используется на Sub-pillar странице. Аналогичная логика с `MARKER` константой.

**Результат рендера:** `contentBefore` → сетка статей → `contentAfter`.  
Если маркер не найден и `is_ready=true` — весь content_html → `contentBefore`.  
Если `!is_ready` — `contentBefore = ''`, показывается placeholder.

---

## Флаги публикации

### `blog_hubs` и `blog_subcategory_hubs`

| `is_ready` | `is_indexed` | noindex | content_html рендерится | В sitemap |
|---|---|---|---|---|
| false | любой | да | НЕТ (placeholder) | НЕТ |
| true | false | да | ДА | НЕТ |
| true | true | нет | ДА | ДА |

### `blog_posts`

| `is_published` | Доступна публично | В `generateStaticParams` | В sitemap |
|---|---|---|---|
| false | НЕТ | НЕТ | НЕТ |
| true | ДА | ДА | ДА |

У `blog_posts` нет `is_indexed` — все опубликованные статьи индексируются.

---

## ISR / revalidate

| Шаблон | revalidate | Задержка видимости изменений |
|---|---|---|
| Все шаблоны `/blog/*`, `/recipes/*` | 60 сек | До 1 минуты |
| Sitemap (`sitemap.ts`) | 3600 сек | До 1 часа |

После публикации или изменения статьи посетитель увидит обновление через ≤60 секунд.

---

## Разделение /blog vs /recipes

Единственный discriminator — поле `category`:
- Статьи: `category` ∈ SILO_CONFIG keys (`pohudenie`, `zdorovye`, `gormony`, `diety`, `bady`)
- Рецепты: `category` ∈ RECIPES_CONFIG keys (`pri-insulinorezistentnosti`, `pri-klimakse`, `pri-diabete`, `pri-gipotireoze`, `dlya-pokhudeniya`, `bez-sakhara`, `vysokobelkovye`, `zavtraki`)

Ключи не пересекаются. Шаблоны `generateStaticParams` и запросы в БД фильтруют по этим спискам.

### Поле `type` в blog_posts

Поле `type='recipe'` существует в `blog_posts`, но:
- В шаблонах страниц (`/blog/*`, `/recipes/*`) **не используется**
- В admin UI **не редактируется** и не показывается
- Используется только в `sitemap.ts`: `.eq('type', 'recipe')` для построения recipe URLs

Это источник бага в sitemap (R103).

---

## SILO_CONFIG и RECIPES_CONFIG

Файл: `src/lib/silo-config.ts`

**SILO_CONFIG** — 5 категорий блога:
- `pohudenie` — единственный с полным `subcategoriesData[]` (19 подкатегорий) и `POHUDENIE_GROUPS` — намеренная архитектура
- `zdorovye`, `gormony`, `diety`, `bady` — только `subcategories: {...}`, без `subcategoriesData`

**RECIPES_CONFIG** — 8 категорий рецептов (статичный список, не в БД):
pri-insulinorezistentnosti, pri-klimakse, pri-diabete, pri-gipotireoze, dlya-pokhudeniya, bez-sakhara, vysokobelkovye, zavtraki

**MENYU_CONFIG** — 6 категорий меню (для `/menyu` — вне scope блога)

Helper-функции: `isSiloCategory()`, `getSiloLabel()`, `getSiloSubLabel()`, `getArticleUrl()`

---

## Adminка `/admin/blog`

Файл: `src/app/(club)/admin/blog/page.tsx` (>2300 строк, 7 вкладок)

| Вкладка | Назначение |
|---|---|
| Статьи | CRUD `blog_posts`: title, slug, excerpt, content (textarea), cover_image_url, meta_title, meta_description, is_published, category (селектор), subcategory, widget_type |
| Хабы | Upsert `blog_hubs`: content_html, meta_title, meta_description, is_ready, is_indexed |
| Хабы подкатегорий | Upsert `blog_subcategory_hubs`: аналогично + subcategory |
| Темы | SEO-темы: `seo_topics`, `seo_clusters` |
| Генератор | AI-генерация статей |
| Настройки | Настройки блога |
| Черновики | Черновики статей |

### Селектор категорий — конфликт двух таксономий (R106)

В форме создания/редактирования статьи (вкладка «Статьи») категория выбирается из объединённого списка: сначала SILO_CONFIG (5 рубрик), затем BLOG_CATEGORIES (7 устаревших рубрик: insulin, thyroid, hormones, digestion, recipes, psychology, supplements). Статья с категорией из BLOG_CATEGORIES получит несуществующий URL — роуты под эти категории отсутствуют.

### Auth-паттерн

- `blog/route.ts`, `blog/[id]/route.ts`: используют `requireAdmin()` из `@/lib/auth/requireAdmin` — email lookup ✓
- `blog-hubs/route.ts`, `blog-subcategory-hubs/route.ts`: локальные копии `requireAdmin()` с тем же email lookup ✓ — дублирование кода (R104)

Rule #11 не нарушается ни в одном роуте блога.

---

## CSS-классы для контента

Файл: `src/app/public-site/blog-content.css` (42 KB)  
Важно: все селекторы начинаются с `.public-theme` — стили работают только внутри класса `.public-theme` (добавляется в public-site layout).

`.blog-content` — основная обёртка для статей и хабов.  
`.hub-content` — модификатор max-width для хабов.  
`.recipe-content` — для рецептов: инлайн `<style>` в компоненте, **не из blog-content.css**.

### Доступные классы блоков

| Класс | Назначение | data-theme |
|---|---|---|
| `.tip-block` + `.tip-icon` | Блок совета с иконкой и левой полосой | green/orange/blue/rose/wine/cream |
| `.kratko-block` | Блок «Кратко» с чек-лист пунктами (✓ иконки) | — |
| `.faq-block` + `.faq-item` | FAQ: вопрос h3 с «?»-иконкой, ответ p | — |
| `.comparison-table` | Div-таблица сравнения; схема 1: `.ct-col-bad`/`.ct-col-good`; схема 2: `.ct-col--bad`/`.ct-col--good` + `.ct-param` (3 колонки) | — |
| `.principle-step` + `.ps-num`, `.ps-body` | Шаг/принцип с оранжевым номером-квадратом | — |
| `.mistake-step` + `.ms-num`, `.ms-body` | Ошибка с красным номером | — |
| `.testimonial-card` + `.tc-header`, `.tc-avatar`, `.tc-name`, `.tc-tag`, `.tc-results`, `.tc-result`, `.tc-quote` | Карточка отзыва участницы | — |
| `.sources-list` + `.sl-title` | Список источников с нумерацией | — |
| `.cta-button` | Ссылка-кнопка | green/orange |
| `.highlight-stat` | Большая цифра-статистика по центру | — |
| `.disclaimer` + `.disclaimer__icon`, `.disclaimer__text` | Дисклеймер нутрициолога (жёлтая полоска) | — |
| `.author-block`, `.author-card` | Блок автора (legacy + новый); модификатор `.author-card--compact` | — |
| `.subcat-card` + `.arrow` | Карточка подкатегории с цветной полоской сверху | rose/green/blue/orange/cream |
| `.placeholder-block` | Заглушка «гид в разработке» (пунктирная рамка) | — |
| `.article-pill` + `.article-pill__sep` | Pill-бейдж категории/подкатегории | — |
| `.quote-card` + `.quote-card__mark`, `.quote-card__text`, `.quote-card__author` | Карточка цитаты | — |
| `.lead-magnet` + `__badge`, `__title`, `__desc`, `__form`, `__input` | Захват email внутри статьи | green |
| `.checklist-card` + `.checklist`, `.checklist__item`, `.checklist__icon`, `.checklist__name`, `.checklist__note` | Чеклист с зелёными галочками | — |
| `.cta-card` + `__glow`, `__content`, `__badge`, `__title`, `__desc`, `__icon` | Большой CTA-блок с градиентом | — |
| `.related-card` + `__thumb`, `__tag`, `__body`, `__title`, `__meta` | Карточка похожей статьи | — |
| `nav` внутри `.blog-content` | Содержание (ToC) — ol с нумерацией | — |
| `blockquote` | Блок цитаты с «"» декором | — |
| `table` | Таблица с закруглёнными углами | — |

Типографика `.blog-content`: `p` (margin 18px), `h2` (курсивный serif + буквица у первого `p::first-letter`), `h3`, `strong`, `em`, `a`, `ul`/`ol`, `img`, `blockquote`.

---

## Мёртвый и устаревший код

### `KeywordsTab()` (R105)

Функция `KeywordsTab()` существует в `src/app/(club)/admin/blog/page.tsx` (строка 319), но не включена в массив `TABS` — недостижима из UI ни при каких условиях.

### `BLOG_CATEGORIES` конфликт (R106)

`src/lib/blog-categories.ts` содержит 7 устаревших рубрик (insulin, thyroid, hormones, digestion, recipes, psychology, supplements) — таксономия до SILO_CONFIG. Используется в селекторе категорий в форме статьи вместе с SILO_CONFIG. Статья, созданная с категорией из BLOG_CATEGORIES, получит несуществующий URL.

### Дублирование `requireAdmin()` (R104)

`blog-hubs/route.ts` и `blog-subcategory-hubs/route.ts` содержат локальные копии функции вместо импорта `@/lib/auth/requireAdmin`. Логика корректная, но поддерживать нужно в двух местах.

---

## SEO tech debt (из блога)

| Номер | Приоритет | Суть |
|---|---|---|
| R103 | средний-высокий | Баг sitemap: все `blog_posts` (включая рецепты) попадают в blog-секцию sitemap с URL `/blog/{slug}` — несуществующий URL для рецептов → 404 в индексе Google/Яндекс |
| R104 | низкий | Дублирование `requireAdmin()` в blog-hubs и blog-subcategory-hubs |
| R105 | низкий | `KeywordsTab()` — мёртвый код в admin/blog |
| R106 | средний | Конфликт двух таксономий в селекторе категорий: SILO_CONFIG + BLOG_CATEGORIES |

Детали: [[08-roadmap/todo]].

---

## Связано

- [[02-public-site/seo-structure]] — URL-карта, robots, sitemap, метатеги, Schema.org
- [[05-infrastructure/database]] — схема БД (blog_posts, blog_hubs, blog_subcategory_hubs)
- `src/lib/silo-config.ts` — SILO_CONFIG, RECIPES_CONFIG, MENYU_CONFIG

---

## История изменений

| Дата | Событие |
|---|---|
| 2026-05-23 | Документ создан — разведка по коду |
