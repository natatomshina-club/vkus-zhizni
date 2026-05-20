# Публикация контента — процесс

Описывает жизненный цикл контента от создания в админке до появления на публичном сайте. Фокус на процессе и операционных деталях.

**Не описывается здесь:** схема БД и шаблоны страниц → [[02-public-site/blog-infrastructure]]; паттерны SEO и карта URL → [[02-public-site/seo-structure]]; UI историй преображения → [[04-admin/modules/stories-admin]].

---

## Типы публикуемого контента

| Тип | Таблица | Ключевой флаг | Страница |
|---|---|---|---|
| Статья блога | `blog_posts` | `is_published` | `/blog/{cat}/{subcat}/{slug}` |
| Рецепт | `blog_posts` | `is_published` | `/recipes/{cat}/{slug}` |
| Хаб (категория) | `blog_hubs` | `is_ready + is_indexed` | `/blog/{cat}` |
| Хаб (подкатегория) | `blog_subcategory_hubs` | `is_ready + is_indexed` | `/blog/{cat}/{subcat}` |
| История успеха | `results_stories` | `published` | `/results/{slug}` |

---

## Жизненный цикл публикации статьи

### Создание черновика

Путь: `/admin/blog` → вкладка «Статьи» → «+ Новая статья»

Обязательные поля: `title`, `slug`. Остальные опциональны.

**Генерация slug**: автоматически из заголовка при вводе. Алгоритм `toSlug()` в `src/app/(club)/admin/blog/page.tsx:71`:
1. Кириллица → транслит по таблице (ё→yo, ж→zh, щ→shch, ъ→«», ь→«»)
2. Все символы кроме `[a-z0-9]` → дефис
3. Обрезка ведущих/замыкающих дефисов
4. Усечение до 80 символов

Slug редактируется вручную; на клиенте фильтруется `[^a-z0-9-]`. Уникальность проверяется только на уровне БД (constraint), не клиентом.

`is_published = false` при создании по умолчанию. `published_at = null`.

### Публикация (впервые)

Чекбокс «Опубликовать» → Сохранить. API POST с `is_published: true` → сервер ставит `published_at = now`.

После публикации страница становится доступна на сайте в течение ≤ 60 секунд (ISR revalidate=60).

### Редактирование опубликованной статьи

Форма редактирования отправляет PATCH с `keep_published_at: true` → `published_at` **не обновляется**, дата первой публикации сохраняется.

### Повторное снятие / публикация через тогл в списке

> [!important] Нетривиальное поведение — оперативно важно.
>
> Кнопка-тогл в списке статей («Снять» / «Опубликовать») отправляет PATCH **без** `keep_published_at`. Результат:
> - При снятии: `published_at → null`
> - При повторной публикации через тогл: `published_at → now` (новая метка времени)
>
> **Следствие**: если снять статью через тогл и опубликовать снова — в Schema.org `BlogPosting.datePublished` и `dateModified` оба будут равны дате **повторной** публикации. История первой публикации теряется. Для сохранения оригинальной даты — редактировать через форму, не через тогл.

### Черновики

Черновики — это `blog_posts` с `is_published=false`. Не хранятся отдельно. Вкладка «Черновики» в `/admin/blog` — клиентский фильтр `posts.filter(p => !p.is_published)`.

**AI-генератор** всегда сохраняет статьи как черновик (`is_published: false`). Это намеренно — чтобы автор проверил перед публикацией. Из-за отсутствия превью (R108) автор не может посмотреть, как статья выглядит на публичной странице, до того как она станет видима всем.

### Превью черновика

**Превью нет.** Страница `/blog/{cat}/{subcat}/{slug}` фильтрует `.eq('is_published', true)` → 404 для любого черновика. Кнопки «Открыть превью» в интерфейсе не существует. R108 — открытая задача.

### Расписание публикации

**Не реализовано.** Нет поля `scheduled_at` или аналога. Публикация только немедленная.

### Удаление

DELETE по id. Bucket `blog-images` при удалении **не очищается** (R109 — накопление сирот в Storage).

---

## Жизненный цикл публикации рецепта

Рецепты и статьи живут в **одной таблице** `blog_posts` и **одной форме** в `/admin/blog` → «Статьи». Отдельной вкладки «Рецепты» нет.

Разграничение — только через `category`:
- Рецепт: `category` из RECIPES_CONFIG (`salaty`, `supy`, `vtorye-blyuda` и т.д.)
- Статья: `category` из SILO_CONFIG (`pohudenie`, `zdorovye`, `gormony`, `diety`, `bady`)

Публичная страница `/recipes/{category}/{slug}` фильтрует `blog_posts` по `is_published=true` и `category ∈ RECIPES_CONFIG`. Нет проверки поля `type` (которое есть в таблице, но в шаблонах не используется).

Жизненный цикл рецепта (создание, slug, published_at, черновик, превью, расписание, удаление) — **идентичен статье** (см. выше).

---

## Жизненный цикл публикации хаба

### Операция — upsert, не create

Хабы создаются и обновляются одним POST `/api/admin/blog-hubs` (upsert по `category`). Нет отдельного «создать» и «редактировать».

