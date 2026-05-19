# Умная кухня — консолидированный черновик источников

> [!warning] Это промежуточный артефакт, не справочник модуля.
> Источник: 6 файлов KITCHEN_*.md (апрель–май 2026) + сверка с кодом на 17 мая 2026.
> На основе этого черновика будут собраны модули [[03-club/modules/smart-kitchen]] и [[03-club/modules/meal-plans]].
> После публикации модулей этот файл архивируется.

---

## Состояние кода на 17 мая 2026

| Файл | Строк | Последнее изменение | Назначение |
|---|---|---|---|
| `src/lib/recipeCalculator.ts` | 372 | 17 мая 19:26 | `calculatePortion`, `getMealTarget`, `selectRecipes` |
| `src/lib/productUtils.ts` | 233 | 17 мая 15:22 | Синонимы, классификация продуктов, расширение ввода |
| `src/lib/weeklyPlanHelper.ts` | 177 | 3 мая 14:43 | Классификация белков, расписание по дням |
| `src/app/api/kitchen/recipes/route.ts` | — | — | API калькулятора рецептов |
| `src/app/api/kitchen/weekly/generate/route.ts` | — | — | API генерации рациона на неделю |
| `src/app/api/kitchen/weekly/[id]/route.ts` | — | — | Просмотр рациона |
| `src/app/api/kitchen/weekly/[id]/pdf/route.ts` | — | — | PDF рациона |
| `src/components/KitchenClient.tsx` | — | — | Фронтенд калькулятора рецептов |

---

## Хронология источников

| Файл | Создан | Строк | Актуальность | Главная тема |
|---|---|---|---|---|
| `KITCHEN_PATCH_7apr2026.md` | 7 апр | 162 | ✅ | SQL-патчи nutrition, рецепты, фронтенд ингредиентов, яйца в штуках |
| `KITCHEN_PATCH_11apr2026.md` | 11 апр | 304 | ✅ частично | База рецептов (~531), алгоритм, масштабирование, новые колонки |
| `KITCHEN_PATCH_25apr2026.md` | 25 апр | 174 | ✅ | Рецепты 2–3 ингредиента, справочник nutrition_id, правила сочетаний |
| `KITCHEN_CONTEXT_25apr2026.md` | 25 апр | 319 | ✅ основа | **Полный контекст:** архитектура, схема БД, правила выдачи, сброс лимитов |
| `KITCHEN_PATCH_03may2026.md` | 3 май | 382 | ✅ актуальный | 87 рецептов (id 592–676), `is_scalable_veggie`, майские улучшения алгоритма |
| `KITCHEN_PATCH_17may2026.md` | 17 май | 19 | ✅ последний | Удаление десертов и списка покупок |

---

## Архитектура алгоритма

### Файлы библиотеки

**`src/lib/recipeCalculator.ts`** — ядро расчётов:

```typescript
export function calculatePortion(
  recipe: { id: number; title: string; category: string; steps: string[]; ingredients: RecipeIngredientRow[] },
  target: MealTargetMacros,
  userProducts: string[] = []
): RecipePortionResult

export function getMealTarget(
  daily: { protein: number; fat: number; carbs: number },
  mealsPerDay: 2 | 3
): MealTargetMacros
// Делит дневные цели на кол-во приёмов (простое деление, округление)

export function selectRecipes(
  recipes: Array<{ id: number; tags: string[]; category: string; protein_tag?: string | null }>,
  userTags: string[],
  category: string,
  excludeIds?: number[],
  count?: number,
  allIngredients?: RecipeIngredientForMatch[],
  userRaw?: string[],
  recipeVeggieMap?: Map<number, string>,
  veggieUsage?: Map<string, number>,
  proteinUsage?: Map<string, number>,
  offalUsage?: Map<string, number>,
): number[]
```

Внутренние константы `recipeCalculator.ts` (не экспортируются):
```typescript
const EGG_IDS = [86, 87]  // куриное / перепелиное
const EGG_WEIGHT: Record<number, number> = { 86: 60, 87: 12 }

const FAT_CAPS_PROTEIN_SALAD: Record<number, number> = {
  125: 30,  // масло оливковое
  506: 30,  // масло гхи (вариант 1)
  591: 30,  // масло гхи (вариант 2)
  124: 40,  // кетомайонез
  101: 60,  // сметана 20%
  100: 60,  // сметана 15%
}
```

