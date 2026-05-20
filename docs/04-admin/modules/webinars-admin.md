# Вебинары — админский модуль

> Этот документ описывает интерфейс и API для Наташи. Таблицы БД, логика квот, флоу участницы и SQL-шпаргалка — в [[03-club/modules/webinars]].

---

## Назначение

Наташа управляет вебинарами из раздела `/admin/webinars`. Здесь создаются вебинары и курсы, наполняются уроки и материалы, загружаются HTML-презентации и выдаётся доступ участницам — как по заявкам, так и вручную.

---

## UI — одна страница

| URL | Файлы |
|---|---|
| `/admin/webinars` | `admin/webinars/page.tsx` (SSR) + `admin/webinars/WebinarsAdminClient.tsx` |

Вся работа происходит на одной странице. Нет отдельных страниц для редактирования или уроков — всё inline внутри `WebinarsAdminClient.tsx`.

**Секции страницы:**
- **Список вебинаров** — карточки с бейджем pending-заявок, кнопками редактирования и управления уроками
- **Заявки** — вкладка или блок с `pending`-заявками по всем вебинарам сразу
- **Inline-редактор** — раскрывается прямо в карточке вебинара

---

## Действия и как их выполнить

### Создать вебинар

Кнопка «+ Создать вебинар» → форма раскрывается inline.

Обязательное поле: **Название** (`title`). При создании автоматически генерируется `slug` из названия (если не задан явно).

Поля при создании: название, короткое описание, полное описание, slug, тип (`webinar`/`course`), `sort_order`, чекбокс «Опубликован» (`is_published`), цена, Video ID (Kinescope), эмодзи, градиент (`color_from`/`color_to`).

Defaults: `emoji = '📹'`, `color_from = '#7C5CFC'`, `color_to = '#5B3FA8'`, `is_published = false`, `price = 0`, `sort_order = 0`, `content_type = 'webinar'`.

### Редактировать вебинар

Кнопка «✏️» на карточке → inline-форма с теми же полями. Сохранение: PATCH `/api/admin/webinars/[id]`.

Обновляемые поля: `title`, `slug`, `short_desc`, `full_desc`, `price`, `emoji`, `color_from`, `color_to`, `is_published`, `sort_order`, `content_type`. Поля `video_id` и `html_url` не обновляются через основной редактор — только через специальные роуты.

> [!note] **Нет удаления вебинара** — кнопки «Удалить вебинар» нет ни в UI, ни в API. `DELETE /api/admin/webinars/[id]` не существует. Если нужно удалить — только через SQL в Supabase Studio.

### Переключить видимость

Кнопка 👁/🙈 → PATCH `/api/admin/webinars/[id]` с `{ is_published: true/false }`. Меняет видимость для участниц без перезагрузки страницы.

### Уроки курса (`content_type = 'course'`)

Кнопка «📚 Уроки» на карточке → раскрывается список уроков.

**Создать урок:** форма с полями «Название» и «Ссылка на Kinescope». Kinescope ID автоматически парсится из URL через `extractKinescopeId()` (`src/lib/kinescope.ts`). POST `/api/admin/webinars/[id]/lessons`.

**Редактировать урок:** кнопка «✏️ Ред.» → inline-редактирование названия и Kinescope URL. PATCH `/api/admin/lessons/[id]`.

**Удалить урок:** кнопка 🗑 → подтверждение → DELETE `/api/admin/lessons/[id]`. Перед удалением урока API явно удаляет все его материалы (`webinar_materials WHERE lesson_id = id`), затем удаляет сам урок.

### Материалы

Материалы могут быть привязаны к вебинару (общие) или к конкретному уроку.

**Добавить материал к вебинару:** POST `/api/admin/webinars/[id]/materials`.

**Добавить материал к уроку:** POST `/api/admin/lessons/[id]/materials`.

**Удалить материал:** кнопка ✕ → DELETE `/api/admin/materials/[id]`. API извлекает путь из публичного URL и удаляет файл из Storage, затем удаляет запись из БД.

**Два способа загрузки PDF:**

| Способ | Компонент | Когда используется |
|---|---|---|
| Direct (клиент → Storage) | `DirectPdfUpload` | Большие файлы. Клиент загружает в Supabase напрямую (нет ограничения Vercel), затем JSON-запрос в API для сохранения URL |
| Server (через API) | `PdfUploadForm` | Малые файлы. Multipart через Next.js API роут |

