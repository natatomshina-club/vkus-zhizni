# Трекер замеров

Модуль еженедельных замеров тела. Участница фиксирует вес, объёмы,
уровень энергии и тягу к сладкому. Новый замер автоматически пересчитывает
КБЖУ-нормы в дневнике.

> [!info] Область модуля
> Покрывает `/dashboard/tracker`.
> Дневник еды/воды/чувств — [[diary.md]].
> Победы и достижения — [[wins.md]].

---

## 1. Что видит участница

### Форма замера

Поля:
- **Вес (кг)** — обязательно, 30–200
- **Талия / Бёдра / Грудь (см)** — опционально
- **Уровень энергии** — кнопки 😩 1–3 / 😐 4–6 / 😊 7–10, обязательно
- **Тяга к сладкому** — toggle-кнопка «Была тяга к сладкому»
- **Дата** — по умолчанию сегодня (`new Date().toISOString().split('T')[0]`)

После сохранения: зелёный блок «✅ Замер сохранён!». При ошибке синхронизации КБЖУ —
жёлтый toast «⚠️ Замер сохранён. Обнови страницу чтобы увидеть новый вес».

### Ограничение — 1 замер в неделю

API проверяет наличие замера в диапазоне `[понедельник, воскресенье]` текущей недели.
При повторе → HTTP 409. Неделя считается с понедельника по воскресенье.

Баннер «Сегодня воскресенье — время вносить замер!» отображается только
если `new Date().getDay() === 0` И замера этой недели ещё нет.

### Сводка и прогресс

- Карточка текущего веса с дельтой от старта
- Прогресс-бар «Путь к цели»: `round(|start − current| / |start − goal| × 100)`
- Целевой вес отображается под баром

### Достижения

| Иконка | Метка | Условие |
|---|---|---|
| 🌱 | Первый замер | `measurements.length >= 1` |
| ⭐ | −5 кг | `lost >= 5` (lost = start_weight − weight) |
| 🏆 | −10 кг | `lost >= 10` |
| 💚 | −15 кг | `lost >= 15` |
| 🍬 | Месяц без тяги | последние 4 замера: `sweet_craving = false` |
| 👑 | Квартал без тяги | последние 13 замеров: `sweet_craving = false` |

> [!warning] Расхождение с документацией
> TRACKER_IMPL.md описывает достижение «Цель достигнута» (`weight <= goalWeight`)
> с иконками `🎯 ⭐ 🔥 📏 💎 👑`. В текущем коде этого достижения нет,
> иконки другие. См. R79.

### Мобильные вкладки

На мобайле — три вкладки: **Сводка** / **Внести** / **История**.

---

## 2. Доступ по тарифам

> [!info] Открыт для всех
> Триал + полный клуб. Подтверждено в TRACKER_IMPL.md.
> Нет проверки `subscription_status` ни в `page.tsx`, ни в API роутах.
> Единственная защита: `if (!user) redirect('/auth')`.

---

## 3. Архитектура файлов

| Файл | Тип | Роль |
|---|---|---|
| `src/app/(club)/dashboard/tracker/page.tsx` | Server Component | Загрузка member + measurements |
| `src/components/TrackerClient.tsx` | Client Component | Весь интерактивный UI |
| `src/app/api/tracker/measurements/route.ts` | API | GET список, POST новый замер + каскад |
| `src/app/api/tracker/measurements/[id]/route.ts` | API | DELETE замера |
| `src/app/api/tracker/summary/route.ts` | API | GET прогресс начало vs текущее |

`page.tsx` загружает при старте параллельно:
- поля `weight, start_weight, goal_weight, full_name` из `members` (по `user.id`)
- все `measurements` участницы (DESC по дате, по `user.id`)

---

## 4. Схема таблицы БД

### `measurements`

```sql
CREATE TABLE measurements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date          date NOT NULL,
  weight        numeric(5,1) NOT NULL,
  waist         numeric(5,1),
  hips          numeric(5,1),
  chest         numeric(5,1),
  energy        integer NOT NULL CHECK (energy BETWEEN 1 AND 10),
  sweet_craving boolean NOT NULL DEFAULT false,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own measurements" ON measurements
  FOR ALL USING (auth.uid() = member_id);
CREATE INDEX idx_measurements_member_date ON measurements(member_id, date DESC);
```

RLS: `auth.uid() = member_id` · ⚠️ Без миграции (см. R72)

> [!info] R76 закрыт (2026-05-23)
> Диагностика на боевой БД подтвердила: поле называется `sweet_craving` — совпадает с кодом.
> `TRACKER_IMPL.md` (DDL, март 2026) содержал неверное имя `craving` — это был баг документации, не кода.

