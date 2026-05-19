# Создание «Мозга проекта» в Obsidian — контекст для следующей сессии

> Этот файл нужно приложить к **первому сообщению новой сессии**, чтобы Claude подхватил контекст без потерь.

---

## 🎯 Цель проекта

Создать структурированную базу знаний проекта «Клуб Вкус Жизни» в Obsidian Vault. Источник наполнения — ~130 разрозненных markdown-файлов, накопившихся в `~/Desktop/vkus-zhizni/` и `~/Desktop/Клуб разработка/` за время разработки.

Vault — это **технический «мозг» проекта**: документация модулей, инфраструктуры, операционных процедур, история сессий. Читается Наташей + используется Claude Code в работе.

## 🏗 Принятая архитектура

**Гибрид: два Vault-а.**

```
~/Desktop/
├── vkus-zhizni/
│   └── docs/             ← Vault #1: «Технический мозг» (в Git вместе с кодом)
│       ├── 00-INDEX.md
│       ├── 01-quickstart.md
│       ├── 02-public-site/
│       ├── 03-club/
│       ├── 04-admin/
│       ├── 05-infrastructure/
│       ├── 06-operations/
│       ├── 07-sessions/
│       ├── 08-roadmap/
│       ├── _templates/
│       └── _attachments/
│
└── Клуб-личное/          ← Vault #2: «Личный мозг» (вне Git)
    ├── Пароли.md
    ├── Идеи.md
    └── ...
```

- **Технический Vault** — в репозитории, видим для Claude Code, версионируется в Git
- **Личный Vault** — создаст Наташа отдельно при необходимости, сейчас не приоритет

## 📦 Что уже сделано в предыдущей сессии

### 1. Создан скелет Vault (16 markdown-файлов)
Файл `vault-skeleton.zip` лежит на рабочем столе Наташи. Содержит:

```
00-INDEX.md                       ← главная карта Vault
01-quickstart.md                  ← доступы, деплой, cron
02-public-site/INDEX.md
03-club/INDEX.md
04-admin/INDEX.md
05-infrastructure/INDEX.md
06-operations/INDEX.md
07-sessions/INDEX.md
08-roadmap/INDEX.md
08-roadmap/todo.md                ← заполнен актуальными задачами
08-roadmap/tech-debt.md           ← заполнен известным техдолгом
08-roadmap/ideas.md
_templates/CLAUDE-RULES.md        ← КЛЮЧЕВОЙ ФАЙЛ — правила работы Claude Code с Vault
_templates/module-template.md
_templates/session-template.md
README.md
```

Скелет — это **каркас INDEX-ов и шаблонов**, не наполнение. Содержимое модулей будет вытаскиваться из существующих материалов на следующих волнах.

### 2. Сделан страховочный архив всей документации

Перед любой реорганизацией создан полный архив:

- **Файл:** `~/Desktop/docs-archive-2026-05-18.zip` (1.2 ГБ)
- **Содержимое:** 1209 .md файлов из `vkus-zhizni/` и полная копия `Клуб разработка/`
- **Назначение:** точка возврата на случай ошибок при реорганизации

### 3. Проведена инвентаризация существующей документации

**В `~/Desktop/vkus-zhizni/`:**
- `CLAUDE.md` v15 (31K) — **актуальный «мозг» проекта**, источник истины для наполнения Vault
- `CLAUDE-CODE-TZ.md`, `CLAUDE-CODE-TZ-v5.md`, `CLAUDE-CODE-V7.md` — старые версии ТЗ
- `EMAIL_PLAN.md`, `KITCHEN_PATCH_17may2026.md` — рабочие документы
- `claude_code_tasks/` — 4 больших файла (MAIN_STRUCTURE 40K, TZ_ETAP_3_FINAL 67K, и др.)
- `SEO_AGENTS/` — 17 файлов SEO-агентов для блога **(НЕ включаем в Vault — отдельная вселенная)**
- `docs/PROJECT_BRAIN.md` (73K, март 2026) — **полностью устаревший** (Vercel, Prodamus, 49₽), архивировать
- `docs/admin.md`, `auth.md`, `content.md`, `diary.md`, `kitchen.md`, `tracker.md`, `SMART_KITCHEN.md` — старые описания модулей

