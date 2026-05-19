# Рацион на неделю

Раздел клуба, где участница получает готовый недельный рацион — 7 дней по 2 или 3 приёма, сгенерированный под её КБЖУ и выбранные продукты.

## Маршруты

| URL | Компонент | Описание |
|---|---|---|
| `/dashboard/kitchen/weekly` | `WeeklyPlanForm.tsx` (в рамках page.tsx) | Форма генерации + список рационов |
| `/dashboard/kitchen/weekly/[id]` | `WeeklyPlanView.tsx` | Просмотр рациона |

Общий контекст умной кухни: [[03-club/modules/smart-kitchen]].

---

## База данных

### `weekly_plans`

| Поле | Тип | Описание |
|---|---|---|
| `id` | UUID | PK |
| `member_id` | UUID | `user.id` *(не `members.id` — особенность этого раздела)* |
| `week_start` | DATE | Ближайший понедельник от даты генерации |
| `meals_per_day` | INTEGER | 2 или 3 |
| `include_soups` | BOOLEAN | Не используется в новых планах (супы не включаются в рацион). Дефолт — `false`. |
| `cook_mode` | TEXT | У новых планов всегда `'daily'`. Логика `'every2days'` удалена 4 мая 2026, но у старых планов в БД значение может сохраниться. |
| `plan_json` | JSONB | Структура рациона: `{ days: PlanDay[], summary: {...} }` |
| `user_products` | TEXT[] | Продукты, введённые участницей при генерации |
| `member_name` | TEXT | `members.full_name` на момент генерации |
| `kbju_calories` | NUMERIC | Цели КБЖУ на момент генерации |
| `kbju_protein` | NUMERIC | — |
| `kbju_fat` | NUMERIC | — |
| `kbju_carbs` | NUMERIC | — |
| `shopping_list_json` | JSONB | **@deprecated** — не заполняется с 17 мая 2026, поле в БД осталось |
| `created_at` | TIMESTAMPTZ | Дата генерации |

> ⚠️ `member_id` здесь хранит `user.id` из сессии, а не `members.id` (UUID из таблицы `members`). Это отличается от правила #1 CLAUDE.md — намеренно или нет, требует уточнения.

---

## API

### POST `/api/kitchen/weekly/generate` — сгенерировать рацион

**Параметры запроса:**
```typescript
{
  meals_per_day:  2 | 3
  include_salads: boolean    // добавить салаты в рацион
  user_products:  string[]   // точные nutrition.name из autocomplete
}
```

**Ответ при успехе:** `{ plan_id: string }` — UUID сохранённого плана.

#### Лимиты

Проверка через таблицу `weekly_plans` (`.eq('member_id', user.id)`):

| Статус | Лимит |
|---|---|
| Триал | **1 рацион всего** — если есть хоть один план, новый не выдаётся |
| Полный клуб (`active`) | **1 рацион в 7 дней** — cooldown, возвращает `next_available` |

Ошибка при превышении триального лимита: `{ error: 'trial_limit' }` → HTTP 429.
Ошибка при cooldown: `{ error: 'cooldown', next_available: ISO-date }` → HTTP 429.
Ошибка при незаполненном КБЖУ: `{ error: 'no_kbju' }` → HTTP 400.

#### Поток генерации

```
1. getUser() → проверка сессии
2. members SELECT → КБЖУ + subscription_status
   (lookup: .eq('id', user.id) — норма, FK members.id = auth.users.id)
3. Проверка лимита (weekly_plans lookup)
4. classifyProteins(user_products) → ProteinGroups
5. buildProteinSchedule(proteins, meals_per_day) → DayProtein[7]
6. recipes SELECT (is_active = true, по категориям)
7. Для каждого из 7 дней:
   a. Определить тип дня (vegSaladDay / proteinSaladDay / обычный)
   b. Подобрать завтрак → selectRecipes + calculatePortion
   c. Подобрать обед/ужин → selectRecipes + calculatePortion
   d. Подобрать салат (если нужен) → selectRecipes
8. Подсчёт summary (avg КБЖУ за 7 дней)
9. INSERT в weekly_plans
10. Ответ: { plan_id }
```

### GET `/api/kitchen/weekly/[id]` — получить рацион

Возвращает запись из `weekly_plans` по id. Проверяет что `member_id = user.id`.

### GET `/api/kitchen/weekly/[id]/pdf` — скачать PDF рациона

