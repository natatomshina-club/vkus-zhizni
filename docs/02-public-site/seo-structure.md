# SEO и индексация публичного сайта

`nata-tomshina.ru` — публичный сайт проекта. Документ описывает структуру URL, навигацию, техническое SEO: sitemap, robots, метатеги, Schema.org, canonical URL.

**Не описывается здесь:** дизайн-система, роутинг клуба, правила контента, SEO-блог (отдельный проект, R64), аналитика, контент-публикация.

---

## Механизм роутинга

Весь публичный сайт живёт в `src/app/public-site/`. Одно Next.js-приложение обслуживает оба домена. Роутинг — `src/proxy.ts`:

```js
// Пути, переписываемые с nata-tomshina.ru → /public-site/*
PUBLIC_SITE_PATHS = ['/blog', '/recipes', '/metabolicheskoe-pohudenie', '/results', '/club',
                     '/free', '/free-kurs', '/marathon', '/menyu', '/racion', '/legko', '/obuchenie']
```

`nata-tomshina.ru/metabolicheskoe-pohudenie` → proxy rewrite → `/public-site/metabolicheskoe-pohudenie`.  
`nata-tomshina.ru/partner` — НЕ в списке → маршрутизируется в `src/app/partner/` напрямую.

---

## Карта URL'ов

### Статические страницы

| URL | Файл | Примечание |
|---|---|---|
| `/` | `public-site/page.tsx` | Главная |
| `/metabolicheskoe-pohudenie` | `public-site/metabolicheskoe-pohudenie/page.tsx` | Pillar «Метаболическое похудение» (быв. `/about`) |
| `/metabolicheskoe-pohudenie/menu` | `public-site/metabolicheskoe-pohudenie/menu/page.tsx` | Cluster-статья «Меню на неделю» |
| `/club` | `public-site/club/page.tsx` | Главный конверсионный лендинг |
| `/free` | `public-site/free/` | Бесплатный мини-курс |
| `/free-kurs`, `/free-kurs/plan`, `/free-kurs/racion` | `public-site/free-kurs/` | |
| `/marathon` | `public-site/marathon/` | |
| `/menyu` | `public-site/menyu/` | Базовая + `/[category]` |
| `/racion` | `public-site/racion/` | |
| `/results` | `public-site/results/page.tsx` | Листинг историй успеха |
| `/partner` | `src/app/partner/` | Не в public-site — отдельный app-dir |

### Динамические страницы

| Паттерн | Источник данных | Условие |
|---|---|---|
| `/blog/[category]` | `blog_hubs` (DB) | `is_ready=true, is_indexed=true` |
| `/blog/[category]/[subcategory]` | `blog_subcategory_hubs` (DB) | `is_ready=true, is_indexed=true` |
| `/blog/[category]/[subcategory]/[slug]` | `blog_posts` | `is_published=true` |
| `/recipes/[category]` | RECIPES_CONFIG (статичный список) | |
| `/recipes/[category]/[slug]` | `blog_posts` | `type='recipe'` |
| `/results/[slug]` | `results_stories` | `published=true` |
| `/menyu/[category]` | статичный список | |

---

## Навигация

### Шапка — PublicNav (`src/components/public/PublicNav.tsx`)

| Пункт | URL | Примечание |
|---|---|---|
| Бесплатный мини-курс 🎁 | `/free` | Выделен badge |
| О методе | `/metabolicheskoe-pohudenie` | |
| Результаты | `/results` | |
| Марафон | `/marathon` | |
| ~~Рецепты~~ | `/recipes` | **Закомментировано в коде** — страница есть, в хедере нет (R102) |
| Блог | `/blog` | |
| Вступить в клуб (CTA) | `/club` | |

### Подвал — PublicFooter (`src/components/public/PublicFooter.tsx`)

О методе · Результаты · Меню · Рецепты · Блог · Марафон · Клуб · **Партнёрская программа** (highlight)

Внешние ссылки в подвале: `club.nata-tomshina.ru/legal/privacy`, `nata-tomshina.ru/legal`

---

## Sitemap

**Файл:** `src/app/public-site/sitemap.ts`, реэкспортируется через `src/app/sitemap.ts`  
**URL:** `https://nata-tomshina.ru/sitemap.xml`  
**Revalidate:** 3600 сек