**В `~/Desktop/Клуб разработка/` (15+ тематических папок):**
- PROJECT_BRAIN v10-v16 (история эволюции мозга)
- 8+ файлов `SESSION_*.md` (хронология работы)
- Тематические описания: AUTH_OTP, MARATHONS, MEDITATIONS, DIARY, TRACKER_IMPL, AFFILIATE_TECH, CLOUDPAYMENTS_GUIDE, LAUNCH_BRIEF, WINS и др.
- «Перенос на Beget» — 8 файлов сессий миграции email
- «Умная кухня» — SMART_KITCHEN V2/V3 + патчи
- «БЛОГ + SEO» — 50+ файлов **(НЕ включаем в Vault — отдельная вселенная)**
- «Будущие задачи», «ФИКСЫ», «ОПЛАТЫ», «Партнерка», «Медитации», «Вебинары», «Марафоны», «Дневник», «Трекер», «ЗАПУСК»

## 📋 План разбора — 5 волн

### ✅ Волна 1 — Архивация (СДЕЛАНО)
Создан `docs-archive-2026-05-18.zip` (1.2 ГБ, 1209 файлов).

### 🟡 Волна 2 — Установка скелета (СЛЕДУЮЩАЯ)
- Распаковать `vault-skeleton.zip` в `~/Desktop/vkus-zhizni/docs/`
- Существующие файлы в `docs/` не перетирать — переименовать в `<имя>.OLD.md` для последующего разбора в Волне 4
- Открыть в Obsidian как Vault

### 🟡 Волна 3 — Сессии
Из `~/Desktop/Клуб разработка/`:
- `SESSION_2026-04-10.md` → `07-sessions/2026-04-10.md`
- `SESSION_16_APRIL_2026.md` → `07-sessions/2026-04-16.md`
- `SESSION_18_20_APRIL_2026.md` → `07-sessions/2026-04-18-20.md`
- `SESSION_MAY_2026.md` → `07-sessions/2026-05-may.md`
- `Перенос на Beget/SESSION_*.md` (8 файлов) → `07-sessions/`
- `SESSION_2026-05-17_FIXES.md` (этот пакет) → `07-sessions/2026-05-17.md`
- Дополнить `07-sessions/INDEX.md` ссылками

### 🟡 Волна 4 — Тематические модули (поэтапно, по одному)
Для каждого: Claude Code читает источник (`Клуб разработка/<тема>/*.md`) + актуальный код + актуальный `CLAUDE.md`, синтезирует финальный файл по шаблону `_templates/module-template.md`. **По одному модулю за итерацию.**

Модули клуба → `03-club/modules/`:
- `marathons.md` ← `Марафоны/MARATHONS.md` + код
- `webinars.md` ← `Вебинары/DOCS_Вебинары.md` + код
- `meditations.md` ← `Медитации/MEDITATIONS.md` + код
- `diary.md` ← `Дневник/DIARY.md` + docs/diary.md + код
- `measurements.md` ← `Трекер/TRACKER_IMPL.md` + docs/tracker.md
- `smart-kitchen.md` ← `Умная кухня/SMART_KITCHEN_V*.md` + патчи + docs/SMART_KITCHEN.md
- `recipes.md`, `meal-plans.md`, `karta-pomoshi.md`, `channels.md`, `notifications.md` ← из кода (нет источников в материалах)

Аутентификация:
- `auth-otp.md` ← `AUTH_OTP.md` + docs/auth.md + код

Подписки:
- `subscriptions.md` ← из CLAUDE.md + кода

