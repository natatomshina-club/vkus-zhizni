# Медитации

Раздел аудиомедитаций клуба: 4 курса, 32 медитации. Участницы слушают прямо в браузере через встроенный HTML5-плеер без сторонних библиотек.

## Где в коде

| Слой | Путь | Назначение |
|---|---|---|
| Страница участницы | `src/app/(club)/dashboard/meditations/page.tsx` | SSR: загружает курсы + медитации + прогресс |
| Клиент участницы | `src/app/(club)/dashboard/meditations/MeditationsClient.tsx` | Плеер, фильтр по курсам, карточки |
| API участницы — список | `src/app/api/meditations/route.ts` | GET: все видимые курсы с медитациями |
| API участницы — прогресс | `src/app/api/meditations/[id]/progress/route.ts` | GET/POST: позиция воспроизведения |
| API участницы — счётчик | `src/app/api/meditations/[id]/play/route.ts` | POST: инкремент `play_count` |
| Страница админа — курсы | `src/app/(club)/admin/meditations/page.tsx` | Список курсов + CRUD |
| Страница админа — медитации | `src/app/(club)/admin/meditations/[courseId]/page.tsx` | Список медитаций курса + загрузка аудио |
| API админа — курсы | `src/app/api/admin/meditations/courses/route.ts` | GET/POST курсов |
| API админа — курс | `src/app/api/admin/meditations/courses/[id]/route.ts` | PATCH/DELETE курса |
| API админа — медитации курса | `src/app/api/admin/meditations/courses/[id]/meditations/route.ts` | GET/POST медитаций курса |
| API админа — медитация | `src/app/api/admin/meditations/[id]/route.ts` | PATCH/DELETE медитации |
| API админа — presigned URL | `src/app/api/admin/meditations/[id]/upload-url/route.ts` | POST: получить подписанный URL для загрузки |

## База данных

### `meditation_courses`

