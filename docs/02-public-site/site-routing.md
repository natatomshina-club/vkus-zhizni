# Роутинг и архитектура двух доменов

Описывает как один монорепо `vkus-zhizni` обслуживает оба домена
через единый Next.js процесс.

> [!info] Область модуля
> Описывает как один монорепо `vkus-zhizni` обслуживает оба домена
> через единый Next.js процесс. Дизайн-система публичного сайта —
> [[design-system.md]]. Дизайн клуба — пока в [[../03-club/_findings.md]].

---

## 1. Архитектура

Один Docker-контейнер на VPS, один Next.js процесс на порту 3000
обслуживает оба домена:
- `nata-tomshina.ru` — публичный сайт (маркетинг, блог, лендинги)
- `club.nata-tomshina.ru` — закрытый клуб (dashboard, OTP-вход)

Разделение по домену делается на уровне Next.js через `src/proxy.ts`,
не на уровне Nginx (тот просто проксирует на :3000).

```
nata-tomshina.ru        ─┐
                          ├─→ Cloudflare → Nginx (VPS) → :3000 (Next.js) → proxy.ts → routing
club.nata-tomshina.ru   ─┘
```

---

## 2. Nginx (deploy/nginx.conf)

В репо есть только блок для `club.nata-tomshina.ru` → localhost:3000.

> [!warning] Nginx-блок основного домена не в репо
> Для `nata-tomshina.ru` блок настроен на сервере вне репо. Это
> делает конфигурацию невоспроизводимой при разворачивании. См. R87.

Live-проверка показала: оба домена отвечают через `nginx/1.18.0 (Ubuntu)`
с одинаковыми заголовками безопасности — значит блоки симметричны,
но эталон есть только на сервере.

---

## 3. Логика в src/proxy.ts

`src/proxy.ts` содержит функцию `proxy()` и `config.matcher` — фактически
это и есть middleware. Ключевой блок домен-роутинга (`proxy.ts:119–143`):

```ts
const hostname = request.headers.get('host') ?? ''
const pathname = request.nextUrl.pathname

const PUBLIC_SITE_PATHS = [
  '/blog', '/recipes', '/about', '/results',
  '/club', '/free', '/free-kurs', '/marathon', '/menyu', '/racion'
]
const isPublicSitePath = PUBLIC_SITE_PATHS.some(p =>
  pathname === p || pathname.startsWith(p + '/')
)

if (hostname === 'nata-tomshina.ru' || hostname === 'www.nata-tomshina.ru') {
  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/public-site', request.url))
  }
  if (isPublicSitePath) {
    return NextResponse.rewrite(new URL(`/public-site${pathname}`, request.url))
  }
}

if (hostname === 'club.nata-tomshina.ru' && pathname === '/') {
  return NextResponse.redirect(new URL(user ? '/dashboard' : '/auth', request.url))
}
```

Поведение по доменам:

| URL | Результат |
|---|---|
| `nata-tomshina.ru/` | rewrite → `/public-site` |
| `nata-tomshina.ru/blog/...` | rewrite → `/public-site/blog/...` |
| `nata-tomshina.ru/about` | rewrite → `/public-site/about` |
| `club.nata-tomshina.ru/` | redirect → `/dashboard` или `/auth` |
| `club.nata-tomshina.ru/dashboard/*` | проходит как есть |

Live-проверка:
- `nata-tomshina.ru` → 200 OK, header `x-middleware-rewrite: /public-site`
- `club.nata-tomshina.ru` → 307 → `/auth` (нет сессии)
- Оба: `Server: nginx/1.18.0 (Ubuntu)`, `X-Powered-By: Next.js`

> [!warning] proxy.ts — нестандартный middleware
> Файл экспортирует `proxy()` и `config.matcher`, но не `default` и не `middleware`.
> `.next/server/middleware-manifest.json` — пустой объект `{}`.
> Реальный `middleware.ts` должен импортировать `proxy` откуда-то —
> точка импорта при разведке не найдена. См. R86.

