# SESSION 2026-05-22 — Handoff для следующей сессии

> Прикрепить к первому сообщению новой сессии.
> Продолжение `SESSION_2026-05-21_VAULT_HANDOFF.md`.

---

## 📊 Что сделано за сессию (22 мая) — R54 закрыт

### 1. R54 — push 144 файлов накопленной разработки на GitHub

Главный результат сессии. Прод и GitHub теперь синхронизированы. До этого:
- Локально на Mac: вся актуальная разработка
- На GitHub `origin/main`: версия с разрывом в недели
- При отказе Mac — невозможно было восстановить рабочее приложение

После R54: `git clone` + `deploy.sh` восстанавливают прод.

### 2. Структура из 14 коммитов

| # | Hash | Тема | Файлы |
|---|------|------|-------|
| 1 | f1bb41a | `chore: extend .gitignore, untrack local settings` | 2 |
| 2 | 989b12a | `chore: remove legacy public pages (migrated)` | 23 D |
| 3 | 772f753 | `feat(public-site): new public-site structure` | 193 |
| 4 | 5275947 | `feat(email): email module rewrite` | 12 |
| 4a | af1c032 | `feat(email): connect existing email routes (follow-up)` | 4 M |
| 5 | 71f8e91 | `feat(admin): help, onboarding, results-stories` | 22 |
| 6 | 33cf207 | `feat(club): diary feelings, notifications, kitchen PDF, webinars` | 12 |
| 7 | 8a3c24b | `feat(api): admin endpoints + member features` | 12 |
| 8 | 6113bf4 | `feat(cron+lib): level-up cron + auth lib + club-mode` | 4 |
| 9 | 9462a90 | `feat(db): 7 migrations applied to production` | 7 |
| 10 | 09fceb2 | `chore: gitignore SEO/blog routes` | 1 |
| 11 | afefb9f | `feat: fonts, robots.txt, dashboard about page` | 7 |
| 12 | 6b935f5 | `feat: integrate refactor across app (integration)` | 114 |
| 13 | b4417e9 | `docs(vault): finalize vault structure` | N |

После R54: `b20241a` (todo обновлён), `f96326a` (git-дисциплина в CLAUDE-RULES).

### 3. Vercel disconnected

Перед push'ем — Disconnect в Vercel Dashboard. Раньше был активный auto-deploy на push (риск двойных cron'ов: серверные на Beget + Vercel'овские из `vercel.json`). Теперь push не триггерит ничего.

### 4. .gitignore дополнен

В коммитах 1 и 10 расширили `.gitignore`:
- Дизайн-материалы: `/club/`, `*.docx`, `lending-*.html`, `natalia*.png/jpg` в корне
- SEO/блог: `/src/app/api/admin/blog-hubs/`, `blog-subcategory-hubs/`, `yandex-parser/` (обе), `SEO_AGENTS/`
- Локальные настройки: `.claude/settings.local.json`, `docs/.obsidian/workspace*.json`
- Vercel local: `.vercel/`
- Корневые ТЗ: `CLAUDE-CODE-TZ*.md`, `CLAUDE-CODE-V*.md`, `KITCHEN_PATCH_*.md`

### 5. todo.md — R54 закрыт, R65-R69 добавлены

- ~~R54~~ ✅ закрыто 2026-05-22
- **R65** — `public/club/` (20 MB) — переместить в `_drafts/` или удалить
- **R66** — `seed_test_elena.sql` — переместить или удалить
- **R67** — большие картинки в репо (~14 MB) — сжать или CDN
- **R68** — корневые legacy на GitHub (HTML-макеты, `PROJECT_BRAIN_v9.md`, `vercel.json`)
- **R69** — `claude_code_tasks/` — в `.gitignore` или удалить

### 6. CLAUDE-RULES.md — новый раздел «Git-дисциплина»

Раздел отсутствовал. R54 был возможен только потому, что правила не было. Теперь зафиксировано:
- Коммит после каждого логического изменения
- Push минимум раз в день
- Pre-commit проверки (status, staged diff, scope control)
- Один коммит — одна тема (integration-коммиты помечать явно)
- Секреты — никогда не в git
- Откат и восстановление (revert, soft reset, никогда force на main)

---

## 🗂 Состояние Vault на конец сессии

### Готово

**Клубные модули** (`03-club/modules/`):
- meditations.md ✅, webinars.md ✅, smart-kitchen.md ✅, meal-plans.md ✅
- marathons.md ✅, subscriptions.md ✅

**Админские модули** (`04-admin/modules/`):
- emails.md ✅, members.md ✅, help-admin.md ✅

**Инфраструктура** (`05-infrastructure/`):
- server.md ✅, payments.md ✅, storage.md ✅, email-system.md ✅, database.md ✅

