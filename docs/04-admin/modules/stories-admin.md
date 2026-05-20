# Истории преображения — управление

Раздел `/admin/results-stories` — создание и публикация историй успеха участниц для публичного сайта.

Ключевые файлы:
- `src/app/(club)/admin/results-stories/page.tsx` — список историй
- `src/app/(club)/admin/results-stories/StoryForm.tsx` — форма создания/редактирования
- `src/app/(club)/admin/results-stories/new/page.tsx` — создание
- `src/app/(club)/admin/results-stories/[id]/page.tsx` — редактирование

---

## Важно: участница не подаёт историю сама

Истории создаются **исключительно администратором** через `/admin/results-stories`. Никакой формы в `/dashboard/` нет — нет ни страницы, ни API-роута для участниц. Если участница хочет поделиться результатом, она делает это вне системы (в чате, по запросу Наташи), а история заводится вручную.

---

## Список историй (`/admin/results-stories`)

Таблица с колонками: Имя + slug, Тег, Статус (Черновик / Опубликовано), Порядок, Действия.

Действия на каждой строке:
- **Редактировать** → `/admin/results-stories/{id}`
- **↗** (только если есть slug) → открывает `https://nata-tomshina.ru/results/{slug}` в новой вкладке
- **Удалить** → подтверждение модалом → `DELETE /api/admin/results-stories/{id}`

> [!warning] При удалении записи из БД **фото в Storage остаются** (bucket `results-photos`). Очистка Storage вручную не предусмотрена.

---

## Форма истории — поля

Одна форма `StoryForm.tsx` для создания и редактирования. Пять секций:

### Основное

| Поле | Обязательно | Описание |
|---|---|---|
| `name` | да | Имя участницы (пример: «Елена») |
| `slug` | да | URL-идентификатор; при создании генерируется автоматически из имени через транслит; только `[a-z0-9-]` |
| `age` | нет | Возраст числом |
| `age_label` | нет | Подпись возраста (пример: «58 лет») |

### Карточка на /results

| Поле | Описание |
|---|---|
| `tag_label` | Тег на карточке (пример: «Диагнозы») |
| `tag_filter[]` | Фильтр-теги через запятую: `weight`, `energy`, `thyroid`, `health`, `pills`, `age50`, `big_weight_loss` |
| `before_kg` / `after_kg` | Вес ДО и ПОСЛЕ |
| `metric_main` | Главная цифра на карточке (пример: «−31») |
| `metric_label` | Подпись к цифре (пример: «кг за 3 года») |
| `summary_quote` | Цитата для карточки |
| `check_items[]` | Чек-лист результатов (динамический список пунктов) |

### Фото

Две кнопки выбора файла: «Фото ДО» и «Фото ПОСЛЕ». Файлы загружаются после сохранения текстовых данных отдельным запросом. Превью показывается сразу после выбора (object URL).

Bucket: `results-photos`, путь: `{story_id}/{type}.{ext}`, `upsert: true`.

### Текст истории

| Поле | Описание |
|---|---|
| `content_html` | HTML текста истории (textarea) |
| `content_source` | Исходный конспект / черновик (не показывается на сайте) |

Ожидаемая HTML-структура `content_html`:
```
<div class="story-hook"> <blockquote>Зацепка</blockquote> </div>
<div class="story-sub">Подзаголовок</div>
<div class="story-body"> <h3>Раздел</h3> <p>…</p> </div>
<div class="story-outro"> <blockquote>Итоговая цитата</blockquote> <cite>— Имя</cite> </div>
```

### SEO

`seo_title`, `seo_description` — используются в `<title>` и `<meta description>` страницы `/results/{slug}`.

### Публикация

| Поле | Описание |
|---|---|
| `order_index` | Порядок в списке (меньше = выше на `/results`) |
| `published` | Чекбокс. `false` — черновик, виден только в админке. `true` — история появляется на `/results` и `/results/{slug}` |

При публикации без `content_html` или без фото — форма показывает `window.confirm` (не блокирует).

---

## Как создать историю (шпаргалка)

1. **Заполнить текстовые поля**: имя, slug (авто), тег, вес ДО/ПОСЛЕ, цифры карточки, цитата, чек-лист, SEO.
2. **Вставить HTML истории** в поле `content_html` (написать в Claude, скопировать готовый HTML).
3. **Выбрать фото** ДО и ПОСЛЕ через кнопки в секции «Фото».
4. **Сохранить** — сначала создаётся запись в БД, затем автоматически загружаются фото.
5. **Проверить** по ссылке ↗ в форме (открывается страница на сайте даже для черновика, если знать URL).
6. **Опубликовать**: чекбокс «Опубликовать» → Сохранить. История появится на `nata-tomshina.ru/results`.

---

## API-роуты

| Метод | Путь | Назначение | Auth |
|---|---|---|---|
| GET | `/api/admin/results-stories` | Список (id, slug, name, tag_label, published, order_index, created_at) | email lookup ✓ |
| POST | `/api/admin/results-stories` | Создать историю | email lookup ✓ |
| GET | `/api/admin/results-stories/[id]` | Полная запись (`select('*')`) | email lookup ✓ |
| PUT | `/api/admin/results-stories/[id]` | Обновить историю | email lookup ✓ |
| DELETE | `/api/admin/results-stories/[id]` | Удалить запись (Storage не чистит) | email lookup ✓ |
| POST | `/api/admin/results-stories/[id]/upload-photo` | Загрузить фото ДО или ПОСЛЕ | email lookup ✓ |

Auth-паттерн корректен во всех роутах: `requireAdmin()` использует `.eq('email', user.email!)`.

---

## Публичная витрина (связь, не детали)

- `nata-tomshina.ru/results` — карточки историй (`published=true`, сортировка по `order_index`)
- `nata-tomshina.ru/results/[slug]` — полная страница истории с `content_html`

Обе страницы читают **только `results_stories`**. `result_cases` публичным сайтом не используется.

---

## `result_cases` — параллельный мёртвый модуль

В проекте существует **вторая таблица** `result_cases` с отдельными API-роутами (`/api/admin/result-cases/*`). Это более старая структура с другим набором полей и другим bucket'ом Storage (`result-photos` без финального `-s`).

Текущее состояние:
- Нет admin UI страницы
- Публичный сайт таблицу не читает (описание в database.md было неверным)
- Нет ни одного вызывающего компонента
- Auth в роутах нарушает Rule #11 (`.eq('id', user.id)`)

Статус: мёртвый. R95 — решить судьбу. [[08-roadmap/todo]]

---

## Известные баги / tech debt

- **R94** — Rule #11 в `/api/admin/result-cases/*`. `requireAdmin()` использует `.eq('id', user.id)` вместо email lookup. Затрагивает `route.ts` (GET/POST) и `[id]/route.ts` (PUT/DELETE). [[08-roadmap/todo]]
- **R95** — `result_cases` мёртвый модуль. API-роуты существуют, auth нарушает Rule #11, admin UI отсутствует, публичный сайт таблицу не читает. Решить: удалить роуты и таблицу или задокументировать как legacy. [[08-roadmap/todo]]

---

## История изменений

| Дата | Событие |
|---|---|
| май 2026 | Документ создан — разведка по коду |