Лимит в обоих случаях: 10 МБ (проверяется на клиенте).

### HTML-презентация

Редактор вебинара → поле «HTML-презентация».

**Загрузить:** `<input accept=".html">` → POST `/api/admin/webinars/[id]/upload-html` (multipart). Только `.html` файлы. Сохраняется с перезаписью (`upsert: true`). Поле `html_url` обновляется в таблице `webinars`.

**Удалить:** кнопка → DELETE `/api/admin/webinars/[id]/upload-html`. Удаляет файл из Storage, `html_url = null`.

### Заявки на доступ

Блок «Ожидают подтверждения» на странице.

GET `/api/admin/webinar-selections` — все `pending`-заявки по всем вебинарам с именами и email участниц.

**Одобрить одну:** кнопка «Одобрить» → PATCH `/api/admin/webinar-selections/[id]/grant`.

**Одобрить все:** кнопка «Одобрить все» → массовое одобрение (несколько PATCH параллельно или последовательно).

**Что происходит при одобрении:**
1. `webinar_selections.status = 'granted'`
2. Запись в `webinar_access` (`granted_by = 'admin'`) — если не было ранее
3. Сообщение в `private_messages`: `✅ Доступ к вебинару «{title}» открыт! Заходи в раздел Вебинары и смотри 💚`

Race condition исключён: UNIQUE constraint + `maybeSingle()` перед вставкой.

### Выдать доступ вручную (без заявки)

Кнопка «Дать доступ» на карточке вебинара → поиск участницы по имени/email (API `/api/admin/members?search=`) → выбор → кнопка «Выдать».

POST `/api/admin/webinars/[id]/grant-manual` с `{ member_id }`.

