# Избранные рецепты

> [!note] Файл называется `recipes.md` по историческим причинам. Фактический раздел в UI — `/dashboard/favorites`, заголовок «Избранные рецепты ⭐».

Раздел `/dashboard/favorites` — хранилище рецептов, сохранённых участницей из Умной кухни и Недельного плана, плюс собственные рецепты из Калькулятора.

---

## Доступ по тарифу

Нет ограничений — избранное доступно всем участницам, включая `trial`. Проверки `subscription_status` при сохранении и отображении не выполняются.

---

## Три хранилища

| Хранилище | Где хранится | Откуда попадает |
|---|---|---|
| `saved_recipes` | БД | Кнопка «⭐ Сохранить» в Умной кухне (`KitchenClient`) и Недельном плане (`WeeklyPlanView`) |
| `member_recipes` | БД | Калькулятор в Умной кухне (`KitchenCalculator`→ API) |
| `saved_sauces` | `localStorage` | Страница соусов в Умной кухне |

Страница `/dashboard/favorites` отображает все три в двух вкладках: «⭐ Избранное» (saved_recipes + saved_sauces, с фильтрами по категории) и «📝 Мои рецепты» (member_recipes).

---

## `saved_recipes` (БД)

### Таблица

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK |
| `member_id` | uuid | FK → `members.id` (email-lookup, не auth.uid()) |
| `title` | text | Название блюда |
| `description` | text\|null | Описание |
| `meal_type` | text\|null | Категория: `завтрак`, `обед_ужин`, `салат`, `суп`, `десерт` |
| `ingredients` | jsonb\|null | Список ингредиентов с граммами |
| `steps` | text[]\|null | Шаги приготовления |
| `time_minutes` | integer\|null | Время готовки |
| `kbju_calories` | integer\|null | Калории |
| `kbju_protein` | integer\|null | Белки (г) |
| `kbju_fat` | integer\|null | Жиры (г) |
| `kbju_carbs` | integer\|null | Углеводы (г) |
| `created_at` | timestamptz | |

### Кнопки сохранения

Запись в `saved_recipes` происходит **клиентом напрямую через Supabase** (`createClient()`, anon-ключ) — без промежуточного API-роута:

| Компонент | Функция | Откуда |
|---|---|---|
| `KitchenClient.tsx` | `handleSave()` | Текущий результат подбора рецептов |
| `KitchenClient.tsx` | `handleHistSave()` | Рецепт из истории запросов |
| `WeeklyPlanView.tsx` | `MealCard.handleSave()` | Блюдо из недельного рациона |

Кнопка показывает «⭐ Сохранить» → после нажатия «✓ Сохранено» (без перезагрузки). Повторное нажатие игнорируется (флаг `saved/histSaved`).

### Удаление

Удаление — тоже клиентом напрямую:

```typescript
supabase.from('saved_recipes').delete().eq('id', id).eq('member_id', userId)
```

С двойным подтверждением в UI (кнопка 🗑 → «Удалить / Нет»).

### Лимит

`maxCount = 50` (захардкожен в `dashboard/favorites/page.tsx`). В счётчик входят `saved_recipes (DB) + saved_sauces (localStorage)`. Отображается прогресс-бар.

> [!warning] **R89 — Лимит не защищён на сервере.** `maxCount = 50` проверяется только в UI. Клиент с anon-ключом может вставить в `saved_recipes` более 50 записей напрямую в обход счётчика. Нужен CHECK на уровне RLS или триггер в БД. См. [[08-roadmap/todo|R89]].

---

## `member_recipes` (БД)

Собственные рецепты участницы, созданные в Калькуляторе кухни. В отличие от `saved_recipes`, для них есть полноценные API-роуты.

### Таблица

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK |
| `member_id` | uuid | FK → `members.id` (email-lookup) |
| `name` | text | Название рецепта |
| `ingredients` | jsonb | Список продуктов с граммами и КБЖУ |
| `total_calories` | numeric\|null | Суммарные калории (на все порции) |
| `total_protein` | numeric\|null | Белки (г) |
| `total_fat` | numeric\|null | Жиры (г) |
| `total_carbs` | numeric\|null | Углеводы (г) |
| `servings_count` | integer | Количество порций (≥ 1) |
| `created_at` | timestamptz | |

Карточка рецепта показывает КБЖУ на 1 порцию и суммарно. При добавлении в дневник — счётчик порций (от 1 до `servings_count`).

---

## `saved_sauces` (localStorage)

Соусы сохраняются в `localStorage` под ключом `saved_sauces` (массив объектов `{id, title, emoji, category, kbju, ingredients, steps, tip, savedAt}`). В БД не пишутся.

**Следствие:** при смене устройства, браузера или очистке данных соусы теряются безвозвратно. Зафиксировано в [[03-club/_findings|_findings]] как архитектурный факт.

---

## API роуты

API-роуты существуют только для `member_recipes`. Для `saved_recipes` операции идут напрямую через Supabase-клиент.

| Метод | Путь | Назначение | Авторизация |
|---|---|---|---|
| GET | `/api/member-recipes` | Список рецептов участницы | участница (свои) |
| POST | `/api/member-recipes` | Создать рецепт: `{name, ingredients, total_calories, total_protein, total_fat, total_carbs, servings_count}` | участница |
| DELETE | `/api/member-recipes/[id]` | Удалить рецепт | участница (только свой: `.eq('member_id', member.id)`) |

**Валидация POST:**
- `name` — обязательно, не пустое
- `ingredients` — массив, не пустой
- `servings_count` — целое число ≥ 1

---

## Auth-паттерн

**SSR-страница** (`dashboard/favorites/page.tsx`):
```typescript
const { data: member } = await adminDb.from('members').select('id').eq('email', user.email!).single()
// member.id передаётся в FavoritesClient как userId prop
```

**API-роуты** (`/api/member-recipes`): email-lookup через вспомогательную `getMemberId(email)`.

**Клиентские операции** (`saved_recipes` INSERT/DELETE): `userId = member.id` из SSR пропа — корректно.

Правило #1 и #11 из CLAUDE.md соблюдены во всех точках.

---

## Виджет на главной

`FavoritesStat` (`src/components/FavoritesStat.tsx`) — виджет на `/dashboard`:

- Получает `dbCount` (count из `saved_recipes`) с SSR-страницы `/dashboard/page.tsx`
- На клиенте добавляет к счётчику соусы из `localStorage`
- Отображает суммарное число и ссылку на `/dashboard/favorites`

---

## Связи с другими модулями

- [[03-club/modules/smart-kitchen]] — **источник кнопок сохранения**: `KitchenClient` (текущий результат + история), `KitchenCalculator` (создание `member_recipes`)
- [[03-club/modules/meal-plans]] — **источник сохранения**: `WeeklyPlanView` сохраняет блюда из рациона в `saved_recipes`
- [[03-club/modules/diary]] — **потребитель**: `DiaryClient` читает `saved_recipes` (топ 5) при открытии модала «добавить в дневник» для быстрого выбора из избранного

---

## Известные баги / tech debt

- **R89** — Лимит `maxCount = 50` без серверной защиты. Клиент может вставить >50 записей напрямую. Нужен CHECK в RLS или триггер. [[08-roadmap/todo]]
- **R90** — `POST /api/kitchen/recipes` (Умная кухня) — `.eq('id', user.id)` при lookup профиля участницы и обновлении счётчика `kitchen_requests_today`. Если `auth.users.id ≠ members.id` — счётчик кухни сломается. [[08-roadmap/todo]]

---

## История изменений

| Дата | Событие |
|---|---|
| май 2026 | Документ создан — разведка по коду |
