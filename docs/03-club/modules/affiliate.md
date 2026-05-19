# Партнёрская программа

Реферальная система клуба: партнёры размещают ссылки и получают комиссию
за привлечённых участниц. Реализована и протестирована (31.03.2026).

> [!info] Область модуля
> Покрывает `/partner/*` (кабинет партнёра на `nata-tomshina.ru`),
> `/admin/affiliates` (управление), webhook начисление комиссий.
> Комиссионные ставки и платёжный флоу — [[../../../05-infrastructure/payments.md]].

---

## 1. Статус и назначение

**Статус:** работает, протестировано. Дата реализации: 31.03.2026.

Партнёр размещает реф-ссылку → клиент переходит → кука живёт 60 дней →
при первой оплате attribution сохраняется → комиссия начисляется через webhook.

Наташа одобряет партнёров вручную, выплачивает 1-го числа каждого месяца.

---

## 2. Флоу от клика до выплаты

```
1. Партнёр размещает: https://nata-tomshina.ru/join?ref=marina_4821
          ↓
2. proxy.ts перехватывает ?ref= :
   - проверяет affiliates WHERE ref_code='marina_4821' AND status='active'
   - записывает куку ref_code=marina_4821 на 60 дней (domain=.nata-tomshina.ru)
   - пишет клик в affiliate_clicks (дедупликация по SHA-256(IP+UA) за 24ч)
   - редирект на /join без ?ref= в URL
          ↓
3. Человек на /join вводит email → перед открытием виджета:
   POST /api/join/save-ref { email, ref_code }
   → upsert в pending_refs (email PK)
          ↓
4. Оплата через CloudPayments → webhook:
   Payment (149₽ триал):
     → attribution сохраняется (members.referred_by, ref_code_used)
     → pending_refs очищается
     → комиссия НЕ начисляется (триал)

   Payment (1500₽ прямая оплата):
     → attribution сохраняется
     → комиссия 20%, type='first', status='pending'

   Recurrent (1500₽ первое списание после триала):
     → проверяет: есть ли уже type='first' для этого member?
     → нет → 20%, type='first'
     → да  → 10%, type='recurring'
          ↓
5. approve_after = created_at + 14 дней (заморозка)
          ↓
6. Наташа: /admin/affiliates → одобряет → status='approved'
          → переводит вручную → status='paid', paid_at=now()
```

> [!warning] Реф-ссылка: /join vs /club
> `AFFILIATE_TECH.md` описывает ссылку как `/club?ref=...`, но welcome email
> (при одобрении партнёра) генерирует `https://www.nata-tomshina.ru/join?ref=...`.
> Middleware корректно обрабатывает ?ref= на обоих путях. Расхождение
> документации и кода — не баг, но стоит унифицировать.

---

## 3. База данных

### `affiliates`

```sql
CREATE TABLE affiliates (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name             text NOT NULL,
  email            text UNIQUE NOT NULL,
  ref_code         text UNIQUE NOT NULL,
  status           text DEFAULT 'pending'
                   CHECK (status IN ('pending', 'active', 'paused', 'blocked')),
  commission_rate  numeric DEFAULT 0.20,
  recurring_rate   numeric DEFAULT 0.10,
  total_earned     numeric DEFAULT 0,
  total_paid       numeric DEFAULT 0,
  payment_details  text,
  promo_text       text,
  otp_code         text,
  otp_expires_at   timestamptz,
  cookie_days      integer DEFAULT 60,
  created_at       timestamptz DEFAULT now()
);
```

Индивидуальные ставки: `commission_rate` и `recurring_rate` задаются на каждого
партнёра отдельно. По умолчанию 20% / 10%.

### `affiliate_clicks`

```sql
CREATE TABLE affiliate_clicks (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id  uuid REFERENCES affiliates(id),
  ip_hash       text,
  user_agent_hash text,
  landed_at     timestamptz DEFAULT now()
);
```

### `affiliate_commissions`

```sql
CREATE TABLE affiliate_commissions (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id      uuid REFERENCES affiliates(id),
  member_id         uuid REFERENCES members(id),
  payment_amount    numeric NOT NULL,
  commission_amount numeric NOT NULL,
  type              text CHECK (type IN ('first', 'recurring')),
  status            text DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'paid')),
  approve_after     timestamptz,
  created_at        timestamptz DEFAULT now(),
  paid_at           timestamptz
);
```