**Что происходит:**
1. Запись в `webinar_access` (`granted_by = 'purchase'` — см. [Расхождения](#расхождения-с-webinarsmd))
2. Сообщение в `private_messages` — то же что при одобрении заявки
3. Если доступ уже существует → 409 Conflict

---

## API роуты

| Метод | Путь | Назначение | Авторизация |
|---|---|---|---|
| GET | `/api/admin/webinars` | Список + счётчики уроков и pending-заявок | только admin |
| POST | `/api/admin/webinars` | Создать вебинар | только admin |
| PATCH | `/api/admin/webinars/[id]` | Обновить поля вебинара | только admin |
| GET | `/api/admin/webinars/[id]/lessons` | Уроки + материалы вебинара (одним запросом) | только admin |
| POST | `/api/admin/webinars/[id]/lessons` | Создать урок | только admin |
| PATCH | `/api/admin/lessons/[id]` | Обновить урок | только admin |
| DELETE | `/api/admin/lessons/[id]` | Удалить урок + его материалы | только admin |
| POST | `/api/admin/webinars/[id]/materials` | Добавить материал к вебинару | только admin |
| POST | `/api/admin/lessons/[id]/materials` | Добавить материал к уроку | только admin |
| DELETE | `/api/admin/materials/[id]` | Удалить материал + файл из Storage | только admin |
| POST | `/api/admin/webinars/[id]/upload-html` | Загрузить HTML-презентацию | только admin |
| DELETE | `/api/admin/webinars/[id]/upload-html` | Удалить HTML-презентацию | только admin |
| POST | `/api/admin/webinars/[id]/grant-manual` | Выдать доступ вручную | только admin |
| GET | `/api/admin/webinar-selections` | Все pending-заявки с деталями | только admin |
| PATCH | `/api/admin/webinar-selections/[id]/grant` | Одобрить заявку | только admin |

> [!note] Вся секция вебинаров — только `admin`. Куратор не имеет доступа (в отличие от марафонов, где куратор мог открывать дни).

---

## Storage

**Бакет:** `webinar-materials`

| Тип файла | Путь в бакете | Поле в `webinars` |
|---|---|---|
| HTML-презентация | `{webinar_id}/presentation.html` | `html_url` |
| PDF к вебинару | `{webinar_id}/general/{timestamp}-{filename}` | — (в `webinar_materials.url`) |
| PDF к уроку | `{webinar_id}/{lesson_id}/{timestamp}-{filename}` | — (в `webinar_materials.url`) |

Все URL публичные (через `getPublicUrl`). HTML-презентация загружается с `upsert: true` (перезаписывает). PDF-материалы — `upsert: false` (timestamp в имени исключает коллизии).

---

## Защита роутов

Все вебинарные роуты: только `role = 'admin'`.

Корректный email-lookup (`.eq('email', user.email!)`):
- `upload-html/route.ts`
- `webinar-selections/route.ts`
- `webinar-selections/[id]/grant/route.ts`

Некорректный id-lookup (`.eq('id', user.id)`) — нарушение правила #11 из CLAUDE.md:
- `webinars/route.ts`
- `webinars/[id]/route.ts`
- `webinars/[id]/lessons/route.ts`
- `webinars/[id]/materials/route.ts`
- `webinars/[id]/grant-manual/route.ts`
- `materials/[id]/route.ts`
- `lessons/[id]/route.ts`
- `lessons/[id]/materials/route.ts`

Задача на исправление: [[08-roadmap/tech-debt]].

---

## Расхождения с `webinars.md`

### 1. Нет удаления вебинара
`webinars.md` упоминает «🗑️ — удалить (двойное подтверждение)» в описании карточки. В коде — нет ни DELETE-роута для вебинара, ни обработчика в UI. Функция удаления уроков есть, вебинаров — нет. Документация в этой части устарела.

### 2. `grant-manual` использует `granted_by = 'purchase'`
По описанию таблицы в `webinars.md`, ручной грант должен давать `granted_by = 'admin'`. Роут `webinar-selections/[id]/grant/route.ts` делает именно так. Но `webinars/[id]/grant-manual/route.ts` вставляет `granted_by: 'purchase'`. Это расхождение в коде — при запросе «кто дал доступ» записи `grant-manual` будут выглядеть как покупки.

### 3. Путь HTML-презентации
`webinars.md` указывает `presentations/{webinar_id}.html`. Фактически в коде (`upload-html/route.ts`): `{webinar_id}/presentation.html`. Документация в этой части устарела.

---

## SQL-шпаргалка

### Удалить вебинар (нет UI — только SQL)
```sql
-- Сначала зависимые записи, потом сам вебинар
DELETE FROM webinar_materials WHERE webinar_id = '<id>';
DELETE FROM webinar_lessons WHERE webinar_id = '<id>';
DELETE FROM webinar_access WHERE webinar_id = '<id>';
DELETE FROM webinar_selections WHERE webinar_id = '<id>';
DELETE FROM webinars WHERE id = '<id>';
```

### Исправить granted_by для grant-manual записей
```sql
-- Найти записи где admin выдал вручную, но стоит 'purchase'
SELECT wa.id, m.email, w.title, wa.granted_by, wa.granted_at
FROM webinar_access wa
JOIN members m ON m.id = wa.member_id
JOIN webinars w ON w.id = wa.webinar_id
WHERE wa.granted_by = 'purchase'
ORDER BY wa.granted_at DESC;
```

### Посмотреть все доступы к вебинару
```sql
SELECT m.email, m.full_name, wa.granted_by, wa.granted_at
FROM webinar_access wa
JOIN members m ON m.id = wa.member_id
WHERE wa.webinar_id = (SELECT id FROM webinars WHERE slug = 'слаг-вебинара')
ORDER BY wa.granted_at DESC;
```

### Статистика заявок по вебинарам
```sql
SELECT w.title, w.emoji,
  COUNT(*) FILTER (WHERE ws.status = 'pending') AS pending,
  COUNT(*) FILTER (WHERE ws.status = 'granted') AS granted
FROM webinars w
LEFT JOIN webinar_selections ws ON ws.webinar_id = w.id
GROUP BY w.id, w.title, w.emoji
ORDER BY pending DESC;
```

### Посмотреть материалы вебинара
```sql
SELECT wm.title, wm.type, wm.url, wl.title AS lesson_title
FROM webinar_materials wm
LEFT JOIN webinar_lessons wl ON wl.id = wm.lesson_id
WHERE wm.webinar_id = (SELECT id FROM webinars WHERE slug = 'слаг-вебинара')
ORDER BY wl.sort_order NULLS LAST, wm.sort_order;
```

---

## Связи с другими модулями

- [[03-club/modules/webinars]] — флоу участницы, схема БД, квоты, типы
- [[03-club/modules/private-messages]] — одобрение заявки и ручной грант создают сообщение в личку
- [[04-admin/modules/members]] — поиск участницы при ручном гранте через `/api/admin/members?search=`

---

## История изменений

| Дата | Событие |
|---|---|
| май 2026 | Документ создан — разведка по коду; зафиксированы 3 расхождения с webinars.md |