### Что входит

| Раздел | Priority | Источник |
|---|---|---|
| `/` | 1.0 | статично |
| `/blog` | 0.8 | статично |
| `/recipes` | 0.8 | статично |
| `/metabolicheskoe-pohudenie` | 0.9 | статично |
| `/metabolicheskoe-pohudenie/menu` | 0.7 | статично |
| `/club` | 0.95 | статично |
| `/blog/[category]` | — | `blog_hubs`, `is_ready+is_indexed` |
| `/blog/[category]/[subcategory]` | — | `blog_subcategory_hubs`, `is_ready+is_indexed` |
| `/recipes/[category]` | — | RECIPES_CONFIG |
| `/blog/[cat]/[subcat]/[slug]` (статьи) | 0.6 | `blog_posts`, `is_published=true` |
| `/recipes/[category]/[slug]` | 0.6 | `blog_posts`, `type='recipe'` |
| `/results/[slug]` | 0.7 | `results_stories`, `published=true` |

### Что НЕ входит в sitemap

`/free`, `/free-kurs`, `/marathon`, `/racion`, `/menyu` — намеренно (не SEO-страницы, лидогенерация).

**`/results` (листинг историй успеха)** — есть canonical, но в sitemap не добавлена. Поисковики найдут через внутренние ссылки, но неоптимально для важной страницы (R97).

---

## Robots.txt

> [!important] Два файла — победитель один.
>
> В проекте существуют **два** robots-файла:
> - `public/robots.txt` — статический файл
> - `src/app/public-site/robots.ts` — динамический Next.js route
>
> **Победитель: `public/robots.txt`**

Почему: middleware (`src/proxy.ts`) содержит matcher с явным исключением:

```js
matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)']
```

Запросы к `/robots.txt` **не перехватываются proxy** и не переписываются в `/public-site/robots.txt`. Next.js отдаёт статический файл из `public/` напрямую.

`src/app/public-site/robots.ts` генерирует `/public-site/robots.txt` — URL, который поисковики никогда не запрашивают. Это мёртвый код: правки в `robots.ts` не влияют на то, что видят поисковики (R100). Если нужно изменить директивы — редактировать `public/robots.txt`.

**Действующее содержимое `public/robots.txt`:**

```
User-agent: *
Allow: /blog
Allow: /recipes
Allow: /about
Allow: /club
Allow: /results
Disallow: /admin
Disallow: /api
Disallow: /dashboard
Disallow: /partner

Sitemap: https://nata-tomshina.ru/sitemap.xml
```

---

## Метатеги

**metadataBase:** `new URL('https://nata-tomshina.ru')` — задан в `src/app/layout.tsx`.  
**Язык:** `<html lang="ru">` в root layout.

| Страница | title | description | canonical | OG |
|---|---|---|---|---|
| `/` | ✓ | ✓ | ✓ | ✓ type: website |
| `/metabolicheskoe-pohudenie` | ✓ | ✓ | ✓ | ✓ type: article |
| `/metabolicheskoe-pohudenie/menu` | ✓ | ✓ | ✓ | ✓ type: article |
| `/results` | ✓ | ✓ | ✓ | ✓ |
| `/club` | ✓ | ✓ | **нет** | **нет og:url** |
| `/results/[slug]` | `generateMetadata` ✓ | ✓ | ✓ | noindex если `!published` |
| `/blog/[cat]/[subcat]/[slug]` | `generateMetadata` ✓ | ✓ | ✓ | ✓ |
| `/blog/[cat]` | ✓ | ✓ | ✓ | noindex если `!is_indexed` |
| `/recipes/[cat]/[slug]` | `generateMetadata` ✓ | ✓ | **нет** | ✓ |

---

## Schema.org / JSON-LD

Реализация: inline `<script type="application/ld+json">` прямо в компонентах страниц.  
`<Breadcrumbs />` (`src/components/public/Breadcrumbs.tsx`) всегда эмитирует `BreadcrumbList`.