> [!warning] Поле `note`
> Присутствует в SELECT и TypeScript interface (`note: string | null`),
> но форма UI его не передаёт при POST. Либо подключить в форму,
> либо убрать из SELECT/interface. См. R77.

---

## 5. API роуты

| Метод | Endpoint | Принимает | Возвращает | Проверки |
|---|---|---|---|---|
| GET | `/api/tracker/measurements` | — | `{ data: Measurement[] }` DESC по дате | auth, `user.id` |
| POST | `/api/tracker/measurements` | `date, weight, waist?, hips?, chest?, energy (1–10), sweet_craving` | `{ data, syncOk, syncError? }` | weight 30–200; energy 1–10; 1 замер/неделю → 409 |
| DELETE | `/api/tracker/measurements/[id]` | id в URL | `{ ok: true }` | auth, `user.id` ownership |
| GET | `/api/tracker/summary` | — | `{ weight, waist, hips, chest }` начало vs текущее | auth, читает `initial_weight` из members |

> [!warning] Auth-метод — `user.id`
> Все 4 роута используют `user.id` напрямую, без email lookup в `members`.
> Если `auth.users.id ≠ members.id` — данные не найдутся. См. R71.

`GET /api/tracker/summary` — использует `initial_weight` из members,
тогда как `page.tsx` использует `start_weight`. Разные поля. См. R74.

---

## 6. Каскад при POST measurement

После успешного INSERT в `measurements` выполняется двухшаговый каскад.
Шаги 1–2 обёрнуты в отдельный `try/catch`: если синхронизация упала —
замер всё равно сохранён, ответ содержит `syncOk: false`.

**Шаг 1 — обновить текущий вес:**
```typescript
supabase.from('members').update({ weight }).eq('id', user.id)
```

**Шаг 2 — пересчитать КБЖУ** (только если в members есть `height + age + activity_level`):
```typescript
supabase.from('members').update({
  kbju_calories,      // пересчитаны через calculateKBJU по новому весу
  kbju_fat,           // пересчитаны
  kbju_carbs,         // = 80 (константа)
  kbju_carbs_system,  // = 80, системный потолок для ручного override
  kbju_manual: false, // ⚠️ сбрасывает ручной override (если был)
  // kbju_protein — НЕ трогается
}).eq('id', user.id)
```

**Не трогается никогда:** `start_weight`, `initial_weight`, `kbju_protein`, `kbju_protein_system`.

> [!warning] Сброс ручного override КБЖУ
> Если участница через `/api/profile/kbju-override` вручную снизила углеводы
> (`kbju_manual: true`) — любой новый замер сбрасывает `kbju_manual: false`
> и восстанавливает системные значения. Ручной override теряется.
> Намеренное поведение или баг — не задокументировано. См. R78.

**Что меняется на других страницах после каскада:**

| Страница | Что обновляется |
|---|---|
| `/dashboard` | Текущий вес в строке профиля, блок «МИНУС КГ» |
| `/dashboard/diary` | Норма КБЖУ (прогресс-бары) |
| `/dashboard/kitchen` | Контекст для генерации меню |
| `/dashboard/profile` | Текущий вес |

---

## 7. Алгоритм КБЖУ (`calculateKBJU`)

**Файл:** `src/lib/kbju.ts`

**Вход:** `{ weight, height, age, activity: ActivityLevel }`  
**Выход:** `{ calories, protein, fat, carbs }`

```
ActivityLevel = 'sedentary' | 'standing' | 'light_training' | 'intense_training'
Коэффициенты:  1.2            1.25          1.3                 1.4
```

**Алгоритм (промежуточные значения не округляются):**

1. `bmr = (Harris-Benedict + Mifflin-St.Jeor) / 2`
2. `tdee = bmr × activity_coef`
3. `calories = round(tdee × 0.825)` — дефицит 17.5%
4. `protein = getProtein(height, activity, age)` — таблица:
   - рост ≥ 160 + сидячий/стоячий + возраст <40 → 75г, ≥40 → 80г
   - рост ≥ 160 + light_training → 90г, intense_training → 100г
   - рост <160 + сидячий/стоячий + <40 → 65г, ≥40 → 75г
   - рост <160 + light_training → 80г, intense_training → 90г
5. `carbs = 80` — константа
6. `fat = clamp(70, 100, round((calories − protein×4 − carbs×4) / 9))`

**Где вызывается:** онбординг, профиль (при изменении веса/активности), POST measurement, `/api/kbju` (калькулятор в профиле).

---

## 8. График

**Метрики:** `weight | waist | hips | chest | energy`  
**Периоды:** `1m | 3m | all`

**Фильтрация** (`useMemo`):
```typescript
if (chartPeriod === 'all') return chrono  // весь массив хронологически
const cutoff = new Date()
cutoff.setMonth(cutoff.getMonth() - (chartPeriod === '1m' ? 1 : 3))
return chrono.filter(m => new Date(m.date + 'T12:00:00') >= cutoff)
```

