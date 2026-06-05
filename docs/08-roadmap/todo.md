# 📋 TODO — открытые задачи

Список того что нужно сделать. По приоритету сверху вниз.

## 🔴 Срочное

Ничего срочного на данный момент.

## 🟡 Средний приоритет

- [ ] **Баг: иконки уровней в dashboard/page.tsx не совпадают с webinars.ts** — привести к единому источнику истины (`src/lib/webinars.ts`). Затронуто: 3–5 мес (🔥/⭐), 6–8 мес (💚/🔥), 9–11 мес (👑/💚)

### Найти источник писем «Доступ в клуб приостановлен»

**Контекст:** Письма идут через Resend Email API ежедневно тестовым участницам (lemexa2, 916995, ketoclub, tsyban62 и др.). В коде через `grep` не нашлось. В Resend → Audiences/Broadcasts/Automations — пусто. Получатели — свои люди, жалоб нет, но непонятно откуда летит.

Точечная разведка для следующей сессии:
- В Resend → клик по конкретному письму → детальная страница покажет API key, теги, headers
- Возможно есть скрытый сервис или старая инстанция приложения

### Миграция OTP с Resend на Beget

**Контекст:** Клубный OTP идёт через Supabase GoTrue → smtp.resend.com (наследие). Бесплатный план Resend = 100 emails/day. По мере роста упрёмся в лимит → логин сломается.

План: заменить SMTP-переменные в `/opt/supabase/docker/.env` (GOTRUE_SMTP_*) на Beget, рестартнуть контейнер `auth`. Подготовить бэкап + smoke-test перед изменением.

### Серия писем «churn» (1/2/3/7/15 день после вылета)

**Контекст:** Изначальная задача из чата 17 мая, отложена до решения вопроса миграции OTP. Нужна новая серия в `email_sequences` с 5 шагами для участниц у которых истекла подписка.

### Унификация синонимов продуктов кухни

Участница вводит «индейка бедро» — система ищет «бедро индейки» и рецепт не находит, выдача пустая. Аналогично «язык говяжий варёный» (с ё) vs «язык говяжий вареный» (без ё). Решается добавлением пар-синонимов в `PRODUCT_SYNONYMS` (`src/lib/productUtils.ts`). Список к проверке: пройти по записям `nutrition` с двусоставными названиями и сверить прямой/обратный порядок слов.

**Источник:** `_drafts/KITCHEN_CONSOLIDATED.md`, патч `KITCHEN_PATCH_03may2026.md`

### Тестирование 5 сценариев алгоритма кухни

После майских изменений (строгий фильтр белков, лимиты салатов, бобовые) пять сценариев заявлены, но статус прогона неизвестен. Сценарии: (1) строгий фильтр сёмги — только «семга слабосоленая», не обычная; (2) охват белков + лимит печени — 4 белка → все появляются, печень ≤ 2 рецептов/неделю; (3) строгий фильтр овощей при 3+ введённых; (4) углеводы 60г + бобовые — нет фасоли, `day_total.carbs` в норме; (5) лимиты салатов — сметана ≤ 60г, масло ≤ 30г. Непрогнанные сценарии = риск тихого регресса при следующих изменениях алгоритма.

**Источник:** `_drafts/KITCHEN_CONSOLIDATED.md`, патч `KITCHEN_PATCH_03may2026.md`

### Наполнение БД рецептов до 700+

На 11 апреля было ~531 рецепт, на 3 мая — 676. Цель: 700+. Осталось: салаты (батч 2, ~20 рецептов), супы (батч 2, ~15 рецептов), завтраки (батч 5, ~20 рецептов). После достижения цели выдача станет богаче по редким комбинациям продуктов.

**Источник:** `_drafts/KITCHEN_CONSOLIDATED.md`, патч `KITCHEN_PATCH_11apr2026.md`

### Добавить муку (пшеничную и цельнозерновую) в `nutrition`

Продукты упомянуты как «есть в плане» в апрельских патчах, но в таблице `nutrition` отсутствуют. Без них рецепты с мукой нельзя добавить корректно — `nutrition_id` не будет существовать. Добавление: простой INSERT с КБЖУ на 100г.

**Источник:** `_drafts/KITCHEN_CONSOLIDATED.md`, патч `KITCHEN_PATCH_11apr2026.md`

- [ ] **check-subscriptions: добавить email при истечении подписки** — cron-задача помечает expired, но email не отправляет (TODO в коде `src/app/api/cron/check-subscriptions/route.ts`)

## 🟢 Без срочности

### Чистка NULL в subscription_plan

14 участниц с `subscription_plan = NULL` и `last_payment_amount = 1500` — не сломаны (для month бонус = 0), но для гигиены данных проставить:
```sql
UPDATE members SET subscription_plan = 'month'
WHERE last_payment_amount = 1500 AND subscription_plan IS NULL;
```

### Чистка наследия Resend

После миграции OTP:
- Удалить `RESEND_API_KEY` из `.env.production.local`
- Удалить DNS-записи `MX send`, `TXT send`, `TXT resend._domainkey` в Cloudflare
- Revoke API keys в Resend dashboard

