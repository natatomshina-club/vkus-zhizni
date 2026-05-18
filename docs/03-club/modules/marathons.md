# Марафоны

> Модуль марафонов — ключевой инструмент клуба. Каждый марафон длится N дней, дни открываются вручную администратором. Доступен всем участницам с активной подпиской, триалкам — только анонс.

## Ключевые файлы

| Файл | Назначение |
|---|---|
| `src/app/(club)/dashboard/marathon/page.tsx` | Главная страница участницы (~1011 строк) |
| `src/app/api/marathons/route.ts` | GET: активный/плановый + до 6 завершённых |
| `src/app/api/marathons/[id]/complete/route.ts` | GET/POST отметок выполнения дней |
| `src/app/api/marathons/[id]/days/route.ts` | GET дней марафона |
| `src/app/api/marathons/[id]/measurements/route.ts` | GET/POST замеров участницы |
| `src/app/api/marathons/[id]/reminder/route.ts` | Регистрация напоминания + email сразу |
| `src/app/(club)/admin/marathons/page.tsx` | Список марафонов в админке |
| `src/app/(club)/admin/marathons/[id]/page.tsx` | Редактор марафона |
| `src/app/(club)/admin/marathons/[id]/days/page.tsx` | Редактор дней, кнопка «▶ Открыть день» |
| `src/app/api/admin/marathons/[id]/days/[day_number]/activate/route.ts` | PATCH: активация дня + автопост в чат |
| `src/app/api/admin/marathons/[id]/finish/route.ts` | POST: завершить марафон |
| `src/app/api/admin/marathons/[id]/upload/route.ts` | Загрузка PDF в Storage |
| `src/app/api/admin/marathon/route.ts` | GET/PUT для marathon_landing (без `s` — отдельная таблица) |

## База данных

### marathons

| Поле | Тип | Примечание |
|---|---|---|
| `id` | uuid | PK |
| `title` | text | |
| `description` | text\|null | |
| `starts_at` | timestamptz\|null | |
| `ends_at` | timestamptz\|null | |
| `duration_days` | integer | |
| `status` | `'planned'\|'active'\|'finished'` | |
| `month_label` | text\|null | Пример: «Апрель 2026» |
| `chat_channel_slug` | text\|null | Формат: `marathon-{id}` |
| `ration_pdf_url` | text\|null | PDF рациона |
| `shopping_list_pdf_url` | text\|null | PDF списка продуктов |
| `announce_title` | text\|null | Заголовок анонса |
| `announce_features` | jsonb\|null | `[{emoji, title, description}]` |
| `announce_prepare_text` | text\|null | Блок «Как подготовиться» |
| `emoji` | text\|null | default 🔥 |
| `next_date` | text\|null | Дата следующего (строка, не timestamp) |

> [!warning] `ration_html` из старой документации — поле не запрашивается в коде, не используется на фронте. Устарело.

### marathon_days

| Поле | Тип | Примечание |
|---|---|---|
| `id` | uuid | PK |
| `marathon_id` | uuid | FK → marathons |
| `day_number` | integer | UNIQUE с marathon_id |
| `task_title` | text\|null | |
| `task_text` | text\|null | HTML или текст |
| `coach_comment` | text\|null | |
| `ration_text` | text\|null | |
| `is_active` | boolean | Управляет видимостью дня — открывается вручную |

### marathon_task_completions

Отметки «Я выполнила!» — `member_id` + `marathon_day_id` + `completed_at`.

### marathon_measurements

Замеры участницы в рамках марафона — вес старт / вес финиш.
Pre-fill веса: при открытии подтягивает последний вес из `/api/tracker/summary`.

### marathon_reminders

| Поле | Тип | Примечание |
|---|---|---|
| `marathon_id` | uuid | FK |
| `member_id` | uuid | FK |
| `remind_at` | timestamptz | Время напоминания |
| `sent` | boolean | В старой доке называлось `reminder_sent` — расхождение, актуально: `sent` |

### marathon_landing

Отдельная таблица, управляется через `/api/admin/marathon` (без `s`). Назначение — предположительно публичная страница анонса марафона. Структура полей не задокументирована — уточнить.

## Логика

### Определение текущего дня

Приоритет: `max(is_active day_numbers)` — берётся максимальный номер активированного дня.  
Фолбэк: `Math.floor((now - starts_at) / 86400000) + 1`.