**`src/lib/productUtils.ts`** — продуктовые утилиты (экспорты):
```typescript
export function normalizeRu(s: string): string
export const PRODUCT_SYNONYMS: Record<string, string[]>
export const PROTEIN_KEYWORDS: Set<string>
export const OFFAL_KEYWORDS: Set<string>
export const OFFAL_GROUP_MAP: Map<string, string>
export const LEGUMES_KEYWORDS: Set<string>
export const VEGGIE_KEYWORDS: Set<string>
export function getOffalGroup(proteinTag: string | null | undefined): string | null
export function filterVeggies(userProducts: string[]): string[]
export function getInputProteins(userRaw: string[]): string[]
export function expandProducts(userProducts: string[]): string[]
```

**`src/lib/weeklyPlanHelper.ts`** — расписание белков по дням:
```typescript
export interface ProteinGroups {
  freshFish: string[];  smokedFish: string[];  offal: string[]
  meat: string[];       minced: string[];       eggs: string[]
}

export interface DayProtein {
  day: number
  meal1Protein: string
  meal1Category: 'завтрак' | 'обед_ужин'
  meal2Protein: string
  meal2Category: 'обед_ужин' | 'салат'
  meal3Protein?: string
  meal3Category?: 'обед_ужин'
  isSmokedFishBreakfast?: boolean
  isSmokedFishSalad?: boolean
  isFreshFishDay?: boolean
}

export function classifyProteins(userProducts: string[]): ProteinGroups
export function buildProteinSchedule(...): DayProtein[]
```

---

## Схема БД

### `recipes`

| Поле | Тип | Описание |
|---|---|---|
| `id` | INTEGER | PK |
| `title` | TEXT | Название рецепта |
| `category` | TEXT | `'завтрак'` / `'обед_ужин'` / `'салат'` / `'салат_белковый'` / `'суп'` |
| `cooking_method` | TEXT | Способ приготовления |
| `time_minutes` | INTEGER | Время в минутах |
| `tags` | TEXT[] | Теги продуктов (для скоринга) |
| `tip_tags` | TEXT[] | Подсказки (отображаются в карточке) |
| `steps` | TEXT[] | Шаги приготовления |
| `cuisine` | TEXT | Кухня |
| `protein_tag` | TEXT | Главный белок (строгий фильтр, NULL если нет) |
| `is_active` | BOOLEAN | Активен для выдачи |
| `servings` | INTEGER | Для десертов — кол-во штук; для остальных — всегда 1 |

> КБЖУ не хранится в таблице — рассчитывается на лету в `calculatePortion()`.

### `recipe_ingredients`

| Поле | Тип | Описание |
|---|---|---|
| `recipe_id` | INTEGER | FK → `recipes` |
| `nutrition_id` | INTEGER | FK → `nutrition` |
| `ingredient_name` | TEXT | Название ингредиента |
| `role` | TEXT | `'protein'` / `'fat'` / `'veggie'` / `'oil'` / `'spice'` |
| `base_grams` | NUMERIC | Граммы на 1 порцию |
| `is_always_available` | BOOLEAN | Всегда есть у участницы (специи и т.д.) |
| `is_scalable_veggie` | BOOLEAN | Можно уменьшать при превышении углеводов (добавлено 3 мая 2026) |

### `nutrition`

| Поле | Тип | Описание |
|---|---|---|
| `id` | INTEGER | PK |
| `name` | TEXT | Название продукта (точное, из autocomplete) |
| `category` | TEXT | Категория |
| `calories` | NUMERIC | Ккал на 100г |
| `protein` | NUMERIC | Белок г/100г |
| `fat` | NUMERIC | Жир г/100г |
| `carbs` | NUMERIC | Углеводы г/100г |
| `name_alt` | TEXT | Альтернативные названия |

Счётчики на 3 мая 2026: `MAX id recipes = 676`, `MAX id nutrition = 620`.

### `members` — КБЖУ-поля (для кухни)

```
kbju_calories, kbju_protein, kbju_fat, kbju_carbs  — цели участницы
kitchen_requests_today                              — счётчик запросов за сегодня (сбрасывается по дате)
kitchen_date                                        — дата последнего запроса
```

### `weekly_plans`

| Поле | Описание |
|---|---|
| `id` | UUID, PK |
| `member_id` | FK → `members` (`user.id`, не `members.id`!) |
| `week_start` | Дата начала недели |
| `meals_per_day` | 2 или 3 |
| `include_soups` | Всегда `false` (супы не используются в рационе) |
| `cook_mode` | Всегда `'daily'` (поле `every2days` удалено 4 мая 2026) |
| `plan_json` | JSON: `{ days: PlanDay[], summary: {...} }` |
| `user_products` | TEXT[] — что ввела участница |
| `member_name` | Имя участницы на момент создания |
| `kbju_calories / kbju_protein / kbju_fat / kbju_carbs` | Цели на момент создания |