### Описать механизм платного доступа к вебинарам

В коде есть поле `webinars.is_paid` (добавлено 2026-04-18) и состояние `paid_access`, но механизм оплаты, привязка к CloudPayments-webhook и хранение покупки — в коде не очевидны. Нужно: пройти по платным вебинарам в БД, найти где обрабатывается покупка, как создаётся `webinar_access` с `is_paid=true`. Результат — дополнить раздел «Логика доступа» в [[03-club/modules/webinars]].

### Рецепт «свиная грудинка с квашеной капустой»

Пропущен в задании 15 при наполнении БД. Требует обсуждения с Наташей: нужен ли рецепт, в какую категорию (`обед_ужин` или `суп`), с какими тегами. Не блокирует ничего.

**Источник:** `_drafts/KITCHEN_CONSOLIDATED.md`, патч `KITCHEN_PATCH_03may2026.md`

### Накопленные мелочи по схеме кухни

Набор мелких улучшений схемы и контента, без видимого эффекта на участницу:

- Переименовать категорию `'салат'` → `'салат_овощной'` в `recipes` (~50 старых рецептов) — единообразие со схемой `'салат_белковый'`. Миграция: `UPDATE recipes SET category = 'салат_овощной' WHERE category = 'салат'` + точечные правки во фронте и API.
- Добавить флаг `is_active_for_weekly` в `recipes` для ручного управления выдачей в рацион (`/api/kitchen/weekly/generate`) независимо от `is_active`. Сейчас все рецепты с `is_active = true` и подходящей категорией — кандидаты, без возможности точечно отключить.
- Добавить в описание рациона пункт про взаимозаменяемость зелени (салат / шпинат / руккола / айсберг). Правка в UI/PDF, не в алгоритме.
- Проверить поле `cuisine` у старых рецептов — возможно пустое или с разнобоем значений. Стандартизировать.

**Источник:** `_drafts/KITCHEN_CONSOLIDATED.md`, раздел «Архитектурные (отложенные)»

### Уборка после R54 (git cleanup)

- [ ] **R65** — `public/club/` (20 MB дизайн-материалов): решить, переместить в `docs/_drafts/` или удалить. Контекст: 4 HTML-версии лендинга + 45 PNG-скриншотов + 2 docx, 20 MB. На диске остаётся, в репо не попадает (.gitignore). Страховочный архив есть (18 мая 2026).

- [ ] **R66** — `supabase/migrations/seed_test_elena.sql`: переместить в `scripts/seeds/` или удалить. 8.4 KB, не закоммичен (R54/commit-9 намеренно исключил). PII-подобное имя.

- [ ] **R67** — Большие картинки в репо (~14 MB): сжать (TinyPNG/WebP) или вынести на CDN. Попали в репо в R54/commit-3: `public/images/after.png` (3.7 MB), `public/images/befor-1.png` (2.7 MB), `public/images/authors/natalia.jpg` (7.4 MB).

- [ ] **R68** — Корневые legacy-файлы на GitHub: удалить отдельной уборкой. `vercel.json` (наследие Vercel, проект на Beget), HTML-макеты в корне (`about-page.html`, `club-page.html`, `marathon.html`, `meditations.html`, `results-page.html` и др.), `natalia.jpg` в корне, `клубные_Геткурс.csv`. Все есть в страховочном архиве 18 мая 2026.

- [ ] **R69** — `claude_code_tasks/` на диске: добавить в `.gitignore` навсегда или удалить. Локальная папка с большими ТЗ-файлами (MAIN_STRUCTURE ~40K, TZ_ETAP_3_FINAL ~67K и др.), в репо не нужна.

### Модуль дневника и трекера (разведка 23.05.2026)

- [ ] **R70** (низкий) — Решить судьбу `diary_notes` API. `/api/diary/notes` существует, ни один компонент не вызывает. Либо удалить роут и таблицу, либо подключить к UI. Источник: `src/app/api/diary/notes/route.ts`.

- [ ] **R71** (средний) — Расследовать `member_id` vs `user.id` в diary/tracker/wins роутах. Часть роутов (`entries`, `water`, `notes`, `tracker/measurements`, `wins`) использует `user.id` напрямую, часть (`feelings`, `calendar`) — email lookup в `members`. Если `auth.users.id ≠ members.id` на проде — половина дневника сломается. Проверить: `SELECT u.id, m.id FROM auth.users u JOIN members m ON m.email = u.email WHERE u.id != m.id`. См. `03-club/_findings.md`.

- [ ] **R72** (низкий) — Восстановить миграции для 5 таблиц. `diary_entries`, `diary_water`, `diary_notes`, `measurements`, `wins` — без SQL-миграций (схема выведена только из кода). Снять DDL с боевой БД, записать в `supabase/migrations/`. Повышает воспроизводимость при разворачивании на новой БД. См. `05-infrastructure/_findings.md`.

