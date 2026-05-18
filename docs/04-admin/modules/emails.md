# Email-рассылки (админка)

> Модуль управления массовыми рассылками и автоматическими сериями. Доступен админу через `/admin/emails`.
>
> Источники в коде сверены **2026-05-19**.

## Что это

Один экран `/admin/emails` (~1330 строк, client-side), 7 API-роутов, 2 редактора писем (RichEditor + блочный EmailBuilder, оба lazy-loaded).

**4 вкладки:**
- **Subscribers** — таблица `subscribers` (лиды, импортированные из GetCourse), CSV-импорт, статистика
- **Members** — сегменты участниц + редактор + отправка
- **Leads** — подмножество `subscribers` где `source IN ('website_free','marathon','blog')`
- **History** — журнал отправок из `email_campaign_logs` (последние 200)

## Сегменты получателей

> [!important] Источник сегментации — `members.tariff`, не `subscription_plan`.

Формируются в `src/app/api/admin/emails/segments/route.ts`.

| value | SQL-фильтр | UI-метка | Иконка |
|---|---|---|---|
| `trial` | `status='trial'` | Триал | 🌱 |
| `monthly` | `status='active' AND tariff IN ('month','monthly')` | Месяц | 💜 |
| `halfyear` | `status='active' AND tariff='halfyear'` | Полгода | 💎 |
| `expired_trial` | `status='expired' AND tariff IN ('trial','Пробный')` | Бывшие триалки | 🔄 |
| `expired` | `status='expired' AND tariff IN ('month','monthly','halfyear')` | Истёкшие | 😴 |
| `cancelled` | `status='cancelled'` | Заблокированные | ⛔ |

> [!warning] Метка «Заблокированные» вводит в заблуждение
> Статус `cancelled` означает «отменила рекуррент в CloudPayments», но **вход через OTP не блокируется** (блокирует только `expired`). Фактическая семантика — «отменила подписку». Тикет в `08-roadmap/todo.md` → R51.

### Почему «Бывшие триалки» — это `tariff='trial'`, а не таблица `cancellations`

Два источника не пересекаются:
- **Таблица `cancellations`** — только те, кто нажал кнопку «Отменить подписку» (пишется из `/api/subscription/cancel`). Используется **только как счётчик** `stats.unsubscribed` в виджете «Подписчицы». В рассылках не участвует.
- **Сегмент `expired_trial`** — SQL-фильтр по `members.tariff`. Включает всех у кого истёк триал, независимо от того, нажали они «Отменить» или просто не продлили.

Следствие: `cancellations.count < expired_trial.count` всегда. Участница, у которой триал истёк сам, попадает в сегмент рассылки, но не в счётчик отмен.

## Таблицы БД

### `members`
Источник всех 6 сегментов. См. `03-club/modules/subscriptions.md`.

### `subscribers`
Лиды (импорт из GetCourse + сборы с лендингов). Не путать с `members`.

Поля (по `subscribers/route.ts`): `id, email, name, source, unsubscribed, created_at`.

### `cancellations`
Счётчик нажатий «Отменить подписку» во время триала.

Поля (по INSERT в `/api/subscription/cancel`): `member_id, email, plan`. INSERT происходит при ручной отмене триала, SELECT — только как `count(*)` для виджета статистики.

### `email_campaigns` + `email_campaign_logs`
**Два лога на одну отправку:**
- `email_campaigns` — архив с полным `body_html` каждой рассылки
- `email_campaign_logs` — метаданные для UI (`id, sent_at, subject, segment, recipients_count, sent_by`), без HTML

History в админке читает только `email_campaign_logs`.

### `email_sequences` + `subscriber_sequence_progress`
Движок автоматических серий (самопис, не Resend Automations).

- `email_sequences` — контент шагов: `series, step, subject, html, delay_days, is_active`
- `subscriber_sequence_progress` — прогресс: `subscriber_id, series, current_step, next_send_at, completed`

## Отправка массовой рассылки

`POST /api/admin/emails/send-announcement`