Админ-модули → `04-admin/modules/`:
- `members.md`, `marathons-admin.md`, `webinars-admin.md`, `emails-admin.md`, ... ← из docs/admin.md + кода

### 🟡 Волна 5 — Инфраструктура и операции
- `05-infrastructure/email-system.md` ← `Перенос на Beget/*` + EMAIL_PLAN.md + находки сегодняшней сессии о Resend
- `05-infrastructure/payments.md` ← `ОПЛАТЫ/CLOUDPAYMENTS_GUIDE.md`
- `05-infrastructure/server.md`, `database.md`, `dns.md`, `monitoring.md`, `secrets.md` ← из CLAUDE.md и кода
- `06-operations/manual-diamond.md`, `restore-diamond.md`, `reset-kitchen-limit.md`, `deploy.md`, `rollback.md`, `troubleshooting.md` ← из CLAUDE.md (раздел операций)
- Партнёрка → решить, в какой раздел: возможно `03-club/modules/affiliate.md` ← `Партнерка/AFFILIATE_TECH.md`

## ⚠️ Что НЕ включаем в Vault

- ❌ `SEO_AGENTS/` (17 файлов) — отдельная инфраструктура для SEO-блога
- ❌ `Клуб разработка/БЛОГ + SEO/` (50+ файлов) — то же
- ❌ `Клуб разработка/СОЦ СЕТИ/` — контент-материалы
- ❌ `Клуб разработка/КОНТЕНТ-комбайн/` — скилы
- ❌ `Клуб разработка/Результаты:кейсы/` — контент
- ❌ Файлы из `claude_code_tasks/` (старые большие ТЗ) — архивируются, не вытаскиваются в Vault
- ❌ `docs/PROJECT_BRAIN.md` (устарел) — после Волны 2 переехать в `_archive/` Vault или удалить (есть в страховочном архиве)

## 🤖 Правило работы Claude Code с Vault

Зафиксировано в `_templates/CLAUDE-RULES.md`. Главное:

1. **Поэтапно, не залпом** — один модуль за итерацию
2. **Без правок исходников** при анализе — только чтение
3. **Перед записью в Vault** — показать Наташе план («куда положу что»), ждать «делай»
4. **Если непонятно куда положить** — спросить Наташу в чате, не угадывать
5. **Не дублировать `CLAUDE.md`** — там операционные правила агента, в Vault — знания о проекте
6. **Не писать секреты** — только имена переменных, без значений
7. **Не удалять файлы**, устаревшее помечать `> [!warning] устарело`

## 🚀 ТЗ для следующей сессии — Волна 2

### Стартовое сообщение для Claude в новой сессии

Когда начнёшь новую сессию, приложи к первому сообщению:
1. Этот файл (`SESSION_2026-05-17_VAULT_PLAN.md`)
2. `vault-skeleton.zip` (с рабочего стола Наташи)

И напиши Claude:

```
Продолжаем работу над «Мозгом проекта» в Obsidian.

Контекст в приложенном файле SESSION_2026-05-17_VAULT_PLAN.md.

Сделано: Волна 1 (архивация). Архив `docs-archive-2026-05-18.zip` (1.2 ГБ) на рабочем столе.

Стартуем Волну 2 — установка скелета. Дай ТЗ для Claude Code.
```

### Точное ТЗ для Claude Code (Волна 2)

После того как новый Claude в чате подтвердит контекст, дать Claude Code это ТЗ:

