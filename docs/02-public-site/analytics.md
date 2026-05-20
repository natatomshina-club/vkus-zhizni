# Аналитика и трекинг

## 1. Внешние счётчики

### Яндекс.Метрика

- ID: `108262096` (хардкод в `src/app/layout.tsx:104`)
- Подключение: `src/app/layout.tsx:90–124`, `<Script strategy="afterInteractive">` + `<noscript>` fallback
- Параметры: `webvisor: true`, `clickmap: true`, `ecommerce: "dataLayer"`, `accurateTrackBounce: true`, `trackLinks: true`, `ssr: true`
- Scope: весь сайт — и публичный, и клуб (единый корневой layout)
- Других внешних счётчиков нет (Google Analytics, GTM, VK Pixel, Facebook Pixel отсутствуют)

---

## 2. Внутренний трекинг просмотров

### Компонент `Analytics.tsx`

- Файл: `src/components/public/Analytics.tsx`
- Встроен в корневой layout — трекает все страницы
- При каждом изменении `pathname` → POST `/api/public/track` с `{ path, event: 'view', referrer }`
- Экспортирует `trackEvent()` — определена, но нигде не вызывается (мёртвая функция — R110)

### API `/api/public/track`

- Файл: `src/app/api/public/track/route.ts`
- Rate limit: 1 view / 30 сек на IP+path (in-memory Map, auto-clean при >5000 записей)
- Пишет в `page_views`: `path`, `event`, `widget_type`, `referrer`
- Миграция для таблицы не найдена — создана вручную в Supabase Studio (R111)

### Типы событий (определены в `/admin/analytics/page.tsx`)

| event | описание | статус |
|---|---|---|
| `view` | просмотр страницы | ✅ работает |
| `click_club` | клик «Вступить в клуб» | ❌ не реализован |
| `click_lead` | клик лид-формы | ❌ не реализован |
| `click_marathon` | клик марафона | ❌ не реализован |
| `email_verified` | подтверждение email | ❌ не реализован |
| `widget_complete` | завершение виджета (+`widget_type`) | ❌ не реализован |

Виджеты (`WIDGET_LABELS`): `ir_test`, `why_test`, `thyroid_test`, `eating_test`, `calc_3months`

---

## 3. Лид-форма диагностики (`klub_diagnostics`)

Не аналитика — лид-форма на лендинге `/club` в режиме `diagnostic`.

- API: `src/app/api/public/club-diagnostic-submit/route.ts`
- Пишет в `klub_diagnostics`: имя, контакты (tg/wa/email), комментарий, user_agent, ip, `source: 'klub_landing'`, `status: 'new'`
- После записи → Telegram-уведомление
- Rate limit по IP

Подробнее: `_findings/05-infrastructure.md` (NEXT_PUBLIC_CLUB_MODE).

---

## 4. Resend — email-трекинг

- Файл: `src/app/api/join/track-email/route.ts`
- Вызывается при подписке через `/join`
- Добавляет email в аудиторию Resend (`RESEND_AUDIENCE_ID`)
- В БД не пишет — только `console.log` (R112)
- Назначение: CRM-список лидов, не метрики

---

## 5. Consent / Cookie banner

Отсутствует. Ни cookie-баннера, ни 152-ФЗ notice в коде нет (R113).

---

## 6. Клуб vs публичный сайт

Клуб закрыт от поисковиков и аналитики на четырёх уровнях:

| Защита | Источник | Статус |
|---|---|---|
| `robots.txt: Disallow /dashboard` | `public/robots.txt` | ✅ |
| `<meta robots noindex,nofollow>` на всех клубных страницах | `src/app/(club)/layout.tsx:8–13` | ✅ |
| Клубные URL отсутствуют в sitemap | `src/app/public-site/sitemap.ts` | ✅ |
| Auth redirect для незалогиненных | `src/app/(club)/dashboard/layout.tsx:16` | ✅ |
| Яндекс.Метрика не трекает `/dashboard` и `/admin` | `src/components/public/YandexMetrika.tsx` | ✅ |
| `page_views` не пишет клубные страницы | `src/components/public/Analytics.tsx` | ✅ |

`YandexMetrika.tsx` — Client Component с `usePathname()`, возвращает `null` на `/dashboard/*` и `/admin/*`. Подключён в `src/app/layout.tsx` вместо inline `<Script id="yandex-metrika">`.

Клуб-специфичное: `/admin/analytics/page.tsx` — дашборд чтения из `page_views` для Наташи.

---

## Шпаргалка

```sql
-- Топ страниц за последние 7 дней
SELECT path, COUNT(*) as views
FROM page_views
WHERE event = 'view'
  AND created_at > now() - interval '7 days'
GROUP BY path
ORDER BY views DESC
LIMIT 20;

-- Источники трафика
SELECT referrer, COUNT(*) as count
FROM page_views
WHERE event = 'view'
  AND created_at > now() - interval '7 days'
  AND referrer IS NOT NULL
GROUP BY referrer
ORDER BY count DESC
LIMIT 20;
```