### Активация дней

Каждый день открывается вручную администратором через кнопку «▶ Открыть день» в админке.  
При активации автоматически:
1. `is_active = true` на записи `marathon_days`
2. Пост от Наташи в чат марафона: «🔥 День N марафона уже открыт!»

### Доступ по тарифу

| Элемент | trial | active |
|---|---|---|
| Анонс / Hero / обратный отсчёт | ✅ | ✅ |
| Кнопка напоминания | ✅ | ✅ |
| Блок «Что тебя ждёт» | ✅ | ✅ |
| Задания, рацион, комментарий Наташи | ❌ TrialLockBlock | ✅ |
| Замеры | ❌ | ✅ |
| Чат марафона | ❌ | ✅ |
| PDF рациона / список продуктов | 🔒 (видно, но заблокировано) | ✅ |
| Блок «Как подготовиться» | ❌ | ✅ |

TrialLockBlock → `/dashboard/upgrade`.

## Что видит участница

### Активный марафон
- Hero с градиентом и кружками дней (кликабельны если `is_active = true` или текущий день)
- Прогресс % выполненных заданий
- Задание выбранного дня + кнопка «✅ Я выполнила!»
- Комментарий Наташи + рацион дня
- Замеры (вес старт — любой день; вес финиш — только последний день)
- Кнопка чата → `/dashboard/channel?slug={chat_channel_slug}`
- PDF рациона и PDF списка продуктов
- Прошлые марафоны (до 6, `status = 'finished'`)

### Анонс следующего (`status = 'planned'`)
- Hero с обратным отсчётом (дд:чч:мм:сс, realtime)
- Кнопка «🔔 Напомни мне о старте» → email-подтверждение отправляется **сразу** при регистрации (механизм отложенного напоминания «за 3 дня» в коде не реализован)
- Блок «Что тебя ждёт» (`announce_features`)
- Блок «Как подготовиться» (`announce_prepare_text`) — скрыт для trial
- PDF рациона / список продуктов (если загружены)

### Нет марафона
Заглушка: «Марафон скоро! Следи за объявлениями».

## Что делает админ

1. Создаёт марафон в `/admin/marathons` — заполняет поля, загружает PDF
2. Наполняет дни в `/admin/marathons/[id]/days`
3. Ежедневно открывает день кнопкой «▶ Открыть день» → автопост в чат
4. По завершении нажимает «Завершить марафон» → pinned-пост «🏁 Марафон завершён!», `expires_at` на все обычные посты (`ends_at + 5 дней`)

## Шпаргалка

### Открыть день вручную (если кнопка не сработала)
```sql
UPDATE marathon_days
SET is_active = true
WHERE marathon_id = '<id>' AND day_number = <N>;
```
После — проверить что автопост ушёл в чат марафона.

### Проверить регистрации напоминаний
```sql
SELECT mr.*, m.title, mem.email
FROM marathon_reminders mr
JOIN marathons m ON m.id = mr.marathon_id
JOIN members mem ON mem.id = mr.member_id
WHERE mr.sent = false
ORDER BY mr.remind_at;
```

### Проверить прогресс участницы
```sql
SELECT mtc.completed_at, md.day_number, md.task_title
FROM marathon_task_completions mtc
JOIN marathon_days md ON md.id = mtc.marathon_day_id
WHERE mtc.member_id = (SELECT id FROM members WHERE email = 'email@example.com')
ORDER BY md.day_number;
```

## Известные особенности

- **`marathon_landing`** — отдельная таблица с неизвестной структурой. Управляется через `/api/admin/marathon` (без `s`). Уточнить назначение.
- **`is_manual_subscription`** — не влияет на доступ к марафонам, флаг не проверяется.
- **Прошлые марафоны** — показываются все `status='finished'` без фильтра по наличию замеров у участницы (старая дока фильтровала — устарело).

## История изменений

| Дата | Событие |
|---|---|
| 25 мар 2026 | MARATHONS.md написан |
| апр 2026 | Добавлены `is_active`, `shopping_list_pdf_url`, `marathon_reminders` |
| апр 2026 | Автопост при активации дня |

## Связано

- [[03-club/modules/webinars]] — аналогичный модуль с уровнями доступа
- [[05-infrastructure/payments]] — тарифы и TrialLockBlock
- [[07-sessions/project-history]] — архитектурные решения по марафонам
