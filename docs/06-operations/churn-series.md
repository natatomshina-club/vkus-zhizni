# Churn-серия (expiry-followup)

Автоматическая серия из пяти писем для участниц с истёкшей подпиской. Создана в сессии 2026-06-06 взамен старого Vercel-cron, который слал одно письмо через Resend API напрямую.

## Где в коде

- **Cron-роут:** `src/app/api/cron/expiry-followup/route.ts`
- **Предшествующий cron:** `src/app/api/cron/check-subscriptions/route.ts`
- **Точки сброса (admin):** `src/app/api/admin/members/[id]/route.ts`
- **Точки сброса (платежи):** `src/app/api/payments/cloudpayments/route.ts`
- **Миграция:** `supabase/migrations/expiry_followup_step.sql`

## Архитектура

Два cron'а работают в связке:

```
subscription_ends_at < NOW()
  └─ 03:00 UTC  check-subscriptions  → subscription_status = 'expired'
       └─ 11:00 UTC  expiry-followup → day = floor((now - ends_at) / 86400)
              ├─ day 1, 2, 3  → шаблон 1 «Ваш доступ в Клуб приостановлен»
              ├─ day 15       → шаблон 2 «Скоро старт ежемесячного марафона»
              └─ day 30       → шаблон 3 «Вы ещё можете вернуться без потери статуса»
```

**Отличие от `subscription-reminders`:** тот шлёт ДО истечения (за 5 и 1 день), только `is_manual_subscription=true`, также отправляет личное сообщение в чат клуба. `expiry-followup` шлёт ПОСЛЕ истечения, всем `expired` без фильтрации по is_manual.

## Расписание и авторизация

Crontab на сервере (`/home/deploy/crontab`):
```
0 3  * * *  check-subscriptions
0 11 * * *  expiry-followup
```

Авторизация: заголовок `Authorization: Bearer $CRON_SECRET` — тот же паттерн что у всех cron'ов проекта. Без заголовка → 401. Код: `expiry-followup/route.ts:181`.

## База данных

### Поле `members.expiry_followup_step`

| Параметр | Значение |
|---|---|
| Тип | `integer` |
| Default | `0` |
| Миграция | `supabase/migrations/expiry_followup_step.sql` |
| Индекс | `idx_members_expiry_followup` на `(subscription_status, expiry_followup_step)` WHERE `expired AND step<30` |

**Семантика:** хранит последний успешно отправленный день серии (0, 1, 2, 3, 15 или 30). Не bool (`sent/not_sent`) — потому что нужно знать точную позицию в серии, чтобы не повторить уже отправленный шаг при частичном сбросе. Не timestamp — потому что дата истечения уже есть в `subscription_ends_at`, и именно от неё считается day.

**Сбрасывается в 0** при возобновлении подписки (пять точек — см. раздел ниже).

## Шаги серии

Выборка: `subscription_status = 'expired'`, `expiry_followup_step < 30`, `subscription_ends_at IS NOT NULL`. Код: `route.ts:188–194`.

| Шаг | День | Критерий (из кода) | Тема письма | step после отправки |
|---|---|---|---|---|
| 1 | 1 | `day===1 && step<1` | «Ваш доступ в Клуб приостановлен» | 1 |
| 1 | 2 | `day===2 && step<2` | то же | 2 |
| 1 | 3 | `day===3 && step<3` | то же | 3 |
| 2 | 15 | `day===15 && step<15` | «Скоро старт ежемесячного марафона» | 15 |
| 3 | 30 | `day===30 && step<30` | «Вы ещё можете вернуться без потери статуса» | 30 |

Шаблон 1 использует три дня подряд: одно и то же письмо, разные записи step. Это позволяет отправить напоминание если участница не открыла первое, и при этом не слать одно и то же дважды в один день.

Тексты писем (HTML) — в `route.ts:66–177`. В этом модуле не дублируются.
Канал отправки: Beget SMTP через `sendEmail()` из `@/lib/mailer` (`from: Вкус Жизни <noreply@nata-tomshina.ru>`). Подробнее о канале: [[05-infrastructure/email-system]].

## Точки сброса expiry_followup_step = 0

При возобновлении подписки step сбрасывается в пяти местах:

| Файл | Блок | Условие сброса |
|---|---|---|
| `admin/members/[id]/route.ts:65` | PATCH `subscription_ends_at` | всегда |
| `admin/members/[id]/route.ts:75` | PATCH `expires_at` | всегда |
| `admin/members/[id]/route.ts:91` | PATCH `extend_days` | всегда |
| `payments/cloudpayments/route.ts:276` | PAY (первый платёж) | только если `!is_manual_subscription` |
| `payments/cloudpayments/route.ts:532` | RECURRENT (автосписание) | только если `!is_manual_subscription` |