`shopping_list_json` — помечен `@deprecated`, новые планы не заполняют.

---

## Логика выдачи рецептов

### Поток от ввода к порции

```
Участница выбирает продукты из autocomplete (точные nutrition.name)
→ user_products[] на сервер
→ expandProducts(user_products) — раскрывает синонимы через PRODUCT_SYNONYMS
→ getInputProteins(userRaw) — извлекает белковые продукты (PROTEIN_KEYWORDS)
→ selectRecipes() — фильтрация + скоринг → список id
→ calculatePortion() для каждого рецепта — пересчёт под цели участницы
```

### Скоринг в `selectRecipes`

Из кода (актуально на 17 мая):
- **+1** за каждый совпавший тег (`tags[]`)
- **+10** за совпадение `protein_tag` (строгое через `normalizeRu`)
- **+50** за неиспользованный овощ (`veggieUsage = 0`)
- **−10** за овощ использованный 2+ раза
- **+50** за неиспользованный белок (`proteinUsage = 0`)

Жёсткие исключения (до скоринга):
- рецепт в `excludeIds`
- субпродукт с `offalUsage ≥ 2`
- `target.carbs < 25` → исключить рецепты с бобовыми (`LEGUMES_KEYWORDS`)
- при 3+ овощах → строгий овощной фильтр (только эти овощи)

### `calculatePortion` — алгоритм пересчёта

```
1. fixed = role IN ('veggie', 'fat') → берутся с base_grams без изменений
2. proteinNeeded = target.protein − белок от fixed
3. proteinGrams = proteinNeeded / protein_per_100g × 100
   └─ яйца: nutrition_id IN [86, 87] → округлить до кратного 60г (куриное) или 12г (перепелиное)
4. fatNeeded = target.fat − жир от protein − жир от fixed
5. oilGrams = max(0, fatNeeded / oil_fat × 100)
   └─ для категории 'салат_белковый' → лимит из FAT_CAPS_PROTEIN_SALAD по nutrition_id масла
6. if углеводы превышают target.carbs:
   → уменьшать is_scalable_veggie ингредиенты (минимум 30% от base_grams)
```

### `isExactMatch` (внутренняя функция)

Рецепт считается exact match, если все ингредиенты `role != 'spice'` и `is_always_available = false` покрыты `userRaw`. Exact match повышает позицию в выдаче.

---

## Категории рецептов

| Категория в БД | Где используется |
|---|---|
| `'завтрак'` | Приём 1 в рационе |
| `'обед_ужин'` | Приёмы 2 и 3 в рационе |
| `'салат'` | Овощной салат — добавка к обеду (без белка) |
| `'салат_белковый'` | Замена обеда в protein-салатный день |
| `'суп'` | Только в калькуляторе рецептов, в рацион **не попадает** |
| `'десерт'` | В калькуляторе рецептов доступен (Десерт 🍰). **В рационе на неделю — удалён 17 мая 2026** (только `generate/route.ts` и UI рациона) |

Категория `'десерт'` может ещё присутствовать в старых `plan_json.bonus_desserts` в БД — не удалять через UPDATE без отдельного решения Наташи.

---

## Лимиты (два разных механизма!)

### 1. Калькулятор рецептов (`/api/kitchen/recipes`)
Использует `members.kitchen_requests_today` + `kitchen_date`:
- Триал: **3 запроса/день**
- Полный клуб: **10 запросов/день**
- Счётчик сбрасывается при смене дня (сравнение `kitchen_date` с `today`)

### 2. Рацион на неделю (`/api/kitchen/weekly/generate`)
Использует таблицу `weekly_plans`, НЕ `kitchen_requests_today`:
- Триал: **1 рацион всего** (если есть хоть один план — новый не выдаётся)
- Полный клуб: **1 рацион в 7 дней** (cooldown, возвращает `next_available`)

---

## Бизнес-правила Наташи

### Структура приёмов

| Режим | Структура |
|---|---|
| 2-разовое | завтрак + обед/ужин (разные белки, разные овощи) |
| 3-разовое обычный день | завтрак + обед = ужин (один рецепт повторяется) |
| 3-разовое день белкового салата | завтрак + белковый салат + другой ужин (3 разных белка) |

### Белки — жёсткие правила

- При 2+ введённых белках — только рецепты с этими белками (никакого «чужого» белка)
- Субпродукты — максимум 2 рецепта/неделю на каждый вид (`OFFAL_GROUP_MAP`)
- Свежая рыба — 2 раза в неделю, только приём 2/3
- Копчёная/солёная рыба — без нагрева: завтрак или белковый салат

