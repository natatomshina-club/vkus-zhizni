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

### Проверка прав через `user.id` вместо `user.email` (нарушение правила #24)

В части admin-роутов проверка прав сделана через `.eq('id', user.id)` вместо `.eq('email', user.email)`. Работает только если `member.id === auth.users.id`, что не гарантируется: `member.id` — отдельный UUID в таблице `members`, `auth.users.id` — UUID из auth-системы Supabase. Совпадение — счастливая случайность, которая может сломаться при любом ручном создании участницы.

**Файлы (найдено при разведках 18 мая 2026):**

Вебинары (5 файлов):
- `src/app/api/admin/webinars/route.ts:8`
- `src/app/api/admin/webinars/[id]/route.ts:8`
- `src/app/api/admin/webinars/[id]/grant-manual/route.ts:8`
- `src/app/api/admin/webinars/[id]/materials/route.ts:9`
- `src/app/api/admin/webinars/[id]/lessons/route.ts:9`

Медитации (1 файл):
- `src/app/api/admin/meditations/[id]/upload-url/route.ts:10` — критично: это активный роут загрузки аудио

Возможно, есть и в других admin-роутах — провести полную ревизию через `grep -rEn "\.eq\(['"]id['"], user\.id" src/app/api/admin`.

**Фикс:** заменить на `.eq('email', user.email)` во всех найденных местах.

Подробнее: [[03-club/modules/webinars#известные-особенности]], [[03-club/modules/meditations#известные-особенности]]

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