Три admin-блока сбрасывают всегда, независимо от `is_manual_subscription`. Для manual-участниц, оплачивающих не через CloudPayments, сброс происходит только через ручной PATCH в админке.

## Канал отправки

Письма уходят через `sendEmail()` из `src/lib/mailer.ts` → Beget SMTP (`mail.nata-tomshina.ru:465`). From: `Вкус Жизни <noreply@nata-tomshina.ru>`.

Это тот же канал, что и все остальные письма клуба. GoTrue OTP идёт отдельно (smtp.resend.com:465) — он не затронут. Подробнее: [[05-infrastructure/email-system]].

## Шпаргалка SQL

### Кому и что отправится сегодня

```sql
SELECT
  email,
  full_name,
  subscription_ends_at,
  expiry_followup_step,
  FLOOR(EXTRACT(EPOCH FROM (NOW() - subscription_ends_at)) / 86400)::int AS day
FROM members
WHERE subscription_status = 'expired'
  AND expiry_followup_step < 30
  AND subscription_ends_at IS NOT NULL
  AND (
    (FLOOR(EXTRACT(EPOCH FROM (NOW() - subscription_ends_at)) / 86400)::int = 1  AND expiry_followup_step < 1)  OR
    (FLOOR(EXTRACT(EPOCH FROM (NOW() - subscription_ends_at)) / 86400)::int = 2  AND expiry_followup_step < 2)  OR
    (FLOOR(EXTRACT(EPOCH FROM (NOW() - subscription_ends_at)) / 86400)::int = 3  AND expiry_followup_step < 3)  OR
    (FLOOR(EXTRACT(EPOCH FROM (NOW() - subscription_ends_at)) / 86400)::int = 15 AND expiry_followup_step < 15) OR
    (FLOOR(EXTRACT(EPOCH FROM (NOW() - subscription_ends_at)) / 86400)::int = 30 AND expiry_followup_step < 30)
  )
ORDER BY subscription_ends_at;
```

### Сколько дней прошло с момента истечения у конкретного человека

```sql
SELECT
  email,
  subscription_ends_at,
  expiry_followup_step,
  FLOOR(EXTRACT(EPOCH FROM (NOW() - subscription_ends_at)) / 86400)::int AS days_since_expiry
FROM members
WHERE email = 'email@example.com';
```

### Сброс step вручную (повторная отправка шага)

```sql
-- Например, повторно отправить с шага day=3 (сбросить до step=2)
UPDATE members
SET expiry_followup_step = 2
WHERE email = 'email@example.com';
```

После обновления cron пришлёт шаблон 1 заново в следующий день с `day=3`. Для полного сброса (отправить всё с нуля) — установить `expiry_followup_step = 0`.

## Известные граничные случаи

**Cron пропустил день (упал сервер)**

Условие проверки — точное совпадение дня (`day===N`). Если cron не запустился:
- Пропуск дня 1 → участница получит шаблон 1 на день 2 (step запишется как 2, день 1 тихо не отправляется).
- Пропуск дня 15 → письмо «скоро марафон» **теряется насовсем**: на день 16 условие `day===15` уже ложно.
- Пропуск дня 30 → аналогично, третье письмо не придёт.

Потенциальный фикс: заменить `day===N` на `day>=N && step<N`. Зафиксировано как **R-NEW-4** в roadmap.

**is_manual_subscription не фильтруется**

Cron не проверяет `is_manual_subscription`. Expired VIP-участницы (с ручным статусом) получат churn-серию наравне с обычными. Возможно, это намеренно (подписка истекла — участница должна знать). Возможно, VIP нужна отдельная коммуникация через Наталью. Зафиксировано как **R-NEW-5** в roadmap.

**subscription_ends_at в будущем**

Не должно случиться: `check-subscriptions` переводит в `expired` только при `ends_at < NOW()`. Если попадётся (`day` будет отрицательным) — ни одно условие не сработает, участница тихо пропускается.

## История изменений

- 2026-06-06: churn-серия создана — [[07-sessions/project-history#обезврежен-legacy-vercel-deployment|project-history]], [[07-sessions/2026-06-06|сессия]]

## Связано

- [[05-infrastructure/payments]] — логика `is_manual_subscription` в webhook
- [[04-admin/members]] — admin PATCH-блоки, три точки сброса
- [[05-infrastructure/email-system]] — Beget SMTP, mailer.ts, GoTrue OTP
- [[05-infrastructure/database]] — поле `members.expiry_followup_step`
- [[06-operations/manual-procedures]] — ручные операции с подписками