| Поле | Тип | Описание |
|---|---|---|
| `id` | UUID | PK |
| `slug` | TEXT | Уникальный идентификатор курса |
| `title` | TEXT | Название курса |
| `description` | TEXT | Описание |
| `emoji` | TEXT | Эмодзи курса |
| `gradient_from` | TEXT | Начальный цвет градиента (#hex) |
| `gradient_to` | TEXT | Конечный цвет градиента (#hex) |
| `sort_order` | INTEGER | Порядок сортировки |
| `is_visible` | BOOLEAN | Показывать участницам |

### `meditations`

| Поле | Тип | Описание |
|---|---|---|
| `id` | UUID | PK |
| `course_id` | UUID | FK → `meditation_courses` |
| `title` | TEXT | Название медитации |
| `description` | TEXT | Описание |
| `duration_seconds` | INTEGER | Длительность в секундах |
| `audio_url` | TEXT | Публичный URL MP3/M4A в Storage; NULL → карточка «Скоро» |
| `emoji` | TEXT | Эмодзи |
| `sort_order` | INTEGER | Порядок внутри курса |
| `is_visible` | BOOLEAN | Показывать участницам |
| `play_count` | INTEGER | Счётчик прослушиваний |

### `meditation_progress`

| Поле | Тип | Описание |
|---|---|---|
| `id` | UUID | PK |
| `member_id` | UUID | FK → `members` |
| `meditation_id` | UUID | FK → `meditations` |
| `completed` | BOOLEAN | Дослушала до конца |
| `last_position_seconds` | INTEGER | Позиция для восстановления |
| `listened_at` | TIMESTAMPTZ | Последнее прослушивание |

UNIQUE: `(member_id, meditation_id)`

## Что видит участница

### Страница `/dashboard/meditations`

**Hero-блок:** тёмный градиент `#1A1340 → #3D2B8A`, иконка 🧘, заголовок «Медитации».

**Фильтр по курсам:** горизонтальный скролл таблеток — «Все» + название каждого курса.

**Список:** курсы как секции-разделители; внутри — карточки медитаций с градиентными превью (цвета `gradient_from`/`gradient_to` курса).

**Плеер** разворачивается inline внутри карточки при нажатии:
- Тёмный фон `#1A1340`
- Кнопки: ⏮ −15 сек, ▶/⏸, ⏭ +15 сек
- Кликабельный прогресс-бар для перемотки
- Время: текущее / общее
- Анимированная точка «● Играет» во время воспроизведения
- Только одна медитация играет одновременно

**Форматирование длительности:** до 60 минут → «8 мин»; 60+ минут → «1 ч 15 мин».

### Логика плеера

- `audio_url = NULL` → карточка показывается с пометкой «Скоро», кнопка задизейблена
- При открытии карточки позиция восстанавливается с сервера (`GET /api/meditations/[id]/progress`)
- Позиция сохраняется каждые 5 секунд во время воспроизведения и при паузе
- При дослушивании до конца → `completed = true`

## Что делает админ

### `/admin/meditations` — управление курсами

Список курсов: карточка с цветной полоской-градиентом сверху, квадратный preview 40×40 с градиентом, emoji + название + описание + кол-во медитаций + slug.

**CRUD курса — inline форма** (не модалка):
- Поля: Название, Описание, Slug, Эмодзи
- Цветовой выбор градиента: `<input type="color">` + текстовое поле + live-preview полоса
- Порядок (`sort_order`), чекбокс «Видимый»

**Переключатель видимости** прямо в карточке: «👁 Видимый» / «🙈 Скрытый».

**Удаление** — двойное подтверждение (кнопка «Удалить» → появляются «Удалить» + «Отмена»). Каскадно удаляет медитации курса.

**Кнопка «Медитации →»** ведёт в `/admin/meditations/[courseId]`.

### `/admin/meditations/[courseId]` — медитации курса

**Список медитаций:** emoji, название, описание, аудио-статус (✅ зелёный бейдж с длительностью / ⬜ серый «Нет файла»), `play_count`, `sort_order`.

**CRUD медитации — inline форма:** Название, Описание (textarea), Эмодзи, Порядок, чекбокс «Видимая». Поля `duration_seconds` и `audio_url` не редактируются вручную — заполняются при загрузке аудио.

**Загрузка аудио** — 3 шага, всё в `handleUpload()`:
1. `POST /api/admin/meditations/[id]/upload-url` → получить presigned URL и `publicUrl`
2. XHR `PUT signedUrl` — файл идёт **напрямую в Supabase Storage**, минуя Next.js (прогресс-бар 0–100%)
3. `PATCH /api/admin/meditations/[id]` → сохранить `audio_url` в БД

Максимальный размер файла: **500 МБ** (проверяется на клиенте до запроса). Форматы: MP3, M4A.

После успешной загрузки появляется ссылка «▶ Прослушать ↗» для проверки файла.

## Известные особенности

1. **MP3-файлы ещё не залиты.** Курсы и медитации созданы в БД, `audio_url = NULL` везде. Приоритет #1 из CLAUDE.md v15: залить через `/admin/meditations`.

2. **Два upload-роута существуют параллельно:**

   **АКТУАЛЬНЫЙ** — `src/app/api/admin/meditations/[id]/upload-url/route.ts`
   Presigned URL, bucket `meditation-audio`. Файл обходит Next.js и Nginx. Используется в UI.

   > [!warning] устарело
   > `src/app/api/admin/meditations/[id]/upload/route.ts` — старая реализация через `FormData` → Next.js → Nginx → Supabase. Bucket `meditations`. Упирается в Nginx-лимит 500 МБ и таймаут 300s при больших файлах. Не используется в UI, но не удалён. Задача на удаление — в [[08-roadmap/tech-debt]].

3. **Проверка прав админа в `upload-url/route.ts` нарушает правило #24.**
   `requireAdmin` использует `.eq('id', user.id)` вместо `.eq('email', user.email)` — работает только пока `member.id === auth.users.id`. Подробнее: [[08-roadmap/tech-debt#проверка-прав-через-userid-вместо-useremail-нарушение-правила-24]]

4. **Мобильное меню** — пункт «Медитации» туда не добавлять: строго 5 позиций.

## Типовые операции

### Включить/выключить медитацию

```sql
UPDATE meditations SET is_visible = true  WHERE id = '<uuid>';
UPDATE meditations SET is_visible = false WHERE id = '<uuid>';
```

### Добавить курс вручную

```sql
INSERT INTO meditation_courses (slug, title, description, emoji, gradient_from, gradient_to, sort_order, is_visible)
VALUES ('morning', 'Утренние медитации', 'Начни день спокойно', '🌅', '#F77D27', '#FFB347', 5, true);
```

### Прогресс участницы по медитациям

```sql
SELECT m.title, mp.last_position_seconds, mp.completed, mp.listened_at
FROM meditation_progress mp
JOIN meditations m ON m.id = mp.meditation_id
WHERE mp.member_id = (SELECT id FROM members WHERE email = 'участница@email.com')
ORDER BY mp.listened_at DESC;
```

## История изменений

- 2026-04-06: внедрён presigned upload для аудиофайлов, bucket `meditation-audio`, обход Nginx-лимита 500 МБ — [[07-sessions/2026-04-06a]]

> [!note] Раздел медитаций существует с ранних версий клуба. Эта секция фиксирует только задокументированные изменения.

## Связано

- [[05-infrastructure/storage]]
