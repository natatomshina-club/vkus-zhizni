# Ручные процедуры

> Шпаргалка операций, которые Наташа выполняет руками. Каждая процедура — кратко: что, как, на что обратить внимание.
>
> Источники в коде сверены **2026-05-19**. При расхождении источник истины — код.

## ⚠️ Главное про блокировку доступа

С **2026-05-19** на проде работает cron `check-subscriptions` (03:00 UTC). Каждую ночь он переводит всех с `subscription_ends_at < now()` в статус `expired` — **включая VIP-участниц с `is_manual_subscription = true`**. После этого OTP-вход блокируется.

**Следствие:** продлевать VIP нужно **до** истечения `subscription_ends_at`, не после. Если опоздала — участница заблокирована до следующего ручного UPDATE.

---

## 1. Продление VIP-подписки

Подписка истекает по `subscription_ends_at`. Cron не делает исключений для VIP.

### Основной способ — UI
1. Открыть `/admin/members/[id]` нужной участницы
2. Нажать «Продлить доступ» (вызывает `PATCH /api/admin/members/[id]` с `{ extend_days: 30, tariff: 'monthly' }`)
3. Проверить новую дату `subscription_ends_at` в карточке

### Фолбэк — SQL
Если UI недоступен или нужно нестандартное продление:

```sql
UPDATE members
SET subscription_status = 'active',
    subscription_ends_at = GREATEST(subscription_ends_at, now()) + interval '30 days'
WHERE email = 'email@example.com'
  AND is_manual_subscription = true;
```

`GREATEST(...)` защищает от «отката» даты, если подписка уже просрочена — отсчёт пойдёт от `now()`, а не от старой даты в прошлом.

---

## 2. Ручной апгрейд участницы в «Бриллианты» (VIP)

### Основной способ — UI
`/admin/members` → «Добавить участницу» либо в карточке существующей участницы → выставить `tariff` и `is_manual_subscription = true`.

> [!warning] Баг R50
> UI выставляет поле `tariff`, но **не выставляет** `subscription_plan`. Из-за этого ломается расчёт уровня (🌸⭐🔥💚💎) и видимость кнопок управления подпиской в профиле. Пока баг не исправлен — после UI-апгрейда **дополнительно** запусти SQL ниже, чтобы синхронизировать поля. Тикет в `08-roadmap/todo.md` → R50.

### Фолбэк / синхронизация полей — SQL

```sql
UPDATE members
SET subscription_status = 'active',
    tariff = 'month',
    subscription_plan = 'month',
    subscription_ends_at = now() + interval '30 days',
    is_manual_subscription = true
WHERE email = 'email@example.com';
```

`subscription_plan = 'month'` (не `'halfyear'`) — иначе в профиле скроются кнопки управления подпиской.

---

## 3. Откат ручного апгрейда (убрать VIP)

```sql
UPDATE members
SET subscription_status = 'expired',
    is_manual_subscription = false
WHERE email = 'email@example.com';
```

OTP-вход заблокируется немедленно. Если нужно вернуть участницу к её исходному тарифу (например, после теста) — выставить `subscription_status = 'active'` + актуальный `subscription_plan` + корректный `subscription_ends_at`.

---

## 4. Создание участницы

### Основной способ — UI
`/admin/members` → «Добавить участницу». Принимает `{ email, full_name, tariff, admin_note }`. Генерирует magic link и отправляет на email.

### Фолбэк — двухшаговый через Supabase Admin API
Если UI недоступен. **CURL без сессии работает только для шага 1** (создание в `auth.users`), потому что отдельного `ADMIN_API_KEY` для админских endpoint'ов нет.

```bash
# Шаг 1: создать пользователя в auth.users
curl -X POST http://localhost:8000/auth/v1/admin/users \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"EMAIL","email_confirm":true}'

# Шаг 2: скопировать UUID из ответа и вставить в members
INSERT INTO members (id, email, full_name, subscription_status, subscription_plan, tariff, subscription_ends_at, is_manual_subscription)
VALUES ('<UUID-из-шага-1>', 'email@example.com', 'Имя Фамилия', 'active', 'month', 'month', now() + interval '30 days', true);
```

---

## 5. Сброс лимита Умной кухни

Лимит хранится в `weekly_plans` (не в `members`).
- **Trial:** 1 рацион за всё время существования участницы
- **Active:** кулдаун 7 дней от последней генерации

### Способ A — сдвинуть дату последнего плана (мягко)
```sql
UPDATE weekly_plans
SET created_at = now() - interval '8 days'
WHERE id = (
  SELECT id FROM weekly_plans
  WHERE member_id = (SELECT id FROM members WHERE email = 'email@example.com')
  ORDER BY created_at DESC LIMIT 1
);
```

