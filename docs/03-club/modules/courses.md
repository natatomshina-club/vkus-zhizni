# Я и моё тело — курсы и материалы

Раздел `/dashboard/courses` — образовательный хаб клуба. Объединяет два суб-модуля:

- **Вводные курсы** — видеокурсы с уроками, прогрессом в localStorage, PDF-материалами
- **Материалы клуба** — статьи, видео, PDF, аудио, сгруппированные по разделам

Общий URL участницы: `/dashboard/courses`. Детальный материал тела: `/dashboard/body/[id]`. Устаревший `/minicourse` редиректит на `/dashboard/courses`.

---

## Суб-модуль 1 — Вводные курсы

### Таблицы БД

#### `intro_courses`

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK |
| `slug` | text | Уникальный slug курса (латиница, используется в URL) |
| `title` | text | Название |
| `description` | text\|null | Краткое описание |
| `sort_order` | integer | Порядок в списке |

#### `intro_lessons`

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK |
| `course_id` | uuid | FK → `intro_courses.id` |
| `sort_order` | integer | Порядок урока |
| `title` | text | Название урока |
| `lesson_type` | text | `'video'` или `'text'` |
| `video_url` | text\|null | Основное видео — полный URL `https://kinescope.io/{ID}` |
| `bonus_video_url` | text\|null | Бонусное видео — тот же формат |
| `text_content` | text\|null | Текст для текстового урока |
| `is_visible` | boolean | `false` — урок скрыт от участниц (не удаляется) |

> [!note] Kinescope-ID в коде: при рендере из `video_url` извлекается ID через `.split('/').pop()`. В таблице хранится полный URL, не голый ID.

#### `intro_lesson_materials`

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK |
| `lesson_id` | uuid | FK → `intro_lessons.id` |
| `title` | text | Название PDF |
| `url` | text | Публичный URL файла в Storage |
| `sort_order` | integer | |

---

### Флоу участницы

**Список курсов** (`/dashboard/courses`):
- Вверху — карточки вводных курсов (из `intro_courses`, с количеством видимых уроков)
- Ниже — «Материалы клуба» (body_sections)

**Страница курса** (`/dashboard/courses/{slug}`):
- Слева — список уроков, прогресс
- По центру — содержимое выбранного урока (видео или текст)
- Под видео — PDF-материалы урока
- Прогресс — в `localStorage` (ключ `vkus-course-{slug}`, для `intro` — legacy-ключ `vkus-intro-progress`)
- `isFinalLesson` — определяется автоматически: последний урок с `lesson_type = 'text'`

**Fallback-курсы:** если `intro_courses` пуста или курс не найден в БД, `intro/page.tsx` и `stop-diabet/page.tsx` показывают захардкоженные уроки. Статические страницы существуют для `intro` и `stop-diabet`; все остальные слаги — через динамический роут `/dashboard/courses/[slug]`.

> [!note] Роут `/dashboard/courses/[slug]/page.tsx` явно возвращает `notFound()` для `slug === 'intro'` и `slug === 'stop-diabet'`, чтобы не конкурировать со статическими страницами.

**Доступ:** все участницы любого тарифа, без ограничений.

---

### API роуты — вводные курсы

