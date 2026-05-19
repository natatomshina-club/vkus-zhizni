# Дневник еды, воды и чувств

Модуль ежедневной записи питания, воды и самочувствия.
Участница видит КБЖУ-факт vs норма, трекер воды и блок настроения.

> [!info] Область модуля
> Покрывает `/dashboard/diary`. Трекер замеров тела — [[measurements.md]].
> Победы и достижения — [[wins.md]].

---

## 1. Что видит участница

### Переключение дат

Стрелки `‹` и `›` меняют `selectedDate` — единый стейт, управляющий всеми блоками.
Дата создаётся с `T12:00:00` чтобы избежать timezone-сдвига:

```typescript
const d = new Date(prev + 'T12:00:00')
d.setDate(d.getDate() - 1)
return d.toISOString().split('T')[0]
```

Переход в прошлый день через календарь — тот же стейт.

### Прогресс-бары КБЖУ

4 бара: Калории / Белки / Жиры / Углеводы.

- **Норма** — берётся из `members`: `kbju_calories`, `kbju_protein`, `kbju_fat`, `kbju_carbs`
- **Факт** — `SUM(поле × servings)` по всем записям `diary_entries` за дату
- При отсутствии нормы в профиле — бары не отображаются
- Цвет: зелёный `#4CAF78` → оранжевый при превышении нормы

### Трекер воды

10 иконок-стаканов в ряд. Тап = toggle зелёного цвета. Подпись `X из 10 стаканов`.
Данные в `diary_water` через upsert по `(member_id, date)`.

### Секции приёмов пищи

| Секция | meal_type | Иконка |
|---|---|---|
| Завтрак | `breakfast` | ☀️ |
| Обед / Ужин | `lunch` | 🍽️ |
| Дополнительный приём | `snack` | 🍎 |

**Нет отдельного `dinner`** — только три варианта. В типах DiaryClient есть `'dinner'` в `MealType`,
но секции рендерятся только для `breakfast`, `lunch`, `snack`. Блюда с `meal_type = 'dinner'`
попадают в секцию «Обед / Ужин» (types: `['lunch', 'dinner']`).

Каждая секция:
- список блюд: название + «320 ккал · Б:24 · Ж:18 · У:8» + кнопка ✕
- пустое состояние: «Пока ничего не добавлено» (без стресса)
- кнопка «+ Добавить блюдо» → разворачивает аккордеон

### Аккордеон добавления

Аккордеон, не попап — модальные окна на мобайле не скроллятся.

**Вкладка «Избранное»** — последние 5 из `saved_recipes ORDER BY created_at DESC LIMIT 5`.
Карточка: название + КБЖУ + кнопка «Добавить». Запись создаётся с `source: 'favorite'`.

**Вкладка «Вручную»** — поля: Название, Калории, Белки, Жиры, Углеводы. `source: 'manual'`.

После добавления — аккордеон закрывается, локальный стейт обновляется оптимистично
(без `router.refresh()` — это вызывает баг «блюдо мигает»).

### Управление порциями

Кнопки `−` и `+` рядом с каждым блюдом. Диапазон 0.5–10, шаг 0.5.
КБЖУ пересчитывается на лету: `calories × servings`, `protein × servings` и т.д.
Запись в БД происходит через дебаунс — `PATCH /api/diary/entries/[id]/servings`.

### Блок «Как я себя чувствовала»

Три группы chips:
1. **Самочувствие** (mood): «😊 Отлично», «🙂 Хорошо», «😐 Нормально», «😴 Устала», «🤕 Плохо»
2. **Пищеварение** (digestion): «✅ Всё хорошо», «🫧 Вздутие», «💢 Тяжесть», «🔥 Изжога», «😣 Дискомфорт в животе»
3. **Энергия и настроение** (energy): «⚡ Энергии много», «😌 Спокойная», «🍬 Тяга к сладкому», «😤 Раздражительность», «😶 Голод между едой»

