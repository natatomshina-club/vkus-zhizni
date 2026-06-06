# Email-инфраструктура

> Все каналы отправки писем в проекте: SMTP-провайдеры, шаблоны, отписка, серии.
>
> Источники в коде сверены **2026-06-06**.

## Карта каналов

> [!important] Три независимых канала. Не путать назначение.

| Канал | Через что | Что отправляет |
|---|---|---|
| **Основной** — `sendEmail()` из `src/lib/mailer.ts` | nodemailer → Beget SMTP (`smtp.beget.com:465`) | Массовые рассылки, серии, VIP-напоминания, magic links, партнёрский OTP, рацион OTP |
| **GoTrue** — конфиг Supabase | Supabase Auth → **`smtp.resend.com:465`** (API-ключ как SMTP_PASS) | Только OTP для входа участниц в клуб |

## Канал 1 — Beget SMTP (основной)

### Конфигурация

Точка входа: `src/lib/mailer.ts` (39 строк, единственный transport на процесс).

```typescript
host:   process.env.SMTP_HOST ?? 'smtp.beget.com'
port:   Number(process.env.SMTP_PORT ?? 465)
secure: true   // TLS, hardcoded
user:   process.env.SMTP_USER ?? 'noreply@nata-tomshina.ru'
pass:   process.env.SMTP_PASS   // без дефолта
```

**Env-переменные:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.

**FROM по умолчанию:** `Вкус Жизни <noreply@nata-tomshina.ru>`.

### Лимиты

Точная цифра Beget SMTP в коде и в Vault не зафиксирована. Проверить в личном кабинете Beget → Почта. Внутренние предохранители в `send-announcement/route.ts`:
- `BATCH_SIZE = 50` (параллельная отправка батчами)
- `BATCH_DELAY_MS = 1000` (пауза между батчами)

Это **темп**, не лимит на размер рассылки. На рассылку в 1000 адресов уйдёт ~20 секунд + сетевые задержки. Если Beget имеет суточный лимит — код о нём не знает (см. R52).

### Потребители mailer.ts (11 файлов)

| Файл | Что шлёт |
|---|---|
| `api/admin/emails/send-announcement/route.ts` | Массовые рассылки по сегментам |
| `api/admin/emails/send-test/route.ts` | Тестовое письмо |
| `api/cron/email-sequences/route.ts` | Email-серии (welcome_leads, evergreen, welcome_members) |
| `api/cron/subscription-reminders/route.ts` | Напоминания VIP за 1/5 дней |
| `api/admin/members/route.ts` | Magic link при создании участницы |
| `api/admin/affiliates/[id]/route.ts` | Уведомление аффилиата |
| `api/partner/apply/route.ts` | Подтверждение заявки партнёра |
| `api/partner/auth/send-otp/route.ts` | OTP для партнёрского кабинета |
| `api/racion/send-otp/route.ts` | OTP для публичного инструмента «Рацион» |
| `api/marathons/[id]/reminder/route.ts` | Напоминание о марафоне |
| `api/public/subscribe/route.ts` | Подтверждение подписки лида |

## Канал 2 — GoTrue SMTP (только клубный OTP)

OTP для входа в клуб (`/api/auth/send-otp`) идёт через **Supabase GoTrue**, не через `mailer.ts`.
Конфигурация живёт в `/opt/supabase/docker/.env` на проде.

**Фактические настройки на проде (сверено 2026-06-06):**
```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=<значение из RESEND_API_KEY, хранится в .env на проде>
SMTP_SENDER_NAME=Вкус Жизни
GOTRUE_SMTP_SENDER_EMAIL=noreply@nata-tomshina.ru
```

GoTrue использует **Resend как SMTP relay**. Письма OTP видны в `resend.com/emails`.
Это **не** Resend Automations/Broadcasts — только транзитная SMTP-доставка.
Отдельный API-ключ GoTrue не нужен: тот же `RESEND_API_KEY` работает как SMTP-пароль.

> [!note] R57 закрыт
> GoTrue подтверждённо использует smtp.resend.com. Миграция на Beget не требуется —
> GoTrue OTP остаётся на Resend SMTP (отдельный канал, не влияет на основные рассылки).

### Диагностика клубного OTP

См. `06-operations/manual-procedures.md` § 6 «Диагностика OTP-входа». Главное:
```bash
sudo docker logs supabase-auth --tail=100 | grep -i "otp\|email\|error"
```

## ~~Канал 3 — Resend Audiences~~ (удалён 2026-06-06)

> [!note] Исторический контекст
> Роут `src/app/api/join/track-email/route.ts` и пакет `resend` удалены в коммите
> `chore(legacy): remove Vercel cron config and Resend SDK leftovers` (2026-06-06).
>
> **Что было:** добавление email в Resend Audience при вводе email на лендинге `/join`.
> **Почему удалено:** `RESEND_AUDIENCE_ID` не был задан в production env → роут
> никогда не выполнял полезной работы. Параллельно отключены Vercel cron'ы
> (были источником ежедневных писем «Доступ в клуб приостановлен» через старый
> Resend API — legacy от архитектуры до миграции на Beget).
>
> **GoTrue SMTP через Resend не затронут** — `RESEND_API_KEY` остаётся в env
> как SMTP-пароль для GoTrue OTP.

## Email-шаблоны

В коде **два шаблона**, между ними расхождение (см. R58).

