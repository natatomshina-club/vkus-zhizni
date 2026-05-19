# Маленькие победы

Модуль фиксации ежедневных достижений участницы. Цель — поддержать мотивацию
через позитивное подкрепление, а не через цифры на весах.
«Даже самое маленькое действие — победа.»

> [!info] Область модуля
> Покрывает `/dashboard/wins` и виджет добавления победы на главной `/dashboard`.
> Дневник питания — [[diary.md]]. Трекер замеров — [[measurements.md]].

---

## 1. Что видит участница

### Страница `/dashboard/wins`

Блоки сверху вниз:

1. **Форма добавления** — textarea + 5 chips + кнопка «Записать победу 🎉»
2. **RandomWin** — блок «Помнишь как ты...» со случайной прошлой победой
3. **ProgressBlock** — 4 карточки 2×2: прогресс замеров тела
4. **WinFeed** — хронологическая лента всех побед + кнопка «Показать ещё»

### Виджет на главной `/dashboard`

Секция «🏆 Маленькая победа сегодня» — тот же `WinInput`, но с `source: 'dashboard'`.
Ссылка «Посмотреть все победы →» ведёт на `/dashboard/wins`.

### Chips-подсказки (5 шт.)

```typescript
const CHIPS = [
  'Не перекусывала',
  'Выпила 2 литра воды',
  'Не хотелось сладкого',
  'Отказалась от мучного',
  'Хорошо спала',
]
```

Тап на чип → текст подставляется в textarea, фокус переходит на поле.

> [!info] WINS.md описывал 8 chips
> В источнике были также: «Белковый завтрак», «Сыта до обеда», «Приготовила по методу».
> В коде осталось 5 — историческое решение при реализации.

### RandomWin

Показывает случайную победу из загруженного списка.
Скрыт при 0 побед. Кнопка «🔄 Другая победа» disabled при `wins.length < 2`.
Анимация: fade out/in за 180мс. Циклирует через `idx % wins.length`.

### Прогресс-блок

4 карточки 2×2: **Вес ⚖️ / Талия 📏 / Бёдра 🔵 / Грудь 💗**.
Каждая: ~~начало~~ → **текущее** + тег «−X кг/см» (зелёный) или «+X» (красный).
При отсутствии данных — «Нет данных» + ссылка «Добавить →» на `/dashboard/tracker`.
Ссылка «Открыть трекер →» в подвале блока.

### Лента побед (WinFeed)

Счётчик «N записей» вверху. 5 цветов левого бордера по кругу: фиолетовый / зелёный / жёлтый / оранжевый / розовый. Дата под каждой записью. Победам с `source === 'dashboard'` — бейдж «с Главной».

Пустое состояние: «Пока нет записанных побед. Добавь первую — любой маленький шаг уже победа!»

---

## 2. Доступ по тарифам

> [!info] Открыт для всех
> Триал + полный клуб. Нет проверки `subscription_status` ни на странице,
> ни в API роутах. Единственная защита: `if (!user) redirect('/auth')`.

---

## 3. Архитектура файлов

| Файл | Тип | Роль |
|---|---|---|
| `src/app/(club)/dashboard/wins/page.tsx` | Server Component | SSR первых 20 побед + прогресс |
| `src/app/(club)/dashboard/wins/WinsClient.tsx` | Client Component | Orchestrator состояния |
| `src/app/(club)/dashboard/wins/components/WinFeed.tsx` | Client Component | Лента + пагинация |
| `src/app/(club)/dashboard/wins/components/ProgressBlock.tsx` | Client Component | Прогресс 2×2 |
| `src/app/(club)/dashboard/wins/components/RandomWin.tsx` | Client Component | Случайная победа |
| `src/components/WinInput.tsx` | Client Component | Ввод (используется на /wins и /dashboard) |
| `src/components/DashboardWinInput.tsx` | Client Component | Обёртка WinInput для дашборда |
| `src/app/api/wins/route.ts` | API | GET список, POST новая |
| `src/app/api/wins/count/route.ts` | API | ⚠️ GET count — не вызывается нигде (R82) |
| `src/components/WinsForm.tsx` | Компонент | ⚠️ Мёртвый и сломан — R75 |

`page.tsx` загружает при старте параллельно:
- первые 20 побед + общий `count: exact` из `wins`
- все `measurements` (ascending) для прогресс-блока

---

## 4. Схема таблицы БД

### `wins`

```sql
CREATE TABLE wins (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  week_date    date NOT NULL,
  result       text NOT NULL,
  is_featured  boolean DEFAULT false,
  source       text NOT NULL DEFAULT 'wins'
               CHECK (source IN ('wins', 'dashboard')),
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE wins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own wins" ON wins
  FOR ALL USING (auth.uid() = member_id);
CREATE INDEX idx_wins_member_date ON wins(member_id, created_at DESC);
```

RLS: `auth.uid() = member_id` · ⚠️ Без миграции (R72)

> [!warning] Поле текста — `result`, не `text`
> Колонка называется `result`. Мёртвый `WinsForm.tsx` делает `.insert({ text })` —
> упал бы с ошибкой БД если бы был вызван.

> [!warning] `week_date` — семантически не используется (R84)
> Обязательное поле, при POST пишется текущая дата UTC.
> При чтении не фильтруется, в UI не отображается.
> Фактически дублирует `created_at`. Планировалась агрегация по неделям — не реализована.

> [!info] `is_featured` — заготовка (R81)
> Поле есть в схеме, нигде не читается и не пишется в коде.