### `pending_refs`

```sql
CREATE TABLE pending_refs (
  email       text PRIMARY KEY,
  ref_code    text NOT NULL,
  created_at  timestamptz DEFAULT now()
);
```

Временное хранилище: связывает лид с партнёром до завершения оплаты.
Очищается webhook'ом при успешной оплате.

> [!warning] Нет автоочистки pending_refs
> Записи старше 7 дней не удаляются автоматически — нет cron-задачи.
> Накапливаются незавершённые лиды. Очистка вручную:
> `DELETE FROM pending_refs WHERE created_at < now() - interval '7 days'`.

### Поля в `members`

```sql
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS referred_by     uuid REFERENCES affiliates(id),
  ADD COLUMN IF NOT EXISTS ref_code_used   text;
```

---

## 4. API роуты

### Партнёрский кабинет

| Метод | Endpoint | Назначение |
|---|---|---|
| POST | `/api/partner/apply` | Заявка нового партнёра |
| POST | `/api/partner/auth/send-otp` | Отправить OTP на email партнёра |
| POST | `/api/partner/auth/verify-otp` | Верифицировать OTP → установить `partner_token` |
| POST | `/api/partner/auth/logout` | Удалить куку `partner_token` |
| GET | `/api/partner/stats` | Статистика: клики, участники, earned, pending_payout, список комиссий |
| PATCH | `/api/partner/payment-details` | Сохранить реквизиты для выплат |

### Связка с оплатой

| Метод | Endpoint | Назначение |
|---|---|---|
| POST | `/api/join/save-ref` | Сохранить `{email, ref_code}` в `pending_refs` перед открытием виджета |
| POST | `/api/payments/cloudpayments` | Webhook: attribution + начисление комиссий |

### Админка

| Метод | Endpoint | Назначение |
|---|---|---|
| GET | `/api/admin/affiliates` | Список партнёров с кликами и участниками |
| PATCH | `/api/admin/affiliates/[id]` | Сменить статус (pending→active→suspended/blocked) |
| GET | `/api/admin/commissions` | Комиссии к одобрению и к выплате, total_debt |
| PATCH | `/api/admin/commissions/[id]` | `action: 'approve'` или `action: 'paid'` |

При одобрении партнёра (`status: 'active'`) автоматически отправляется
welcome email с реф-ссылкой и ссылкой на `/partner/login`.

---

## 5. Авторизация партнёра

Отдельная от клуба система — партнёры не являются участницами.

**Файл:** `src/lib/partner-auth.ts`

```
Схема: JWT HS256, секрет = JWT_SECRET
Кука:  partner_token, TTL = 7 дней, httpOnly
Payload: { affiliate_id: string, email: string }
```

**OTP-флоу:**
1. `POST /api/partner/auth/send-otp` → генерирует 6-значный код, сохраняет в `affiliates.otp_code` + `otp_expires_at` (15 мин), шлёт через `mailer.ts` (не GoTrue)
2. `POST /api/partner/auth/verify-otp` → проверяет код, выдаёт `partner_token`

**Страницы:**

| URL | Файл | Назначение |
|---|---|---|
| `/partner` | `src/app/partner/page.tsx` | Лендинг партнёрской программы |
| `/partner/login` | `src/app/partner/login/page.tsx` | Вход (ввод email) |
| `/partner/verify` | `src/app/partner/verify/page.tsx` | Ввод OTP кода |
| `/partner/dashboard` | `src/app/partner/dashboard/page.tsx` | Кабинет партнёра |
| `/legal/affiliate` | `src/app/(club)/legal/affiliate/page.tsx` | Оферта программы |

---

## 6. Комиссионная экономика

