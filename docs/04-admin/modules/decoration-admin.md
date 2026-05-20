# Оформление — управление сезонными темами

Раздел `/admin/themes` (заголовок «Оформление») — управление сезонным оформлением клуба: праздничные частицы, цвета акцента, поздравительный баннер.

Ключевые файлы:
- `src/app/(club)/admin/themes/page.tsx` — страница управления
- `src/app/api/admin/themes/route.ts` — CRUD API (admin)
- `src/app/api/seasonal-theme/route.ts` — публичный API для клиентского хука
- `src/hooks/useSeasonalTheme.ts` — хук-потребитель (клуб)
- `src/components/SeasonalThemeApplier.tsx` — применяет CSS-переменные
- `src/components/SeasonalParticles.tsx` — рендерит падающие частицы
- `src/components/SeasonalBanner.tsx` — праздничный баннер на `/dashboard`

---

## Таблица `seasonal_themes`

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK |
| `slug` | text | Идентификатор темы: `new_year`, `valentine`, `womens_day` и др. |
| `title` | text | Название (пример: «Новый год») |
| `emoji` | text | Emoji темы |
| `particle_type` | text | Тип частиц: `snow`, `hearts`, `petals`, `stars`, `leaves`, `confetti` |
| `accent_color` | text | HEX цвет акцента (пример: `#2A9D5C`) |
| `accent_light` | text | HEX светлый фон (пример: `#D0F5E8`) |
| `start_date` | text | Начало периода в формате `MM-DD` |
| `end_date` | text | Конец периода в формате `MM-DD` |
| `is_forced` | boolean | Принудительно включена вручную |
| `is_system` | boolean | Системная тема — показывает праздничный баннер |

`start_date..end_date` поддерживает переход через Новый год: если `start > end`, тема активна в конце декабря ИЛИ в начале января.

---

## Что показывается в UI

**Текущая активная тема** — цветная плашка вверху. Если тем нет — «Сейчас нет активной темы».

**Список тем** — карточки с:
- Emoji + название + статус-бейдж (`Включена вручную` / `Активна автоматически` / `Неактивна`)
- Тип частиц + диапазон дат + цветовые кружки
- Кнопки «Включить сейчас» / «Выключить» + «🗑 Удалить»

**Быстрые пресеты** — 8 кнопок. Нажатие заполняет форму создания данными пресета, не создаёт тему автоматически.

**Форма создания новой темы** — поля: название, slug (авто), emoji, тип частиц (выбор кнопками), цвет акцента (color picker + HEX), светлый фон, период `MM-DD`. Превью темы перед сохранением.

### Пресеты

| Slug | Название | Частицы | Период |
|---|---|---|---|
| `new_year` | Новый год | snow | 12-15 – 01-10 |
| `valentine` | День влюблённых | hearts | 02-10 – 02-16 |
| `womens_day` | 8 марта | petals | 03-06 – 03-10 |
| `easter` | Пасха | stars | 04-18 – 04-21 |
| `may_day` | 1 мая | leaves | 04-30 – 05-01 |
| `victory_day` | 9 мая | stars | 05-08 – 05-09 |
| `new_school` | 1 сентября | leaves | 09-01 – 09-01 |
| `club_birthday` | День рождения клуба | confetti | 10-15 – 10-15 |

---

## Логика активации

**Приоритеты (убывают):**
1. `is_forced = true` — тема включена вручную → всегда активна, пока не выключат
2. Дата в диапазоне `start_date..end_date` — автоматически активна
3. Нет активной темы → частицы не показываются

При нажатии «Включить сейчас» (`PATCH is_forced: true`): сервер сначала снимает `is_forced` со всех остальных тем, затем ставит у выбранной. Одновременно может быть активна только одна тема.

---

## Механизм применения — как тема попадает в клуб

```
PATCH /api/admin/themes → is_forced: true → seasonal_themes (БД)
                 ↓
Клиент открывает страницу клуба:
useSeasonalTheme() → GET /api/seasonal-theme → sessionStorage (TTL 2 мин)
                 ↓
SeasonalThemeApplier:
  document.documentElement.style.setProperty('--seasonal-accent', accent_color)
  document.documentElement.style.setProperty('--seasonal-accent-light', accent_light)
                 ↓
SeasonalParticles:
  24 emoji-частицы, падают CSS-анимацией, тип из particle_type
```

**Где монтируется:** `src/app/(club)/layout.tsx` — оба компонента (`SeasonalThemeApplier` + `SeasonalParticles`) присутствуют на **каждой странице клуба**.

**CSS-переменные:** `--seasonal-accent` и `--seasonal-accent-light` ставятся на `<html>`. Базовые переменные (`--pur`, `--bg` и т.д.) не перезаписываются — тема накладывается поверх.

**Задержка после PATCH:** до 2 минут (TTL кэша в sessionStorage). Принудительное обновление — перезагрузка страницы.

**`/api/seasonal-theme` — публичный эндпоинт** (без авторизации): данные темы (emoji, цвета) не приватные, запрос выполняется с браузера клиентским хуком.

---

## SeasonalBanner — праздничный баннер

Компонент `SeasonalBanner` подключён **только на `/dashboard`** (не в layout). Показывается исключительно для `is_system=true` тем. Текст поздравлений захардкожен по `slug`:

| Slug | Текст |
|---|---|
| `new_year` | «С Новым годом!» |
| `valentine` | «С Днём влюблённых!» |
| `womens_day` | «С 8 марта!» |
| … | … |
| `club_birthday` | «День рождения клуба!» |

Баннер закрывается кнопкой ✕. Dismissed-статус хранится в `localStorage` с ключом `banner-closed-{slug}-{date}` — закрыть один раз в день достаточно, завтра покажется снова.

Кастомные темы (не из пресетов, `is_system=false`) баннер **не показывают**.

---

## CelebrationEffect — не часть сезонной системы

`src/components/CelebrationEffect.tsx` — canvas-анимация конфетти, срабатывающая на событие (не связана с `seasonal_themes`). Используется только в `BirthdayBanner.tsx` при дне рождения участницы. Работает независимо от активной сезонной темы.

---

## API-роуты

| Метод | Путь | Auth | Описание |
|---|---|---|---|
| GET | `/api/admin/themes` | email lookup ✓ | Список всех тем, сортировка по `start_date` |
| POST | `/api/admin/themes` | email lookup ✓ | Создать тему (`slug, title, start_date, end_date` обязательны) |
| PATCH | `/api/admin/themes` | email lookup ✓ | Обновить поля; при `is_forced: true` — снимает флаг со всех остальных |
| DELETE | `/api/admin/themes?id=xxx` | email lookup ✓ | Удалить тему |
| GET | `/api/seasonal-theme` | без авторизации | Активная тема для хука (forced или по дате) |

Auth во всех admin-роутах корректный: `requireAdmin()` → `.eq('email', user.email!)`.

---

## Связано

- [[05-infrastructure/database]] — таблица `seasonal_themes`
- `src/app/(club)/layout.tsx` — точка монтирования компонентов оформления

---

## История изменений

| Дата | Событие |
|---|---|
| май 2026 | Документ создан — разведка по коду |
