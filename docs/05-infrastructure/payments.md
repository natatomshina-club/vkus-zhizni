# Платежи — CloudPayments

> Интеграция с CloudPayments для приёма оплаты подписок. Боевой режим с 6 апреля 2026.

## Тарифы

| Тариф | ID в коде | Цена | Длительность | Рекуррент |
|---|---|---|---|---|
| Пробный | `trial` | 149 ₽ | 7 дней | Да → через 7 дней списывается 1500 ₽/мес |
| Месяц | `month` | 1500 ₽ | 30 дней | Да → каждый месяц |
| Полгода | `halfyear` | 6000 ₽ | 180 дней | Нет |

**Fallback определения плана:** сначала из `Data.Metadata.plan` (виджет), затем по сумме (149 / 1500 / 6000).

**Legacy значения в БД:** `monthly` = `month`, `Полгода` = `halfyear` — исторические, появились до унификации. Webhook с 17 мая 2026 пишет только канонические значения.

`PLAN_DAYS`: `{ trial: 7, month: 30, monthly: 30, halfyear: 180 }`

## Уровни участниц

> Уровень определяется функцией `getEffectiveMonths` в `src/lib/webinars.ts`.
> Подробнее — будущий файл `03-club/modules/subscriptions.md`.

`getEffectiveMonths(createdAt, plan)`:
- Считает полные месяцы с даты регистрации
- Для `halfyear` / `Полгода` прибавляет +6 месяцев

| Уровень | Эффективных месяцев | Квота вебинаров |
|---|---|---|
| 🌸 Новенькая | 0–2 | 0 |
| ⭐ Вошла во вкус | 3–5 | 2 |
| 🔥 Уже своя | 6–8 | 5 |
| 💚 Легенда | 9–11 | 7 |
| 💎 Бриллиант | 12+ | всё (999) |

Курсы (`content_type='course'`) — доступны только с 9+ месяцев.

## Состояния подписки

```
trial → active → expired
              ↘ cancelled  (при отмене рекуррента через CloudPayments)
```

Поле в БД: `members.subscription_status`.

**Защита от повторного триала:** если `last_payment_amount != null` — повторный триал игнорируется, в `payment_logs` пишется `duplicate_trial`.

**`is_manual_subscription = true`:** рекуррент обновляет `last_payment_at`, но не трогает `subscription_ends_at`. Используется для VIP-участниц с ручным продлением.

## Платёжный флоу

### Новая участница (`/join`)
1. Страница `/join` — публичная, без auth middleware
2. Открывается виджет CloudPayments с `publicId` + `metadata.plan`
3. CloudPayments отправляет webhook на `/api/payments/cloudpayments`
4. Webhook обрабатывает событие PAY (см. ниже)

### Апгрейд внутри клуба (`/dashboard/upgrade`)
- Только `month` и `halfyear` (триал недоступен)
- Путь: `src/app/(club)/dashboard/upgrade/page.tsx`

## Вебхук

**URL:** `/api/payments/cloudpayments`  
**Файл:** `src/app/api/payments/cloudpayments/route.ts`

### HMAC верификация
Проверяются оба заголовка: `Content-HMAC` и `X-Content-HMAC` (GUIDE.md упоминал только второй — устарел).  
При mismatch: возвращает `{ code: 0 }` без обработки платежа.  
Секреты: `CP_API_SECRET` (боевой) / `CP_API_SECRET_TEST` (тестовый) — оба проверяются параллельно.

### Логика обработки

#### PAY (первый платёж / триал)
1. HMAC проверка
2. Защита от повторного триала
3. Upsert в `members`: `subscription_status`, `subscription_plan`, `subscription_ends_at`
4. Upsert в `subscribers` с `source: 'club_member'`
5. Аффилиатная комиссия: 20% с первого реального платежа (не триала)
6. Welcome email: `POST /api/email/welcome` (fire-and-forget)
7. Email-серия welcome: запись в `subscriber_sequence_progress` через 1 час

#### Recurrent (автосписание)
1. Обновляет `subscription_ends_at`, `last_payment_at`
2. Если `is_manual_subscription = true` — обновляет только `last_payment_at`
3. Аффилиатная комиссия: 10% с рекуррентов

#### Cancelled / Rejected
- Статус → `cancelled`
- Рекуррент останавливается

## Отмена подписки

| Тариф | Способ отмены |
|---|---|
| trial | `/api/subscription/cancel` (кнопка внутри клуба) |
| month / halfyear | Участница сама на `my.cloudpayments.ru/ru/unsubscribe` |

## Партнёрская комиссия (аффилиаты)

- `pending_refs` — хранит `ref_code` до момента первой оплаты
- 20% с первого реального платежа
- 10% с рекуррентов
- Подробнее — будущий файл `03-club/modules/affiliate.md`

## Ключевые файлы

| Файл | Назначение |
|---|---|
| `src/app/api/payments/cloudpayments/route.ts` | Главный webhook |
| `src/app/api/subscription/cancel/route.ts` | Отмена триала |
| `src/app/api/cron/check-subscriptions/route.ts` | Cron: пометка expired |
| `src/lib/webinars.ts` | `getEffectiveMonths`, уровни, квоты |
| `src/app/join/page.tsx` | Страница оплаты (новые) |
| `src/app/(club)/dashboard/upgrade/page.tsx` | Апгрейд тарифа |

## Переменные окружения

| Переменная | Тип | Описание |
|---|---|---|
| `NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID` | build-arg | Public ID для виджета |
| `CP_API_SECRET` | runtime | HMAC-секрет боевого магазина |
| `CP_API_SECRET_TEST` | runtime | HMAC-секрет тестового магазина |

## Шпаргалка

### Ручной апгрейд в Бриллианты (SQL)
```sql
UPDATE members
SET subscription_status = 'active',
    subscription_plan = 'halfyear',
    subscription_ends_at = now() + interval '180 days'
WHERE email = 'email@example.com';
```
После — перезапустить PostgREST (см. [[05-infrastructure/server#После ALTER TABLE]]).

### Диагностика webhook
```bash
ssh deploy@155.212.130.228
sudo docker logs vkus-zhizni --tail=200 | grep -i "cloudpayments\|webhook\|payment"
```

### Проверить статус подписки
```sql
SELECT email, subscription_status, subscription_plan,
       subscription_ends_at, is_manual_subscription
FROM members
WHERE email = 'email@example.com';
```

## История изменений

| Дата | Событие |
|---|---|
| 29 мар 2026 | CLOUDPAYMENTS_GUIDE.md написан (тестовый режим) |
| 6 апр 2026 | Переключение в боевой режим |
| 17 мая 2026 | Фикс: `subscription_plan = 'halfyear'` теперь корректно пишется webhook'ом |

## Связано

- [[05-infrastructure/server]] — деплой и логи
- [[03-club/modules/subscriptions]] — тарифы и уровни (будущий файл)
- [[03-club/modules/affiliate]] — партнёрская программа (будущий файл)
- [[08-roadmap/todo]] — открытые задачи по платежам