### Цепочка флагов is_ready → is_indexed

| `is_ready` | `is_indexed` | Публичная страница | Индексация |
|---|---|---|---|
| нет записи | — | placeholder «✍️ Полный гид в разработке» | noindex |
| `false` | любое | placeholder | noindex |
| `true` | `false` | полный контент | noindex (предпросмотр перед индексацией) |
| `true` | `true` | полный контент | indexed, попадает в sitemap |

Страница хаба **не даёт 404** при отсутствии записи в DB — показывает placeholder. 404 возникает только если `category` не зарегистрирован в SILO_CONFIG.

**Кто переключает**: только admin вручную через вкладки «Хабы» / «Хабы подкатегорий» в `/admin/blog`. Никаких автоматических триггеров.

**ISR**: изменения флагов попадают на публичную страницу в течение ≤ 60 секунд (revalidate=60). В sitemap — ≤ 1 час (revalidate=3600).

---

## Жизненный цикл публикации истории успеха

Подробный UI истории — в [[04-admin/modules/stories-admin]]. Здесь — только процесс публикации.

### Черновик (`published=false`)

- Запись существует в БД.
- Страница `/results/{slug}` **доступна по прямому URL** с `robots: noindex, nofollow` — поисковики не видят, человек может открыть.
- Ссылка «↗» в форме редактирования открывает страницу даже для черновика.
- В список `/results` история **не попадает**.

### Публикация (`published=true`)

- История появляется в списке `/results` (сортировка по `order_index`).
- Страница `/results/{slug}` становится indexable (без `noindex`).
- `order_index`: влияет только на порядок в списке, не на факт публикации. Значение 0 — нормально.

### Ключевое отличие: нет ISR

Страницы `/results` и `/results/{slug}` используют `force-dynamic` (не ISR). Изменения видны **немедленно** при следующем HTTP-запросе без задержки revalidate. Снял/опубликовал — следующий посетитель уже видит новое состояние.

---

## SEO-поля: откуда берутся, куда идут

### Статья блога

| Поле DB | Кто заполняет | Куда попадает на странице |
|---|---|---|
| `meta_title` | Admin вручную или AI-генератор | `<title>`, `og:title`, `BlogPosting.headline` |
| `meta_description` | Admin или AI | `<meta description>`, `og:description`, `BlogPosting.description` |
| `title` | Admin (обязательное) | Fallback если `meta_title` null |
| `excerpt` | Admin (опционально) | Fallback если `meta_description` null |
| `cover_image_url` | URL-вставка вручную или fal.ai | `og:image`, `BlogPosting.image` |
| `published_at` | Авто при публикации | `og:publishedTime`, `BlogPosting.datePublished`, `dateModified` |
| `slug + category + subcategory` | slug авто, категории вручную | canonical URL, `og:url`, `mainEntityOfPage` |

Canonical format: `https://nata-tomshina.ru/blog/{category}/{subcategory}/{slug}/` (с замыкающим слешем).

### Хаб категории (`/blog/{cat}`)

| Поле DB | Fallback | Куда попадает |
|---|---|---|
| `meta_title` | `SILO_CONFIG.pillarTitle` | `<title>`, `og:title` |
| `meta_description` | `SILO_CONFIG.description` | `<meta description>`, `og:description` |
| `is_ready + is_indexed` | — | `robots: noindex` если не оба true |

Schema.org: `CollectionPage` + `BreadcrumbList` (всегда, независимо от `is_ready`).

### Хаб подкатегории (`/blog/{cat}/{subcat}`)

| Поле DB | Fallback 1 | Fallback 2 |
|---|---|---|
| `meta_title` | `subcategoriesData[].h1 + " | Вкус Жизни"` | «{subLabel} — {cat.label} | Блог Натальи Томшиной» |
| `meta_description` | `subcategoriesData[].description` | шаблонная строка «Статьи о {subLabel}...» |

`is_indexed` логика — идентична хабу категории.

### История успеха (`/results/{slug}`)

| Поле DB | Кто заполняет | Куда попадает |
|---|---|---|
| `seo_title` | Admin форма | `<title>`, `og:title`; fallback «История — Вкус Жизни» |
| `seo_description` | Admin форма | `<meta description>`, `og:description` |
| `slug` | Авто из `name` через `toSlug()` | canonical URL, `og:url` |
| `published` | Admin чекбокс | `robots: noindex, nofollow` если false |

Поле `published_at` в `results_stories` **отсутствует** (в отличие от `blog_posts`).

---

## Связь с sitemap

Условие попадания в `sitemap.xml`:

| Тип | Условие |
|---|---|
| Статья блога | `is_published=true` |
| Хаб категории | `is_ready=true AND is_indexed=true` |
| Хаб подкатегории | `is_ready=true AND is_indexed=true` |
| История успеха | `published=true` |
| Рецепт | `is_published=true` + `category ∈ RECIPES_CONFIG` |

Sitemap revalidate: 3600 секунд (1 час). После публикации запись попадёт в sitemap в течение ≤ 1 часа.