```
FROM      = 'Вкус Жизни <noreply@nata-tomshina.ru>'
BATCH     = 50 писем
DELAY     = 1000 мс между батчами
```

Флоу:
1. Получить список email по выбранному сегменту
2. По каждому письму подставить `{{unsubscribe_token}}` (персональная ссылка отписки через `emailToToken(email)`)
3. Обернуть в `baseEmailTemplate()` + `inlineStyles()` (если не передан `raw: true`)
4. Отправить через `sendEmail()` из `src/lib/mailer.ts` → nodemailer → **Beget SMTP**
5. Записать в `email_campaigns` (с HTML) и `email_campaign_logs` (без HTML)

> [!warning] Нет глобального rate limiter
> Только 1 секунда между батчами по 50 писем. При рассылке на 500+ адресатов можно упереться в лимиты Beget SMTP. Тикет в `08-roadmap/todo.md` → R52.

## Автоматические серии (cron `email-sequences`)

**Endpoint:** `/api/cron/email-sequences`
**Расписание:** `0 9 * * *` (09:00 UTC)
**Auth:** header `x-cron-secret: $CRON_SECRET`

**Логика:**
1. Найти все `subscriber_sequence_progress` где `completed = false AND next_send_at <= now()`
2. Для каждого: загрузить `email_sequences[series][current_step]`, отправить
3. Обновить `next_send_at = now() + delay_days * 86400` секунд
4. Если у подписчицы `status = 'unsubscribed'` — пометить серию `completed = true`

**Известные серии** (из кода):
- `welcome_leads` → автоматический переход в `evergreen` после завершения (через `NEXT_SERIES`)
- `welcome` (для платежей, INSERT происходит в `cloudpayments/route.ts` при первом платеже)
- Возможно другие — детальный состав шагов не задокументирован. Тикет в `08-roadmap/todo.md` → R53.

**Точки запуска INSERT в `subscriber_sequence_progress`:**
- `cloudpayments/route.ts` — при первом платеже (welcome)
- Точки онбординга лидов (`/public/subscribe`, `/join` и др.)

## Каналы отправки писем (общая карта)

> [!important] Два независимых канала, не путать.

| Канал | Что использует | Что через него идёт |
|---|---|---|
| `sendEmail()` из `mailer.ts` | nodemailer → Beget SMTP (`smtp.beget.com:465`) | Массовые рассылки, серии, VIP-напоминания, magic links, партнёрский OTP, рацион OTP |
| Клубный OTP | Supabase GoTrue → отдельный SMTP | Только OTP для входа участниц в клуб |

**Resend используется только** для записи контактов через Audiences API (в `/api/join/track-email/route.ts`) — **писем не отправляет**.

Детали SMTP-конфигурации и env-переменные — в `05-infrastructure/email-system.md` (будет создан).

## API-роуты — справочник

| Endpoint | Метод | Что делает |
|---|---|---|
| `/api/admin/emails/segments` | GET | Счётчики по 6 сегментам |
| `/api/admin/emails/send-announcement` | POST | Отправка рассылки сегменту |
| `/api/admin/emails/send-test` | POST | Тестовое письмо на произвольный email |
| `/api/admin/emails/subscribers` | GET, DELETE | Список и удаление из `subscribers` |
| `/api/admin/emails/history` | GET | Журнал из `email_campaign_logs` |
| `/api/admin/emails/upload-image` | POST | Загрузка изображения для письма |
| `/api/admin/emails/import-csv` | POST | Импорт CSV → `subscribers` |

Auth: session cookie + `role='admin'` в `members`.

## Открытые вопросы / техдолг

- **R51:** UI-метка «Заблокированные» для `cancelled` не соответствует семантике (вход не блокируется)
- **R52:** Нет глобального rate limiter в `send-announcement` — риск упереться в лимиты SMTP при большой рассылке
- **R53:** Детальный состав email-серий (welcome / evergreen / прочие) не задокументирован — нужен второй проход разведки по `email_sequences`
- **Нет метрик открытий/кликов** писем — см. `08-roadmap/tech-debt.md`

---

*Обновлено: 2026-05-19. Источники сверены с кодом.*