| Страница | Тип схемы | Статус |
|---|---|---|
| `/blog/[cat]/[subcat]/[slug]` | `BlogPosting` + `Person` + `Organization` + `BreadcrumbList` | ✓ |
| `/blog/[cat]` | `CollectionPage` + `BreadcrumbList` (@graph) | ✓ |
| `/recipes/[cat]/[slug]` | `Recipe` | ✓ |
| `/metabolicheskoe-pohudenie` | `Article` + `Person` + `Organization` + `FAQPage` + `BreadcrumbList` (@graph) | ✓ |
| `/metabolicheskoe-pohudenie/menu` | `Article` + `Person` + `Organization` + `FAQPage` + `BreadcrumbList` (@graph) | ✓ |
| Любая страница с `<Breadcrumbs />` | `BreadcrumbList` | ✓ |
| `/` | **нет** (`WebSite` + `Organization` отсутствует) | пробел (R101) |
| `/results` листинг | **нет** | пробел |
| `/results/[slug]` | **нет** | пробел |
| `/club`, `/free`, `/marathon` | **нет** | OK, лендинги |

---

## Canonical URLs — сводка

| URL | Canonical | Примечание |
|---|---|---|
| `/` | ✓ | |
| `/metabolicheskoe-pohudenie` | ✓ | |
| `/metabolicheskoe-pohudenie/menu` | ✓ | |
| `/results` | ✓ | |
| `/blog/*` | ✓ | все уровни |
| `/results/[slug]` | ✓ | |
| `/club` | **нет** | Главный лендинг без canonical — риск дублирования с `/` в индексе (R99) |
| `/recipes/[cat]/[slug]` | **нет** | `generateMetadata` без `alternates.canonical` (R98) |

---

## Особые случаи

### noindex

- `/blog/[cat]` — `noindex` когда `!is_indexed` в `blog_hubs` (DB)
- `/results/[slug]` — `noindex` когда `!published` в `results_stories`

### 404

Кастомная страница: `src/app/public-site/not-found.tsx`. Ссылки на `/`, `/blog`, `/recipes`, `/club`. Без специальных метатегов — 404 отдаётся по HTTP-статусу.

### Редиректы

Настроенные permanent-редиректы (`next.config.ts`, `redirects()`):

```
/about  →  /metabolicheskoe-pohudenie  (permanent, 308)
/blog/pohudenie/bez-diet-bez-golodaniy/:path*  →  /blog/pohudenie/bez-diet-bez-sporta/:path*  (permanent)
```

> Next.js `permanent: true` отдаёт 308, не 301 — Google обрабатывает их одинаково.

**`/welcome` отсутствует.** Старый редирект `/welcome?plan=monthly` из эпохи Prodamus (`SESSION_2026-05-19_VAULT_HANDOFF.md`) — следов в коде нет. Закрытый вопрос.

---

## SEO tech debt — открытые задачи

| Номер | Приоритет | Суть |
|---|---|---|
| R97 | низкий | `/results` (листинг историй успеха) — есть canonical, нет в sitemap |
| R98 | средний | `/recipes/[cat]/[slug]` — нет `canonical` в `generateMetadata` |
| R99 | средний | `/club` — нет `alternates.canonical` и `openGraph.url` |
| R100 | низкий | `src/app/public-site/robots.ts` — мёртвый код, правки не влияют на SEO |
| R101 | средний | Нет Schema.org на `/` (`WebSite`+`Organization`) и `/about` (`Person`) |
| R102 | средний | `/recipes` скрыт из PublicNav — страница есть в sitemap, нет в хедере |

R96 (Rule #11 в middleware, кураторская auth) — в `docs/08-roadmap/todo.md`, не в этом модуле.

Детали всех пунктов: [[08-roadmap/todo]].

---

## Связано

- [[02-public-site/architecture]] — общая архитектура публичного сайта
- [[05-infrastructure/server]] — nginx, certbot, домены
- [[08-roadmap/todo]] — R97-R102 с деталями

---

## История изменений

| Дата | Событие |
|---|---|
| 2026-05-23 | Документ создан — разведка по коду |
| 2026-06-14 | `/about` → `/metabolicheskoe-pohudenie` (rename + 308); добавлен `/menu` cluster; обновлены sitemap, nav, schema, canonical, proxy paths, redirects |