Данные в хронологическом порядке (reversed, т.к. API возвращает DESC).

**Стиль:** Chart.js Line, цвет `#7C5CFC` (фиолетовый), `fill: true`, `spanGaps: true`
(пропускает `null` в опциональных полях waist/hips/chest).

---

## 9. Достижения

Вычисляются на клиенте из массива `measurements`:

```typescript
const lost = startWeight - currentWeight  // от start_weight до последнего замера

achievements = [
  { icon: '🌱', label: 'Первый замер',       achieved: measurements.length >= 1 },
  { icon: '⭐', label: '−5 кг',              achieved: lost >= 5 },
  { icon: '🏆', label: '−10 кг',             achieved: lost >= 10 },
  { icon: '💚', label: '−15 кг',             achieved: lost >= 15 },
  { icon: '🍬', label: 'Месяц без тяги',     achieved: length >= 4  && slice(0,4).every(!sweet_craving)  },
  { icon: '👑', label: 'Квартал без тяги',   achieved: length >= 13 && slice(0,13).every(!sweet_craving) },
]
```

`slice(0, N)` работает корректно т.к. API возвращает замеры DESC (последние первые).

> [!warning] TRACKER_IMPL.md описывает другой набор
> DDL-источник содержит достижение «Цель достигнута» (`weight <= goalWeight`, 🎯)
> и иные иконки (`🎯 ⭐ 🔥 📏 💎 👑`). В коде его нет. Решить: добавить или
> обновить источник. См. R79.

---

## 10. Известные проблемы

| # | Описание | Приоритет |
|---|---|---|
| R76 | ✅ закрыт — `sweet_craving` верно и в БД, и в коде; баг был в TRACKER_IMPL.md | — |
| R77 | `note` есть в SELECT/interface, нет в форме UI | низкий |
| R78 | `kbju_manual: false` при замере сбрасывает ручной override | средний |
| R79 | Достижение «Цель достигнута» убрано или выпало | низкий |
| R80 | `todayStr()` без timezone-защиты `setHours(12,0,0,0)` | низкий |
| R71 | Все роуты используют `user.id` (не email lookup) | средний |
| R72 | Нет миграции для `measurements` | низкий |
| R74 | `initial_weight` vs `start_weight` — семантика неясна | низкий |

---

## 11. Связи с другими модулями

| Модуль | Связь |
|---|---|
| [[../../../04-admin/modules/members.md]] | Поля `weight`, `start_weight`, `initial_weight`, `kbju_*`, `height`, `age`, `activity_level` — читаются и пишутся при замере |
| [[diary.md]] | Норма КБЖУ в дневнике (`kbju_calories`, `kbju_protein`, `kbju_fat`, `kbju_carbs`) — обновляется каждым замером |
| [[wins.md]] | `wins/page.tsx` читает первый и последний замер из `measurements` для прогресс-блока |
| [[subscriptions.md]] | Доступ не ограничен по тарифу |

---

## 12. SQL-шпаргалка

```sql
-- Все замеры участницы
SELECT * FROM measurements
WHERE member_id = '<uuid>'
ORDER BY date DESC;

-- Первый и последний замер
SELECT
  (SELECT weight FROM measurements WHERE member_id = '<uuid>' ORDER BY date ASC  LIMIT 1) AS first_weight,
  (SELECT weight FROM measurements WHERE member_id = '<uuid>' ORDER BY date DESC LIMIT 1) AS last_weight;

-- Проверить реальное имя поля тяги в боевой БД (R76)
SELECT column_name FROM information_schema.columns
WHERE table_name = 'measurements' AND column_name LIKE '%craving%';

-- Недели подряд без тяги к сладкому (при условии поле = sweet_craving)
WITH ordered AS (
  SELECT date, sweet_craving,
         ROW_NUMBER() OVER (ORDER BY date DESC) AS rn
  FROM measurements
  WHERE member_id = '<uuid>'
)
SELECT COUNT(*) AS weeks_without_craving
FROM ordered
WHERE rn < COALESCE(
  (SELECT MIN(rn) FROM ordered WHERE sweet_craving = true),
  999
);

-- Все замеры за период (для графика 1М)
SELECT * FROM measurements
WHERE member_id = '<uuid>'
  AND date >= CURRENT_DATE - INTERVAL '1 month'
ORDER BY date;
```

---

## 13. История изменений

| Дата | Событие |
|---|---|
| Март 2026 | Разработка. Источник: `TRACKER_IMPL.md`. Исправлены 5 багов (фокус input, прогресс-бар, достижения, сайдбар, блок «минус кг»). |
| 23.05.2026 | Модуль записан в Vault по результатам разведки. |