Плюс свободная заметка (note). Данные сохраняются в `diary_feelings`.
Изменение любого chip или заметки инициирует debounced-сохранение.

### Календарь

- Сетка текущего месяца
- **Зелёный кружок** — есть записи в `diary_entries`
- **Дополнительная точка** — есть запись в `diary_feelings`
- Клик на день → переключает `selectedDate` (блоки 1–4 перезагружаются)
- Навигация по месяцам: стрелки `‹` `›`
- Данные: `GET /api/diary/calendar?year=&month=`

> [!warning] Баг зелёных кружков в календаре
> В сессии 04.04.2026 был открытый баг: `/api/diary/calendar` возвращал пустые массивы.
> В текущем коде остались отладочные `console.log` в `calendar/route.ts`.
> Статус починки неизвестен. См. R73.

---

## 2. Доступ по тарифам

> [!warning] Нет проверки subscription_status
> Дневник доступен всем авторизованным, включая trial.
> Единственная защита: `if (!user) redirect('/auth')` в `page.tsx`.
> Это отличается от smart-kitchen и marathons, которые проверяют тариф.

Все кнопки навигации к дневнику (Dashboard, Sidebar, MobileNav) отображаются без условий по тарифу.

---

## 3. Архитектура файлов

| Файл | Тип | Роль |
|---|---|---|
| `src/app/(club)/dashboard/diary/page.tsx` | Server Component | Параллельная загрузка начальных данных |
| `src/components/DiaryClient.tsx` | Client Component | Весь интерактивный UI (953 строки) |
| `src/app/api/diary/entries/route.ts` | API | GET записей, POST нового блюда |
| `src/app/api/diary/entries/[id]/route.ts` | API | DELETE блюда |
| `src/app/api/diary/entries/[id]/servings/route.ts` | API | PATCH порций |
| `src/app/api/diary/water/route.ts` | API | GET/POST трекера воды |
| `src/app/api/diary/feelings/[date]/route.ts` | API | GET/POST самочувствия |
| `src/app/api/diary/notes/route.ts` | API | ⚠️ GET/POST заметок — не используется |
| `src/app/api/diary/calendar/route.ts` | API | GET дней с записями за месяц |

`page.tsx` загружает при старте параллельно:
- КБЖУ-нормы из `members`
- `diary_entries` за сегодня
- `diary_water` за сегодня
- отмеченные дни текущего месяца (`diary_entries`)
- `diary_feelings` за сегодня и дни месяца с feelings

---

## 4. Схема таблиц БД

### `diary_entries`

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid PK | |
| `member_id` | uuid FK → members(id) | ON DELETE CASCADE |
| `date` | date | дата приёма пищи |
| `meal_type` | text | `'breakfast'` / `'lunch'` / `'snack'` |
| `title` | text | название блюда |
| `calories` | integer | ккал, DEFAULT 0 |
| `protein` | numeric(6,1) | г, DEFAULT 0 |
| `fat` | numeric(6,1) | г, DEFAULT 0 |
| `carbs` | numeric(6,1) | г, DEFAULT 0 |
| `source` | text | `'manual'` / `'kitchen'` / `'favorite'`, DEFAULT `'manual'` |
| `servings` | numeric | порции, DEFAULT 1, диапазон 0.5–10 |
| `created_at` | timestamptz | |

RLS: `auth.uid() = member_id` · Index: `(member_id, date)` · ⚠️ Без миграции (см. [[../05-infrastructure/_findings.md]])

**История:** первоначальная схема имела поля `note, energy, breakfast, lunch, dinner` — таблица пересоздана в марте 2026.

### `diary_water`

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid PK | |
| `member_id` | uuid FK → members(id) | |
| `date` | **text** | строка `'YYYY-MM-DD'` (не тип date!) |
| `glasses_count` | integer | 0–10, DEFAULT 0 |
| `updated_at` | timestamptz | |

