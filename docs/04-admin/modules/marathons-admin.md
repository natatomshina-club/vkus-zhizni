# Марафоны — админский модуль

> Этот документ описывает интерфейс и API для Наташи. Флоу участницы, таблицы БД и SQL-шпаргалка — в [[03-club/modules/marathons]].

---

## Назначение

Наташа управляет марафонами из раздела `/admin/marathons`. Здесь создаются марафоны, наполняются дни, ежедневно открываются задания, загружаются PDF и финализируется марафон по окончании.

---

## UI — три страницы

| URL | Назначение |
|---|---|
| `/admin/marathons` | Список всех марафонов с фильтром по статусу; кнопки «Создать», «Редактировать», «Дни», «Удалить» |
| `/admin/marathons/[id]` | Редактор марафона — 4 секции: Основное / Анонс / Рацион и продукты (PDF) / Чат |
| `/admin/marathons/[id]/days` | Аккордеон по дням: контент каждого дня + кнопка «▶ Открыть день» |

**Навигация:** Список → «Редактировать» → редактор → «📅 Редактор дней» → страница дней → «← К марафону».

---

## Действия и как их выполнить

### Создать марафон

Список → кнопка «+ Создать» → форма раскрывается inline.

Обязательное поле: **Название**. Остальное опционально при создании.

При создании автоматически генерируется `slug` из названия + timestamp.

### Редактировать марафон

Список → «Редактировать» → страница `/admin/marathons/[id]`.

Четыре секции:

**Основное:** название, описание, месяц/период (`month_label`), эмодзи, даты начала/окончания, длительность (дней), статус (`planned` / `active` / `finished`), `next_date` — строка «Следующий марафон — {next_date}» в pinned-посте при завершении.

**Анонс** (для заглушки «скоро»): заголовок анонса, блок «Что тебя ждёт» (`announce_features` — список карточек emoji + заголовок + описание), блок «Как подготовиться» (`announce_prepare_text`).