### Способ B — удалить последний план (для trial)
```sql
DELETE FROM weekly_plans
WHERE id = (
  SELECT id FROM weekly_plans
  WHERE member_id = (SELECT id FROM members WHERE email = 'email@example.com')
  ORDER BY created_at DESC LIMIT 1
);
```

Способ A безопаснее — сохраняет историю рационов. Способ B нужен только для trial (там лимит «1 рацион всего», сдвиг даты не поможет).

---

## 6. Диагностика OTP-входа

Если участница пишет «не приходит код» или «email не найден» — пошагово:

### Шаг 1: проверить статус в БД
```sql
SELECT email, subscription_status, subscription_ends_at, subscription_plan
FROM members
WHERE email = 'email@example.com';
```

**Что блокирует OTP:** только `subscription_status = 'expired'`. Сама дата `subscription_ends_at` напрямую не проверяется — но cron в 03:00 UTC переводит просроченных в `expired`, что и приводит к блокировке.

> [!note] Статус `cancelled` не блокирует вход
> Сейчас OTP блокируется **только** при `subscription_status = 'expired'`. Участница со статусом `cancelled` всё ещё может войти. Статус неясен — баг или фича, отметить для проверки.

### Шаг 2: проверить логи GoTrue
```bash
sudo docker logs supabase-auth --tail=100 | grep -i "otp\|email\|error"
```

Или через Supabase Studio: **Authentication → Users → Last Sign In** для конкретного email.

### Шаг 3: проверить отправку через GoTrue SMTP
Клубный OTP идёт **не через Beget SMTP** (`mailer.ts`), а через отдельную SMTP-конфигурацию GoTrue (`/opt/supabase/docker/.env`, переменные `GOTRUE_SMTP_*`).

Если код не пришёл на почту:
1. Логи docker (уже сделано в шаге 2)
2. Проверить env-переменные `GOTRUE_SMTP_*` в `/opt/supabase/docker/.env`
3. Подробнее — см. `05-infrastructure/email-system.md`.

> [!note] Resend не отправляет письма
> Resend используется только как CRM (Audiences API в `/api/join/track-email/route.ts`). Все клубные письма идут через Beget SMTP или GoTrue SMTP.

---

## 7. Активация дня марафона вручную

### Основной способ — UI
`/admin/marathons/[id]/days` → кнопка «Активировать» рядом с нужным днём.

**UI делает два шага:**
1. `UPDATE marathon_days SET is_active = true`
2. Автопост в чат марафона от лица Наташи: `🔥 День N марафона уже открыт!`

### Фолбэк — SQL

> [!warning] SQL не отправляет автопост
> Триггера на `marathon_days` нет. Пост создаётся **только** через API. Если активировать день через SQL — участницы не получат уведомления в чате.

Активация дня без автопоста:
```sql
UPDATE marathon_days
SET is_active = true
WHERE marathon_id = '<uuid-марафона>' AND day_number = <N>;
```

Если нужен и пост — добавить вручную:
```sql
INSERT INTO channel_posts (member_id, channel, text, is_pinned, is_ai_reply)
VALUES (
  (SELECT id FROM members WHERE email = 'nata.tomshina@gmail.com'),
  'marathon-<uuid-марафона>',
  '🔥 День N марафона уже открыт!',
  false, false
);
```

---

## Приложение: Auth-механизмы endpoint'ов

| Endpoint | Механизм |
|---|---|
| `/api/admin/members/*` | Session cookie + `role='admin'` в `members` |
| `/api/cron/level-up` | Header `x-cron-secret: $CRON_SECRET` |
| `/api/cron/check-subscriptions` | Header `Authorization: Bearer $CRON_SECRET` |
| `/api/cron/subscription-reminders` | Header `Authorization: Bearer $CRON_SECRET` |
| `/api/cron/cleanup-media` | Header `Authorization: Bearer $CRON_SECRET` |

Отдельного `ADMIN_API_KEY` для curl-вызовов админских endpoint'ов **нет** — для них нужна сессия. Авторизация cron непоследовательна (`x-cron-secret` vs `Authorization: Bearer`) — см. `08-roadmap/tech-debt.md`.

Prod URL: `https://club.nata-tomshina.ru`

---

## Открытые вопросы (требуют проверки)

- **`cancelled` не блокирует OTP.** Намеренно или баг? Сейчас зайти могут все, кроме `expired`.
- **Баг R50.** `subscription_plan` не выставляется при создании через UI. См. `08-roadmap/todo.md`.

---

*Обновлено: 2026-05-19. Источники сверены с кодом.*
