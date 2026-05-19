# Участницы клуба (управление)

> Справочник участниц: жизненный цикл, тарифы, блокировки, ручные операции. Только для админа — `/admin/members`.
>
> Источники в коде сверены **2026-05-19**.

## Где в коде

| Слой | Файл |
|---|---|
| Список участниц | `src/app/(club)/admin/members/page.tsx` |
| Карточка участницы | `src/app/(club)/admin/members/[id]/page.tsx` |
| UI карточки | `src/app/(club)/admin/members/[id]/MemberClient.tsx` |
| API — список, создание | `src/app/api/admin/members/route.ts` |
| API — карточка, апгрейд, блокировка | `src/app/api/admin/members/[id]/route.ts` |
| API — смена роли | `src/app/api/admin/members/[id]/role/route.ts` |
| API — удаление | `src/app/api/admin/members/[id]/delete/route.ts` |
| Типы | `src/types/admin.ts` — `MemberRow`, `Tariff`, `SubscriptionStatus` |

## База данных

### Таблица `members`

Основной справочник участниц клуба. Одна строка — одна участница.

| Поле | Тип | Назначение |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` |
| `email` | text | Email (ключ связи с auth) |
| `name` | text | Короткое имя |
| `full_name` | text\|null | Полное ФИО |
| `first_name` | text\|null | Имя для приветствий |
| `role` | text | Роль: `'user'` / `'admin'` / `'curator'` |
| `status` | text | **LEGACY** — всегда `'trial'`, не обновляется. Не использовать в логике. |
| `subscription_status` | text | Актуальный статус подписки (см. раздел «Тарифы и статусы») |
| `tariff` | text | Тариф (см. раздел «Тарифы и статусы») |
| `subscription_plan` | text\|null | Тариф из CloudPayments — отдельное поле (см. ниже) |
| `subscription_ends_at` | timestamptz\|null | Дата окончания подписки |
| `subscription_started_at` | timestamptz\|null | Дата начала подписки |
| `trial_ends_at` | timestamptz\|null | Дата окончания триала (вероятно legacy — см. «Открытые вопросы») |
| `is_blocked` | boolean | Признак блокировки |
| `blocked_at` | timestamptz\|null | Когда заблокирована |
| `blocked_reason` | text\|null | Причина блокировки |
| `is_manual_subscription` | boolean | Ручная подписка (не через CloudPayments) |
| `admin_note` | text\|null | Заметка Наташи |
| `created_at` | timestamptz | Дата регистрации |
| `birth_date` | date\|null | День рождения |
| `age` | number\|null | Возраст |
| `weight` | number\|null | Текущий вес |
| `height` | number\|null | Рост |
| `start_weight` | number\|null | Стартовый вес |
| `goal_weight` | number\|null | Целевой вес |
| `activity_level` | text\|null | Уровень физической активности |
| `health_conditions` | text[]\|null | Ограничения по здоровью |
| `allergies` | text\|null | Аллергии |
| `kbju_calories` | number\|null | Норма калорий (ккал/день) |
| `kbju_protein` | number\|null | Норма белков (г/день) |
| `kbju_fat` | number\|null | Норма жиров (г/день) |
| `kbju_carbs` | number\|null | Норма углеводов (г/день) |
| `avatar_url` | text\|null | Ключ в Storage bucket |
| `kitchen_requests_today` | number | Счётчик запросов к кухне сегодня |
| `kitchen_date` | date | Дата сброса счётчика кухни |
| `onboarding_completed` | boolean | Завершила онбординг |
| `tour_completed` | boolean | Завершила обзорный тур по интерфейсу |
| `last_status_notified_months` | number | Последний месяц, за который показывалось уведомление о ранге (вебинары) |
| `segment` | text\|null | Назначение не установлено (см. «Открытые вопросы») |

## Тарифы и статусы

### `subscription_status` — актуальный статус

> [!important] Это поле — единственный источник истины о статусе участницы. `status` — не использовать.

| Значение | Смысл |
|---|---|
| `'trial'` | Пробный доступ |
| `'active'` | Активная подписка |
| `'expired'` | Подписка истекла (выставляет cron) |
| `'cancelled'` | Отменила рекуррентный платёж в CloudPayments |
| `'blocked'` | Заблокирована вручную |

### `tariff` — тариф

> [!important] Источник сегментации рассылок — `members.tariff`, не `subscription_plan`. См. [emails](emails.md).

В БД исторически встречаются оба написания для каждого уровня:

| Значение в БД | Смысл | Длительность |
|---|---|---|
| `'trial'` / `'Пробный'` | Пробный доступ | 7 дней |
| `'month'` / `'monthly'` | Месяц | 30 дней |
| `'halfyear'` / `'Полгода'` | Полгода | 180 дней |

При SQL-фильтрах всегда обрабатывать оба варианта: `IN ('month', 'monthly')`, `IN ('trial', 'Пробный')`.

Отображение в UI через `TARIFF_LABELS` (`MemberClient.tsx:17`), который покрывает все шесть значений.

### `tariff` vs `subscription_plan`

Два поля с перекрывающимся смыслом:

- **`tariff`** — основное. Заполняется при ручном создании (`api/admin/members/route.ts`) и через CloudPayments webhook. Используется в email-сегментации и UI.
- **`subscription_plan`** — заполняется **только из CloudPayments webhook**. У ручных участниц (`is_manual_subscription = true`) может быть `null`. Используется в расчёте клубного ранга через `getEffectiveMonths()`.

Явного контракта между полями нет. Tech-debt: см. «Открытые вопросы».

### Роли (`role`)

| Значение | Смысл |
|---|---|
| `'user'` | Обычная участница |
| `'admin'` | Администратор (Наташа) |
| `'curator'` | Куратор |

Смена роли: `PATCH /api/admin/members/[id]/role` (значения: `'curator'` / `'member'` → в БД сохраняется `'user'`). Роль `'admin'` нельзя изменить или заблокировать через UI.

## Жизненный цикл участницы

```
Оплата на лендинге (CloudPayments)
    ↓
