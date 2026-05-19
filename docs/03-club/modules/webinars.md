# Вебинары

Раздел закрытых видеоуроков клуба: вебинары и курсы, доступ по уровню участницы (бесплатно по квоте) или за отдельную покупку. Одно видео — страница Kinescope, набор видео — плейлист с уроками.

## Где в коде

### Страницы участницы

| Слой | Путь | Назначение |
|---|---|---|
| Список вебинаров | `src/app/(club)/dashboard/webinars/page.tsx` | **Server Component** — читает БД напрямую (не через API) |
| Клиент списка | `src/app/(club)/dashboard/webinars/WebinarsClient.tsx` | Фильтр, карточки, кнопки |
| Страница вебинара | `src/app/(club)/dashboard/webinars/[slug]/page.tsx` | SSR: проверка доступа + плеер |
| Клиент вебинара | `src/app/(club)/dashboard/webinars/[slug]/WebinarPageClient.tsx` | Вкладки: видео / материалы / уроки |
| HTML-презентация | `src/app/(club)/dashboard/webinars/presentation/page.tsx` | iframe-просмотр HTML через прокси |

### API участницы

| Роут | Метод | Назначение |
|---|---|---|
| `src/app/api/webinars/route.ts` | GET | Список вебинаров + selections + уровень участницы |
| `src/app/api/webinars/[id]/select/route.ts` | POST | Выбрать вебинар (расходует квоту) |
| `src/app/api/webinars/presentation/route.ts` | GET | Прокси HTML-файла из bucket (обход CORS) |

### Страницы и API админа

| Слой | Путь | Назначение |
|---|---|---|
| Список вебинаров | `src/app/(club)/admin/webinars/page.tsx` | SSR |
| Клиент списка | `src/app/(club)/admin/webinars/WebinarsAdminClient.tsx` | CRUD, загрузка HTML, управление уроками |
| CRUD вебинаров | `src/app/api/admin/webinars/route.ts` | GET/POST |
| Вебинар | `src/app/api/admin/webinars/[id]/route.ts` | PATCH/DELETE |
| Уроки | `src/app/api/admin/webinars/[id]/lessons/route.ts` | GET/POST уроков |
| Материалы | `src/app/api/admin/webinars/[id]/materials/route.ts` | GET/POST материалов |
| HTML-презентация | `src/app/api/admin/webinars/[id]/upload-html/route.ts` | PUT/DELETE HTML в bucket |
| Заявки (список) | `src/app/api/admin/webinar-selections/route.ts` | GET pending + массовое одобрение |
| Заявка (одобрить) | `src/app/api/admin/webinar-selections/[id]/grant/route.ts` | POST: status → 'granted' |
| Ручной доступ | `src/app/api/admin/webinars/[id]/grant-manual/route.ts` | POST: дать доступ без заявки |

### Библиотека и типы

| Файл | Назначение |
|---|---|
| `src/lib/webinars.ts` | Логика уровней, квот, состояний вебинара |
| `src/types/webinars.ts` | Типы: `WebinarRow`, `WebinarState`, `WebinarAccess`, `WebinarSelection`, `WebinarLesson`, `WebinarMaterial` |

## База данных

### `webinars`