UNIQUE `(member_id, date)` · RLS: `auth.uid() = member_id` · ⚠️ Без миграции

### `diary_feelings`

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid PK | |
| `member_id` | uuid FK → members(id) | ON DELETE CASCADE |
| `date` | date | |
| `mood` | text | одно значение из chips группы 1 |
| `digestion` | text[] | массив выбранных chips группы 2 |
| `energy` | text[] | массив выбранных chips группы 3 |
| `note` | text | свободная заметка |
| `updated_at` | timestamptz | |

UNIQUE `(member_id, date)` · RLS: `auth.uid() = member_id` · ✅ Миграция: `supabase/migrations/diary_feelings.sql` (04.04.2026)

### `diary_notes`

> [!warning] Заготовка — не подключена к UI
> Route `/api/diary/notes` существует, но ни один клиентский компонент его не вызывает.
> Схема выведена только из кода `route.ts`. Судьба не решена. См. R70.

| Поле | Тип | Описание |
|---|---|---|
| `member_id` | uuid | |
| `date` | date/text | |
| `mood_tags` | text[] | теги настроения |
| `free_note` | text | свободная заметка |
| `updated_at` | timestamptz | |

UNIQUE `(member_id, date)` · RLS: `auth.uid() = member_id` · ⚠️ Без миграции

---

## 5. API роуты

| Метод | Endpoint | Назначение | Таблица | Auth-метод |
|---|---|---|---|---|
| GET | `/api/diary/entries?date=` | записи за дату | `diary_entries` | user.id |
| POST | `/api/diary/entries` | добавить блюдо | `diary_entries` | user.id |
| DELETE | `/api/diary/entries/[id]` | удалить блюдо | `diary_entries` | user.id |
| PATCH | `/api/diary/entries/[id]/servings` | обновить порции | `diary_entries` | user.id |
| GET | `/api/diary/water?date=` | стаканы за дату | `diary_water` | user.id |
| POST | `/api/diary/water` | обновить стаканы | `diary_water` | user.id |
| GET | `/api/diary/feelings/[date]` | самочувствие за дату | `diary_feelings` | email lookup |
| POST | `/api/diary/feelings/[date]` | сохранить самочувствие | `diary_feelings` | email lookup |
| GET | `/api/diary/notes?date=` | ⚠️ не используется | `diary_notes` | user.id |
| POST | `/api/diary/notes` | ⚠️ не используется | `diary_notes` | user.id |
| GET | `/api/diary/calendar?year=&month=` | дни с записями | `diary_entries` + `diary_feelings` | email lookup |

> [!warning] Inconsistency в auth-методе
> `entries`, `water`, `notes` — используют `user.id` напрямую.
> `feelings`, `calendar` — делают email lookup в `members` → берут `member.id`.
> Если `auth.users.id ≠ members.id` на проде — разные части дневника будут видеть разные данные.
> Подробнее: [[../_findings.md]] · R71.

---

## 6. Бизнес-логика

### Расчёт факт-КБЖУ

```typescript
calories: entries.reduce((s, e) => s + (e.calories || 0) * (e.servings ?? 1), 0)
```

Аналогично для protein, fat, carbs.

### Источники блюд

| source | Откуда |
|---|---|
| `'manual'` | ручной ввод в аккордеоне |
| `'kitchen'` | кнопка «📓 В дневник» из Умной кухни |
| `'favorite'` | вкладка «Избранное» из `saved_recipes` |

### Добавление из Умной кухни

Кнопка «📓 В дневник» под блюдом разворачивает три inline-кнопки:
`[ ☀️ Завтрак ]  [ 🍽️ Обед/Ужин ]  [ 🍎 Дополнительный ]`
Запись создаётся с `source: 'kitchen'`, `date: today`.

### Добавление из Избранного (`/dashboard/favorites`)