### Овощи

- При 3+ введённых овощах — строгий фильтр: только эти овощи
- `is_scalable_veggie = true` на 11 видах овощей — допускают уменьшение порции при превышении carbs
- **Недопустимые сочетания:** болгарский перец — запрещён с рыбой и творогом

### Углеводы

- `target.carbs < 25` → исключить рецепты с бобовыми (`LEGUMES_KEYWORDS`)

### Масла в белковых салатах (лимиты FAT_CAPS_PROTEIN_SALAD)

| Продукт | nutrition_id | Лимит |
|---|---|---|
| Масло оливковое | 125 | 30г |
| Масло гхи (1) | 506 | 30г |
| Масло гхи (2) | 591 | 30г |
| Кетомайонез | 124 | 40г |
| Сметана 20% | 101 | 60г |
| Сметана 15% | 100 | 60г |

---

## Рацион на неделю

### Архитектура `plan_json`

```typescript
interface PlanDay {
  day_number: number
  day_name: string
  cook_group: number
  is_cook_day: boolean
  cook_group_days: string
  meals: PlanMeal[]
  day_total: { calories: number; protein: number; fat: number; carbs: number }
}

interface PlanMeal {
  meal_type: 'завтрак' | 'обед' | 'ужин' | 'салат' | 'салат_белковый'
  recipe_id: number | string
  title: string
  steps: string[]
  ingredients: PlanIngredient[]
  total: { calories; protein; fat; carbs }
  requires_shopping: string[]     // продукты, которых нет у участницы
  servings: number
  portions_to_cook: number
  is_repeat?: boolean             // повторяет блюдо из другого дня
  repeat_from_day?: number
  repeat_meal_type?: string
}
```

### Удалено 17 мая 2026

- `plan_json.bonus_desserts` — полностью убрано из `generate/route.ts`, `WeeklyPlanView.tsx`, PDF
- `shopping_list_json` — не заполняется, помечен `@deprecated` в типе `WeeklyPlan`; поле в БД осталось для обратной совместимости

---

## Хронология ключевых событий

- **2026-04-07** — SQL-патчи nutrition, логика отображения ингредиентов, яйца в штуках, `EGG_IDS/EGG_WEIGHT` в коде
- **2026-04-11** — ~531 рецепт в БД (завтрак ~111, обед_ужин ~166, десерт ~71, суп ~67, салаты ~39). Алгоритм: яйца кратно 60г, приоритет protein_tag (+10 score), масштабирование порций
- **2026-04-25** — Рецепты с 2–3 ингредиентами, строгий фильтр белков (exact match), справочник nutrition_id, правила сочетаний задокументированы
- **2026-05-03** — 87 новых рецептов (id 592–676), 5 копчёных рыб (id 616–620). Поле `is_scalable_veggie` добавлено в `recipe_ingredients` (287 строк, 11 овощей). `weeklyPlanHelper.ts` создан
- **2026-05-04** (`b85e82f`) — protein salads, veggie diversity, удалён `every2days` cook_mode
- **2026-05-04** (`00a1361`) — reduce scalable veggies when carbs exceed target
- **2026-05-04** (`64eb603`) — строгое сравнение protein_tag бонуса (normalizeRu)
- **2026-05-05** (`954198e`) — строгий фильтр белков, охват всех белков, субпродукты, лимиты жира, бобовые
- **2026-05-17** — удаление десертов и списка покупок из генератора и UI

---

## Зазоры между документацией и кодом

1. **`FAT_CAPS` — неверное имя и файл.** В `KITCHEN_PATCH_03may2026.md` упомянуто как экспорт `productUtils.ts`. В коде: `FAT_CAPS_PROTEIN_SALAD`, внутренняя константа `recipeCalculator.ts` (не экспортируется).

2. **Лимиты кухни — два механизма, CLAUDE.md описывает только первый.** CLAUDE.md: «Триал — 3 запроса/день, Полный клуб — 10 запросов/день» — это лимиты `kitchen_requests_today` для **калькулятора рецептов** (`/api/kitchen/recipes`). Рацион на неделю (`/api/kitchen/weekly/generate`) использует **другую логику**: триал = 1 рацион всего, полный = 1 рацион в 7 дней.

3. **`weekly_plans` — поля задокументированы частично.** `KITCHEN_CONTEXT_25apr` показывает только `id, member_id, plan_json, created_at`. Реальный insert включает: `week_start`, `meals_per_day`, `include_soups`, `cook_mode`, `user_products[]`, `member_name`, `kbju_*`.