Генерирует PDF из `plan_json`. Секция «Список покупок» удалена 17 мая 2026.

---

## Алгоритм рациона

### `classifyProteins` (`src/lib/weeklyPlanHelper.ts`)

```typescript
export function classifyProteins(userProducts: string[]): ProteinGroups
```

Определяет к какой группе относится каждый белковый продукт:

```typescript
export interface ProteinGroups {
  freshFish:  string[]   // свежая рыба (горбуша, кета, лосось, треска, ...)
  smokedFish: string[]   // копчёная/солёная рыба (слабосолёная, х/г копчения, ...)
  offal:      string[]   // субпродукты (печень, сердечки, желудки, язык)
  meat:       string[]   // мясо, птица
  minced:     string[]   // фарш
  eggs:       string[]   // яйца
}
```

### `buildProteinSchedule` (`src/lib/weeklyPlanHelper.ts`)

```typescript
export function buildProteinSchedule(
  proteins:    ProteinGroups,
  mealsPerDay: 2 | 3,
): DayProtein[]
```

Возвращает расписание белков на 7 дней. Жёсткие правила:
- **Свежая рыба** — строго дни 3 и 6, приём 2/3
- **Копчёная/солёная рыба** — день 2 завтрак, день 5 белковый салат
- **Ротация** — мясо/субпродукты/фарш ротируются со смещением (разные белки в приёме 1 и приёме 2 одного дня)

```typescript
export interface DayProtein {
  day:           number          // 1–7
  meal1Protein:  string          // белок первого приёма
  meal1Category: 'завтрак' | 'обед_ужин'
  meal2Protein:  string          // белок второго приёма
  meal2Category: 'обед_ужин' | 'салат'
  meal3Protein?: string          // белок третьего приёма (только 3-разовое)
  meal3Category?: 'обед_ужин'
  isSmokedFishBreakfast?: boolean
  isSmokedFishSalad?:     boolean
  isFreshFishDay?:        boolean
}
```

---

## Структура `plan_json`

```typescript
interface PlanDay {
  day_number:     number
  day_name:       string       // 'Понедельник' ... 'Воскресенье'
  cook_group:     number
  is_cook_day:    boolean
  cook_group_days: string
  meals:          PlanMeal[]
  day_total:      { calories: number; protein: number; fat: number; carbs: number }
}

interface PlanMeal {
  meal_type:   'завтрак' | 'обед' | 'ужин' | 'салат' | 'салат_белковый'
  recipe_id:   number | string
  title:       string
  steps:       string[]
  ingredients: PlanIngredient[]
  total:       { calories: number; protein: number; fat: number; carbs: number }
  requires_shopping:  string[]    // продукты которых нет у участницы (подсвечивается оранжевым)
  servings:           number
  portions_to_cook:   number
  is_repeat?:         boolean     // повторяет блюдо из другого дня
  repeat_from_day?:   number
  repeat_meal_type?:  string
}
```

`summary` (верхний уровень `plan_json`):
```typescript
{
  avg_calories: number
  avg_protein:  number
  avg_fat:      number
  avg_carbs:    number
}
```

---

## Бизнес-правила

### Структура приёмов

| Режим | Структура дня |
|---|---|
| 2-разовое | Завтрак + Обед/Ужин |
| 3-разовое (обычный день) | Завтрак + Обед = Ужин (один рецепт) |
| 3-разовое (день белкового салата) | Завтрак + Белковый салат + Ужин (3 разных белка) |

### Дни салатов (при `include_salads = true`)

| Режим | Дни овощного салата | Дни белкового салата | Дни без салата |
|---|---|---|---|
| 2-разовое | 1, 3, 5 | 2, 6 | 4, 7 |
| 3-разовое | 1, 3, 6 | 2, 5 | 4, 7 |

Белковый салат — только если есть `proteinSaladCandidates` (рецепты `салат_белковый` с нужными белками).

### Свежая рыба

- Максимум **2 раза в неделю**, строго дни 3 и 6
- Всегда второй/третий приём (не завтрак)
- Рыбы из списка: горбуша, кета, кижуч, нерка, минтай, сибас, дорадо, камбала, терпуг, карп, щука, форель, лосось, треска, тилапия, палтус, скумбрия, окунь

### Копчёная/солёная рыба

