# Changelog 14.06.2026 — pillar rename, статья-меню, лид-захват, антиспам

> Куда положить: `/vkus-zhizni/docs/changelog/2026-06-14_metabolicheskoe-pohudenie.md`

Все изменения этой сессии на боевом сайте. Коммиты в `main`.

## Коммиты

| Хэш | Что |
|-----|-----|
| `feff816` | rename `/about` → `/metabolicheskoe-pohudenie` + 301 + ссылки/Schema |
| `3b095d8` | новая страница `/metabolicheskoe-pohudenie/menu` + форма лид-магнита |
| `64544b4` | фикс honeypot (`website`→`company_url`, autoComplete=off) + правки pillar (тизер→кнопка, убран TOC chto-takoe, блок method-intro + CSS) |
| `c96c503` | централизованный антиспам (`anti-spam.ts`), `company_url` уходит в POST, гард во всех subscribe-роутах |
| `5fcbc79` | content(menu): +4 FAQ + tip-block «Где прячется срыв» + `dateModified` → IndexNow-пинг |
| `12bfd6e` | fix(menu): `article-body__inner` wrapper — ограничение ширины как на pillar |

## 1. Переименование pillar

- Папка `src/app/public-site/about` → `metabolicheskoe-pohudenie`.
- 301 в `next.config.ts` (`redirects()`); `src/proxy.ts` → `PUBLIC_SITE_PATHS`.
- Обновлены ссылки: `PublicNav.tsx`, `PublicFooter.tsx`, blog `[slug]/page.tsx`
  (Person Schema url), blog `[subcategory]/page.tsx` (CollectionPage.author),
  recipes `[slug]/page.tsx` (Recipe.author), `sitemap.ts`, `robots.txt`,
  `llms.txt`, внутренние `@id`/canonical/og.
- Проверено: `/about` → 308 permanent → новый URL; новый URL 200; canonical ок.

## 2. Статья-меню (статичный вложенный маршрут)

- `src/app/public-site/metabolicheskoe-pohudenie/menu/page.tsx` — полный JSX,
  ручной `@graph` (Article+Person+Organization+FAQPage), `<Breadcrumbs>`.
- CSS `.menu-table` в `blog-content.css` (на переменных темы).
- OG `/images/og/metabolicheskoe-pohudenie-menu.jpg` (1200×630).
- `sitemap.ts`: запись с приоритетом 0.7.

## 3. Лид-захват email

- `EmailForm.tsx` параметризован: пропсы `endpoint` (default
  `/api/public/subscribe`), `source`, `redirectTo` (default `/free-kurs`).
  Дефолты сохраняют поведение `/free` — обратная совместимость.
- Новый роут `src/app/api/public/subscribe-menu/route.ts` (клон `/subscribe`):
  пишет `source: 'menu-racion'`, шлёт письмо со **ссылкой** на
  `/pdf/racion-7-dney.pdf` (без вложения, `mailer.ts` не трогали), редирект
  `/free-kurs/racion`. Double opt-in нет (как в `/subscribe`).
- PDF заменён: `public/pdf/racion-7-dney.pdf` — на 1-й странице подзаголовок
  «Метаболическое питание · 3 приёма пищи в день». Имя файла прежнее (кнопка на
  `/free-kurs/racion` не тронута).
- БД `subscribers`: используется тег `source = 'menu-racion'` (поле было, раньше
  писался NULL).

## 4. Антиспам (на весь проект)

- `src/lib/anti-spam.ts`: `isHoneypotFilled()` + `rateLimit()` (Map в памяти,
  5 запросов/час/IP).
- Honeypot-поле: `company_url` (не `website`/`email`/`name` — ломало автозаполнение
  и роняло живые сабмиты), `autoComplete="off"`, спрятано CSS-офсетом.
- Гард в начале `subscribe/route.ts` и `subscribe-menu/route.ts`: honeypot →
  rate-limit → запись. Бот получает тихий `200`, без записи в БД и письма.

## 5. Контент pillar

- Удалён вступительный блок «Что такое метаболическое похудение».
- Добавлен блок `method-intro` (eyebrow «— МЕТОД —» + H2 «Метаболическое
  **похудение**» + lead + оранжевая callout-карточка с бейджем «ТЕМП · 2-3 кг»).
  CSS `.method-intro__*` в `blog-content.css` на переменных.
- Тизер «Меню на неделю»: «Статья скоро появится» → кнопка `.btn--green` на
  `/metabolicheskoe-pohudenie/menu`.

## IndexNow / индексация

- Ключ публичный (лежит в `/<key>.txt`). Статичные страницы авто-пинг не шлют —
  делаем вручную POST на `api.indexnow.org` (Яндекс+Bing). Google — через GSC URL
  Inspection.
- Пинговать после деплоя: pillar + `/menu`.

## Какие doc-файлы обновить в этом Vault

- `docs/redirects.md` (или аналог) — добавить 301 `/about` → `/metabolicheskoe-pohudenie`.
- `docs/lead-capture.md` — описать `EmailForm` пропсы, роуты `subscribe` /
  `subscribe-menu`, теги `source`, поток письма+редиректа.
- `docs/anti-spam.md` — новый: honeypot `company_url` + rate-limit, где подключён.
- `docs/seo-structure.md` (или карта URL) — pillar-cluster
  `/metabolicheskoe-pohudenie/menu`, sitemap-приоритеты.
