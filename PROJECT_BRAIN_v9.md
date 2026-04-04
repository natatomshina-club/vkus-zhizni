# 🌿 ВКУС ЖИЗНИ — Мозг проекта v9
## Вставляй этот файл в начало каждой новой сессии с Claude

**Последнее обновление:** 2 апреля 2026
**Статус:** MVP фаза 4 — Умная Кухня полностью доработана ✅

---

## 👤 О ПРОЕКТЕ

**Название:** Клуб стройных и здоровых «Вкус Жизни»
**Основатель:** Наталья Томшина — нутрициолог (не врач)
**Суть метода:** Белок + некрахмалистые овощи + полезные жиры, без быстрых углеводов и сахара.

**КРИТИЧЕСКОЕ ПРАВИЛО:** Никогда не использовать слова «кето», «лоукарб», «LCHF».
Заменять на: «питание для гормонального баланса», «метод Натальи», «умное питание», «система Вкус Жизни».

---

## 🏗 ТЕХНИЧЕСКИЙ СТЕК

- **Frontend + Backend:** Next.js 14 (App Router) + TypeScript
- **БД:** Supabase (PostgreSQL + Auth)
- **Хостинг:** Vercel — fra1
- **CDN:** Cloudflare (Free) — SSL Full (strict)
- **Домен клуба:** club.nata-tomshina.ru
- **Деплой:** `npx vercel --prod` (НЕ git push!)
- **Оплата:** CloudPayments ✅
- **Push:** OneSignal ✅
- **Email:** Resend ✅
- **ИИ:** YandexGPT (бот) + Anthropic API (статьи)
- **Видео:** Kinescope

### Supabase
- URL: https://byykvsjamtcklwtnjkpf.supabase.co
- Anon key: sb_publishable_2V678YWUVeSiT0g1mUOHKg_zfOUFSVj

---

## 💳 ТАРИФЫ

- **Пробный:** 149 ₽/7 дней + рекуррент 1500₽/мес
- **Месяц:** 1 500 ₽/мес
- **Полгода:** 6 000 ₽ разовый

---

## 🔑 ПАТТЕРН member_id (ВЕЗДЕ!)

```typescript
const supabaseAdmin = createServiceClient()
const { data: member } = await supabaseAdmin
  .from('members')
  .select('id')
  .eq('email', user.email)
  .single()
// member.id — НЕ user.id!
```

---

## 📊 ТАБЛИЦЫ БАЗЫ ДАННЫХ

### nutrition — продукты
```
id, name, category, calories, protein, fat, carbs, unit
```
- ~400+ продуктов, на 100г, по Скурихину
- Уникальный индекс: `nutrition_name_unique` на `lower(trim(name))`
- Дубли очищены апрель 2026 ✅

### recipes — рецепты
```
id, title, category, cooking_method, time_minutes,
tags text[], steps text[], tip_tags text[],
servings int DEFAULT 1,
is_active boolean
```
**Категории и логика:**
| Категория | Пересчёт КБЖУ | servings |
|-----------|---------------|---------|
| завтрак | ✅ calculatePortion | 1 |
| обед_ужин | ✅ calculatePortion | 1 |
| салат | ❌ base_grams as-is | 1 |
| десерт | ❌ base_grams / servings | 2-12 |
| суп | ❌ base_grams / servings | 4-5 |

**Статус базы:** ~220+ рецептов
- id 1-165: старые рецепты
- id 166-221: новые десерты
- id 186-205: новые салаты
- id 206-220: новые супы

### recipe_ingredients
```
id, recipe_id, nutrition_id, ingredient_name,
role ('protein'|'fat'|'veggie'|'oil'|'spice'),
base_grams, is_always_available
```
**Роли:**
- `protein` — граммы динамические (под белок участницы)
- `veggie` / `fat` — граммы фиксированные
- `oil` — динамическое (под жиры)
- `spice` — КБЖУ не считается

### diary_entries — дневник
```
id, member_id, date, meal_type, title,
calories, protein, fat, carbs,
servings numeric DEFAULT 1,
source, created_at
```
**ВАЖНО:** calories/protein/fat/carbs = КБЖУ 1 порции.
Итог = значение × servings.

API: PATCH /api/diary/entries/[id]/servings

### weekly_plans — рационы
```
id, member_id, created_at, week_start,
meals_per_day int (2|3),
include_soups boolean,
include_salads boolean,
cook_mode text ('daily'|'every2days'),
plan_json jsonb,
shopping_list_json jsonb,
user_products text[],
member_name text,
kbju_calories, kbju_protein, kbju_fat, kbju_carbs int,
status text DEFAULT 'active'
```
**Лимит:** 1 рацион в 7 дней. Триал: 1 за всё время.
**Сброс лимита:** `DELETE FROM weekly_plans WHERE member_id = (SELECT id FROM members WHERE email = '...')`

### Остальные таблицы без изменений:
body_sections, body_materials, saved_recipes,
cooking_tips, subscribers, email_campaigns,
push_subscriptions, affiliates, affiliate_commissions

---

## 🗂 СТРУКТУРА УМНОЙ КУХНИ

### Роуты
```
/dashboard/kitchen              — три вкладки
/dashboard/kitchen/weekly       — список рационов + форма
/dashboard/kitchen/weekly/[id]  — просмотр рациона
```