- [ ] **R73** (средний) — Баг зелёных кружков в календаре дневника + отладочные логи. В сессии 04.04.2026 `/api/diary/calendar` возвращал пустые массивы. В текущем коде `calendar/route.ts` остались 3 отладочных `console.log`. Проверить починен ли баг на проде, убрать логи. Источник: `src/app/api/diary/calendar/route.ts`.

- [ ] **R74** (низкий) — Разобраться с `initial_weight` vs `start_weight` в `members`. `/api/tracker/summary` использует `initial_weight`, `/dashboard/tracker/page.tsx` — `start_weight`. Дублирование или разные смыслы? Документировать в `04-admin/modules/members.md` (или будущем `measurements.md`). См. `04-admin/_findings.md`.

- [ ] **R75** (низкий) — Мёртвый и сломанный компонент `WinsForm.tsx`. `src/components/WinsForm.tsx` (61 строка) нигде не используется (grep нашёл только сам файл). Помимо того что мёртвый — делает `.insert({ text })`, тогда как колонка в БД называется `result`; также не передаёт обязательное поле `week_date`. При подключении упал бы с ошибкой БД. Удалить или переписать. Источник: `src/components/WinsForm.tsx`.

### Публичный сайт — роутинг и стили (разведка 23.05.2026)

- [ ] **R86** (низкий) — Найти настоящий `middleware.ts` — откуда импортируется `proxy()`. `src/proxy.ts` содержит `export async function proxy()` и `export const config`, но не является стандартным Next.js middleware. `.next/server/middleware-manifest.json` пустой. При разведке точка импорта не найдена. Проверить: `grep -rn "from.*proxy\|require.*proxy" src/ --include="*.ts"`. Источник: `src/proxy.ts`.

- [ ] **R87** (низкий) — Задокументировать nginx-блок для `nata-tomshina.ru`. В репо `deploy/nginx.conf` есть только блок для `club.nata-tomshina.ru`. Блок основного домена настроен на сервере вне репо — конфигурация невоспроизводима. Снять с сервера и добавить в `deploy/nginx.conf` или `docs/05-infrastructure/server.md`. Источник: `deploy/nginx.conf`.

- [ ] **R88** (низкий) — Оценить вес CSS публичного сайта. `theme.css` 79 KB + `blog-content.css` 42 KB = 121 KB CSS грузятся на каждой странице публичного сайта без route-based splitting. Проверить реальный impact (gzip даст 20–30 KB), решить нужно ли разбивать. Источник: `src/app/public-site/layout.tsx`.

### Модуль побед (разведка 23.05.2026)

- [ ] **R81** (низкий) — `wins.is_featured` — заготовка, нигде не используется. Поле `is_featured boolean DEFAULT false` есть в схеме таблицы, но ни читается, ни пишется нигде в коде. Решить: реализовать механизм «избранных побед» или убрать поле. Источник: `src/app/(club)/dashboard/wins/`, `src/app/api/wins/route.ts`.

- [ ] **R82** (низкий) — Мёртвый роут `/api/wins/count`. Файл `src/app/api/wins/count/route.ts` существует и регистрируется Next.js роутингом, но ни один клиентский компонент его не вызывает. Паттерн аналогичен `/api/diary/notes` (R70). Удалить или подключить. Источник: `src/app/api/wins/count/route.ts`.

- [ ] **R83** (средний) — Расхождение стартового веса в прогресс-блоке победм и в трекере. `wins/page.tsx` берёт стартовый вес как `measurements[0].weight` (первый замер по дате), тогда как `/api/tracker/summary` использует `members.initial_weight`. Если значения расходятся — участница видит разный прогресс на `/dashboard/wins` и `/dashboard/tracker`. Унифицировать источник стартового веса. Связано с R74. Источник: `src/app/(club)/dashboard/wins/page.tsx`, `src/app/api/tracker/summary/route.ts`.

- [ ] **R84** (низкий) — `wins.week_date` семантически не используется. Поле NOT NULL, при POST пишется текущая дата UTC, при чтении не фильтруется, в UI не отображается — фактически дублирует `created_at`. Агрегация по неделям планировалась, но не реализована. Решить: удалить поле или реализовать недельную агрегацию. Источник: `src/app/api/wins/route.ts`.

- [ ] **R85** (низкий) — `totalCount` не синхронизируется между виджетом дашборда и страницей побед. Если победа добавлена через виджет `/dashboard` (`source: 'dashboard'`), счётчик «N записей» на `/dashboard/wins` обновится только при следующем server render. Оптимистичный `setTotalCount` работает только внутри той же страницы. Источник: `src/app/(club)/dashboard/wins/WinsClient.tsx`.

### Модуль замеров (разведка 23.05.2026)

- [x] **R76** ✅ 2026-05-23 — `craving` vs `sweet_craving` в `measurements`. Диагностика подтвердила: в БД колонка называется `sweet_craving`, код использует `sweet_craving` — всё верно. Баг был только в `TRACKER_IMPL.md` (DDL называл поле `craving`). Достижения «Месяц без тяги» и «Квартал без тяги» работают корректно.

