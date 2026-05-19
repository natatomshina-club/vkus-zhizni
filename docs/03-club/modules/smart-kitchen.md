# Умная кухня — калькулятор рецептов

Раздел клуба, где участница подбирает рецепты под свои продукты и получает порцию, рассчитанную точно под её КБЖУ.

## Маршруты

| URL | Компонент | Описание |
|---|---|---|
| `/dashboard/kitchen` | `KitchenClient.tsx` | Главная страница: две вкладки |
| `/dashboard/kitchen/sauces` | `sauces/page.tsx` | Соусы — статический список |
| `/dashboard/kitchen/weekly` | `weekly/page.tsx` | Рацион на неделю → [[03-club/modules/meal-plans]] |
| `/dashboard/kitchen/weekly/[id]` | `weekly/[id]/page.tsx` | Просмотр рациона → [[03-club/modules/meal-plans]] |

## Вкладки и кнопки `/dashboard/kitchen`

| Элемент | id / href | Компонент |
|---|---|---|
| 🍳 Рецепты (вкладка) | `'kitchen'` | Внутри `KitchenClient.tsx` |
| 🧮 Калькулятор (вкладка) | `'calculator'` | `KitchenCalculator.tsx` |
| Соусы (ссылка-кнопка) | `/dashboard/kitchen/sauces` | `sauces/page.tsx` |

**Вкладка «🧮 Калькулятор»** — отдельный КБЖУ-калькулятор (не связан с рецептами).

**Кнопка «Соусы»** — ссылка-кнопка, не вкладка. Страница статическая, данные хардкодом (список из 6 соусов). Нет API, нет БД.

---

## База данных

### `recipes`

| Поле | Тип | Описание |
|---|---|---|
| `id` | INTEGER | PK |
| `title` | TEXT | Название рецепта |
| `category` | TEXT | `'завтрак'` / `'обед_ужин'` / `'салат'` / `'салат_белковый'` / `'суп'` / `'десерт'` |
| `cooking_method` | TEXT | Способ приготовления |
| `time_minutes` | INTEGER | Время в минутах |
| `tags` | TEXT[] | Продуктовые теги (для скоринга и поиска) |
| `tip_tags` | TEXT[] | Подсказки — отображаются в карточке |
| `steps` | TEXT[] | Шаги приготовления |
| `cuisine` | TEXT | Кухня |
| `protein_tag` | TEXT\|NULL | Главный белок рецепта. Используется в скоринге `selectRecipes` (+10 за совпадение через `normalizeRu`) и в строгом фильтре при 2+ введённых белках. |
| `is_active` | BOOLEAN | Показывается ли в выдаче |
| `servings` | INTEGER | Для десертов — кол-во штук; для остальных — 1 |

> КБЖУ не хранится — рассчитывается на лету в `calculatePortion()`.

Счётчики на 3 мая 2026: `MAX id = 676` (~676 рецептов). Из них ~531 до 3 мая + 87 новых (id 592–676).

### `recipe_ingredients`

| Поле | Тип | Описание |
|---|---|---|
| `recipe_id` | INTEGER | FK → `recipes` |
| `nutrition_id` | INTEGER | FK → `nutrition` |
| `ingredient_name` | TEXT | Название ингредиента |
| `role` | TEXT | `'protein'` / `'fat'` / `'veggie'` / `'oil'` / `'spice'` |
| `base_grams` | NUMERIC | Базовые граммы на 1 порцию |
| `is_always_available` | BOOLEAN | Всегда есть у участницы (специи и т.д.) |
| `is_scalable_veggie` | BOOLEAN | Можно уменьшать при превышении углеводов *(добавлено 3 мая 2026)* |

На 3 мая 2026: 287 строк с `is_scalable_veggie = true` на 11 видах овощей.

### `nutrition`

| Поле | Тип | Описание |
|---|---|---|
| `id` | INTEGER | PK |
| `name` | TEXT | Название продукта (точное, из autocomplete) |
| `category` | TEXT | Категория продукта |
| `calories` | NUMERIC | Ккал/100г |
| `protein` | NUMERIC | Белок г/100г |
| `fat` | NUMERIC | Жир г/100г |
| `carbs` | NUMERIC | Углеводы г/100г |
| `name_alt` | TEXT | Альтернативные названия |