```
Задача: установка скелета Obsidian Vault в docs/ с сохранением существующих файлов.

Контекст: страховочный архив всей документации уже создан в ~/Desktop/docs-archive-2026-05-18.zip. 
Можно работать смело — если что-то пойдёт не так, восстановим из архива.

Выполни:

cd ~/Desktop/vkus-zhizni

# 1. Список существующих файлов в docs/ (для отчёта)
echo "=== Существующие файлы в docs/ ==="
ls -la docs/ 2>/dev/null

# 2. Переименовать все существующие .md в docs/ корне с суффиксом .OLD
# (чтобы не конфликтовали с новыми INDEX-ами скелета)
cd docs
for f in *.md; do
  [ -f "$f" ] && [ "$f" != "*.md" ] && mv "$f" "${f%.md}.OLD.md"
done
cd ..

# 3. Распаковать скелет в docs/
# Архив vault-skeleton.zip должен быть в ~/Desktop/
cd ~/Desktop/vkus-zhizni
unzip -o ~/Desktop/vault-skeleton.zip -d /tmp/vault-unpack/
# Контент архива внутри папки vault_skeleton/ — перенести его содержимое в docs/
cp -r /tmp/vault-unpack/vault_skeleton/* docs/
cp -r /tmp/vault-unpack/vault_skeleton/.* docs/ 2>/dev/null || true
rm -rf /tmp/vault-unpack/

# 4. Проверить что получилось
echo "=== Структура docs/ после установки скелета ==="
find docs -maxdepth 2 -type d | sort
echo
echo "=== Все файлы в docs/ ==="
find docs -maxdepth 2 -type f | sort

# 5. Прочитать docs/_templates/CLAUDE-RULES.md и подтвердить понимание правил
cat docs/_templates/CLAUDE-RULES.md

После выполнения покажи Наташе в чате:
- Структуру папок docs/
- Список файлов (включая .OLD.md)
- Подтверждение что прочитал CLAUDE-RULES.md и будешь по ним работать

Ничего больше не делай. Жди инструкций на Волну 3.

Правило: никаких изменений на проде (код, env, БД) в этой работе. Только файлы в docs/.
```

### Ожидаемый результат Волны 2

После выполнения в `~/Desktop/vkus-zhizni/docs/` будет:

```
docs/
├── 00-INDEX.md                       ← новый
├── 01-quickstart.md                  ← новый
├── README.md                         ← новый
├── PROJECT_BRAIN.OLD.md              ← старый, помечен .OLD
├── SMART_KITCHEN.OLD.md              ← старый, помечен .OLD
├── admin.OLD.md                      ← старый, помечен .OLD
├── auth.OLD.md
├── content.OLD.md
├── diary.OLD.md
├── kitchen.OLD.md
├── tracker.OLD.md
├── 02-public-site/...                ← новые INDEX
├── 03-club/...                       ← новые INDEX
├── 04-admin/...                      ← новые INDEX
├── 05-infrastructure/...             ← новые INDEX
├── 06-operations/...                 ← новые INDEX
├── 07-sessions/INDEX.md              ← новый
├── 08-roadmap/INDEX.md + todo.md + tech-debt.md + ideas.md
├── _templates/CLAUDE-RULES.md + module-template.md + session-template.md
└── _attachments/
```

Старые `.OLD.md` останутся в корне `docs/` до Волны 4 — там их контент будет вычитан и распределён по новым местам в `03-club/`, `04-admin/`, `05-infrastructure/`.

После Волны 2 — Наташа открывает Obsidian, выбирает `~/Desktop/vkus-zhizni/docs/` как Vault, проверяет что граф работает, INDEX-ы открываются.

---

## 📌 Запомнить для новой сессии

- **Правило #1:** Claude Code не делает изменений на проде без явного «делай». В прошлой сессии чуть не положил вход в клуб самовольной миграцией OTP.
- **CLAUDE.md v15** в корне репозитория — источник истины. Все 7 предыдущих версий (v10-v16) лежат в `Клуб разработка/` для истории.
- **OTP идёт через Resend** — критическая зависимость, в TODO миграция на Beget.
- **Бесплатный план Resend** = 100 emails/day. Запас есть, но не бесконечный.
- **`subscription_plan = 'halfyear'`** теперь корректно записывается webhook'ом (фикс из этой сессии).
- **SEO_AGENTS и контент-материалы** — не в Vault, отдельная вселенная.