4. **`recipe_ingredients` — `is_scalable_veggie` отсутствует в документах до 3 мая.** В `KITCHEN_CONTEXT_25apr` (апрель) поля таблицы без этого поля. Добавлено 3 мая 2026.

5. **`bonus_desserts` / `shopping_list_json`** — оба упоминаются в документах как активные. Оба удалены/deprecated 17 мая 2026. Старые планы в БД содержат эти поля.

6. **Категория `салат_овощной`** — упоминается в `KITCHEN_PATCH_11apr` (состояние БД на 11 апр: «салат_овощной 19»). В generate/route.ts используется `'салат'`, а не `'салат_овощной'`. Возможно, это pending-переименование (см. Pending п. 5).

7. **`member_id` в `weekly_plans`** — в `generate/route.ts` при insert используется `user.id` (не `members.id`). Это нарушение правила #1 CLAUDE.md, или для этой таблицы специально. Требует уточнения.

---

## Pending-задачи из патчей

> [!info] Перенесено в roadmap
> Все 9 задач этого раздела перенесены в [[08-roadmap/todo|todo.md]] 18 мая 2026:
> - 4 задачи → 🟡 Средний приоритет (синонимы, тестирование, наполнение БД, мука)
> - 2 задачи → 🟢 Без срочности (свиная грудинка, накопленные мелочи схемы)
> 
> Содержимое раздела ниже оставлено для исторической точности — это первоисточник.

Из `KITCHEN_PATCH_03may2026.md` (section 6):

1. **Тестирование 5 сценариев** (статус неизвестен):
   - Строгий фильтр сёмги (только «семга слабосоленая», не обычная)
   - Охват белков + лимит печени — 4 белка → все появляются, печень ≤ 2 рецептов
   - Строгий фильтр овощей при 3+
   - Углеводы 60г + бобовые — нет фасоли, day_total.carbs в норме
   - Лимиты салатов — сметана ≤ 60г, масло ≤ 30г

2. **Унификация синонимов** (продукты могут не находить рецепты):
   - `индейка бедро` ↔ `бедро индейки`
   - `язык говяжий варёный` (с ё)

3. **Рецепт — свиная грудинка с квашеной капустой** — пропущен в задании 15, обсудить с Наташей

Из `KITCHEN_PATCH_11apr2026.md` (section 11):

4. **Наполнение БД** — цель 700+ рецептов (на 11 апр было ~531, на 3 мая 676). Осталось: салаты батч 2 (~20), супы батч 2 (~15), завтраки батч 5 (~20)
5. **Мука пшеничная и цельнозерновая** — добавить в `nutrition` (было в плане апреля)

Архитектурные (отложенные):

6. Переименовать категорию `салат` → `салат_овощной` (50 старых рецептов) — для чистоты схемы
7. Добавить flag `is_active_for_weekly` для ручного управления выдачей в рацион
8. Добавить в описание рациона пункт про взаимозаменяемость зелени (салат/шпинат/руккола/айсберг)
9. Проверить `cuisine` у старых рецептов

---

## Разделение материала

### → `smart-kitchen.md` (Умная кухня — калькулятор рецептов)

- Описание раздела `/dashboard/kitchen` — три вкладки
- API `/api/kitchen/recipes` — лимиты `kitchen_requests_today`, логика выдачи
- `KitchenClient.tsx` — фронтенд, autocomplete, карточка рецепта
- Таблицы `recipes`, `recipe_ingredients`, `nutrition` — схема
- Функции `calculatePortion`, `getMealTarget`, `selectRecipes` — сигнатуры
- Утилиты `productUtils.ts` — синонимы, классификация, расширение
- Бизнес-правила: категории, лимиты масел, яйца в штуках, exact match
- Типовые SQL для диагностики

### → `meal-plans.md` (Рацион на неделю)

- Описание раздела `/dashboard/kitchen/weekly`
- API `/api/kitchen/weekly/generate` — лимиты (1/7d), структура генерации
- `weeklyPlanHelper.ts` — `classifyProteins`, `buildProteinSchedule`, `ProteinGroups`
- Таблица `weekly_plans` — схема с полями insert
- Структура `plan_json` — `PlanDay`, `PlanMeal`, `PlanIngredient`
- Бизнес-правила: структура приёмов, белки по дням, рыба, субпродукты, углеводы
- Удалённые функции: `bonus_desserts`, `shopping_list_json`, `every2days`
- Типовые SQL для сброса лимитов