Помимо роутинга по домену `proxy.ts` также отвечает за:
- Affiliate ref tracking (`?ref=` → cookie + запись в `affiliate_clicks`)
- Supabase сессия — обновление cookie при каждом запросе
- Редирект неавторизованных → `/auth`
- Проверка `subscription_status` → редирект на `/join`
- Проверка `is_blocked` → редирект на `/blocked`
- Редирект куратора вне `/admin/marathons` → `/dashboard`

---

## 4. Структура публичного сайта

```
src/app/
├── public-site/              ← всё для nata-tomshina.ru
│   ├── layout.tsx            ← отдельный layout (шрифты + .public-theme)
│   ├── theme.css             ← вся дизайн-система (79 KB)
│   ├── blog-content.css      ← типографика статей (42 KB)
│   ├── club/                 ← лендинг /club (страница вступления)
│   │   └── styles.css        ← стили лендинга
│   ├── page.tsx              ← главная nata-tomshina.ru
│   ├── blog/
│   ├── about/
│   ├── free/
│   ├── free-kurs/
│   ├── marathon/
│   ├── menyu/
│   ├── racion/
│   ├── recipes/
│   ├── results/
│   ├── robots.ts             ← robots.txt
│   └── sitemap.ts            ← sitemap.xml
└── (club)/                   ← всё для club.nata-tomshina.ru
    ├── dashboard/
    └── ...
```

`src/app/page.tsx` (корень) — редирект на `/auth`. Используется при прямом
обращении без домена (локальная разработка, CI и т.п.).

---

## 5. next.config.ts

Никаких `rewrites()` или `headers()` по домену. Только:
- `output: 'standalone'`
- `images.remotePatterns` — включает `club.nata-tomshina.ru`
- `redirects()` — один SEO-редирект для блога
- `headers()` — `X-Content-Type-Options: nosniff` глобально

Вся логика доменного роутинга — в `src/proxy.ts`.

---

## 6. metadataBase

В `src/app/layout.tsx`:
```ts
metadataBase: new URL('https://nata-tomshina.ru')
```

Все canonical-ссылки и Open Graph URL строятся от этого основания —
включая страницы клуба. Для приватных страниц клуба это некорректно
(они не должны индексироваться), но не критично: `robots.ts` закрывает
клубные пути через `Disallow`.

---

## 7. Открытые вопросы

| # | Описание | Приоритет |
|---|---|---|
| R86 | Найти настоящий `middleware.ts` — откуда импортируется `proxy()` | низкий |
| R87 | Задокументировать nginx-блок для `nata-tomshina.ru` (сейчас только на сервере) | низкий |
| R88 | Оценить вес CSS публичного сайта — `theme.css` 79KB + `blog-content.css` 42KB без route-based splitting | низкий |

---

## 8. Шпаргалка диагностики

```bash
# Проверить заголовки публичного сайта
curl -sI https://nata-tomshina.ru

# Убедиться что proxy.ts реврайтит на /public-site
curl -sI https://nata-tomshina.ru | grep -i rewrite

# Проверить редирект клуба (нет сессии → /auth)
curl -sI https://club.nata-tomshina.ru

# Проверить nginx на сервере (если есть SSH)
ssh deploy@155.212.130.228 "ls /etc/nginx/sites-enabled/"

# Найти откуда импортируется proxy.ts (R86)
grep -rn "from.*proxy\|require.*proxy" src/ --include="*.ts"
```

---

## 9. Связи с другими модулями

| Модуль | Связь |
|---|---|
| [[design-system.md]] | Дизайн-система публичного сайта (палитра, шрифты) |
| [[../05-infrastructure/server.md]] | Docker, Nginx, VPS-инфраструктура |
| [[../03-club/modules/subscriptions.md]] | OTP-вход в клуб после редиректа с лендинга |

---

## 10. История изменений

| Дата | Событие |
|---|---|
| 23.05.2026 | Модуль записан в Vault по результатам разведки. |
