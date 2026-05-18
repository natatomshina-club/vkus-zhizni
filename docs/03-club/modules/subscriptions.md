# Подписки и уровни участниц

> Логика подписок и уровней — центральный механизм клуба. Уровень вычисляется динамически из времени членства и плана. Единственный источник истины: `src/lib/webinars.ts`.

## Поля в `members` (подписка)

| Поле | Тип | Описание |
|---|---|---|
| `subscription_status` | `'trial'\|'active'\|'expired'\|'cancelled'` | Текущий статус |
| `subscription_plan` | `'trial'\|'month'\|'monthly'\|'halfyear'\|'Полгода'` | Тариф (legacy-значения: monthly, Полгода) |
| `subscription_ends_at` | timestamptz | Дата окончания подписки |
| `trial_ends_at` | timestamptz | Дата окончания триала |
| `subscription_started_at` | timestamptz | Старт подписки — используется как база для расчёта уровня |
| `is_manual_subscription` | boolean | VIP: рекуррент не трогает `subscription_ends_at` |
| `start_weight` | numeric\|null | Стартовый вес — используется для «Минус кг» (`start_weight - weight`) |
| `segment` | text\|null | Сегмент из онбординговой анкеты («Постепенно без стресса» и др.) |

> `tariff` — поле запрашивается в `dashboard/page.tsx` но нигде не рендерится. Вероятно legacy.

## Тарифы

| Тариф | ID | Цена | Длительность | Рекуррент |
|---|---|---|---|---|
| Пробный | `trial` | 149 ₽ | 7 дней | Да → 1500 ₽/мес |
| Месяц | `month` | 1500 ₽ | 30 дней | Да |
| Полгода | `halfyear` | 6000 ₽ | 180 дней | Нет |

Подробно — [[05-infrastructure/payments]].

> **Ручные «Бриллианты»** (`is_manual_subscription = true`) должны иметь `subscription_plan = 'month'`, иначе скрываются кнопки управления подпиской в профиле.

## Уровни — `getEffectiveMonths`

Источник: `src/lib/webinars.ts` — единственное место где вычисляется уровень.

**Формула:**
```
effectiveMonths = Math.floor((now - subscription_started_at) / 30_days)
                 + (plan === 'halfyear' || plan === 'Полгода' ? 6 : 0)
```

| Уровень | Эффективных месяцев | Квота вебинаров |
|---|---|---|
| 🌸 Новенькая | 0–2 | 0 |
| ⭐ Вошла во вкус | 3–5 | 2 |
| 🔥 Уже своя | 6–8 | 5 |
| 💚 Легенда | 9–11 | 7 + курсы |
| 💎 Бриллиант | 12+ | всё (999) |

Курсы (`content_type='course'`) — доступны только с 9+ месяцев.

> [!warning] Баг: иконки уровней в `dashboard/page.tsx` не совпадают с `webinars.ts` и `level-up` cron.
> - 3–5 мес: dashboard показывает 🔥 «Вошла во вкус», cron ожидает ⭐
> - 6–8 мес: dashboard 💚 «Уже своя», cron 🔥
> - 9–11 мес: dashboard 👑 «Легенда», cron 💚
>
> Источник истины — `webinars.ts`. `dashboard/page.tsx` нужно привести к нему. Задача в [[08-roadmap/todo]].

## Видимость контента

### Trial vs Active

| Элемент | trial | active |
|---|---|---|
| Sidebar badge | 🟣 «Пробный период» | 🟢 «Полный клуб» |
| Trial banner (desktop) | ✅ | ❌ |
| Кнопка «Отменить пробный» (профиль) | ✅ | ❌ |
| Марафон: задания / рацион / комментарий | ❌ TrialLockBlock | ✅ |
| Марафон: замеры | ❌ | ✅ |
| Марафон: чат | ❌ | ✅ |

TrialLockBlock → `/dashboard/upgrade`.

### По уровням

Уровень влияет только на вебинары и курсы (см. таблицу выше). Остальной контент клуба от уровня не зависит.

## Level-up уведомления

Cron-задача `/api/cron/level-up` — запускается ежедневно в 10:00.

Пороги: **3, 6, 9, 12** эффективных месяцев.

При переходе через порог — уведомление участнице. Дедупликация через таблицу `notifications` (чтобы не отправлять повторно).

> [!warning] Авторизация cron-задач непоследовательна:
> - `level-up` → заголовок `x-cron-secret`
> - `check-subscriptions` → `Authorization: Bearer`
>
> Оба используют один `CRON_SECRET`, но разные форматы. Техдолг — унифицировать.

## Отмена подписки

| Тариф | Способ |
|---|---|
| `trial` | Кнопка в профиле → `/api/subscription/cancel` |
| `month` / `halfyear` | Участница сама на `my.cloudpayments.ru/ru/unsubscribe` |

При отмене триала: `subscription_status = 'cancelled'`.

> `subscription-reminders` cron (`/api/cron/subscription-reminders`) — роут существует, статус задачи на сервере неизвестен. Уточнить.

## Ключевые файлы

| Файл | Назначение |
|---|---|
| `src/lib/webinars.ts` | `getEffectiveMonths`, `getStatusLabel`, `getWebinarQuota` — источник истины |
| `src/app/(club)/dashboard/page.tsx` | Уровень → иконки, цвета, trial banner |
| `src/app/(club)/dashboard/profile/ProfileClient.tsx` | Управление подпиской, кнопка отмены триала |
| `src/app/api/cron/level-up/route.ts` | Уведомления при переходе уровня |
| `src/app/api/cron/check-subscriptions/route.ts` | Пометка expired |
| `src/app/api/subscription/cancel/route.ts` | Отмена триала |

## Белые пятна

- `kbju_protein_system`, `kbju_carbs_system`, `kbju_manual` — три поля в `members` для управления ручным/системным КБЖУ. Логика не изучена, не задокументирована.
- `subscription-reminders` cron — статус на сервере неизвестен.
- `/welcome?plan=monthly` — страница-редирект после оплаты, наследие Prodamus. Актуальность при CloudPayments неизвестна.

## История изменений

| Дата | Событие |
|---|---|
| апр 2026 | Переход с Prodamus на CloudPayments, тарифы пересобраны |
| 17 мая 2026 | Фикс: `subscription_plan = 'halfyear'` корректно пишется webhook'ом |

## Связано

- [[05-infrastructure/payments]] — CloudPayments, webhook, тарифы
- [[03-club/modules/webinars]] — квоты и уровни в контексте вебинаров
- [[03-club/modules/marathons]] — TrialLockBlock
- [[08-roadmap/todo]] — баг иконок уровней