`MAX id = 620` на 3 мая 2026.

### Поля `members` для кухни

```
kbju_calories, kbju_protein, kbju_fat, kbju_carbs  — цели участницы (нужны для расчёта)
kitchen_requests_today                              — счётчик запросов за сегодня
kitchen_date                                        — дата последнего запроса (для сброса)
```

---

## API `/api/kitchen/recipes`

**POST** — подбирает 3 рецепта и возвращает порции под КБЖУ участницы.

### Параметры запроса

```typescript
{
  category: 'завтрак' | 'обед_ужин' | 'салат' | 'суп' | 'десерт'
  meals_per_day?: 2 | 3  // обязателен для завтрак/обед_ужин
  user_products: string[]  // точные nutrition.name из autocomplete
}
```

### Лимит запросов

Использует `members.kitchen_requests_today` + `kitchen_date`:

| Статус | Лимит |
|---|---|
| Триал (`trial` или не задан) | **3 запроса/день** |
| Полный клуб (`active`) | **10 запросов/день** |

Счётчик сбрасывается при смене дня: если `kitchen_date ≠ today`, счётчик трактуется как 0.

При превышении: `{ error: 'limit_reached', limit }` → HTTP 429.

Ошибка при незаполненном профиле: `{ error: 'no_kbju', message: '...' }` → HTTP 400.

### Поток обработки

```
1. getUser() → проверка сессии
2. members SELECT → КБЖУ + счётчик (по user.id)
3. Проверка лимита
4. getMealTarget(daily, meals_per_day)  ← только для завтрак/обед_ужин
5. recipes SELECT (is_active = true, нужная category)
6. expandProducts(user_products)  ← синонимы
7. candidateIngredients SELECT (для exact match)
8. selectRecipes() → [3 id]
9. recipe_ingredients SELECT для каждого
10. calculatePortion() → порция под цель
11. UPDATE members SET kitchen_requests_today, kitchen_date
12. Возврат {recipes, requests_left, tip}
```

### Категории фиксированных рецептов

`'салат'`, `'суп'`, `'десерт'` — **фиксированные** (не масштабируются под КБЖУ): `getMealTarget` не вызывается, `calculatePortion` получает `target = null`.

`'завтрак'`, `'обед_ужин'` — **масштабируемые**: полный расчёт через `getMealTarget` + `calculatePortion`.

---

## Алгоритм

### `selectRecipes` (`src/lib/recipeCalculator.ts`)

```typescript
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

**Скоринг:**
- **+1** за каждый совпавший тег
- **+10** за совпадение `protein_tag` (через `normalizeRu`)
- **+50** за неиспользованный овощ (`veggieUsage = 0`)
- **−10** за овощ использованный 2+ раз
- **+50** за неиспользованный белок (`proteinUsage = 0`)

**Жёсткие исключения (до скоринга):**
- рецепт в `excludeIds`
- субпродукт с `offalUsage ≥ 2` (по `OFFAL_GROUP_MAP`)
- `target.carbs < 25` → исключить рецепты с бобовыми (`LEGUMES_KEYWORDS`)
- при 3+ введённых овощах → строгий фильтр: только рецепты с этими овощами

### `calculatePortion` (`src/lib/recipeCalculator.ts`)

```typescript
export function calculatePortion(
  recipe: { id: number; title: string; category: string; steps: string[]; ingredients: RecipeIngredientRow[] },
  target: MealTargetMacros,
  userProducts: string[] = []
): RecipePortionResult
```

**Алгоритм расчёта:**
```
1. fixed = role IN ('veggie', 'fat') → берутся с base_grams без изменений
2. proteinNeeded = target.protein − белок от fixed
3. proteinGrams = proteinNeeded / protein_per_100g × 100
   └─ яйца (nutrition_id ∈ EGG_IDS): округление до кратного EGG_WEIGHT
4. fatNeeded = target.fat − жир от protein − жир от fixed
5. oilGrams = max(0, fatNeeded / oil_fat × 100)
   └─ категория 'салат_белковый': лимит из FAT_CAPS_PROTEIN_SALAD
6. если carbs > target.carbs:
   → уменьшать is_scalable_veggie ингредиенты (минимум 30% от base_grams)