CloudPayments webhook → members:
    subscription_status = 'active'
    tariff = 'monthly' | 'halfyear'
    subscription_plan = 'monthly' | 'halfyear'
    subscription_ends_at = now() + 30/180 дней
    subscription_started_at = now()
    ↓
Ежедневный cron check-subscriptions (0 0 * * *):
    subscription_ends_at < now() → subscription_status = 'expired'
    ↓
[при отмене рекуррента] CloudPayments webhook:
    subscription_status = 'cancelled'
    ↓
[ручная блокировка] PATCH /api/admin/members/[id]:
    is_blocked = true
    subscription_status = 'blocked'
    blocked_at = now()
    blocked_reason = <текст>
```

**Ручное создание через админку** (`POST /api/admin/members`):

1. Проверка дубля в `members` по email
2. `auth.admin.createUser({email, email_confirm: true})`
3. `members.upsert({id: uid, subscription_status: 'active', is_manual_subscription: true, ...})`
4. `auth.admin.generateLink({type: 'magiclink', redirectTo: '/dashboard'})` — magic link действителен 24 часа
5. `sendEmail(...)` — письмо-приглашение с кнопкой входа

Откат: при ошибке upsert в шаге 3 → `auth.admin.deleteUser(uid)`.

## Кто пишет / читает таблицу

### Пишут

| Кто | Что меняет |
|---|---|
| `api/admin/members/route.ts` (POST) | Создаёт запись (upsert) |
| `api/payments/cloudpayments/route.ts` | subscription_status, tariff, subscription_plan, subscription_ends_at, subscription_started_at |
| `api/cron/check-subscriptions/route.ts` | subscription_status = 'expired' |
| `api/admin/members/[id]/route.ts` (PATCH) | tariff, subscription_ends_at, is_blocked, blocked_*, onboarding_completed |
| `api/admin/members/[id]/role/route.ts` (PATCH) | role |
| `api/admin/members/[id]/delete/route.ts` (DELETE) | удаление строки |
| `api/tracker/measurements/route.ts` | weight, kbju_* |
| `components/ProfileClient.tsx` | Профильные поля (kbju, цели, антропометрия) |
| `dashboard/webinars/page.tsx` | last_status_notified_months |

### Читают

Практически все модули клуба. Главные потребители:

- `api/member/me/route.ts` — источник для `MemberContext` на всех страницах участницы
- Все страницы `/dashboard/*` — проверка subscription_status, КБЖУ, данные профиля
- `api/admin/emails/segments/route.ts` — сегменты рассылок по tariff + subscription_status
- `requireAdmin()` во всех admin-роутах — проверка роли

## Что видит Наташа в админке

### Список `/admin/members`

- **Вкладки-фильтры:** Все / Триал / Активные / Отменили / Заблокированы
- **Поиск** по имени и email (ilike, дебаунс)
- **Пагинация:** 20 записей/страница, max 200 на запрос
- **Строка:** аватар, ФИО + email, дата регистрации, статус (badge), дата окончания, тариф
- **Иконка именинницы** 🎂 если `birth_date` совпадает с сегодня

**Форма «Добавить участницу»:** email, ФИО, тариф (Месяц / Полгода), заметка. После сохранения magic link показывается на экране (запасной вариант если email не отправился).

### Карточка `/admin/members/[id]`

| Блок | Действия |
|---|---|
| Клубный ранг | 🌸 Новенькая / 🔥 Вошла во вкус / 💚 Уже своя / 👑 Легенда / 💎 Бриллиант — по `getEffectiveMonths(subscription_started_at, subscription_plan)` |
| Тариф | Смена тарифа + дата окончания вручную |
| Продление | +30 дней / +180 дней / до конкретной даты (extends from current end или от today) |
| Блокировка | Заблокировать (с причиной) / Разблокировать |
| Роль | Назначить куратором / Снять |
| Заметка | admin_note (сохраняется отдельно) |
| История платежей | Таблица PaymentLog: amount, plan, event_type, created_at |
| Удаление | Кнопка «Удалить» — вызывает DELETE /api/admin/members/[id]/delete |

## Типовые операции

### Найти активных участниц с тарифом «Полгода»

```sql
SELECT email, full_name, subscription_ends_at
FROM members
WHERE subscription_status = 'active'
  AND tariff IN ('halfyear', 'Полгода')
ORDER BY subscription_ends_at;
```

### Найти участниц с истекающей подпиской (ближайшие 7 дней)

```sql
SELECT email, full_name, subscription_ends_at, tariff
FROM members
WHERE subscription_status = 'active'
  AND subscription_ends_at BETWEEN now() AND now() + interval '7 days'
ORDER BY subscription_ends_at;
```

### Ручная разблокировка (если UI недоступен)

```sql
UPDATE members
SET is_blocked = false,
    subscription_status = 'active',
    blocked_at = null,
    blocked_reason = null
WHERE email = 'email@example.com';
```

### Счётчик по статусам (дашборд Наташи)

```sql
SELECT
  subscription_status,
  count(*) AS cnt
FROM members
GROUP BY subscription_status
ORDER BY cnt DESC;
```

## Открытые вопросы / Tech debt

1. **`status` — legacy, не использовать.** Поле всегда содержит `'trial'`, не обновляется с момента миграции с GetCourse. Все проверки доступа — через `subscription_status`. Удалять не рекомендуется до полного аудита всех мест чтения.

2. **`subscription_status` тип неполный.** `SubscriptionStatus` в `src/types/admin.ts` объявлен как `'trial' | 'active' | 'cancelled' | 'blocked'` — нет `'expired'`. Несоответствие типа реальному состоянию БД. Добавить `'expired'` в тип. Не критично, но приводит к ложным предположениям в новом коде.

3. **`tariff` vs `subscription_plan` — нет контракта.** Два поля с перекрывающимся смыслом, разные источники записи. Ни где не задокументировано, кто из них «главный» для каждой задачи. Tech-debt: зафиксировать явный контракт (что и когда писать в каждое поле) или привести к одному полю.

4. **`segment` — назначение не установлено.** Присутствует в select из `src/app/(club)/dashboard/page.tsx`, нигде явно не записывается и не используется в бизнес-логике. Вероятно legacy или задел на будущее. Не трогать до выяснения.

5. **`trial_ends_at` — вероятно legacy.** Присутствует в `api/member/me` select, но отсутствует во всех admin-select и нигде не отображается. Возможно осталось с эпохи GetCourse. Не трогать до аудита.

## История изменений

> [!note] Ранние изменения не задокументированы — модуль существовал до начала ведения сессий в Vault.

- 2026-05-19: создан модуль в Vault — [[07-sessions/SESSION_2026-05-19_VAULT_HANDOFF]]

## Связано

- [emails](emails.md) — сегменты рассылок строятся по `members.tariff` и `members.subscription_status`
- [payments](../../05-infrastructure/payments.md) — CloudPayments webhook пишет в `members`
- [subscriptions](../../03-club/modules/subscriptions.md) — логика доступа участницы (модуль не написан)
- [email-system](../../05-infrastructure/email-system.md) — серия `welcome_members` стартует при первом платеже
- [database](../../05-infrastructure/database.md) — `members` в общем индексе таблиц
- `08-roadmap/todo.md` → R50 (UI апгрейда не выставляет subscription_plan), R51 (метка «Заблокированные» для cancelled)

---

*Обновлено: 2026-05-19. Источники сверены с кодом.*