- [ ] **R77** (низкий) — `measurements.note` есть в SELECT и TypeScript interface, нет в форме UI. Поле `note text` существует в схеме и возвращается всеми GET-запросами, но форма его не передаёт при POST. Подключить в форму замера или убрать из SELECT/interface. Источник: `src/app/api/tracker/measurements/route.ts`, `src/components/TrackerClient.tsx`.

- [ ] **R78** (средний) — `kbju_manual: false` сбрасывается при каждом замере веса. POST `/api/tracker/measurements` всегда ставит `kbju_manual: false` и пересчитывает КБЖУ по новому весу. Если участница через `/api/profile/kbju-override` снизила углеводы вручную (`kbju_manual: true`) — её override теряется при следующем замере. Уточнить у Наташи: намеренное поведение или баг?

- [ ] **R79** (низкий) — Достижение «Цель достигнута» в трекере. TRACKER_IMPL.md описывает достижение с иконкой 🎯 (`weight <= goalWeight`). В текущем коде его нет, иконки достижений тоже не совпадают: источник `🎯 ⭐ 🔥 📏 💎 👑`, код `🌱 ⭐ 🏆 💚 🍬 👑`. Решить: добавить «Цель достигнута» и синхронизировать иконки — или обновить TRACKER_IMPL.md как устаревший. Источник: `src/components/TrackerClient.tsx`.

- [ ] **R80** (низкий) — Timezone-уязвимость в `todayStr()` трекера. Функция использует `new Date().toISOString().split('T')[0]` без защиты `setHours(12,0,0,0)`. При UTC+3 в окне 00:00–03:00 дата формы будет вчерашней. Непоследовательно: в дневнике защита есть (`T12:00:00`). Источник: `src/components/TrackerClient.tsx:57`.

## 📐 Решения по структуре Vault

Архитектурные решения, принятые в ходе сборки Vault. Не задачи, а контекст для будущих сессий, чтобы не пересматривать одно и то же.

### Один файл модуля на раздел с двойным интерфейсом

Если раздел есть и в `/dashboard/` (для участницы), и в `/admin/` — описываем одним файлом в `03-club/modules/` с двумя секциями: «Что видит участница» и «Что делает админ». Не плодим параллельные файлы в `04-admin/modules/`. Админский INDEX ссылается на модули клуба для таких разделов. Отдельные файлы в `04-admin/modules/` — только для чисто административных инструментов (Рассылки, Аналитика, CMS, Партнёры, Оформление и т.п.).

### Умная кухня и Рацион — два отдельных модуля

В UI «Рацион на неделю» — это вкладка внутри Умной кухни, но в Vault выделяем в отдельный файл [[03-club/modules/meal-plans]], потому что Рацион — самая активно дорабатываемая часть кухни (обучение системы), у него своя история изменений и свой tech-debt. Калькулятор остаётся секцией внутри [[03-club/modules/smart-kitchen]] как вспомогательная утилита.

**Порядок разбора в Волне 4:** сначала `smart-kitchen.md` (Рецепты + Калькулятор + общая инфраструктура продуктов и КБЖУ), потом `meal-plans.md` (опирается на инфраструктуру из smart-kitchen, не дублирует).

### SEO-блог — отдельный Vault

