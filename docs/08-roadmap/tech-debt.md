# 🔧 Технический долг

Известные проблемы кода/архитектуры, которые работают, но требуют рефакторинга.

## Frontend

### Хардкод цветов
- `src/components/widgets/QuizEngine.tsx` — ~35 хардкодов
- `src/components/widgets/CalcWidget.tsx` — ~19 хардкодов
- 8 контентных переменных в `theme.css` остались на старой earth-tones палитре

### Лендинг клуба
- `src/app/public-site/club/page.tsx` — собственная CSS-тема (~30 хардкодов в `<style>`), не интегрирована с `theme.css`

## Backend / инфраструктура

### Резервная отправка email
- OTP идёт через Resend (наследие), нужна миграция на Beget — см. [[08-roadmap/todo|TODO]]

### Нет метрик открытий/кликов email-рассылок
- **Нет метрик открытий/кликов email-рассылок.** Сейчас в `email_campaign_logs` хранятся только метаданные отправки (`recipients_count, subject, sent_at, sent_by`). Нет данных об open rate, click rate, отписках по конкретной рассылке. Требуется интеграция с tracking pixels или переход на ESP с аналитикой.

### Устаревший upload-роут для медитаций
- `src/app/api/admin/meditations/[id]/upload/route.ts` — старая FormData-реализация. Заменён на `upload-url/route.ts` (presigned). Не используется в UI, но не удалён из репозитория. Бакет `meditations` (старый) → актуальный `meditation-audio`. Подробнее: [[03-club/modules/meditations#известные-особенности]]

### Системный аудит Rule #11 — `.eq('id', user.id)` в admin-роутах

**Системный паттерн:** в проекте исторически копировали `requireAdmin()` локально в каждый роут вместо импорта из `@/lib/auth/requireAdmin.ts`. Каждая копия воспроизводит одно и то же нарушение: `.eq('id', user.id)` вместо `.eq('email', user.email)`.

`member.id` ≠ `auth.users.id` — это разные UUID. Нарушение не ломается на тестовых участницах (созданных через Supabase UI), но сломается при любом ручном создании участницы через Admin API, где UUID генерируются независимо.

**Полный аудит (разведка 2026-05-23): 14 файлов ✅ правильно (`.eq('email', user.email)`), 42 файла ❌ неправильно (`.eq('id', user.id)`).**

Задокументированные именованные точки нарушения:

| R-номер | Файл | Последствие |
|---|---|---|
| R71 | `src/app/api/diary/` (часть роутов) | diary/tracker/wins данные не сохраняются |
| R90 | `src/app/api/kitchen/recipes/route.ts:65,99` | лимит кухни не считается |
| R91 | `src/components/ProfileClient.tsx`, `AvatarUpload.tsx` | сохранение профиля и аватара не работает |
| R92 | `src/app/api/profile/avatar/route.ts:19` | удаление аватара в DB не работает |
| R94 | `src/app/api/admin/result-cases/route.ts:10`, `[id]/route.ts:10` | admin-проверка |
| R96 | системный — 42 admin-роута (см. ниже) | admin-функции вернут 403 если UUID разойдутся |
| R107 | `src/app/api/admin/generate-image/route.ts:8` | AI-генерация изображений для admin |

Первые 10 из 42 неправильных файлов (по данным разведки):
- `src/app/api/admin/keyword-queue/route.ts`
- `src/app/api/admin/keyword-queue/[id]/route.ts`
- `src/app/api/admin/keyword-queue/cluster/route.ts`
- `src/app/api/admin/keyword-suggestions/route.ts`
- `src/app/api/admin/webinars/route.ts`
- `src/app/api/admin/webinars/[id]/route.ts`
- `src/app/api/admin/webinars/[id]/lessons/route.ts`
- `src/app/api/admin/webinars/[id]/materials/route.ts`
- `src/app/api/admin/webinars/[id]/grant-manual/route.ts`
- `src/app/api/admin/seo-settings/route.ts`

Дополнительно — найдено при разведке 18 мая 2026 (до введения R-нумерации):

Вебинары (5 файлов):
- `src/app/api/admin/webinars/route.ts:8`
- `src/app/api/admin/webinars/[id]/route.ts:8`
- `src/app/api/admin/webinars/[id]/grant-manual/route.ts:8`
- `src/app/api/admin/webinars/[id]/materials/route.ts:9`
- `src/app/api/admin/webinars/[id]/lessons/route.ts:9`

Медитации:
- `src/app/api/admin/meditations/[id]/upload-url/route.ts:10` — критично: активный роут загрузки аудио

**Полная ревизия:** `grep -rEn "\.eq\(['\"](id)['\"], user\.id" src/app/api/`

**Фикс:** единственный правильный паттерн — `import { requireAdmin } from '@/lib/auth/requireAdmin'` и убрать все локальные копии. Заменить `.eq('id', user.id)` на `.eq('email', user.email)` в случаях прямого доступа к DB без requireAdmin.

Подробнее: [[03-club/modules/webinars#известные-особенности]], [[03-club/modules/meditations#известные-особенности]], [[08-roadmap/todo]]

### Уведомления
- OneSignal SDK грузится на `nata-tomshina.ru` (должен только в клубе) — перенести инициализацию из `RootLayout` в `(club)/layout.tsx`
- Multiple GoTrueClient instances — Supabase warning в консоли, не критично

## UI / UX

### Скролл к посту из уведомлений на iOS Safari
- На десктопе работает, на iPhone `getBoundingClientRect()` возвращает нули. Решено пока оставить — участница видит подсвеченный пост, ищет визуально.

### 404 на `/images/authors/natalia.jpg`
- Файл не загружен в `public/`

## Документация

### Лимит рационов
- Простой `UPDATE kitchen_requests_today = 0` не сбрасывает лимит рационов (только запросов кухни) — где-то отдельная логика, не дофиксили в майской сессии

## Связано

- [[08-roadmap/todo|Открытые задачи]]