Все роуты — только admin.

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/admin/intro-courses` | Список курсов с уроками и материалами (embedded join) |
| POST | `/api/admin/intro-courses` | Создать курс: `{title, description, slug, sort_order}` |
| DELETE | `/api/admin/intro-courses/[id]` | Удалить курс |
| POST | `/api/admin/intro-courses/[id]/lessons` | Создать урок |
| PATCH | `/api/admin/intro-lessons/[id]` | Обновить урок: `{title, lesson_type, video_url, bonus_video_url, text_content, is_visible, sort_order}` |
| DELETE | `/api/admin/intro-lessons/[id]` | Удалить урок |
| POST | `/api/admin/intro-lessons/[id]/materials` | Добавить PDF-материал к уроку |
| DELETE | `/api/admin/intro-materials/[id]` | Удалить PDF-материал |

> [!warning] **Баг — нарушение правила #11:** все `intro_*` роуты используют `requireAdmin` с `.eq('id', user.id)` вместо `.eq('email', user.email)`. Работает, пока `members.id = auth.users.id` совпадают для Наташи. Задача на исправление: [[08-roadmap/tech-debt]].

---

### Storage — вводные курсы

**Бакет:** `webinar-materials` (общий с вебинарами)

| Что | Путь в бакете |
|---|---|
| PDF к уроку | `intro-courses/{lesson_id}/{timestamp}_{filename}` |

Загрузка: клиент → Supabase Storage напрямую (через anon-ключ), затем POST в API для сохранения URL.

---

## Суб-модуль 2 — Материалы клуба (Курс тела)

### Таблицы БД

#### `body_sections`

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK |
| `title` | text | Название раздела |
| `emoji` | text | Иконка |
| `sort_order` | integer | |
| `is_active` | boolean | `false` — скрыт для участниц |

#### `body_materials`

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK |
| `section_id` | uuid | FK → `body_sections.id` |
| `title` | text | Название |
| `description` | text\|null | Краткое описание |
| `format` | text | `'video'` / `'article'` / `'pdf'` / `'audio'` |
| `content_url` | text\|null | URL контента (статья HTML, PDF, аудио); для видео — не используется |
| `video_urls` | text[]\|null | Список Kinescope-URL для `format = 'video'` (несколько видео) |
| `thumbnail_url` | text\|null | Обложка |
| `duration_label` | text\|null | Строка длительности, напр. `'14 мин'` |
| `sort_order` | integer | |
| `views_count` | integer | Счётчик просмотров |
| `is_published` | boolean | Виден ли участницам |
| `attachments` | jsonb\|null | Вложения: массив `{name: string, url: string}` |

---

### Флоу участницы

**Список материалов** (`/dashboard/courses` секция «Материалы клуба»):
- Отображаются все активные секции с опубликованными материалами
- Trial-участницы: первые 3 материала **глобально** (независимо от раздела) — открыты; начиная с 4-го — `locked: true`, `content_url: null`, карточка с замком + CTA апгрейда

**Детальная страница** (`/dashboard/body/[id]`):
- Рендер по формату: видео через Kinescope-плеер / статья (HTML) / PDF / аудио
- Для `video`: список из `video_urls`
- Вложения: список ссылок из `attachments`

**Trial-логика** (из `CoursesPage` и `GET /api/body/sections`):
```typescript
let freeCount = 0
sections.map(s =>
  s.materials.map(m => {
    freeCount++
    if (!isTrial || freeCount <= 3) return { ...m, locked: false }
    return { ...m, content_url: null, locked: true }
  })
)
```

---

### API роуты — материалы клуба

| Метод | Путь | Назначение | Авторизация |
|---|---|---|---|
| GET | `/api/body/sections` | Секции + материалы (с `locked`-флагом) | любая участница |
| GET | `/api/admin/body/sections` | Секции + материалы (full, для админа) | только admin |
| POST | `/api/admin/body/sections` | Создать раздел: `{title, emoji, sort_order}` | только admin |
| PATCH | `/api/admin/body/sections/[id]` | Обновить: `{title, emoji, sort_order, is_active}` | только admin |
| DELETE | `/api/admin/body/sections/[id]` | Удалить раздел | только admin |
| POST | `/api/admin/body/materials` | Создать материал | только admin |
| PATCH | `/api/admin/body/materials/[id]` | Обновить материал | только admin |
| DELETE | `/api/admin/body/materials/[id]` | Удалить материал | только admin |
| POST | `/api/admin/body/upload` | Загрузить файл в Storage | только admin |

Все `admin body` роуты используют корректный `assertAdmin` с `.eq('email', user.email!)` — правило #11 соблюдено.

---

### Storage — материалы клуба

**Бакет:** `body-materials`

| Что | Путь в бакете | Параметр |
|---|---|---|
| Контент (PDF, аудио) | `files/{timestamp}-{safeName}.{ext}` | `folder = 'files'` |
| Вложения | `attachments/{timestamp}-{safeName}.{ext}` | `folder = 'attachments'` (default) |

Загрузка через `POST /api/admin/body/upload` (multipart). Лимит: 10 МБ (проверяется в клиенте).

---

## Admin UI

**URL:** `/admin/courses` → `AdminBodyWrapper`

Две вкладки:

### Вкладка «Вводные курсы» (`AdminCoursesClient`)

- Список курсов, каждый курс — раскрываемая секция с уроками
- **Создать курс:** форма с названием, slug (автогенерируется транслитерацией из названия), описанием → POST `/api/admin/intro-courses`
- **Удалить курс:** двойное подтверждение → DELETE `/api/admin/intro-courses/[id]`
- **Добавить урок:** выбор типа (видео/текст), название, Kinescope URL или текст, sort_order → POST `/api/admin/intro-courses/[id]/lessons`
- **Редактировать урок:** inline, поля title / video_url / bonus_video_url / text_content → PATCH `/api/admin/intro-lessons/[id]`
- **Удалить урок:** двойное подтверждение → DELETE `/api/admin/intro-lessons/[id]`
- **Переставить уроки:** кнопки ▲▼ — swap `sort_order` двух соседних уроков параллельными PATCH
- **Видимость урока:** чекбокс → PATCH с `{is_visible}`
- **PDF к уроку:** выбор файла → клиент загружает в `webinar-materials` бакет → POST `/api/admin/intro-lessons/[id]/materials`
- **Удалить PDF:** DELETE `/api/admin/intro-materials/[id]`

### Вкладка «Материалы» (`AdminBodyTab`)

Split-view: разделы (260px слева) / материалы (flex справа).

**Разделы:**
- Создать: emoji + название → POST `/api/admin/body/sections`
- Редактировать inline: emoji + название → PATCH
- Удалить: `confirm()` → DELETE
- Переставить: ↑↓ кнопки (swap `sort_order`)

**Материалы выбранного раздела:**
- Форма создания/редактирования — поля по формату:
  - `video` — список Kinescope URL (кнопка «+ Добавить видео»), поле `video_urls`
  - `article` — `SimpleEditor` (inline WYSIWYG), сохраняется в `content_url`
  - `pdf` / `audio` — URL-поле + кнопка загрузки файла → POST `/api/admin/body/upload`
- **Вложения** (`attachments`) — загрузка в `body-materials`, поддерживаемые типы: `.pdf`, `.doc`, `.docx`, `.xlsx`, `.png`, `.jpg`, `.jpeg`
- `is_published` — чекбокс (черновик vs опубликован)
- Переставить материалы: ↑↓ кнопки

---

## Доступ по тарифу

| Суб-модуль | trial | active |
|---|---|---|
| Вводные курсы | ✅ полный | ✅ полный |
| Материалы клуба (первые 3) | ✅ | ✅ |
| Материалы клуба (с 4-го) | 🔒 замок | ✅ |

---

## Известные баги

1. **intro_* роуты — id-lookup вместо email-lookup** — все `requireAdmin` в `intro-courses`, `intro-lessons`, `intro-materials` роутах используют `.eq('id', user.id)`, нарушение правила #11. body_* роуты исправны.

---

## Прочее

- `getCourseVisual(slug)` — в `src/lib/load-course.ts`: задаёт градиент и эмодзи для курса по slug. Для `intro` и `stop-diabet` — заданы явно; для новых курсов — дефолтный фиолетовый градиент.
- `buildCourseData()` — формирует `lessonsLabel` (счёт видео/текстов), `storageKey`, `backHref` для `CoursePageClient`.
- `/minicourse` — legacy-редирект на `/dashboard/courses`.

---

## Связи с другими модулями

- [[03-club/modules/subscriptions]] — логика trial vs active
- [[04-admin/modules/webinars-admin]] — PDF к урокам используют тот же бакет `webinar-materials`
- [[08-roadmap/tech-debt]] — баг с id-lookup в intro_* роутах

---

## История изменений

| Дата | Событие |
|---|---|
| май 2026 | Документ создан — разведка по коду |