- **День 2, завтрак** — копчёная/солёная рыба без нагрева
- **День 5, белковый салат** — копчёная/солёная рыба в салате
- Маркеры: `слабосолён`, `малосолён`, `холодного копчения`, `горячего копчения`, `копчён`, `солён`

### Субпродукты

Максимум **2 рецепта/неделю** на каждый вид (по `OFFAL_GROUP_MAP`). При превышении рецепт исключается через `selectRecipes`.

### Строгий фильтр белков

При 2+ введённых белках — только рецепты с этими белками (строгая проверка через `protein_tag + normalizeRu`). «Чужой» белок не подставляется.

### Углеводы

`target.carbs < 25` → исключить рецепты с бобовыми (`LEGUMES_KEYWORDS`) через `selectRecipes`.

---

## Форма генерации (`WeeklyPlanForm.tsx`)

Параметры которые выбирает участница:
- **Кол-во приёмов** — 2 или 3
- **Продукты** — autocomplete из `nutrition.name`
- **Включить салаты** — кнопки «🥗 Добавить салаты» / «Без салатов» (по умолчанию — без салатов)

При заблокированном доступе (лимит):
- Триал: сообщение «В триале доступен 1 рацион»
- Cooldown: сообщение «Следующий рацион доступен: [дата]»

---

## Что удалено

| Функция | Когда | Что изменилось |
|---|---|---|
| `bonus_desserts` | 17 мая 2026 | Убрано из `generate/route.ts`, `WeeklyPlanView.tsx`, PDF. Старые планы в БД содержат поле — не удалять без решения Наташи. |
| `shopping_list_json` | 17 мая 2026 | Не заполняется, `ShoppingAccordion` удалён. Поле в БД осталось для совместимости со старыми планами. |
| `cook_mode = 'every2days'` | 4 мая 2026 | Поле `cook_mode` осталось, но всегда `'daily'` |

`requires_shopping` в `PlanMeal` **оставлено** — используется для подсветки «нужно купить» внутри карточки блюда.

SQL для очистки старых планов от `bonus_desserts` (деструктивно — не запускать без решения):
```sql
-- Сначала посмотреть, сколько планов затронет:
SELECT count(*) FROM weekly_plans WHERE plan_json ? 'bonus_desserts';

-- Только после проверки:
UPDATE weekly_plans
SET plan_json = plan_json - 'bonus_desserts'
WHERE plan_json ? 'bonus_desserts';
```

---

## Типовые SQL

### Сбросить лимит рациона вручную (полный клуб)
```sql
-- Удалить последний план участницы (cooldown перестанет действовать)
DELETE FROM weekly_plans
WHERE member_id = (
  SELECT id FROM auth.users WHERE email = 'участница@example.com'
)
ORDER BY created_at DESC
LIMIT 1;
```

> ⚠️ `member_id` в `weekly_plans` хранит `auth.users.id` (не `members.id`). Используй `auth.users` для lookup по email.

### Проверить планы участницы
```sql
SELECT id, week_start, meals_per_day, created_at
FROM weekly_plans
WHERE member_id = (
  SELECT id FROM auth.users WHERE email = 'участница@example.com'
)
ORDER BY created_at DESC;
```

---

## Известные особенности

1. **`member_id` — `user.id`, не `members.id`** — в отличие от всего остального кода, `weekly_plans` использует `user.id` из сессии. Это отличается от lookup в `members` (где `.eq('id', user.id)` — норма по FK). Аномалия именно в `weekly_plans`, где поле `member_id` хранит `auth.users.id`, а не `members.id`. Задокументировано как зазор #7 в [[_drafts/KITCHEN_CONSOLIDATED]] (черновик-источник; после переноса pending-задач в `08-roadmap/todo.md` будет архивирован — тогда ссылку заменить на [[08-roadmap/tech-debt]]). SQL-запросы к этой таблице должны идти через `auth.users`, а не `members`.

2. **`shopping_list_json` в старых планах** — поле присутствует у планов до 17 мая 2026. При отображении старых планов через `WeeklyPlanView.tsx` секция уже не рендерится (компонент удалён).

3. **`cook_mode` в БД** — у старых планов может быть значение `'every2days'`. Код его больше не использует, но поле в БД остаётся.

---

## Связано

- [[03-club/modules/smart-kitchen]] — калькулятор рецептов, схема БД рецептов
- [[08-roadmap/tech-debt]] — нерешённые проблемы
- [[08-roadmap/todo]] — открытые задачи (наполнение БД, синонимы)
