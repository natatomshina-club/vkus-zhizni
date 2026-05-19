# SESSION 2026-05-19 — Handoff для следующей сессии

> Прикрепить к первому сообщению новой сессии.

---

## 📊 Что сделано за сессию 19 мая

### Блок 1 — Три инфраструктурных и клубных модуля

**`docs/05-infrastructure/server.md`** — сервер и деплой:
- Характеристики VPS, домены, схема сети (Cloudflare → Nginx → Next.js → Kong)
- Файловая структура, контейнеры (13 Supabase + vkus-zhizni)
- deploy.sh (rsync → docker build на сервере), переменные сборки
- Бэкапы: серверный `/home/deploy/backups/` + локальное зеркало `~/Desktop/vkus-backup/`
- Актуальный crontab (5 задач), безопасность, шпаргалка

**`docs/05-infrastructure/payments.md`** — CloudPayments:
- Тарифы (trial 149₽/7д, month 1500₽/30д, halfyear 6000₽/180д)
- Уровни участниц + ссылка на subscriptions.md
- Webhook флоу: PAY / Recurrent / Cancelled, HMAC верификация
- Аффилиаты (20% первый платёж, 10% рекуррент), отмена подписки
- Переменные окружения, шпаргалка

**`docs/03-club/modules/marathons.md`** — марафоны:
- Флоу участницы: активный / плановый / нет марафона
- БД: marathons, marathon_days (is_active), marathon_task_completions, marathon_measurements, marathon_reminders
- Доступ по тарифу (trial видит только анонс, TrialLockBlock)
- Активация дней вручную + автопост в чат, финализация марафона
- Шпаргалка SQL

**`docs/03-club/modules/subscriptions.md`** — подписки и уровни:
- Поля members (subscription_status, subscription_plan, subscription_started_at, is_manual_subscription и др.)
- getEffectiveMonths — единственный источник истины: `src/lib/webinars.ts`
- Таблица уровней (🌸⭐🔥💚💎), видимость контента trial vs active
- Level-up cron (пороги 3/6/9/12 мес), отмена подписки
- **Баг зафиксирован:** иконки уровней в dashboard/page.tsx не совпадают с webinars.ts

### Блок 2 — Прод: настройка cron и починка данных

Выяснилось что три cron-задачи существовали в коде но никогда не запускались.

**Проверка данных выявила:**
- 5 участниц с истёкшим `subscription_ends_at` оставались в статусе `active` (лазейка)
- 7 VIP-участниц истекали 19 мая без единого напоминания (`last_expiry_reminder_sent = NULL` у всех)
- `cleanup-media` — нечего чистить, медиафайлы в чате не используются

**Что сделано на проде:**
1. Разовый запуск `check-subscriptions` → 5 участниц помечены `expired`, лазейка закрыта
2. Добавлен cron `check-subscriptions` (03:00 UTC)
3. Разовый запуск `subscription-reminders` → 6 VIP получили email + PM
4. Добавлен cron `subscription-reminders` (08:00 UTC)

**Актуальный crontab на сервере:**
```
0 2 * * *  backup.sh                    → backup.log
0 3 * * *  check-subscriptions          → cron.log
0 8 * * *  subscription-reminders       → cron.log
0 9 * * *  email-sequences              → cron-sequences.log
0 10 * * * level-up                     → cron-level-up.log
```
Все логи: `/home/deploy/backups/cron*.log`

---

## 🗂 Что в Vault сейчас

### Готово (вычитано по коду)
- `CLAUDE.md` (новый, 199 строк, 12 правил)
- `docs/03-club/modules/meditations.md` ✅
- `docs/03-club/modules/webinars.md` ✅
- `docs/03-club/modules/smart-kitchen.md` ✅
- `docs/03-club/modules/meal-plans.md` ✅
- `docs/03-club/modules/marathons.md` ✅
- `docs/03-club/modules/subscriptions.md` ✅
- `docs/05-infrastructure/server.md` ✅
- `docs/05-infrastructure/payments.md` ✅
- `docs/07-sessions/` — 17 файлов + `project-history.md` (55 записей)
- `docs/08-roadmap/todo.md` / `tech-debt.md` / `ideas.md`
- `docs/_archive/CLAUDE-v15-2026-04-14.md`

### Нужно создать (приоритет)