### `src/lib/email-templates/base.ts::baseEmailTemplate(content, preheader?)`
Используется в реальных отправках. Применяется автоматически в `sendEmail()` если не передан `raw: true`.
- Фон страницы: `#f5f0eb` (бежевый)
- Шапка: `#2d1f3d` (тёмно-фиолетовый), текст «🌿 Вкус Жизни»
- Ширина: 600px max
- Футер: `nata.tomshina@gmail.com`, `nata-tomshina.ru`, кнопка «Отписаться»

### `src/lib/email-template.ts` (без `s` в названии)
**Внимание:** другой файл, другие функции.

- `inlineStyles(html)` — добавляет inline-стили к тегам `<h2>`, `<p>`, `<strong>`, `<ul>`, `<ol>`, `<li>`, `<a>`. Используется в `send-announcement/route.ts` ПЕРЕД оборачиванием в `baseEmailTemplate`.
- `buildEmailHtml(content, unsubscribeToken)` — альтернативный full-HTML шаблон с градиентной шапкой `#6B4FA0 → #9B6FD0`. **Используется только в превью UI EmailBuilder**, не в отправках.

Конвейер реальной рассылки в `send-announcement/route.ts`:
```typescript
const content = inlineStyles(bodyHtml)            // 1. стилизация тегов
const templateHtml = baseEmailTemplate(content)   // 2. обёртка в base
const html = templateHtml.replace('{{unsubscribe_token}}', emailToToken(email))  // 3. персональная отписка
sendEmail({ html, raw: true })                    // 4. raw — не оборачивать второй раз
```

> [!warning] Превью в UI не совпадает с реальной отправкой
> Админ видит письмо в дизайне `buildEmailHtml` (градиент), но получатель — в `baseEmailTemplate` (тёмная шапка). См. R58.

## Unsubscribe-флоу

### Генерация токена
`src/lib/email-utils.ts:1`:
```typescript
export const emailToToken = (email) => Buffer.from(email).toString('base64url')
export const tokenToEmail = (token) => Buffer.from(token, 'base64url').toString('utf-8')
```

> [!note] Без HMAC и без подписи
> Любой может сгенерировать unsubscribe-ссылку для любого email. Для `subscribers` (CRM-лиды) приемлемо. См. R59.

### Подстановка в письме
В шаблоне `email-templates/base.ts:33`:
```html
href="https://nata-tomshina.ru/unsubscribe?token={{unsubscribe_token}}"
```

Плейсхолдер `{{unsubscribe_token}}` **не заменяется автоматически** — это делает каждый отправляющий код отдельно. Сейчас замена есть только в `send-announcement/route.ts:104`.

> [!warning] Серии писем — отписка не работает
> `cron/email-sequences` шлёт письма **без замены `{{unsubscribe_token}}`** → все серии (welcome_leads, evergreen, welcome_members) уходят с буквальной строкой в ссылке. Получатель не может отписаться от серийных писем. Высокий приоритет к фиксу. См. R55.

### Endpoint обработки
`GET /api/unsubscribe?token=XXX` (`src/app/api/unsubscribe/route.ts`):
```typescript
const email = tokenToEmail(token)
await admin
  .from('subscribers')
  .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
  .eq('email', email)
// → redirect /unsubscribed
```

**Меняется только в `subscribers`**, не в `members`. Участницы клуба от рассылок через эту ссылку не отписываются.

## Email-серии

Полное описание — в `04-admin/modules/emails.md` § «Автоматические серии (cron email-sequences)».

Кратко: движок на БД (`email_sequences` + `subscriber_sequence_progress`), запускается cron'ом `0 9 * * *` (09:00 UTC). Известные серии:

| Серия | Триггер старта | Где INSERT |
|---|---|---|
| `welcome_members` | Первый платёж (любой) | `payments/cloudpayments/route.ts:330`, задержка +1ч |
| `welcome_leads` | Подтверждение email на сайте (free mini-course) | `public/verify-email/route.ts:60`, сразу |
| `welcome_leads` | Подтверждение OTP в рационе | `racion/verify-otp/route.ts:61`, сразу |
| `evergreen` | Авто-старт после завершения `welcome_leads` | `cron/email-sequences/route.ts:95` |

Цепочка авто-перехода: `welcome_leads → evergreen`. У `welcome_members` авто-перехода нет.

Детальный состав шагов (`step`, `subject`, `delay_days`) — в БД-таблице `email_sequences`, не задокументирован. См. R53.

## Связанные документы

- `04-admin/modules/emails.md` — UI админки, сегменты рассылки, серии (детально)
- `06-operations/manual-procedures.md` § 6 — диагностика OTP-входа
- `08-roadmap/todo.md` — открытые баги R55–R59
- `08-roadmap/tech-debt.md` — техдолг по email-инфраструктуре

## Открытые вопросы / техдолг

- **R52** — Нет глобального rate limiter в `send-announcement`
- **R53** — Детальный состав email-серий не задокументирован
- **R55** — `cron/email-sequences` не заменяет `{{unsubscribe_token}}` → отписка в сериях не работает (**высокий приоритет**)
- **R56** — `cron/subscription-reminders` двойная HTML-обёртка → VIP-напоминания приходят битыми (**высокий приоритет**)
- ~~**R57**~~ — ✅ **закрыт 2026-06-06**: GoTrue использует smtp.resend.com как SMTP relay. Миграция на Beget не требуется.
- **R58** — Два email-шаблона в коде расходятся, превью != реальная отправка
- **R59** — `emailToToken` без HMAC, фиксация как приемлемый риск или добавление подписи

---

*Обновлено: 2026-06-06. Сверены GoTrue SMTP-настройки; удалены legacy Resend Audiences.*