SEO-блог и контент-стратегия (`Клуб разработка/БЛОГ + SEO/`) не входят в технический Vault. Это самостоятельная вселенная с агентами, SILO-структурой, правилами перелинковки. Собирается отдельно, когда дойдут руки. Подробнее: [[08-roadmap/ideas#инфраструктура-знаний|Инфраструктура знаний]].

### Разобрать PROJECT_BRAIN_v10..v16 для восстановления хронологии проекта

В `~/Desktop/Клуб разработка/` лежат 7 версий **PROJECT_BRAIN_v10.md..v16.md** — это история «мозга проекта» до того, как мозгом стал `CLAUDE.md`. По логике именования — продолжение того же документа. Скорее всего, там точные даты появления модулей (медитации, вебинары, подписки), отброшенные архитектурные решения и причины «почему так а не иначе».

Сейчас при сборке модулей в Vault мы вынуждены писать «существует с ранних версий клуба» — потому что в `CLAUDE.md` (v15, не обновлялся с 14 апреля 2026) этой хронологии нет. PROJECT_BRAIN'ы должны её закрыть.

Это отдельная фаза работы — не вкладывается в Волну 4 (тематические модули).

**План:**
1. Прочитать все 7 версий по порядку
2. Построить diff между ними — что добавлено, что убрано, что переименовано
3. Извлечь хронологию модулей (когда что появилось)
4. Извлечь отброшенные решения (контекст для будущих архитектурных вопросов)
5. Положить результат в `07-sessions/project-history.md` + ссылку из `07-sessions/INDEX.md`
6. После этого PROJECT_BRAIN_v* можно архивировать — знания вытащены

**Дополнительно: `CLAUDE.md` v15 устарел на месяц.** Не обновлялся с 14 апреля 2026. Содержит правила #1–#24 (которые корректны) + снимок проекта на 14 апреля. Не знает про `webinars.html_url`, `webinars.is_paid`, `weeklyPlanHelper.ts`, пять майских коммитов по кухне, текущее число участниц. Решение: либо обновить, либо депрекейтить в пользу Vault.

## Баги

- [x] **R50** ✅ 2026-05-23 — UI ручного апгрейда не выставлял `subscription_plan`. Исправлено в трёх местах: PATCH `members/[id]` (блок `tariff` и блок `extend_days`) + POST `members` (upsert при создании). Теперь `getEffectiveMonths()` корректно считает бонус +6 мес для halfyear, уровни и квоты вебинаров работают верно.

- [ ] **R51** — UI-метка «Заблокированные» для сегмента `cancelled` в `/admin/emails` не соответствует семантике. Статус `cancelled` означает «отменила рекуррент в CloudPayments», но вход через OTP не блокируется (блокирует только `expired`). Изменить метку в `src/app/api/admin/emails/segments/route.ts` (или клиентском файле страницы) на «Отменила подписку». См. `04-admin/modules/emails.md` § «Сегменты получателей».

- [ ] **R52** — Нет глобального rate limiter в `send-announcement`. В `src/app/api/admin/emails/send-announcement/route.ts` только `BATCH_SIZE=50` + `BATCH_DELAY_MS=1000`. При рассылке на 500+ адресатов можно упереться в лимиты Beget SMTP. Добавить общий учёт отправок (например, не более N писем/минуту независимо от батчей). См. `04-admin/modules/emails.md` § «Отправка массовой рассылки».

- [ ] **R53** — Детальный состав email-серий не задокументирован. Из кода известны имена `welcome_leads`, `evergreen`, `welcome`, но шаги (`step`, `subject`, `delay_days`) лежат в БД-таблице `email_sequences` и в `emails.md` не описаны. Сделать выгрузку из `email_sequences` и дополнить `04-admin/modules/emails.md` § «Автоматические серии».

- [x] **R54** ✅ 2026-05-19 — Git-дисциплина: разобрать 144 файла висящих изменений в рабочей копии (накопленная разработка за несколько недель). Закоммитить логическими блоками: kitchen patches, email module, new landing, cron endpoints, migrations, CLAUDE.md v16, cleanup legacy pages. Запушить на GitHub. После — внести в `_templates/CLAUDE-RULES.md` правило «коммит после каждой правки, push раз в день». Выполнено: 13 коммитов + commit-4a, GitHub = production. См. сессию 2026-05-19 чата.

- [x] **R55** ✅ 2026-05-19 — Cron `email-sequences` не заменяет `{{unsubscribe_token}}` в письмах серий. В `src/app/api/cron/email-sequences/route.ts` вызов `sendEmail()` идёт без замены токена и без `raw: true` → все автоматические серии (welcome_leads, evergreen, welcome_members) уходят с буквальной строкой `{{unsubscribe_token}}` в ссылке «Отписаться». Пользователь не может отписаться от серийных писем. Добавить замену по аналогии с `send-announcement/route.ts:104` (`html.replace('{{unsubscribe_token}}', emailToToken(email))`). **Высокий приоритет** — нарушает требования законодательства об отписке.

- [x] **R56** ✅ 2026-05-19 — Cron `subscription-reminders` шлёт двойную HTML-обёртку. В `src/app/api/cron/subscription-reminders/route.ts` отправка полного `<!DOCTYPE html>` идёт без `raw: true` → `sendEmail` оборачивает её ещё раз в `baseEmailTemplate` → вложенные HTML-документы в письме. Добавить `raw: true` в вызов `sendEmail()`. VIP-напоминания приходят битыми с момента запуска cron 2026-05-19.

- [ ] **R57** — Несоответствие документации: `00-INDEX.md` и `tech-debt.md` указывают «OTP через Resend, мигрируем на Beget». Это про **GoTrue OTP** (вход в клуб), не про код проекта. Проверить на сервере `/opt/supabase/docker/.env` → `GOTRUE_SMTP_HOST=?` (Resend SMTP relay или Beget?). По результатам — обновить `00-INDEX.md`, `tech-debt.md` и `05-infrastructure/email-system.md`.

- [ ] **R58** — Два email-шаблона в коде расходятся. `src/lib/email-templates/base.ts::baseEmailTemplate` (тёмная шапка #2d1f3d) используется в реальных отправках. `src/lib/email-template.ts::buildEmailHtml` (градиент #6B4FA0→#9B6FD0) используется только в превью UI `EmailBuilder`. Пользователь админки видит превью в одном дизайне, а получатель получает письмо в другом. Решить: какой из двух — основной, и удалить второй.

- [ ] **R59** — `emailToToken` (`src/lib/email-utils.ts`) использует plain base64url без HMAC и без соли. Любой может сгенерировать unsubscribe-ссылку для любого email. Для `subscribers` (CRM-лиды) приемлемо, но решение должно быть осознанным. Зафиксировать в `05-infrastructure/email-system.md` как «приемлемый риск» или добавить HMAC-подпись.

- [ ] **R60** — Верифицировать `database.md` с боевой БД. Запустить `psql "$DATABASE_URL" -c "\dt public.*"` на проде и сравнить с текущим списком 72 таблиц. Возможны пропуски таблиц через RPC и Edge Functions. Приоритет: низкий (сделать когда появится DATABASE_URL в окружении Claude Code).

- [ ] **R61** — Написать модуль: Канал клуба. Файл: `03-club/modules/channel.md`. Таблицы: `channel_posts`, `private_messages`, `channel_last_seen`, `channel_likes`, `announcements`. Источник: `src/app/api/channel/`.

- [ ] **R62** — Написать модуль: Обучающие курсы. Файл: `03-club/modules/courses.md` (или два модуля — решить при написании). Таблицы: `body_sections`, `body_materials`, `intro_courses`, `intro_lessons`, `intro_lesson_materials`. Источники: `src/app/api/body/`, `supabase/migrations/intro_courses.sql`.

- [ ] **R63** — Разобраться с `push_subscriptions`. Таблица найдена в коде, нигде не задокументирована. Если фича Web Push работает — написать описание (в `subscriptions.md` или отдельный раздел). Если заброшена — пометить legacy в `tech-debt.md`. Источник: `src/hooks/usePushNotifications.ts`, `src/app/api/notifications/route.ts`.

- [x] **R64** ✅ 2026-05-23 — SEO/Блог: зафиксировать как «вне scope Vault». Решено: вместо «вне scope» добавлен `02-public-site/blog-infrastructure.md` — техническая инфраструктура блога (шаблоны, таблицы, CSS, маркеры, ISR). Контентные правила SILO/Pillar и SEO-стратегия остаются вне Vault.

### Модуль историй преображения (разведка май 2026)

- [ ] **R94** (средний) — Rule #11 в `/api/admin/result-cases/route.ts` и `/api/admin/result-cases/[id]/route.ts`. Обе функции `requireAdmin()` используют `supabase.from('members').select('role').eq('id', user.id)` вместо email lookup. Если `auth.users.id ≠ members.id` — admin-проверка ломается (роут либо пропустит, либо отклонит). Источник: `src/app/api/admin/result-cases/route.ts:10`, `src/app/api/admin/result-cases/[id]/route.ts:10`.

- [ ] **R95** (низкий) — `result_cases` — мёртвый модуль. API-роуты `/api/admin/result-cases/*` (GET, POST, PUT, DELETE, upload-photo) существуют и зарегистрированы в Next.js роутинге, но: нет admin UI страницы, публичный сайт таблицу не читает, ни один клиентский компонент не вызывает эти роуты. Auth нарушает Rule #11 (R94). Решить: удалить API-роуты и таблицу `result_cases` или задокументировать как legacy с пометкой «не подключать». Storage bucket `result-photos` также можно очистить. Источник: `src/app/api/admin/result-cases/`.

### Модуль профиля участницы (разведка май 2026)

- [ ] **R91** (средний) — Rule #11 в `ProfileClient.tsx` и `AvatarUpload.tsx`. `saveProfile()`, `saveHealth()` и DB-обновление после загрузки аватара используют `.eq('id', userId)` где `userId = user.id` (auth id из SSR-пропа). Если `auth.users.id ≠ members.id` — сохранения данных профиля и аватара обновят ноль строк или неверную строку. Исправить: передавать `member.id` из SSR (уже есть в `page.tsx` как `member.id`) вместо `user.id`, или делать email lookup на клиенте. Источник: `src/components/ProfileClient.tsx`, `src/app/(club)/dashboard/profile/AvatarUpload.tsx`.

- [ ] **R92** (средний) — Rule #11 в `DELETE /api/profile/avatar`. Роут использует `admin.from('members').update({ avatar_url: null }).eq('id', user.id)`. Storage-путь `{user.id}/avatar.jpg` корректен и менять его не нужно. Исправить только DB update: заменить `.eq('id', user.id)` на email lookup. Источник: `src/app/api/profile/avatar/route.ts:19`.

- [ ] **R93** (низкий) — Отладочные `console.log` в двух API-роутах. `/api/member/me` содержит `console.log` на чтение профиля; `/api/onboarding/profile` содержит два `console.log` с `user.email` и результатом UPDATE. Не влияют на работу, но замусоривают серверные логи. Убрать. Источник: `src/app/api/member/me/route.ts`, `src/app/api/onboarding/profile/route.ts`.

### Модуль избранных рецептов (разведка май 2026)

- [ ] **R89** (средний) — Лимит `maxCount = 50` для `saved_recipes` не защищён на сервере. `FavoritesClient` проверяет лимит только в UI — клиент с anon-ключом может вставить >50 записей напрямую через Supabase. Нужен CHECK-constraint или RLS-триггер в БД. Источник: `src/app/(club)/dashboard/favorites/page.tsx:56`, `src/components/FavoritesClient.tsx:199`.

- [ ] **R90** (средний) — `POST /api/kitchen/recipes` использует `.eq('id', user.id)` при lookup профиля участницы и обновлении счётчика `kitchen_requests_today` — нарушение правила #11. Если `auth.users.id ≠ members.id` — счётчик кухни (3/10 запросов в день) сломается: лимит не будет считаться корректно, участница получит бесконечные запросы или ошибку `no_kbju`. Исправить на email-lookup. Источник: `src/app/api/kitchen/recipes/route.ts:65,99`.

### Публичный сайт — SEO и роутинг (разведка 2026-05-23)

- [ ] **R96** (средний) — Rule #11: `proxy.ts` не причём (там нет проверки ролей). По итогам разведки 2026-05-23: **42 API-роута** используют `.eq('id', user.id)` вместо `.eq('email', user.email)` в локальных копиях `requireAdmin`. Не ломает сейчас (единственный admin зарегистрирован через Supabase UI, UUID совпадают), но нарушает правило #11. Механическая правка — отдельная сессия. Подробнее: tech-debt.md § «Системный аудит Rule #11».

- [ ] **R97** (низкий) — `/results` (листинг историй успеха) не добавлена в sitemap. Canonical есть (`https://nata-tomshina.ru/results`), в `sitemap.ts` страница отсутствует. Поисковики найдут через внутренние ссылки, но важная страница без явного включения в sitemap — неоптимально. Добавить в статическую секцию `sitemap.ts` с priority 0.8. Источник: `src/app/public-site/sitemap.ts`.

- [ ] **R98** (средний) — `/recipes/[category]/[slug]` — нет canonical в `generateMetadata`. Все остальные основные страницы имеют `alternates.canonical`. Canonical — базовая SEO-гигиена, без него страница рискует дублироваться. Добавить `alternates: { canonical: \`https://nata-tomshina.ru/recipes/${params.category}/${params.slug}\` }` в `generateMetadata`. Источник: `src/app/public-site/recipes/[category]/[slug]/page.tsx`.

- [ ] **R99** (средний) — `/club` — нет `alternates.canonical` и `openGraph.url`. `/club` — главный конверсионный лендинг клуба. Без canonical он рискует дублироваться с `/` в индексе Google. Добавить `alternates: { canonical: 'https://nata-tomshina.ru/club' }` и `openGraph.url` в `metadata`. Источник: `src/app/public-site/club/page.tsx`.

- [ ] **R100** (низкий) — `src/app/public-site/robots.ts` — мёртвый код. Middleware `src/proxy.ts` исключает `robots.txt` из matcher — запросы не переписываются в `/public-site/robots.txt`. Поисковики получают `public/robots.txt` (статику). Правки в `robots.ts` не влияют на SEO. Удалить файл или оставить как документацию (пометить комментарием). Источник: `src/app/public-site/robots.ts`.

- [ ] **R101** (средний) — Отсутствует Schema.org на главных страницах. `/` — нет `WebSite` + `Organization` schema (влияет на rich snippets и LLM-парсинг). `/about` — нет `Person` schema (Наташа — лицо бренда, автор). Добавить inline JSON-LD по аналогии с `/blog/[cat]/[subcat]/[slug]`. Источник: `src/app/public-site/page.tsx`, `src/app/public-site/about/page.tsx`.

- [x] **R102** ✅ 2026-05-23 — `/recipes`, `/menyu`, `/partner`, `/racion` скрыты из навигации и от роботов. Убраны из PublicNav, PublicFooter, sitemap; добавлены в robots.txt (Disallow). Роуты сохранены. /partner скрыт из футера, роут `/partner` сохранён — вернуться когда будет готов к запуску.

### Публичный сайт — процесс публикации (разведка 2026-05-23)

- [ ] **R107** (средний) — Rule #11 в `generate-image/route.ts`. Локальная копия `requireAdmin()` использует `.eq('id', user.id)` вместо email lookup — нарушение правила #11. Если `auth.users.id ≠ members.id` — AI-генерация изображений возвращает 403 для всех admin. Это **седьмая точка нарушения Rule #11** в коде (R71, R90, R91, R92, R94, R96 — предыдущие). Системный паттерн: см. tech-debt.md § «Системный аудит Rule #11». Источник: `src/app/api/admin/generate-image/route.ts:8`.

- [ ] **R108** (низкий) — Нет превью черновиков статей. Страница `/blog/{cat}/{subcat}/{slug}` фильтрует `is_published=true` → черновик всегда 404 на публичном сайте. Кнопки «Предпросмотр» нет. В связке с AI-генератором (всегда сохраняет как черновик) — автор не может проверить вёрстку до публикации. Решение: роут `/api/preview?token=...` с bypassed published-check или временный signed URL. Источник: `src/app/public-site/blog/[category]/[subcategory]/[slug]/page.tsx:32`.

- [ ] **R109** (низкий) — Удаление статьи / истории не очищает Storage. При `DELETE /api/admin/blog/{id}` — bucket `blog-images` не чистится (пути `blog/{slug}/*` остаются). При `DELETE /api/admin/results-stories/{id}` — bucket `results-photos` не чистится (зафиксировано в stories-admin.md). Накопление сирот-файлов. Решение: добавить `supabase.storage.from('blog-images').remove([...paths])` в DELETE-роут после удаления записи. Источники: `src/app/api/admin/blog/[id]/route.ts:63`, `src/app/api/admin/results-stories/[id]/route.ts:91`.

### Публичный сайт — блог (разведка 2026-05-23)

- [x] **R103** ✅ 2026-05-23 — Баг в sitemap: блог-секция включает рецепты с неверными URL. Закрыт в рамках R102: раздел `/recipes` полностью убран из sitemap вместе с category hubs и individual recipe URLs.

- [ ] **R104** (низкий) — Дублированный `requireAdmin()` в blog-hubs и blog-subcategory-hubs роутах. `src/app/api/admin/blog-hubs/route.ts` и `src/app/api/admin/blog-subcategory-hubs/route.ts` содержат локальную копию логики requireAdmin вместо импорта из `src/lib/auth/requireAdmin.ts`. Функциональность верна (email lookup ✓), но при изменении requireAdmin нужно обновлять три места. Рефактор: заменить на импорт. Источник: `src/app/api/admin/blog-hubs/route.ts`, `src/app/api/admin/blog-subcategory-hubs/route.ts`.

- [ ] **R105** (низкий) — Мёртвый код: `KeywordsTab()` в `/admin/blog`. Функция объявлена в `src/app/(club)/admin/blog/page.tsx:319`, но не включена в массив `TABS` → вкладка «Ключевые слова» в UI не появится. Удалить или добавить в TABS. Источник: `src/app/(club)/admin/blog/page.tsx:319`.

- [ ] **R106** (средний) — Конфликт двух таксономий в форме создания статьи. В `src/app/(club)/admin/blog/page.tsx` категории статей берутся из двух несовместимых источников: `SILO_CONFIG` (5 категорий — pohudenie, zdorovye и т.д.) и `BLOG_CATEGORIES` (7 legacy-категорий — insulin, thyroid и т.д.) — оба в одном `<select>` (строки 224 и 276). Статьи с legacy-категорией получают URL `/blog/{legacy-slug}` — страница для них не существует. Фикс: убрать `BLOG_CATEGORIES` из формы, оставить только `SILO_CONFIG`. Источник: `src/app/(club)/admin/blog/page.tsx:224,276`.

### Публичный сайт — аналитика (разведка 2026-05-23)

- [ ] **R110** (низкий) — `trackEvent()` в `Analytics.tsx` определена, нигде не вызывается. Функция экспортируется из `src/components/public/Analytics.tsx`, но ни один компонент её не импортирует и не вызывает. Либо подключить к кнопкам «Вступить в клуб», «Подписаться» и виджетам (тогда события `click_club`, `click_lead`, `widget_complete` в admin/analytics заработают), либо удалить функцию и убрать нереализованные события из дашборда. Источник: `src/components/public/Analytics.tsx:19`.

- [ ] **R111** (низкий) — Миграция для `page_views` отсутствует в репо. Таблица создана вручную в Supabase Studio, DDL нигде не зафиксирован. При разворачивании на новой БД таблица не создастся. Снять DDL с боевой БД и добавить в `supabase/migrations/`. Аналогично R72 для таблиц дневника. Источник: `src/app/api/public/track/route.ts:34`.

- [ ] **R112** (низкий) — `track-email` роут не сохраняет данные в БД. `src/app/api/join/track-email/route.ts` добавляет email в аудиторию Resend, но в `members` или отдельную таблицу не пишет — только `console.log`. При анализе воронки нет возможности посмотреть историю лидов через SQL. Решить: добавить запись в `page_views` (`event: 'email_verified'`) или отдельную таблицу лидов. Источник: `src/app/api/join/track-email/route.ts:25`.

- [ ] **R113** (средний) — Нет cookie consent / 152-ФЗ баннера. На сайте используется Яндекс.Метрика с Вебвизором (запись сессий) — это персональные данные по 152-ФЗ и cookies по GDPR. Никакого согласия не запрашивается. Минимум: добавить уведомление «Сайт использует cookies» с кнопкой «Принять». Максимум: CookieYes или аналог с разделением на необходимые / аналитические. Источник: `src/app/layout.tsx:90–124`.

### R-NEW — Нормализовать TARIFF_LABELS, убрать дубликаты русских ключей

TARIFF_LABELS содержит 6 ключей (3 английских + 3 русских дубликата),
из-за чего админка рендерит 6 кнопок вместо 3 (две с label 'Месяц',
две с 'Полгода'). Текущая защита через `tariffDefaultDate` покрывает
кейс, но корневая проблема — разнобой в БД (`tariff` имеет 6 исторических
значений). Решается миграцией значений в БД к каноническим английским
ключам + чисткой TARIFF_LABELS.

Связано: tech-debt про `tariff` vs `subscription_plan`, баг R3.

## Связано

- [[08-roadmap/tech-debt|Технический долг]]
- [[07-sessions/INDEX|Хронология сессий]]