**Операции** (`06-operations/`):
- manual-procedures.md ✅

**Прочее:**
- `02-public-site/_findings.md` (копилка)
- `08-roadmap/todo.md` (R01–R69)
- `_templates/CLAUDE-RULES.md` (+ раздел git-дисциплины)

### Не сделано (приоритет средний)

- `03-club/modules/diary.md` ← `Клуб разработка/Дневник/DIARY.md` + код (6 таблиц в database.md)
- `03-club/modules/measurements.md` ← `Клуб разработка/Трекер/TRACKER_IMPL.md` + код
- `03-club/modules/affiliate.md` ← `Клуб разработка/Партнерка/AFFILIATE_TECH.md` + находки A6, B5 из `_findings.md`
- `04-admin/modules/marathons-admin.md`
- `04-admin/modules/webinars-admin.md`

### Не сделано (низкий)

- `03-club/modules/channel.md` (R61)
- `03-club/modules/courses.md` (R62)
- `02-public-site/*` — полноценные модули

---

## ⚠️ Открытые баги в коде (todo.md)

**Высокий:**
- R50 — UI ручного апгрейда не выставляет `subscription_plan`

**Средний:**
- R51 — метка «Заблокированные» для `cancelled` семантически неверна
- R52 — нет глобального rate limiter в `send-announcement`
- R57 — GoTrue SMTP-провайдер требует уточнения
- R58 — два email-шаблона расходятся

**Низкий:**
- R53, R59, R60, R63, R65–R69 (детали в todo.md)

---

## 📋 Рекомендуемый план следующей сессии

После большого R54 — два направления на выбор.

### Вариант A — продолжить Vault (модули)
`diary.md` — есть готовый источник `Клуб разработка/Дневник/DIARY.md` + 6 таблиц уже размечены в database.md. Быстрый прогресс по документации.

Затем `measurements.md` или `affiliate.md`.

### Вариант B — починить R50 (код)
UI ручного апгрейда не выставляет `subscription_plan`, только `tariff`. Средняя сложность. После R55/R56 в прошлой сессии R50 — третий код-фикс той же серии.

### Вариант C — уборка (R65–R69)
Если хочется закрыть «хвосты» после R54: убрать `seed_test_elena`, перенести `club/`, удалить legacy с GitHub. Маленькие задачи, быстрая закрываемость.

**Моя рекомендация:** A (diary.md). После большой инфраструктурной работы хорошо вернуться к спокойной документации модулей.

---

## 📌 Методика

1. **Код = первый источник истины.** Документация — вторичный.
2. **ТЗ → разведка в чате → ОК → запись → git status → коммит → push.**
3. **git status после каждого шага** — только ожидаемые файлы.
4. **Никаких изменений на проде** без явного «делай».
5. **Один модуль за итерацию.**
6. **Секреты не пишем** — только имена переменных.
7. **Попутные находки** — в `_findings.md`.
8. **Коммитим логическими блоками, push в конце сессии** (CLAUDE-RULES.md `Git-дисциплина`).
9. **Перед каждым `git add`** — `git status --porcelain | grep "^ ?M"` в scope, чтобы не пропустить М-файлы.

---

## 🚀 Стартовое сообщение для новой сессии
Продолжаем работу над Vault.
Контекст в приложенном файле SESSION_2026-05-22_VAULT_HANDOFF.md.
Сделано в прошлой сессии: R54 закрыт — 14 коммитов на GitHub
(прод и репо синхронизированы). Vercel disconnected.
Раздел "Git-дисциплина" в CLAUDE-RULES.md.
R65-R69 добавлены в todo.
Стартуем с [diary.md / R50 / R65-R69 уборка — выбери].

---

## 📌 Урок R54 — для протокола

Что мы не сделали правильно изначально:
1. План разбивки строился на untracked-директориях, не учитывая 128 М-файлов
2. На коммите 4 пропустили 4 М-файла email-модуля — пришлось делать коммит 4а
3. План был на 10 коммитов, фактически вышло 14 (плюс R54-todo, R54-rules)

Что сработало:
1. **Pre-commit разведка с `git status --porcelain` по scope-паттерну** — поймали пропуски на ШАГЕ 1 коммита 10
2. **`core.quotepath false`** — исключило false negatives на путях с кириллицей
3. **Push после каждого коммита** — давало контрольную точку, могли остановиться на любом
4. **`ask_user_input_v0` для развилок** — не блокировал текстом, давал быстро решить
5. **Контрольный grep `vne scope`** перед каждым `git commit` — ловил случайные посторонние файлы

Эти приёмы войдут в общий стандарт работы (CLAUDE-RULES.md «Git-дисциплина»).