### Файлы
```
src/app/api/kitchen/recipes/route.ts          — подбор рецептов
src/app/api/kitchen/save/route.ts             — избранное
src/app/api/kitchen/weekly/generate/route.ts  — генерация рациона
src/app/api/kitchen/weekly/[id]/route.ts      — получение рациона
src/components/KitchenClient.tsx              — UI кухни (3 вкладки)
src/components/KitchenCalculator.tsx          — калькулятор КБЖУ
src/components/WeeklyPlanForm.tsx             — форма рациона
src/components/WeeklyPlanView.tsx             — просмотр рациона
src/lib/recipeCalculator.ts                   — алгоритм порций
src/lib/productUtils.ts                       — expandProducts (shared)
```

### Вкладки KitchenClient
```
[ 🍳 Рецепты ] [ 🧮 Калькулятор ] [ 📅 Рацион на неделю ]
```

---

## 🧮 АЛГОРИТМ recipeCalculator.ts

```
1. мakros участницы / кол-во приёмов → цель на приём
2. белок от фиксированных ингредиентов
3. остаток белка → граммы protein-ингредиента
4. жир без масла → граммы масла
5. углеводы — остаточные (не подгоняются под норму!)
6. отклонение ±2г по белку и жирам
```

**ВАЖНО:** Углеводы — это МАКСИМУМ, не цель.
Норма может не добираться — это нормально для метода.

### Лимиты запросов Умной Кухни
- Триал: 3 запроса/день
- Полный клуб: 10 запросов/день
- Сброс: `UPDATE members SET kitchen_requests_today=0 WHERE email='...'`

---

## 📅 ЛОГИКА РАЦИОНА НА НЕДЕЛЮ

Подробно в SMART_KITCHEN_V3.md

### Структура дней (кратко)
```
2 приёма + суп:    дни 1-2: З+О+🍲, дни 3-7: З+О
2 приёма + салат:  все дни: З+О+🥗
3 приёма + суп:    дни 1-2: З+🍲+У (суп=обед), дни 3-7: З+О+У
3 приёма + салат:  все дни: З+О+У+🥗
Суп и салат: дни 1-2 только суп, дни 3-7 только салат
```

### Режим «готовлю на 2 дня»
```
Группы: [Пн+Вт] [Ср+Чт] [Пт+Сб] [Вс]
День готовки: ингредиенты × 2
День повтора: ♻️ (кроме салата — всегда свежий)
```

### Расчёт mealTarget с доп. блюдами
```
С салатом: mealTarget = (норма − КБЖУ_салата) / meals
С супом 2-разовое: mealTarget = (норма − КБЖУ_порции_супа) / 2
С супом 3-разовое: суп заменяет обед, mealTarget = норма / 3
```

### Десерты
Не в днях! Бонусный блок в конце рациона (3 варианта).
Полные карточки с ингредиентами и шагами.

---

## 📋 ПРАВИЛА РАБОТЫ С CLAUDE CODE

1. Никогда: «кето», «лоукарб», «LCHF»
2. SQL миграции — вручную в Supabase
3. Деплой: `npx vercel --prod`
4. member_id — lookup по email через service role
5. Яйца — в штуках (1 шт = 60г С1), показывать (≈N шт.)
6. Максимум 3 яйца в одном рецепте завтрака/обеда
7. tour_completed ≠ onboarding_completed
8. Новые продукты в nutrition: ON CONFLICT DO NOTHING

---

## ✅ СДЕЛАНО В СЕССИИ 2 АПРЕЛЯ 2026

- Реструктуризация категорий кухни (салат/суп/десерт без пересчёта)
- Поле servings в recipes
- Поле servings в diary_entries + счётчик порций
- Калькулятор КБЖУ (вкладка в кухне)
- 55 новых рецептов (десерты + салаты + супы)
- Чистка дублей в nutrition + уникальный индекс
- Исправлены битые nutrition_id в recipe_ingredients
- Рацион на неделю (полная реализация)
- «ЛАЙФХАК ОТ НАТАШИ» вместо «СОВЕТ ПО ПРИГОТОВЛЕНИЮ»
- История поиска: макс 20, 3 дня, без дублей

---

## ⚠️ СЛЕДУЮЩИЕ ЗАДАЧИ

### Срочно (запуск)
1. CloudPayments боевой режим
2. Upgrade Supabase → Pro
3. Upgrade Vercel → Pro
4. Upgrade Resend → Pro

### Умная Кухня
5. Убрать/заменить чипы продуктов в Рецептах
6. Расширить рецепты до 500+ (нужно ~280 новых)
   - Овощные салаты простые: +30-40
   - Завтраки: +40-50
   - Обеды/ужины: +80-100
7. Расширить nutrition на ~80-100 продуктов
8. Нормализовать категории nutrition

### Рацион
9. Тестирование всех комбинаций опций
10. Проверить граммовки в списке покупок
11. Возможность пересоздать рацион

### Баги
12. Профиль участницы в админке — устаревший тариф
13. Чат: фото без текста — ошибка NOT NULL
14. 404 на dashboard/about (тур)
15. Куратор не видит марафоны
16. OneSignal ошибка на nata-tomshina.ru