| Параметр | Значение |
|---|---|
| Триал 149 ₽ | Комиссия **не начисляется** |
| Первая оплата 1500 ₽ | 20% = 300 ₽ (`type='first'`) |
| Рекуррент 1500 ₽ | 10% = 150 ₽ (`type='recurring'`) |
| Конверсия триал → платный | 20% с первого рекуррента (`type='first'`, если нет предыдущей 'first') |
| Срок куки | 60 дней (`affiliates.cookie_days`) |
| Период заморозки | 14 дней (`approve_after = now() + 14d`) |
| Минимальная выплата | 1000 ₽ (из AFFILIATE_TECH.md, не проверено в коде) |
| День выплат | 1-е число каждого месяца (вручную) |

**Статусы комиссии:** `pending` → `approved` → `paid`

Поле `affiliates.total_earned` обновляется при каждом INSERT в `affiliate_commissions`.
Поле `affiliates.total_paid` обновляется при `action: 'paid'` в `/api/admin/commissions/[id]`.

---

## 7. Защита от фрода

| Риск | Реализация |
|---|---|
| Самореферал | webhook: `if (affiliate.email === member.email) → skip` |
| Накрутка кликов | middleware: дедупликация `SHA-256(IP) + SHA-256(UA)` за 24ч в `affiliate_clicks` |
| Оплата триала без конверсии | Комиссия только за `plan !== 'trial'` (≥1500₽) |
| Ранняя выплата / возврат | `approve_after = now() + 14d`, ручное одобрение Наташей |
| Фейковые партнёры | Ручное одобрение (status='pending' по умолчанию) |
| Подделка ref_code | middleware проверяет `status='active'` в БД перед записью куки |

---

## 8. Что не реализовано

| Статус | Описание |
|---|---|
| ⏳ TODO | Автоочистка `pending_refs` старше 7 дней — нет cron-задачи |
| ⏳ Фаза 4+ | Масштабирование через CPA-сети (Admitad) — только после 50+ партнёров |
| ⏳ TODO | UI изменения `commission_rate`/`recurring_rate` в админке — сейчас через Supabase Studio |

---

## 9. Шпаргалка SQL

```sql
-- Все активные партнёры с балансом
SELECT name, email, ref_code, total_earned, total_paid,
       total_earned - total_paid AS debt
FROM affiliates
WHERE status = 'active'
ORDER BY total_earned DESC;

-- Комиссии к одобрению (14-дневный холд прошёл)
SELECT ac.id, a.name, a.email, ac.commission_amount, ac.type, ac.created_at
FROM affiliate_commissions ac
JOIN affiliates a ON a.id = ac.affiliate_id
WHERE ac.status = 'pending'
  AND ac.approve_after <= now()
ORDER BY ac.created_at;

-- Общий долг по выплатам (approved, но не paid)
SELECT a.name, a.email, a.payment_details,
       SUM(ac.commission_amount) AS to_pay
FROM affiliate_commissions ac
JOIN affiliates a ON a.id = ac.affiliate_id
WHERE ac.status = 'approved'
GROUP BY a.id, a.name, a.email, a.payment_details
ORDER BY to_pay DESC;

-- Участницы привлечённые конкретным партнёром
SELECT m.email, m.ref_code_used, m.subscription_status, m.created_at
FROM members m
JOIN affiliates a ON a.id = m.referred_by
WHERE a.ref_code = 'marina_4821'
ORDER BY m.created_at DESC;

-- Очистить старые pending_refs вручную
DELETE FROM pending_refs
WHERE created_at < now() - interval '7 days';

-- Проверить наличие комиссий 'first' у участницы (для логики триал → рекуррент)
SELECT COUNT(*) FROM affiliate_commissions
WHERE member_id = '<member_uuid>'
  AND type = 'first';
```

---

## 10. Связи с другими модулями

| Модуль | Связь |
|---|---|
| [[../../../05-infrastructure/payments.md]] | CloudPayments webhook — основное место начисления комиссий |
| [[../../../02-public-site/site-routing.md]] | proxy.ts перехватывает ?ref= и пишет куки |
| [[subscriptions.md]] | `members.referred_by` — поле из системы подписок |
| [[../../../04-admin/modules/emails.md]] | Welcome email партнёру при одобрении через `mailer.ts` |

---

## 11. История изменений

| Дата | Событие |
|---|---|
| 31.03.2026 | Реализация и тестирование партнёрской программы. Источник: `AFFILIATE_TECH.md`. |
| 23.05.2026 | Модуль записан в Vault по результатам разведки. |