| Поле | Тип | Описание |
|---|---|---|
| `id` | UUID | PK |
| `slug` | TEXT | URL-идентификатор (`/dashboard/webinars/[slug]`) |
| `title` | TEXT | Название |
| `short_desc` | TEXT | Короткое описание (для карточки) |
| `full_desc` | TEXT | Полное описание (для страницы вебинара) |
| `content_type` | TEXT | `'webinar'` — одиночный вебинар; `'course'` — плейлист уроков |
| `video_id` | TEXT | ID видео Kinescope (NULL → «Скоро») |
| `html_url` | TEXT | URL HTML-презентации в bucket `webinar-materials` (добавлено 2026-04-16) |
| `price` | INTEGER | Цена в рублях (NULL → бесплатный по квоте) |
| `emoji` | TEXT | Эмодзи на карточке |
| `color_from` | TEXT | Начальный цвет градиента (#hex) |
| `color_to` | TEXT | Конечный цвет градиента (#hex) |
| `sort_order` | INTEGER | Порядок в списке |
| `is_published` | BOOLEAN | Показывать участницам |

### `webinar_lessons`

| Поле | Тип | Описание |
|---|---|---|
| `id` | UUID | PK |
| `webinar_id` | UUID | FK → `webinars` |
| `title` | TEXT | Название урока |
| `video_id` | TEXT | ID видео Kinescope |
| `sort_order` | INTEGER | Порядок внутри курса |
| `is_visible` | BOOLEAN | Показывать участницам |

### `webinar_materials`

| Поле | Тип | Описание |
|---|---|---|
| `id` | UUID | PK |
| `webinar_id` | UUID | FK → `webinars` |
| `lesson_id` | UUID | FK → `webinar_lessons` (NULL → материал к вебинару, не уроку) |
| `title` | TEXT | Название материала |
| `type` | TEXT | `'pdf'` / `'audio'` / `'text'` |
| `url` | TEXT | URL в bucket `webinar-materials` (для `pdf`/`audio`) |
| `content` | TEXT | Текстовое содержимое (для `type = 'text'`) |
| `sort_order` | INTEGER | Порядок |

### `webinar_access`

Фактический доступ к вебинару (отдельно от заявок).

| Поле | Тип | Описание |
|---|---|---|
| `id` | UUID | PK |
| `member_id` | UUID | FK → `members` |
| `webinar_id` | UUID | FK → `webinars` |
| `granted_by` | TEXT | `'status'` (по квоте/уровню) / `'purchase'` (купил) / `'admin'` (выдан вручную) |
| `granted_at` | TIMESTAMPTZ | Когда открыт доступ |

### `webinar_selections`

Заявки на доступ (то, что участница «выбирает» из своей квоты).

| Поле | Тип | Описание |
|---|---|---|
| `id` | UUID | PK |
| `member_id` | UUID | FK → `members` |
| `webinar_id` | UUID | FK → `webinars` |
| `status` | TEXT | `'pending'` — ожидает; `'granted'` — доступ открыт |
| `is_paid` | BOOLEAN | Платный доступ (добавлено 2026-04-18) — такие не считаются в бесплатную квоту |
| `selected_at` | TIMESTAMPTZ | Когда сделана заявка |

UNIQUE: `(member_id, webinar_id)`

> [!note] `webinar_selections` — это «запрос на доступ» (черновик), `webinar_access` — «фактический доступ» (выданный). Они работают вместе: квота → selections (pending) → одобрение → access.

## Логика доступа

### Состояния вебинара (`WebinarState`)

Из `src/types/webinars.ts`:

```typescript
export type WebinarState = 'locked' | 'can_select' | 'pending' | 'has_access'
```

| Состояние | Смысл | Что видит участница |
|---|---|---|
| `'locked'` | Уровень недостаточен или квота исчерпана | Заблокировано, кнопок нет |
| `'can_select'` | Есть свободная квота, можно выбрать | Кнопка «Выбрать» |
| `'pending'` | Заявка отправлена, ждёт одобрения | «Ожидает подтверждения» |
| `'has_access'` | Доступ открыт (по квоте, покупке или вручную) | «Открыть» |

> [!note] Состояние «Скоро» (когда `video_id = NULL`) — это **UI-условие**, а не отдельное состояние типа. Логика в компоненте проверяет `video_id` независимо от `WebinarState`.

### Квоты по уровням

| Уровень | Стаж (эффективный) | Доступных вебинаров |
|---|---|---|
| 🌸 Новенькая | 0–3 мес | 0 |
| ⭐ Вошла во вкус | 3 мес | 2 (только `webinar`) |
| 🔥 Уже своя | 6 мес | 5 (только `webinar`) |
| 💚 Легенда | 9 мес | 7 (включая `course`) |
| 💎 Бриллиант | 12 мес | 999 — Безлимитный доступ |

### Функции в `src/lib/webinars.ts`

```typescript
getMonthsInClub(joinedAt: string): number
// Полные календарные месяцы с даты вступления

getEffectiveMonths(joinedAt: string, plan: string | null): number
// То же + бонус +6 для plan IN ('halfyear', 'Полгода')

getWebinarQuota(effectiveMonths: number): number
// Возвращает квоту: 0 / 2 / 5 / 7 / 999

canSelectType(webinar: WebinarRow, months: number): boolean
// Проверяет: может ли участница со стажем `months` выбрать
// этот вебинар по типу (`webinar` доступен с 3 мес, `course` — с 9 мес)

getWebinarState(
  webinar: WebinarRow,
  months: number,
  access: WebinarAccess[],
  selections: WebinarSelection[]
): WebinarState
// Главная функция: возвращает состояние конкретного вебинара
// для участницы — на основе её доступов, заявок и квоты
```

⚠️ Везде передавать `subscription_started_at ?? created_at` как `joinedAt` (не просто `created_at`). Правило #21 из CLAUDE.md.

### Три пути получения доступа

Каждый путь создаёт запись в `webinar_access` с соответствующим `granted_by`:

1. **Квота по уровню** (`granted_by = 'status'`) — участница нажимает «Выбрать» → `webinar_selections` со `status = 'pending'` → Наташа одобряет в `/admin/webinars` → `status = 'granted'` + запись в `webinar_access`.

2. **Ручное назначение** (`granted_by = 'admin'`) — Наташа открывает доступ через `POST /api/admin/webinars/[id]/grant-manual` без заявки.

3. **Платный доступ** (`granted_by = 'purchase'`) — вебинар куплен отдельно, не расходует квоту. Selections для такого доступа создаётся с `is_paid = true`. Механизм оплаты и связь с CloudPayments в коде неочевидны, требуется разведка — см. [[08-roadmap/todo]].

## Что видит участница

### `/dashboard/webinars` — список

**Карточки** с названием, типом (`webinar`/`course`) и статус-бейджем (🔒 заблокировано / Выбрать / Ожидает / ✅ Открыт / Скоро — если `video_id = NULL`).

**Кнопка «Выбрать»:** активна при `state = 'can_select'`. Создаёт запись в `webinar_selections` через `POST /api/webinars/[id]/select`, статус сразу `pending`.

**Квота-подсказка:** показывает сколько слотов доступно и потрачено на уровне участницы.

**Фильтр по типу:** «Все» / «Вебинары» / «Курсы».

### `/dashboard/webinars/[slug]` — страница вебинара

**Видео:** iframe Kinescope `https://kinescope.io/embed/{video_id}`. Если `video_id = NULL` — блок «Скоро».

**Вкладки курса (`type = 'course'`):** список уроков → каждый урок открывает Kinescope-плеер.

**Материалы:** список файлов для скачивания из bucket `webinar-materials`.

**HTML-презентация:** кнопка открывает `/dashboard/webinars/presentation?url=...`, внутри — iframe с прокси-роутом (обход CORS).

## Что делает админ

### `/admin/webinars` — список вебинаров

**Бейдж «Ожидают подтверждения»** — количество `pending`-заявок, ведёт в раздел заявок.

**Карточка вебинара:** название, тип, `sort_order`, видимость. Кнопки:
- 👁 / 🙈 — переключить видимость (`PATCH is_visible`)
- ✏️ — редактировать (inline форма)
- 🗑️ — удалить (двойное подтверждение)
- «Заявки» — список selections для этого вебинара
- «Дать доступ» — ручной грант без заявки

**CRUD вебинара — inline форма:** Название, Короткое описание, Полное описание, Slug, Тип (`webinar`/`course`), `sort_order`, чекбокс «Опубликован» (`is_published`), Цена, Video ID (Kinescope), эмодзи, градиент (`color_from`/`color_to`), загрузка HTML-презентации.

**Загрузка HTML-презентации:**
1. `<input type="file" accept=".html">` → `PUT /api/admin/webinars/[id]/upload-html`
2. Файл сохраняется в bucket `webinar-materials` по пути `presentations/{webinar_id}.html`
3. `html_url` сохраняется в `webinars`
4. Удаление: `DELETE /api/admin/webinars/[id]/upload-html` → удаляет файл, `html_url → NULL`

**Уроки курса (`type = 'course'`):** список уроков с `sort_order`, Video ID, видимостью. CRUD через `POST/PATCH /api/admin/webinars/[id]/lessons`.

**Материалы:** загрузка файлов в bucket `webinar-materials`. Можно привязать к конкретному уроку. CRUD через `POST/DELETE /api/admin/webinars/[id]/materials`.

### Раздел заявок

`GET /api/admin/webinar-selections` — все `pending`-заявки с email участниц.

Кнопка «Одобрить» → `POST /api/admin/webinar-selections/[id]/grant` → статус `'granted'`.

Кнопка «Одобрить все» → массовое обновление.

> [!note] При одобрении заявки (через grant или grant-manual) участнице автоматически создаётся запись в `private_messages` — уведомление о доступе. Подробнее: [[03-club/modules/private-messages]].

## Известные особенности

1. **`/dashboard/webinars/page.tsx` — Server Component, не API.** Страница участницы читает БД напрямую, а не через `GET /api/webinars/route.ts`. Роут `/api/webinars` существует, но этой страницей не используется. Не путать при доработках.

2. **`requireAdmin` в 5 роутах использует `user.id` вместо `user.email`** (нарушение правила #24 из CLAUDE.md: проверка прав админа должна идти через email, а не id; `member.id ≠ auth.users.id`):
   - `src/app/api/admin/webinars/route.ts:8`
   - `src/app/api/admin/webinars/[id]/route.ts:8`
   - `src/app/api/admin/webinars/[id]/grant-manual/route.ts:8`
   - `src/app/api/admin/webinars/[id]/materials/route.ts:9`
   - `src/app/api/admin/webinars/[id]/lessons/route.ts:9`

   Исправить: `.eq('id', user.id)` → `.eq('email', user.email)`. Задача в [[08-roadmap/tech-debt]].

3. **Kinescope `video_id = NULL`** — вебинар показывается с меткой «Скоро», плеер не отображается. Корректно обработано в UI.

4. **HTML-презентация проходит через прокси.** Файл в bucket не открывается напрямую из-за CORS — `GET /api/webinars/presentation?url=...` скачивает его на сервере и отдаёт с нужными заголовками.

5. **Race condition при одобрении заявок** исключён: UNIQUE constraint `webinar_selections_member_webinar_unique` + upsert с `ignoreDuplicates: true` в grant-роуте.

## Типовые операции

### Посмотреть все заявки на вебинар

```sql
SELECT ws.id, ws.status, m.email, m.name, ws.created_at
FROM webinar_selections ws
JOIN members m ON m.id = ws.member_id
WHERE ws.webinar_id = (SELECT id FROM webinars WHERE slug = 'название-слага')
ORDER BY ws.created_at;
```

### Одобрить заявку вручную

```sql
UPDATE webinar_selections
SET status = 'granted'
WHERE id = '<uuid>';
```

### Посмотреть вебинары участницы

```sql
SELECT w.title, w.type, ws.status, ws.created_at
FROM webinar_selections ws
JOIN webinars w ON w.id = ws.webinar_id
WHERE ws.member_id = (SELECT id FROM members WHERE email = 'участница@email.com')
ORDER BY ws.created_at DESC;
```

## История изменений

- 2026-04-03: при переезде на Beget в БД 22 вебинара + 194 урока — [[07-sessions/2026-04-03b]]
- 2026-04-16: добавлены HTML-презентации (поле `html_url`, роут `upload-html`, прокси, viewer) — [[07-sessions/2026-04-16]]
- 2026-04-18: добавлено поле `is_paid` в `webinar_selections` — раздельный учёт платных и бесплатных доступов — [[07-sessions/2026-04-18]]
- 2026-05-17: фикс race condition в `presentation/page.tsx` (тот же класс ошибок, что в PDF-viewer) — [[07-sessions/2026-05-17]]

> [!note] Раздел вебинаров существует с ранних версий клуба. Эта секция фиксирует только задокументированные изменения.

## Связано

- [[05-infrastructure/storage]] — bucket `webinar-materials`
- [[03-club/subscriptions]] — доступ зависит от уровня подписки и `subscription_started_at`
- [[03-club/modules/private-messages]] — одобрение заявок и ручной грант сопровождаются автосообщением в личку