```

### `getMealTarget` (`src/lib/recipeCalculator.ts`)

```typescript
export function getMealTarget(
  daily: { protein: number; fat: number; carbs: number },
  mealsPerDay: 2 | 3
): MealTargetMacros
```

Делит дневные цели на кол-во приёмов с округлением.

### Утилиты `src/lib/productUtils.ts`

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

`expandProducts` — раскрывает синонимы через `PRODUCT_SYNONYMS` перед скорингом.

---

## Бизнес-правила

### Яйца — в штуках

```typescript
const EGG_IDS = [86, 87]              // куриное, перепелиное
const EGG_WEIGHT = { 86: 60, 87: 12 } // г на штуку
```

В карточке: `calculatePortion` считает целые яйца, UI показывает `(≈N шт.)`.

### Лимиты масел в белковых салатах

Внутренняя константа `FAT_CAPS_PROTEIN_SALAD` в `recipeCalculator.ts` (не экспортируется):

| Продукт | `nutrition_id` | Лимит |
|---|---|---|
| Масло оливковое | 125 | 30 г |
| Масло гхи (1) | 506 | 30 г |
| Масло гхи (2) | 591 | 30 г |
| Кетомайонез | 124 | 40 г |
| Сметана 20% | 101 | 60 г |
| Сметана 15% | 100 | 60 г |

Применяется только для `category = 'салат_белковый'`.

### Недопустимые сочетания

Болгарский перец — запрещён с рыбой и творогом (правило Наташи, учитывается при составлении рецептов; отдельного кода-фильтра нет).

### Exact match

`isExactMatch` (внутренняя функция): рецепт — exact match, если все ингредиенты с `role != 'spice'` и `is_always_available = false` покрыты `userRaw`. Повышает позицию рецепта в выдаче.

---

## Категории рецептов

| Категория в БД | Отображение в UI | Масштабируется под КБЖУ |
|---|---|---|
| `'завтрак'` | Завтрак 🌅 | ✅ |
| `'обед_ужин'` | Обед/Ужин 🍽 | ✅ |
| `'салат'` | Салат 🥗 | ❌ (фиксированный) |
| `'салат_белковый'` | — (используется в рационе) | ✅ |
| `'суп'` | Суп 🍲 | ❌ (фиксированный) |
| `'десерт'` | Десерт 🍰 | ❌ (фиксированный) |

`'салат_белковый'` не отображается в CATEGORIES калькулятора — используется только в генераторе рациона.

`'десерт'` доступен в калькуляторе рецептов, **но не включается в рационы** (удалён из `/api/kitchen/weekly/generate` 17 мая 2026, см. [[03-club/modules/meal-plans]]).

---

## Что видит участница

1. **Выбирает продукты** — через autocomplete (`nutrition.name`) или быстрые кнопки (`QUICK_PRODUCTS`)
2. **Выбирает категорию** — Завтрак / Обед/Ужин / Салат / Десерт / Суп
3. **Выбирает кол-во приёмов** — 2 или 3 (только для завтрак/обед_ужин)
4. **Получает 3 карточки рецептов** — с ингредиентами в граммах и КБЖУ порции
5. **Может сохранить в дневник** — добавляет КБЖУ в дневник питания
6. **Счётчик запросов** — показывается «Осталось N из 3/10»

Если КБЖУ не заполнены в профиле — кнопка заблокирована, подсказка «Заполни профиль».

---

## Известные особенности

1. **Синонимы — пробел** — `индейка бедро` ↔ `бедро индейки`, `язык говяжий варёный` (с ё) могут не находить рецепты без явного синонима в `PRODUCT_SYNONYMS`.

2. **`tip_tag` `root_vegetable_warning`** — кнопка в карточке рецепта показывает предупреждение для корнеплодов (специальная логика в UI).

3. **Сброс лимита** — `UPDATE members SET kitchen_requests_today = 0` сбрасывает только счётчик калькулятора. Лимит рационов на неделю — отдельный механизм (см. [[03-club/modules/meal-plans]]).

---

## Связано

- [[03-club/modules/meal-plans]] — рацион на неделю, отдельный лимит и алгоритм
- [[08-roadmap/tech-debt]] — нерешённые проблемы
- [[08-roadmap/todo]] — открытые задачи (синонимы, наполнение БД)
