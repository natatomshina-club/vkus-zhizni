# SESSION 2026-05-20 (вечер) — Handoff для следующей сессии

> Прикрепить к первому сообщению новой сессии.
> Продолжение `SESSION_2026-05-23_VAULT_HANDOFF.md`.

---

## 📊 Что сделано за сессию

6 модулей, все коммиты запушены на remote.

| Коммит   | Модуль                                                                  |
|----------|-------------------------------------------------------------------------|
| ccc1155  | `03-club/design-system.md` — палитра, шрифты, компоненты клуба          |
| 32139a3  | `03-club/modules/affiliate.md` — партнёрская программа                  |
| 90cf9fa  | `04-admin/modules/marathons-admin.md` — управление марафонами           |
| 56fc4b2  | `04-admin/modules/webinars-admin.md` — управление вебинарами            |
| channel  | `03-club/modules/channel.md` — чаты, личные сообщения, FAQ, объявления  |
| 95cab6f  | `03-club/modules/courses.md` — Я и моё тело (вводные курсы + материалы) |

---

## 🗂 Состояние Vault — полная картина

### Готово ✅

**Клубные модули** (`03-club/modules/`):
meditations, webinars, smart-kitchen, meal-plans, marathons, subscriptions,
diary, measurements, wins, affiliate, channel, courses

**Дизайн клуба:** `03-club/design-system.md`

**Админские модули** (`04-admin/modules/`):
emails, members, help-admin, marathons-admin, webinars-admin

**Инфраструктура** (`05-infrastructure/`):
server, payments, storage, email-system, database

**Операции** (`06-operations/`):
manual-procedures

### Остаток — клубные модули

- `03-club/modules/recipes.md` — Избранные рецепты (не разведан, источник только в коде)
- `03-club/modules/profile.md` — Профиль участницы (не разведан)

### Остаток — админские модули

| Раздел в `/admin` UI    | Файл                      | Источник                                                       |
|-------------------------|---------------------------|----------------------------------------------------------------|
| Я и моё тело            | `ya-i-moe-telo-admin.md`  | код (admin UI уже описан в courses.md — возможно не нужен)     |
| Истории                 | `stories-admin.md`        | код                                                            |
| Аналитика               | `analytics-admin.md`      | код                                                            |
| Страницы сайта          | `pages-admin.md`          | код                                                            |
| Оформление              | `decoration-admin.md`     | код                                                            |
| Сообщения (direct admin)| уже в `channel.md`        | ✅ закрыто                                                     |
| Партнёры                | уже в `affiliate.md`      | ✅ закрыто                                                     |
| SEO-блог                | вне scope Vault           | —                                                              |

> **Примечание:** Admin UI для «Я и моё тело» (`/admin/courses`) уже задокументирован
> в `courses.md` (две вкладки, все API роуты). Отдельный `ya-i-moe-telo-admin.md`
> скорее всего не нужен — проверить при старте сессии.

---

## 🎯 Цель следующей сессии

**Закрыть всю оставшуюся документацию клуба и админки**, чтобы в следующих
сессиях плотно заняться публичным сайтом.

### Рекомендуемый порядок

1. `recipes.md` — быстрый модуль, источник в коде
2. `profile.md` — профиль участницы
3. `stories-admin.md` — Истории/результаты
4. `pages-admin.md` — CMS страниц сайта
5. `analytics-admin.md` — аналитика
6. `decoration-admin.md` — оформление/сезонные темы
7. Проверить, нужен ли `ya-i-moe-telo-admin.md` (скорее нет)

После всего — сверка с UI `/admin` и `/dashboard`: все разделы покрыты?

---

## ⚠️ Открытые баги (из сегодняшней сессии)

**Новые:**

- **channel.md** — PATCH `/channel/posts/[id]` смешивает `members.id` с `auth user.id`
- **channel.md** — `/channel/seen` пишет `member_id: user.id`, `/channel/unread`
  читает через email-lookup — несогласованность в `channel_last_seen`
- **courses.md** — `intro_*` роуты используют `.eq('id', user.id)` вместо
  email-lookup (нарушение правила #11)
- **webinars-admin.md** — `grant-manual` пишет `granted_by: 'purchase'` вместо `'admin'`

**Ранее открытые — высокий приоритет:**

- **R50** — UI ручного апгрейда не выставляет `subscription_plan`
- **R76** — `craving` vs `sweet_craving` в measurements (требует SQL на проде)

---

## 🚀 Стартовое сообщение для новой сессии

```
Продолжаем работу над Vault.

Контекст в приложенном файле SESSION_2026-05-20_evening_VAULT_HANDOFF.md.

Сделано в прошлой сессии: 6 модулей (design-system, affiliate,
marathons-admin, webinars-admin, channel, courses). Все запушены.

Цель сессии: закрыть оставшиеся модули клуба и админки, потом
переходить к публичному сайту.

Стартуем с recipes.md.
```

---

## 📌 Методика — без изменений

1. Код = первый источник истины
2. ТЗ → разведка в чате → ОК → запись → `git status` → коммит → push
3. `git status` после каждого шага — только ожидаемые файлы
4. Никаких изменений на проде без явного «делай»
5. Один модуль за итерацию
6. Секреты не пишем — только имена переменных
7. Попутные находки → `_findings.md`
8. Коммитим логическими блоками, push в конце сессии
9. Handoff-файлы пишет основной Claude (в чате), не Claude Code