Кнопка «📓 В дневник ▼» → выбор приёма → выбор даты (Сегодня / Вчера / Другая дата).
«Другая дата» открывает `<input type="date" max={today}>` — нельзя выбрать будущее.

### Дебаунс при изменении порций

Каждое нажатие `+`/`−` запускает таймер (ref хранит `Map<entry_id, timeout>`).
Если за время таймера ещё раз нажали — старый таймер отменяется, новый стартует.
Итог: один запрос `PATCH /servings` вместо десяти.

### Оптимистичный стейт

После POST/DELETE — только `setEntries(prev => [...prev, newEntry])`.
`router.refresh()` и `revalidate` **не вызываются** — известный баг:
параллельный revalidate + оптимистичный стейт = блюдо добавляется и мгновенно исчезает.

### Агрегат календаря

`GET /api/diary/calendar` за один вызов возвращает:
```json
{ "markedDays": [1, 5, 12, 20], "feelingDays": [5, 12, 18] }
```
Числа — дни месяца. Рендер кружков и точек полностью на клиенте.

---

## 7. Известные проблемы

| # | Описание | Приоритет |
|---|---|---|
| R70 | `diary_notes` API без клиента — удалить или подключить | низкий |
| R71 | Inconsistency `member_id` vs `user.id` в diary/tracker/wins роутах | средний |
| R72 | Нет миграций для 5 из 6 таблиц модуля | низкий |
| R73 | Баг зелёных кружков в календаре + отладочные `console.log` | средний |

---

## 8. Связи с другими модулями

| Модуль | Связь |
|---|---|
| [[smart-kitchen.md]] | `saved_recipes` — источник для вкладки «Избранное» |
| [[subscriptions.md]] | КБЖУ-нормы берутся из `members`, но тариф дневник не проверяет |
| [[measurements.md]] | Замеры тела — отдельная страница `/dashboard/tracker` |
| [[wins.md]] | Победы — отдельная страница `/dashboard/wins` |

---

## 9. SQL-шпаргалка

```sql
-- Все записи участницы за дату
SELECT * FROM diary_entries
WHERE member_id = '<member_id>' AND date = '2026-05-23'
ORDER BY created_at;

-- Сводка КБЖУ за день (с учётом порций)
SELECT
  ROUND(SUM(calories * COALESCE(servings, 1))) AS total_calories,
  ROUND(SUM(protein  * COALESCE(servings, 1))::numeric, 1) AS total_protein,
  ROUND(SUM(fat      * COALESCE(servings, 1))::numeric, 1) AS total_fat,
  ROUND(SUM(carbs    * COALESCE(servings, 1))::numeric, 1) AS total_carbs
FROM diary_entries
WHERE member_id = '<member_id>' AND date = '2026-05-23';

-- Дни с записями за месяц (как делает /api/diary/calendar)
SELECT DISTINCT EXTRACT(DAY FROM date)::int AS day
FROM diary_entries
WHERE member_id = '<member_id>'
  AND date BETWEEN '2026-05-01' AND '2026-05-31';

-- Проверить есть ли feelings за дату
SELECT mood, digestion, energy, note
FROM diary_feelings
WHERE member_id = '<member_id>' AND date = '2026-05-23';

-- Стаканы воды за дату
SELECT glasses_count FROM diary_water
WHERE member_id = '<member_id>' AND date = '2026-05-23';
```

---

## 10. История изменений

| Дата | Событие |
|---|---|
| Март 2026 | Запуск дневника. Схема `diary_entries` пересоздана (старая: `note, energy, breakfast, lunch, dinner`). Источник: `DIARY.md` в материалах. |
| 04.04.2026 | Добавлена таблица `diary_feelings`. Миграция `diary_feelings.sql`. Баг: зелёные кружки в календаре не работали (R73). |
| 10.04.2026 | Доработки DiaryClient (последнее изменение `page.tsx`). |
| 23.05.2026 | Модуль записан в Vault по результатам разведки. |