**Высокий:**
- `06-operations/manual-procedures.md` — продление VIP, ручные SQL-операции. **Срочно:** VIP теперь блокируются при истечении, Наташе нужна инструкция.
- `04-admin/modules/emails.md` — открытый вопрос про «бывших триалок» (две семантики, кодовая сверка обязательна)

**Средний:**
- `05-infrastructure/database.md` — общий индекс таблиц БД (их накопилось много)
- `03-club/modules/diary.md` ← `Клуб разработка/Дневник/DIARY.md` + код
- `03-club/modules/measurements.md` ← `Клуб разработка/Трекер/TRACKER_IMPL.md` + код
- `03-club/modules/affiliate.md` ← `Клуб разработка/Партнерка/AFFILIATE_TECH.md` + код
- `04-admin/modules/members.md`, `marathons-admin.md`, `webinars-admin.md`

---

## ⚠️ Открытые вопросы

### Баги (зафиксированы в todo.md)
- **Иконки уровней** в `dashboard/page.tsx` не совпадают с `webinars.ts`:
  - 3–5 мес: dashboard 🔥, webinars.ts ⭐
  - 6–8 мес: dashboard 💚, webinars.ts 🔥
  - 9–11 мес: dashboard 👑, webinars.ts 💚
  - Источник истины — `webinars.ts`, dashboard нужно привести к нему

### Неизвестный статус
- `NEXT_PUBLIC_CLUB_MODE = diagnostic` — переменная в Dockerfile, назначение неизвестно
- `/welcome?plan=monthly` — страница-редирект, наследие Prodamus, актуальность неизвестна
- `marathon_landing` таблица — структура и назначение не задокументированы
- `kbju_*` поля в members (`kbju_protein_system`, `kbju_carbs_system`, `kbju_manual`) — логика не изучена
- `tariff` поле в members — запрашивается в коде, нигде не рендерится, вероятно legacy

### Техдолг (в todo.md)
- Авторизация cron непоследовательна: `level-up` → `x-cron-secret`, `check-subscriptions` → `Authorization: Bearer`
- `check-subscriptions` не отправляет email при expired (TODO в коде)
- `subscription-reminders` cron настроен, но те кто истёк 19 мая не получили напоминаний (пропустили окно 1/5 дней)

---

## 🚨 Критически важное для следующей сессии

**VIP-участницы теперь блокируются автоматически.**

До сегодня: `check-subscriptions` не работал → участницы с истёкшим `subscription_ends_at` продолжали заходить бесконечно.

После сегодня: cron запускается в 03:00 UTC → все с истёкшим `subscription_ends_at` получают статус `expired` → OTP-вход заблокирован.

**Что это значит для Наташи:** продлевать VIP-подписки нужно **до** истечения `subscription_ends_at`, не после. Иначе участница будет заблокирована до 03:00 следующего дня.

**Первым делом в следующей сессии** — создать `06-operations/manual-procedures.md` с инструкцией продления VIP.

SQL для продления VIP:
```sql
UPDATE members
SET subscription_ends_at = subscription_ends_at + interval '30 days'
WHERE email = 'email@example.com'
  AND is_manual_subscription = true;
```

---

## 📋 Рекомендуемый план следующей сессии

### Шаг 1 — `06-operations/manual-procedures.md` (срочно)
Инструкции для Наташи: продление VIP, ручной апгрейд в Бриллианты, создание участницы через Admin API, сброс лимита кухни, диагностика входа.

Источники: новый CLAUDE.md (раздел операций) + шпаргалки из уже созданных модулей.

### Шаг 2 — `04-admin/modules/emails.md`
Открытый вопрос: две семантики «бывших триалок»:
- (а) Таблица `cancellations` (только нажавшие «Отменить»)
- (б) SQL: `subscription_status='expired' AND plan IN ('trial','Пробный')`

Кодовая сверка обязательна перед записью.

### Шаг 3 — `05-infrastructure/database.md`
Сводный индекс всех таблиц БД. Таблицы уже разбросаны по модулям — собрать в одном месте.

---

## 📌 Методика (не меняется)

1. **Код = первый источник истины.** Документация — вторичный.
2. **ТЗ → разведка в чате → ОК → запись → git status.** Не пропускать шаги.
3. **git status после каждого шага** — только ожидаемые файлы.
4. **Никаких изменений на проде** без явного «делай» от Наташи.
5. **Один модуль за итерацию** — не смешивать задачи.
6. **Секреты не пишем** — только имена переменных.