---

## 5. API роуты

| Метод | Endpoint | Принимает | Возвращает | Проверки |
|---|---|---|---|---|
| GET | `/api/wins?limit=&offset=` | limit (default 20, max 50), offset | `{ wins: Win[], hasMore: boolean }` | auth, `user.id` |
| POST | `/api/wins` | `{ text, source? }` | `{ id, result, source, created_at }` | text 3–500 символов; source ∈ \['wins','dashboard'\] |
| GET | `/api/wins/count` | — | `{ count: number }` | ⚠️ нигде не вызывается (R82) |

`hasMore = data.length === limit` — если пришло ровно limit записей, значит есть ещё.

POST принимает поле `text` в теле, пишет в БД как `result`:
```typescript
supabase.from('wins').insert({
  member_id: user.id,
  result: text,      // тело приходит как text, в БД идёт как result
  source,
  week_date: new Date().toISOString().split('T')[0],  // UTC, без timezone-защиты
})
```

> [!warning] Auth-метод — `user.id`
> Все 3 роута используют `user.id` напрямую. См. R71.

---

## 6. source 'wins' vs 'dashboard'

| source | Где выставляется | Файл |
|---|---|---|
| `'wins'` | Страница `/dashboard/wins` | `WinsClient.tsx` |
| `'dashboard'` | Виджет на главной | `DashboardWinInput.tsx` |

При **чтении не фильтруется** — оба source возвращаются вместе.
В ленте победам с `source === 'dashboard'` отображается бейдж «с Главной».

---

## 7. Пагинация

**Серверная (SSR):** `page.tsx` загружает первые 20 при рендере (`PAGE_SIZE = 20`).

**Клиентская (load more):**
```typescript
GET /api/wins?limit=20&offset=wins.length
```
Кнопка «Показать ещё» → добавляет к массиву. Скрывается при `hasMore = false`.

`totalCount` для счётчика — `count: exact` запрос в `page.tsx`.
Обновляется оптимистично на `/wins` при добавлении: `setTotalCount(c => c + 1)`.

> [!warning] Счётчик не синхронизируется с дашбордом (R85)
> Если победа добавлена через виджет на главной, счётчик «N записей» на
> `/dashboard/wins` узнаёт об этом только при следующем server render.

---

## 8. Прогресс-блок — источник данных

`page.tsx` читает `measurements` **напрямую** (не через `/api/tracker/summary`):

```typescript
supabase.from('measurements')
  .select('date, weight, waist, hips, chest')
  .eq('member_id', user.id)
  .order('date', { ascending: true })

const first = measurements[0]           // первый по дате = стартовые значения
const last  = measurements[length - 1]  // последний = текущие
```

Стартовый вес = `first.weight` из `measurements`.

> [!danger] Расхождение со стартовым весом в трекере (R83)
> `/api/tracker/summary` использует `members.initial_weight` как стартовый вес.
> Здесь — `measurements[0].weight` (первый замер).
> При разных значениях участница видит разный прогресс на `/wins` и `/tracker`.
> Связано с R74 (семантика `initial_weight` vs `start_weight`).

---

## 9. Известные проблемы

| # | Описание | Приоритет |
|---|---|---|
| R75 | `WinsForm.tsx` — мёртвый и сломан (`text` вместо `result`, нет `week_date`) | низкий |
| R81 | `is_featured` — заготовка, нигде не используется | низкий |
| R82 | `/api/wins/count` — мёртвый роут | низкий |
| R83 | Стартовый вес: `first measurement` vs `initial_weight` | средний |
| R84 | `week_date` семантически не используется | низкий |
| R85 | `totalCount` не синхронизируется между виджетом и страницей | низкий |
| R71 | Все роуты используют `user.id` (не email lookup) | средний |
| R72 | Нет миграции для `wins` | низкий |
| R80 | `week_date` вычисляется через UTC без timezone-защиты | низкий |

---

## 10. Связи с другими модулями

| Модуль | Связь |
|---|---|
| [[measurements.md]] | `wins/page.tsx` читает таблицу `measurements` напрямую для прогресс-блока |
| [[../../../04-admin/modules/members.md]] | `initial_weight` используется в `/api/tracker/summary` (расхождение R83) |
| [[subscriptions.md]] | Доступ не ограничен по тарифу |
| [[diary.md]] | Аналогичный паттерн: `user.id`, без проверок тарифа |

---

## 11. SQL-шпаргалка

```sql
-- Все победы участницы
SELECT id, result, source, created_at FROM wins
WHERE member_id = '<uuid>'
ORDER BY created_at DESC;

-- Количество побед
SELECT COUNT(*) FROM wins WHERE member_id = '<uuid>';

-- Победы за последние 7 дней
SELECT * FROM wins
WHERE member_id = '<uuid>'
  AND created_at >= now() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Разбивка по source (аналитика)
SELECT source, COUNT(*) AS cnt FROM wins
WHERE member_id = '<uuid>'
GROUP BY source;

-- Проверить is_featured (R81)
SELECT COUNT(*) FROM wins WHERE is_featured = true;
```

---

## 12. История изменений

| Дата | Событие |
|---|---|
| Март 2026 | Разработка. Источник: `WINS.md`. Исправлены баги: `text` → `result`, добавлен `week_date` при INSERT. |
| Март 2026 | В источнике описано 8 chips — в коде реализовано 5. Агрегация по неделям не реализована. |
| 23.05.2026 | Модуль записан в Vault по результатам разведки. |