> [!warning] R103 — баг в sitemap: blog_posts секция включает рецепты с неверными URL.
> Статьи блога запрашиваются без фильтра по типу → рецепты попадают в секцию `/blog/{slug}` → 404-URL. Фикс ещё не сделан. Подробнее: [[08-roadmap/todo]].

---

## ISR и таймлайны видимости

| Действие | Видимость на сайте | В sitemap |
|---|---|---|
| Опубликовал статью (`is_published=true`) | ≤ 60 с (ISR revalidate=60) | ≤ 1 ч |
| Отредактировал опубликованную статью | ≤ 60 с | без изменений |
| Снял статью (`is_published=false`) | ≤ 60 с → 404 | ≤ 1 ч → уйдёт из sitemap |
| Хаб: включил `is_indexed=true` | ≤ 60 с (контент уже виден) | ≤ 1 ч |
| Хаб: переключил `is_ready=true` | ≤ 60 с (контент вместо placeholder) | нет — `is_indexed` ещё false |
| Опубликовал историю | **немедленно** (force-dynamic) | ≤ 1 ч |
| Отредактировал историю | **немедленно** | без изменений |
| Снял историю (`published=false`) | **немедленно** → noindex | ≤ 1 ч → уйдёт из sitemap |

---

## Медиа и cover-изображения

### Статьи блога — два пути

**Ручной ввод**: поле «URL обложки» — текстовый ввод URL. Загрузки файла нет; предполагается внешняя ссылка или URL из уже загруженного в Storage.

**AI-генератор**: fal.ai генерирует изображение → сервер скачивает → загружает в Supabase Storage:
- Bucket: `blog-images`
- Путь: `blog/{slug}/{position}-{timestamp}.jpg` (timestamp добавлен для cache-busting)
- Позиции: `cover`, `after_intro`, `mid_article`, `conclusion`

При удалении статьи bucket `blog-images` **не очищается** (R109).

### Истории успеха — загрузка через API

- Поля: `photo_before_url`, `photo_after_url`
- Загрузка: `POST /api/admin/results-stories/{id}/upload-photo` (отдельный запрос после сохранения текстовых данных)
- Bucket: `results-photos`, путь `{story_id}/{type}.{ext}`, режим `upsert: true`
- При удалении истории фото в Storage **не удаляются** (задокументировано в [[04-admin/modules/stories-admin]])

---

## Виджеты в статьях блога

Поле `widget_type` в `blog_posts` — тип интерактивного виджета, вставляемого в конец статьи.

| Значение `widget_type` | Виджет |
|---|---|
| `""` (пусто) | Авто: `selectWidget()` выбирает по `main_keyword` и `cluster_name` через regex |
| `"none"` | Без виджета |
| `"ir_test"` | Тест: Инсулинорезистентность |
| `"why_test"` | Тест: Почему не худею |
| `"thyroid_test"` | Тест: Щитовидная железа |
| `"eating_test"` | Тест: Пищевые привычки |
| `"calc_3months"` | Калькулятор: план на 3 месяца |

`selectWidget()` в `src/lib/widget-selector.ts` — regex по ключевым словам. Дефолт при нераспознанном кластере: `ir_test`.

---

## Права на публикацию

Все роуты публикации контента требуют `role = 'admin'` (email lookup через `requireAdmin()`).

`curator` имеет доступ к клубу (проверяется в `src/proxy.ts`), но **не имеет прав** на публикацию: `requireAdmin()` проверяет `role = 'admin'`, и curator с другой ролью получит 403. Это объясняет почему R96 (Rule #11 в кураторской проверке) — про доступ в клуб, а не про публикацию.

Источник требований auth: `src/lib/auth/requireAdmin.ts` (email lookup ✓). Локальные копии в blog-hubs и blog-subcategory-hubs роутах тоже используют email lookup, но это дублирование (R104).

---

## Известные ограничения и tech debt

| Номер | Приоритет | Суть |
|---|---|---|
| R103 | средний-высокий | Sitemap bug: рецепты в блог-секции sitemap → 404 URL → [[08-roadmap/todo]] |
| R104 | низкий | Дублированный `requireAdmin()` в blog-hubs/blog-subcategory-hubs → [[08-roadmap/todo]] |
| R107 | средний | Rule #11 в `generate-image/route.ts` → AI-генерация заблокирована если id не совпадают → [[08-roadmap/todo]] |
| R108 | низкий | Нет превью черновиков → автор не видит вёрстку до публикации → [[08-roadmap/todo]] |
| R109 | низкий | Удаление статьи/истории не чистит Storage (blog-images, results-photos) → [[08-roadmap/todo]] |

---

## Связано

- [[02-public-site/blog-infrastructure]] — схема БД, шаблоны страниц, маркеры, CSS, ISR-детали
- [[02-public-site/seo-structure]] — карта URL, canonical, метатеги, robots, sitemap
- [[04-admin/modules/stories-admin]] — UI историй преображения, загрузка фото, API-роуты
- [[08-roadmap/todo]] — R103-R109

---

## История изменений

| Дата | Событие |
|---|---|
| 2026-05-23 | Документ создан — разведка по коду |