**Рацион и продукты:** загрузка PDF рациона и PDF списка продуктов (см. [Storage](#storage)).

**Чат марафона:** поле `chat_channel_slug` — слаг канала для автопостов при активации дней. Обычно `marathon-{id}`.

Кнопка «💾 Сохранить» — PATCH на `/api/admin/marathons/[id]`.

### Наполнить дни

Редактор → «📅 Редактор дней» → `/admin/marathons/[id]/days`.

Список дней в виде аккордеона (количество = `duration_days`). Для каждого дня:
- Заголовок задания (`task_title`)
- Текст задания (`task_text`)
- Слово Наташи (`coach_comment`)
- Рацион дня (`ration_text` — текст или HTML)

«💾 Сохранить все N дней» — bulk upsert через POST `/api/admin/marathons/[id]/days`. Конфликт по `(marathon_id, day_number)`.

### Открыть день

Страница дней → кнопка «▶ Открыть день» рядом с нужным днём.

Кнопка доступна пока `is_active = false`. После активации заменяется бейджем «🔥 Активен».

**Что происходит:**
1. `marathon_days.is_active = true` для данного `day_number`
2. Пост от Наташи (`nata.tomshina@gmail.com`) в канал марафона:

```
🔥 День N марафона уже открыт!

Заходите на страницу марафона — там новое задание и рацион дня.
👉 https://club.nata-tomshina.ru/dashboard/marathon

Все вопросы и отчёты — здесь в чате 💬
```

### Загрузить PDF

Редактор → секция «Рацион и продукты».

- Кнопка «📎 Выбрать PDF файл» → рацион (`ration_pdf_url`)
- Кнопка «🛒 Выбрать PDF списка продуктов» → список покупок (`shopping_list_pdf_url`)

Лимит: 10 МБ (проверяется на фронте). Загрузка перезаписывает предыдущий файл (`upsert: true`). Кнопка 🗑 удаляет файл из Storage и очищает поле в таблице.

### Завершить марафон

Смена статуса на `finished` делается через поле «Статус» в редакторе марафона (PATCH).

Специальная кнопка «Завершить» отсутствует в UI — есть только API-роут `POST /api/admin/marathons/[id]/finish` (вызывается вручную или программно).

**Что происходит при вызове finish:**
1. `marathons.status = 'finished'`
2. Создаётся pinned-пост в канале `marathon-{id}`:
   `🏁 Марафон завершён! Следующий марафон — {next_date}`
3. Всем обычным постам в этом канале (`is_pinned = false`, `expires_at IS NULL`) выставляется `expires_at = ends_at + 5 дней`

> [!warning] Баг finish-роута: при создании pinned-поста и расстановке `expires_at` используется хардкод `marathon-{id}`, а не поле `chat_channel_slug` из таблицы. Если слаг канала переопределён — посты уйдут не в тот канал.

### Удалить марафон

Список → кнопка «Удалить» → подтверждение → DELETE `/api/admin/marathons/[id]`.

> [!warning] Удаление не каскадируется через API — связанные `marathon_days`, `marathon_task_completions`, `marathon_measurements`, `marathon_reminders` останутся в БД. Каскад должен быть настроен на уровне FK в схеме. Перед удалением активного или прошедшего марафона — уточнить.

---

## API роуты

| Метод | Путь | Назначение | Авторизация |
|---|---|---|---|
| GET | `/api/admin/marathons` | Список (фильтр `?status=all\|planned\|active\|finished`) | admin, curator |
| POST | `/api/admin/marathons` | Создать марафон | admin, curator |
| GET | `/api/admin/marathons/[id]` | Получить один | admin, curator |
| PATCH | `/api/admin/marathons/[id]` | Обновить поля | admin, curator |
| DELETE | `/api/admin/marathons/[id]` | Удалить марафон | admin, curator |
| GET | `/api/admin/marathons/[id]/days` | Список дней | admin, curator |
| POST | `/api/admin/marathons/[id]/days` | Bulk upsert всех дней | admin, curator |
| PATCH | `/api/admin/marathons/[id]/days/[n]/activate` | Активировать день N | admin, curator |
| POST | `/api/admin/marathons/[id]/finish` | Завершить марафон | admin, curator |
| POST | `/api/admin/marathons/[id]/upload` | Загрузить PDF рациона | admin, curator |
| DELETE | `/api/admin/marathons/[id]/upload` | Удалить PDF рациона | admin, curator |
| POST | `/api/admin/marathons/[id]/upload?type=shopping` | Загрузить PDF списка продуктов | admin, curator |
| DELETE | `/api/admin/marathons/[id]/upload?type=shopping` | Удалить PDF списка продуктов | admin, curator |
| GET | `/api/admin/marathon` | Получить `marathon_landing` | только admin |
| PUT | `/api/admin/marathon` | Обновить `marathon_landing` | только admin |

---

## Storage

**Бакет:** `marathon-files`

| Тип | Путь в бакете | Поле в таблице |
|---|---|---|
| PDF рациона | `marathon-{id}-ration.pdf` | `ration_pdf_url` |
| PDF списка продуктов | `{id}/shopping-list.pdf` | `shopping_list_pdf_url` |

URL публичный (через `getPublicUrl`). Загрузка всегда перезаписывает (`upsert: true`).

---

## marathon_landing — публичная страница анонса

Отдельная таблица. Управляется через `/api/admin/marathon` (без `s`) — **только `role = 'admin'`**, куратор не имеет доступа.

Поля таблицы: `title`, `subtitle`, `start_date`, `duration_days`, `program`, `results`, `for_whom`, `is_active`.

API работает с единственной записью где `is_active = true`. Назначение — предположительно публичная страница анонса марафона на внешнем сайте. UI-страницы для редактирования в клубной админке нет — только API.

---

## Защита роутов

Большинство роутов проверяют `role = 'admin' OR role = 'curator'`.

> [!warning] Известный баг: большинство `requireAdmin` в роутах марафонов используют `.eq('id', user.id)` вместо `.eq('email', user.email)`. Это нарушение правила #11 из CLAUDE.md. Работает, пока `members.id = auth.users.id` совпадают для Наташи. Исключение — `activate/route.ts` использует корректный email-lookup.

При исправлении — менять только поиск в `members`, не логику авторизации.

---

## Бизнес-ограничения

- Нельзя активировать уже активный день (UI скрывает кнопку, но API не блокирует повторный вызов — просто перезапишет `true`).
- Нельзя завершить уже завершённый марафон (`status = 'finished'`) — API вернёт 400.
- Слаг чата (`chat_channel_slug`) нужно задать до старта — иначе автопосты идут в канал `marathon-{id}`, который может не существовать.
- Статус меняется вручную через поле «Статус» в редакторе — автоматической смены по датам нет.

---

## SQL-шпаргалка

### Вызвать финализацию вручную (если нет UI-кнопки)
```bash
curl -X POST https://club.nata-tomshina.ru/api/admin/marathons/<id>/finish \
  -H "Cookie: <auth cookie>"
```

### Активировать день в обход UI (если кнопка не сработала)
```sql
UPDATE marathon_days
SET is_active = true
WHERE marathon_id = '<id>' AND day_number = <N>;
-- Автопост в чат не отправится — только через API
```

### Посмотреть статусы всех дней марафона
```sql
SELECT day_number, task_title, is_active
FROM marathon_days
WHERE marathon_id = '<id>'
ORDER BY day_number;
```

### Сколько участниц зарегистрировались на напоминание
```sql
SELECT COUNT(*) FROM marathon_reminders
WHERE marathon_id = '<id>' AND sent = false;
```

### Статистика выполнения по дням
```sql
SELECT md.day_number, md.task_title, COUNT(mtc.id) AS completions
FROM marathon_days md
LEFT JOIN marathon_task_completions mtc ON mtc.marathon_day_id = md.id
WHERE md.marathon_id = '<id>'
GROUP BY md.day_number, md.task_title
ORDER BY md.day_number;
```

---

## Связи с другими модулями

- [[03-club/modules/marathons]] — флоу участницы, схема БД, шпаргалка SQL
- [[03-club/modules/channels]] — автопосты при активации и завершении идут в `channel_posts`
- [[04-admin/modules/emails]] — рассылка анонсов участницам (сегмент `trial`, `monthly` и др.)

---

## История изменений

| Дата | Событие |
|---|---|
| май 2026 | Документ создан — разведка по коду |
