# Профиль участницы

Раздел `/dashboard/profile` — личный кабинет участницы: фото, данные тела, КБЖУ-норма, здоровье, статус подписки, документы, уведомления, выход.

Ключевые файлы:
- `src/app/(club)/dashboard/profile/page.tsx` — SSR-оболочка
- `src/components/ProfileClient.tsx` (1101 строк) — главный клиентский компонент
- `src/app/(club)/dashboard/profile/AvatarUpload.tsx` — загрузка аватара

---

## Доступ по тарифу

Ограничений нет — страница доступна всем участницам (`trial`, `active`, `expired`). Участницы с `expired` технически могут открыть URL, но войти через OTP не смогут (правило #10 из CLAUDE.md блокирует вход).

---

## Разделы страницы

### 1. Фото профиля

Компонент `AvatarUpload` (`src/app/(club)/dashboard/profile/AvatarUpload.tsx`).

- **Загрузка:** клиентский Supabase (`createClient()`), bucket `avatars`, путь `{auth_user_id}/avatar.jpg`, режим `upsert: true` (один файл на участницу). Перед загрузкой изображение сжимается на клиенте: canvas resize до max 400px, JPEG 85%.
- **После загрузки:** обновляет `members.avatar_url` строкой `{public_url}?t={timestamp}` (cache-bust).
- **Удаление:** `DELETE /api/profile/avatar` — удаляет файл из Storage и обнуляет `avatar_url`.

> [!note] Путь в Storage (`{auth_user_id}/avatar.jpg`) использует `auth.users.id` — намеренно и консистентно между upload и delete. Проблема только в DB-обновлении (`.eq('id', userId)`), где нужен `member.id` из email lookup. См. R91, R92.

### 2. Данные участницы

Редактируемые поля, кнопка «Сохранить». При сохранении пересчитывает КБЖУ через `calculateKBJU()` из `@/lib/kbju` (формула Mifflin–St Jeor).

| Поле | Описание |
|---|---|
| `full_name` | ФИО: три поля в UI, собираются в одну строку |
| `first_name` | Имя (используется в приветствии) |
| `age` | Возраст |
| `weight` | Текущий вес (кг) |
| `height` | Рост (см) |
| `goal_weight` | Целевой вес |
| `initial_weight` | Начальный вес при вступлении |
| `activity_level` | Уровень активности (select) |
| `birth_date` | Дата рождения |

### 3. Моя норма КБЖУ

Показывает рассчитанные значения. Разрешает ручную корректировку белков и углеводов.

| Поле | Редактируемость | Правило |
|---|---|---|
| `kbju_calories` | нет | всегда read-only |
| `kbju_protein` | да | ±20г от `kbju_protein_system` |
| `kbju_carbs` | да | ↓ до 20г, ↑ не выше `kbju_carbs_system` |
| `kbju_fat` | нет | авто: `(calories - protein×4 - carbs×4) / 9` |

Ручная корректировка: `PATCH /api/profile/kbju-override`. При сохранении `kbju_manual = true`.
Сброс к системным значениям: `POST /api/profile/kbju-override/reset`. При сбросе `kbju_manual = false`.

> [!warning] **R78** — POST `/api/tracker/measurements` всегда ставит `kbju_manual: false` и пересчитывает КБЖУ по новому весу. Ручная корректировка из КБЖУ-формы теряется при следующем замере. Документировано в [[03-club/modules/measurements]].

### 4. Здоровье

| Поле | Редактируемость | Способ |
|---|---|---|
| `health_conditions` | да | 8 чекбоксов: `gastritis`, `no_gallbladder`, `gerd`, `ibs`, `ir`, `high_cholesterol`, `kidney`, `diabetes` |
| `allergies` | нет | показывается строкой, поле не редактируется |

**`allergies` read-only — намеренно.** Поле заполняется один раз при онбординге (`OnboardingForm.tsx`, свободный текст). Изменить его через интерфейс профиля нельзя — это не баг.

### 5. Подписка

Все поля read-only. Управление зависит от `subscription_status`:

| Статус | Что видит участница |
|---|---|
| `trial` | Статус «Пробный период», кнопка «Отменить пробный период» |
| `active` | Статус «Активна», план, дата следующего списания, ссылка на CloudPayments |
| `expired` | Статус «Истекла», CTA «Продлить» → `/dashboard/upgrade` |

**Отмена триала (`POST /api/subscription/cancel`):**
- Доступна только при `subscription_status = 'trial'` (активные подписки через этот роут не отменяются)
- Меняет `subscription_status` → `'expired'`
- Записывает в `cancellations(member_id, email, plan)` — служит счётчиком для виджета статистики в админке
- Auth: email lookup → `member.id` из email lookup (корректно)

### 6. Документы

Статические ссылки: `/legal/terms`, `/legal/privacy`, `/legal/disclaimer`, `/legal/rules`, `/legal/refund`.

### 7. Уведомления

Toggle web push (`usePushNotifications` hook). Управляет подпиской через Service Worker. Таблица: `push_subscriptions` (не задокументирована, см. R63).

### 8. Выход

`supabase.auth.signOut()` → редирект на `/auth`.

---

## Полная таблица полей `members`

| Поле | Показывается | Редактируется | Раздел |
|---|---|---|---|
| `email` | да | нет | шапка |
| `full_name` | да | да | Данные участницы |
| `first_name` | да | да | Данные участницы |
| `age` | да | да | Данные участницы |
| `weight` | да | да | Данные участницы |
| `height` | да | да | Данные участницы |
| `goal_weight` | да | да | Данные участницы |
| `initial_weight` | да | да | Данные участницы |
| `activity_level` | да | да | Данные участницы |
| `birth_date` | да | да | Данные участницы |
| `health_conditions` | да | да | Здоровье |
| `allergies` | да | нет | Здоровье |
| `kbju_calories` | да | нет | КБЖУ |
| `kbju_protein` | да | да (±20г) | КБЖУ |
| `kbju_fat` | да | нет (авто) | КБЖУ |
| `kbju_carbs` | да | да (↓ до 20г) | КБЖУ |
| `avatar_url` | да | да | Фото |
| `subscription_status` | да | нет | Подписка |
| `subscription_plan` | да | нет | Подписка |
| `subscription_ends_at` | да | нет | Подписка |
| `trial_ends_at` | да | нет | Подписка |
| `kbju_manual` | нет | нет | техническое |
| `kbju_protein_system` | нет | нет | техническое |
| `kbju_carbs_system` | нет | нет | техническое |
| `name` | нет | нет | наследие |
| `id`, `created_at`, `status` | нет | нет | — |

---

## Auth-паттерн

**SSR-страница** (`dashboard/profile/page.tsx`):

```typescript
const { data: member } = await createServiceClient()
  .from('members')
  .select('id, email, name, full_name, ...')
  .eq('email', user.email)   // email lookup — правило #1 соблюдено
  .single()
// НО: передаёт в ProfileClient userId={user.id} (auth id), а не member.id
```

**Клиентские сохранения** в `ProfileClient.tsx` — нарушение правила #11, см. R91:

```typescript
// saveProfile() и saveHealth() — оба:
await supabase.from('members').update({...}).eq('id', userId)
// userId = user.id (auth id из SSR prop), а не members.id
```

**API-роуты КБЖУ** (`kbju-override`, `kbju-override/reset`): email lookup ✓

**`DELETE /api/profile/avatar`**: нарушение правила #11, см. R92.

**`POST /api/subscription/cancel`**: email lookup → `member.id` из email lookup ✓

---

## API-роуты

| Метод | Путь | Назначение | Auth |
|---|---|---|---|
| GET | `/api/member/me` | Данные профиля | email lookup ✓ |
| PATCH | `/api/profile/kbju-override` | Ручная корректировка белков/углеводов | email lookup ✓ |
| POST | `/api/profile/kbju-override/reset` | Сброс КБЖУ к системным значениям | email lookup ✓ |
| DELETE | `/api/profile/avatar` | Удалить аватар (Storage + DB) | `.eq('id', user.id)` ❌ R92 |
| POST | `/api/subscription/cancel` | Отменить пробный период | email lookup → `member.id` ✓ |

`GET /api/member/me` содержит отладочные `console.log` (R93).

---

## Специальные вопросы

| Вопрос | Ответ |
|---|---|
| **Email change** | Механизма нет. Email всегда read-only. |
| **Account deletion** | Механизма нет. Нет ни UI, ни API-роута. |
| **Avatar bucket** | `avatars`, путь `{auth_user_id}/avatar.jpg` (upsert). |
| **Affiliate entry point** | В профиле нет. Партнёрская программа — отдельный раздел клуба ([[03-club/modules/affiliate]]). |

---

## Онбординг (смежный роут)

`POST /api/onboarding/profile` — вызывается при первичном онбординге, не при редактировании профиля. Email lookup ✓. Устанавливает `onboarding_completed = true`. Пишет поля, которых нет в форме профиля: `start_weight`, `agreed_terms_at`, `agreed_disclaimer_at`, `agreed_personal_data_at`. Содержит отладочные `console.log` (R93).

---

## Известные баги / tech debt

- **R91** — Rule #11: `saveProfile()` и `saveHealth()` в `ProfileClient.tsx` + `AvatarUpload.tsx` используют `.eq('id', userId)` где `userId = user.id` (auth id). Если `auth.users.id ≠ members.id` — сохранения обновят ноль строк или неверную строку. Исправить: передавать `member.id` из SSR-пропа или делать email lookup. [[08-roadmap/todo]]
- **R92** — Rule #11: `DELETE /api/profile/avatar` делает `.eq('id', user.id)` при обнулении `members.avatar_url`. Storage-путь (`{user.id}/avatar.jpg`) корректен и менять его не нужно. Исправить только DB update на email lookup. [[08-roadmap/todo]]
- **R93** — Отладочные `console.log` в `/api/member/me` и `/api/onboarding/profile`. На работу не влияют, но замусоривают логи. Убрать. [[08-roadmap/todo]]
- **R78** — Замер веса сбрасывает ручную корректировку КБЖУ. Задокументировано в [[03-club/modules/measurements]].

---

## История изменений

| Дата | Событие |
|---|---|
| май 2026 | Документ создан — разведка по коду |
