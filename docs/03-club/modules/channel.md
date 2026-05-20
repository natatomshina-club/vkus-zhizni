# Канал клуба — чаты, личные сообщения, объявления

Раздел `/dashboard/channel` — коммуникационное ядро клуба. Включает общие чаты, чат марафона, личную переписку с Наташей и закреплённые объявления. Все данные — в реальном времени через Supabase Realtime.

---

## Каналы

| Slug | Название | Тип | Особенности |
|---|---|---|---|
| `boltalka` | Болталка | Лента | Общий чат. Текстовые посты вечные (`expires_at = null`) |
| `plates` | Тарелки | Лента | Фото еды. Поле `meal_tag`: `breakfast` / `lunch` / `snack` |
| `direct` | Личные | Direct | Не `channel_posts` — отдельная таблица `private_messages`. Переписка только с Наташей |
| `marathon-{id}` | Чат марафона | Лента | Динамический slug. Только `subscription_status = 'active'`. Закрывается при статусе марафона `finished` |

> [!note] Канал `faq` из типов — устаревший артефакт. База знаний вынесена в отдельный раздел `/dashboard/help` (таблица `faq_items`). Посты из чата можно сохранять в FAQ через кнопку «В FAQ» — см. [API роуты](#api-роуты).

---

## База данных

### `channel_posts`

Единая таблица для постов и комментариев в лентах (boltalka, plates, marathon-каналы).

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK |
| `member_id` | uuid | FK → `members` (НЕ auth user id) |
| `channel` | text | Slug канала |
| `text` | text\|null | Текст, max 1000 символов |
| `media_url` | text\|null | Первое фото (legacy, дублирует media_urls[0]) |
| `media_urls` | text[]\|null | До 3 фото |
| `media_expires_at` | timestamptz\|null | Legacy-поле, для новых постов всегда null |
| `meal_tag` | text\|null | `'breakfast'`/`'lunch'`/`'snack'` — только в `plates` |
| `is_ai_reply` | boolean | Всегда false (зарезервировано) |
| `is_pinned` | boolean | Pinned-посты не удаляются cron-ом |
| `parent_id` | uuid\|null | FK → `channel_posts.id` — комментарий к посту |
| `likes_count` | integer | Денормализованный счётчик (обновляется при лайке) |
| `expires_at` | timestamptz\|null | Когда удалить пост (см. TTL ниже) |
| `created_at` | timestamptz | |

**Комментарии** хранятся в этой же таблице с `parent_id != null`. Вложенность только один уровень — комментарии к комментариям не поддерживаются. GET-запросы на ленту фильтруют только `parent_id IS NULL`.

**TTL-логика (`expires_at`):**

| Ситуация | expires_at |
|---|---|
| Пост с медиа (любой канал) | `created_at + 7 дней` |
| Текстовый пост в marathon-канале | `marathon.ends_at + 5 дней` |
| Текстовый пост boltalka / plates | `null` (вечный) |
| Pinned-пост (is_pinned = true) | никогда не удаляется cron-ом |

---

### `private_messages`

Личные сообщения между участницей и Наташей. Не используют `channel_posts`.

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK |
| `member_id` | uuid | FK → `members` |
| `text` | text\|null | Текст, max 2000 символов |
| `media_url` | text\|null | Первое фото |
| `media_urls` | text[]\|null | До 3 фото |
| `from_admin` | boolean | `true` — сообщение от Наташи, `false` — от участницы |
| `is_read` | boolean | Прочитано ли |
| `created_at` | timestamptz | |

Переписка не peer-to-peer — только участница ↔ Наташа. Сторонние участницы друг с другом не переписываются.

При чтении GET `/api/channel/direct`: все `from_admin = true` автоматически помечаются `is_read = true`.

Cron `cleanup-media` удаляет записи с медиа старше 7 дней.

---

### `channel_last_seen`

Timestamp последнего просмотра канала. UNIQUE: `(member_id, channel)`. Используется для счётчика непрочитанных.

> [!warning] Несогласованность: `POST /channel/seen` пишет `member_id: user.id` (auth id), а `GET /channel/unread` читает через email-lookup → `member.id`. Если auth id ≠ members.id — счётчик не сбрасывается.

---

### `channel_likes`

| Поле | Тип |
|---|---|
| `id` | uuid |
| `post_id` | uuid |
| `member_id` | uuid |
| `created_at` | timestamptz |

Лайк — toggle через POST `/api/channel/posts/[id]/like`. При лайке/анлайке сервис-клиент инкрементирует/декрементирует `channel_posts.likes_count`.

> [!warning] Лайки пишут `member_id: user.id` (auth id), тогда как посты пишут `member_id` через email-lookup → `members.id`. Смешение id-пространств.

---

### `announcements`

Закреплённые баннеры-объявления (видны всем участницам вверху канала).

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK |
| `text` | text | Текст, max 2000 символов |
| `is_active` | boolean | Видно ли участницам |
| `created_at` | timestamptz | |

Публичный GET `/api/announcements` — возвращает одно активное объявление. Admin управляет через `/api/admin/announcements`.

---

## API роуты

### Посты и комментарии

| Метод | Путь | Назначение | Авторизация |
|---|---|---|---|
| GET | `/api/channel/posts` | Лента (параметры: `channel`, `cursor`, `after`, `limit`) | любая участница |
| POST | `/api/channel/posts` | Создать пост | любая участница* |
| GET | `/api/channel/posts/[id]` | Один пост | любая участница |
| PATCH | `/api/channel/posts/[id]` | Редактировать текст | только автор, ≤24 часа |
| DELETE | `/api/channel/posts/[id]` | Удалить пост | автор, admin, curator |
| GET | `/api/channel/posts/[id]/comments` | Комментарии к посту | любая участница |
| POST | `/api/channel/posts/[id]/comments` | Оставить комментарий | любая участница |
| POST | `/api/channel/posts/[id]/like` | Лайк / анлайк (toggle) | любая участница |
| POST | `/api/channel/posts/[id]/save-to-faq` | Сохранить пост в базу знаний | только admin |

\* Канал марафона — только `subscription_status = 'active'`.

**Пагинация постов:**
- `cursor` (ISO timestamp) — посты старше курсора (load more)
- `after` (ISO timestamp) — посты новее after (polling новых)
- Без параметров — первая страница

**Удаление поста:** каскадно удаляет дочерние комментарии и их медиа из Storage.

**Редактирование:** только текст, не медиа. Ограничение 24 часа с момента создания.

> [!warning] Баг: PATCH сравнивает `post.member_id !== user.id` — смешивает `members.id` (в котором сохранён пост) с `auth user.id`. Если они не совпадают — автор не может редактировать свой пост.

---

### Медиа

| Метод | Путь | Назначение |
|---|---|---|
| POST | `/api/channel/upload-url` | Получить signed URL для прямой загрузки фото в Storage |

Клиент загружает фото напрямую в Supabase Storage (минует Next.js). Ограничения: jpeg / png / webp / heic / heif / gif, max 10 МБ, max 3 фото на пост. Домен медиа-URL проверяется сервером при публикации поста.

---

### Непрочитанные и «прочитано»

| Метод | Путь | Назначение |
|---|---|---|
| POST | `/api/channel/seen` | Отметить канал прочитанным (upsert last_seen_at) |
| GET | `/api/channel/unread` | Счётчик непрочитанных постов по каналам |
| GET | `/api/channel/notifications/unread` | Кол-во непрочитанных direct от Наташи |

---

### FAQ (база знаний)

| Метод | Путь | Назначение | Авторизация |
|---|---|---|---|
| GET | `/api/channel/faq` | Список FAQ (параметры: `q`, `category`, `cursor`, `limit`) | любая участница |
| POST | `/api/channel/faq` | Создать запись FAQ | только admin |
| PATCH | `/api/channel/faq/[id]` | Редактировать запись | только admin |
| DELETE | `/api/channel/faq/[id]` | Удалить запись | только admin |
| POST | `/api/channel/posts/[id]/save-to-faq` | Сохранить пост в FAQ | только admin |

FAQ хранится в таблице `faq_items` (не в `channel_posts`). Кнопка «В FAQ» на посте позволяет Наташе быстро создать запись с `source_post_id` — сам пост при этом **не удаляется**, живёт своё TTL. Подробнее: [[04-admin/modules/help-admin]].

---

### Личные сообщения (direct)

| Метод | Путь | Назначение | Авторизация |
|---|---|---|---|
| GET | `/api/channel/direct` | Переписка участницы с Наташей | участница (свои) |
| POST | `/api/channel/direct` | Отправить сообщение Наташе | участница |
| GET | `/api/admin/direct` | Все диалоги (список) | только admin |
| GET | `/api/admin/direct/[memberId]` | Диалог + профиль + последний вес участницы | только admin |
| POST | `/api/admin/direct/[memberId]` | Отправить сообщение от Наташи | только admin |

При отправке Наташей → notification участнице (`type: 'private_message'`, ссылка на `/dashboard/channel?ch=direct`).

---

### Объявления

| Метод | Путь | Назначение | Авторизация |
|---|---|---|---|
| GET | `/api/announcements` | Активное объявление | любая участница |
| GET | `/api/admin/announcements` | Список всех (до 20) | только admin |
| POST | `/api/admin/announcements` | Создать объявление | только admin |
| PATCH | `/api/admin/announcements` | Переключить `is_active` | только admin |
| DELETE | `/api/admin/announcements` | Удалить (`?id=`) | только admin |

При POST с `replace_previous: true` — все предыдущие активные объявления деактивируются.

---

## Storage

**Бакет:** `channel-media`

**Путь:** `{channel}/{user.id}/{timestamp}.{ext}`

Примеры: `boltalka/uuid/1716800000000.jpg`, `marathon-uuid/uuid/1716800000000.webp`

Допустимые типы: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`, `image/gif`. Максимум 10 МБ. До 3 фото на пост.

---

## Realtime

Таблицы в Supabase Realtime publication: `channel_posts`, `private_messages`.

При создании новой таблицы для Realtime — добавить в publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE имя_таблицы;
```
Иначе WebSocket подключится, но события не придут (правило #7 из CLAUDE.md).

---

## Cron-очистка

| Роут | Расписание | Что делает |
|---|---|---|
| `GET /api/cron/cleanup-posts` | — | Удаляет `channel_posts` с истёкшим `expires_at` (только `is_pinned = false`) |
| `GET/POST /api/cron/cleanup-media` | — | Удаляет записи с медиа (`media_url IS NOT NULL`) старше 7 дней из `channel_posts` и `private_messages` |

Авторизация: `Bearer {CRON_SECRET}`.

---

## Доступ по тарифу

| Канал | trial | active |
|---|---|---|
| boltalka | ✅ | ✅ |
| plates | ✅ | ✅ |
| direct | ✅ | ✅ |
| marathon-{id} | ❌ 403 | ✅ (пока марафон не завершён) |

После `marathon.status = 'finished'` — только admin/curator может постить. Участницы получают 403.

---

## Побочные эффекты

| Действие | Эффект |
|---|---|
| Комментарий к чужому посту | `notifications.insert({ type: 'reply', link: /dashboard/channel?ch=X&post=id })` для автора поста |
| Наташа пишет в direct | `notifications.insert({ type: 'private_message', link: /dashboard/channel?ch=direct })` для участницы |
| Активация дня марафона | Автопост от Наташи в `marathon-{id}` (см. [[04-admin/modules/marathons-admin]]) |
| Завершение марафона | Pinned-пост `🏁 Марафон завершён!` + `expires_at` на все обычные посты канала |

---

## Известные баги

1. **PATCH (редактирование) смешивает id-пространства** — `post.member_id` хранит `members.id`, но сравнивается с `auth user.id`. Пост создаётся с `members.id` через email-lookup, но редактировать его через UI нельзя, если эти id не совпадают.

2. **`channel_last_seen` — несогласованность** — `POST /channel/seen` пишет `member_id: user.id` (auth id), `GET /channel/unread` читает через `member.id` из email-lookup. Если auth id ≠ members.id — счётчик непрочитанных не сбрасывается.

3. **Лайки используют auth user.id** — `channel_likes.member_id = user.id`, посты — `channel_posts.member_id = members.id`. Смешение пространств.

4. **FAQ и admin-роуты announcements** используют `.eq('id', user.id)` для проверки роли вместо `.eq('email', user.email)` — нарушение правила #11.

---

## Связи с другими модулями

- [[04-admin/modules/marathons-admin]] — автопосты при активации дня и завершении марафона
- [[03-club/modules/webinars]] — одобрение заявок создаёт сообщение в `private_messages`
- [[04-admin/modules/help-admin]] — таблица `faq_items`, куда сохраняются посты из чата
- [[05-infrastructure/database]] — таблицы канала в индексе БД

---

## История изменений

| Дата | Событие |
|---|---|
| май 2026 | Документ создан — разведка по коду |
