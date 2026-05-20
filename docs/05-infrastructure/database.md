# База данных — индекс таблиц

> Карта таблиц схемы `public` в Supabase.
> **Источник:** анализ `.from('table_name')` вызовов в `src/` — **не сверено с боевой БД**, дата сбора: 2026-05-19.
>
> **Слепое пятно:** таблицы, доступные только через Supabase RPC (`.rpc('func')`) или прямой SQL в Edge Functions, в этот список **не попали**. При верификации запустить на проде: `psql "$DATABASE_URL" -c "\dt public.*"` и сравнить с этим списком.
>
> Детальные описания структуры — в модулях по ссылкам. «Не задокументирована» = нет модульного файла в `03-club/`, `04-admin/` или `05-infrastructure/`.

**Всего таблиц: 72**

---

## Содержание

- [Участницы](#участницы) — 3
- [Подписки и оплаты](#подписки-и-оплаты) — 3
- [Email — CRM и серии](#email--crm-и-серии) — 7
- [Канал (лента клуба)](#канал-лента-клуба) — 5
- [Уведомления](#уведомления) — 2
- [Вебинары](#вебинары) — 5
- [Медитации](#медитации) — 3
- [Марафоны](#марафоны) — 6
- [Кухня и рецепты](#кухня-и-рецепты) — 7
- [Обучающие курсы](#обучающие-курсы) — 5
- [Дневник и трекер](#дневник-и-трекер) — 6
- [Партнёры / Аффилиаты](#партнёры--аффилиаты) — 3
- [Публичный сайт](#публичный-сайт) — 4
- [Помощь и контент](#помощь-и-контент) — 5
- [SEO / Блог](#seo--блог) — 8

---

## Участницы

### `members`
Основной справочник участниц клуба. Тариф, статус подписки, КБЖУ-поля, даты начала/конца подписки, реф-код.
Пишут: webhook CloudPayments, cron `check-subscriptions`, cron `subscription-reminders`, админка.
Читают: почти все модули клуба.
→ [subscriptions](../03-club/modules/subscriptions.md) · также: [emails](../04-admin/modules/emails.md), [payments](payments.md), [webinars](../03-club/modules/webinars.md)

### `avatars`
Хранит metadata загруженных аватарок участниц (ключ в Storage bucket).
→ [storage](storage.md)

### `birthday_greetings`
> [!warning] Не задокументирована.
Назначение по коду: автоматические поздравления участниц с днём рождения.
Источник: `src/app/api/birthdays/check/route.ts`.

---

## Подписки и оплаты

### `payment_logs`
Журнал всех входящих платёжных событий от CloudPayments (webhook).
Пишет: `src/app/api/payments/cloudpayments/route.ts`.
→ [payments](payments.md)

### `cancellations`
Журнал ручных отмен пробного периода. Пишет: `POST /api/subscription/cancel` (только при `subscription_status = 'trial'`). Поля: `member_id, email, plan`. Читается только как `count(*)` для виджета «Подписчицы» в админке — в рассылках не участвует. Не содержит отмен CloudPayments-рекуррентов.
→ [emails](../04-admin/modules/emails.md) · [profile](../03-club/modules/profile.md)

### `pending_refs`
Временное хранилище реф-кодов партнёров при регистрации (до завершения оплаты). TTL-чистка отдельным процессом.
Пишет: `src/app/api/join/save-ref/route.ts`.
→ [payments](payments.md) · подробности аффилиатной логики: [Партнёры](#партнёры--аффилиаты)

---

## Email — CRM и серии

### `subscribers`
CRM-лиды: email-адреса с публичного сайта и из GetCourse. Сегментируются для рассылок. Статус `unsubscribed` выставляется через `/api/unsubscribe`.
Пишут: формы лендингов, CSV-импорт из GetCourse, CloudPayments webhook (синхронизация).
→ [emails](../04-admin/modules/emails.md) · [email-system](email-system.md)

### `email_sequences`
Библиотека шаблонов писем для автоматических серий (`step`, `subject`, `html`, `delay_days`, `is_active`).
Читает: cron `email-sequences`.
→ [emails](../04-admin/modules/emails.md) · [email-system](email-system.md)

### `subscriber_sequence_progress`
Прогресс каждого подписчика в серии (текущий шаг, когда следующая отправка, завершена ли серия).
Пишут: CloudPayments webhook, `verify-email`, `racion/verify-otp`, cron `email-sequences`.
→ [emails](../04-admin/modules/emails.md) · [email-system](email-system.md)

### `email_campaign_logs`
Журнал ручных рассылок (одна запись на отправку): `subject`, `recipients_count`, `sent_at`, `sent_by`. Без open/click rate.
Пишет: `src/app/api/admin/emails/send-announcement/route.ts`.
→ [emails](../04-admin/modules/emails.md)

### `email_campaigns`
> [!warning] Слабо задокументирована.
Вероятно, дополнительный справочник кампаний (может быть legacy). Упомянута в emails.md.
→ [emails](../04-admin/modules/emails.md)

### `email_templates`
> [!warning] Не задокументирована в основных модулях.
Хранит HTML-шаблоны писем для EmailBuilder (UI-редактор). Только в сессиях.
Источник: `src/app/api/admin/email-templates/route.ts`.

### `email_otps`
OTP-коды для входа в клуб (временные, TTL). Используются GoTrue/send-otp потоком на `club.nata-tomshina.ru`.
Читает: `src/app/api/public/verify-email/route.ts`, `src/app/api/racion/verify-otp/route.ts`.
→ [email-system](email-system.md) · [subscriptions](../03-club/modules/subscriptions.md)

---

## Канал (лента клуба)

### `channel_posts`
Посты в ленте клуба (текст, медиа, тип, автор). WebSocket Realtime через Supabase publication.
Пишут: участницы и admin через `/api/channel/posts`.
→ модуль «Канал» не написан, см. `07-sessions/project-history.md`

### `private_messages`
Личные сообщения между участницами и Натальей. Realtime.
→ модуль «Канал» не написан · упоминается: [webinars](../03-club/modules/webinars.md)

### `channel_last_seen`
> [!warning] Не задокументирована.
Хранит timestamp последнего прочтения канала для счётчика непрочитанных.
Источник: `src/app/api/channel/unread/route.ts`.

### `channel_likes`
> [!warning] Не задокументирована.
Лайки на посты в ленте.
Источник: `src/app/api/channel/posts/[id]/route.ts`.

### `announcements`
> [!warning] Не задокументирована.
Объявления в клубе (предположительно закреплённые сообщения или баннеры).
Источник: `src/app/api/channel/posts` или admin-роуты (grep показал использование).

---

## Уведомления

### `notifications`
Push-уведомления для участниц (OneSignal). Хранит историю отправленных.
→ [subscriptions](../03-club/modules/subscriptions.md)

### `push_subscriptions`
> [!warning] Не задокументирована.
Токены устройств для Web Push (OneSignal). Пишет `src/app/api/notifications/route.ts`.
Источник: `src/hooks/usePushNotifications.ts`.

---

## Вебинары

### `webinars`
Каталог вебинаров (название, slug, дата, is_paid, html_url).
→ [webinars](../03-club/modules/webinars.md)

### `webinar_lessons`
Уроки внутри вебинара (видео, порядок, доступность).
→ [webinars](../03-club/modules/webinars.md)

### `webinar_materials`
Материалы к вебинарам (PDF, ссылки).
→ [webinars](../03-club/modules/webinars.md)

### `webinar_access`
Доступ участницы к конкретному вебинару (purchased, granted).
Пишут: webhook CloudPayments (покупка), admin (ручная выдача).
→ [webinars](../03-club/modules/webinars.md)

### `webinar_selections`
Выбор вебинаров участницей для просмотра (избранное / «хочу посмотреть»).
→ [webinars](../03-club/modules/webinars.md)

---

## Медитации

### `meditation_courses`
Курсы медитаций (название, описание, обложка).
→ [meditations](../03-club/modules/meditations.md)

### `meditations`
Отдельные медитации внутри курса (аудио, длительность, порядок).
→ [meditations](../03-club/modules/meditations.md) · [storage](storage.md)

### `meditation_progress`
Прогресс участницы по медитациям (прослушано, дата).
→ [meditations](../03-club/modules/meditations.md)

---

## Марафоны

### `marathons`
Каталог марафонов (название, описание, даты, настройки).
→ [marathons](../03-club/modules/marathons.md)

### `marathon_days`
Дни марафона (задания, контент, порядок).
→ [marathons](../03-club/modules/marathons.md)

### `marathon_reminders`
Напоминания участницам по дням марафона (cron или ручные).
→ [marathons](../03-club/modules/marathons.md)

### `marathon_landing`
Данные для лендингов марафонов (секции, блоки контента, оффер).
→ [marathons](../03-club/modules/marathons.md)

### `marathon_task_completions`
> [!warning] Не задокументирована.
Отметки о выполнении заданий участницами по дням марафона.
Источник: `src/app/api/marathons/[id]/complete/route.ts`.

### `marathon_measurements`
> [!warning] Не задокументирована.
Замеры участниц в рамках марафона (вес, объёмы).
Источник: `src/app/api/marathons/[id]/route.ts` или `marathon-measurements`.

---

## Кухня и рецепты

### `recipes`
Банк рецептов (название, категория, КБЖУ, ингредиенты через recipe_ingredients). ~676 рецептов на май 2026.
→ [smart-kitchen](../03-club/modules/smart-kitchen.md)

### `recipe_ingredients`
Ингредиенты рецептов со ссылкой на `nutrition` (граммовка, роль).
→ [smart-kitchen](../03-club/modules/smart-kitchen.md)

### `nutrition`
Справочник продуктов КБЖУ (название, белки, жиры, углеводы, калории на 100г).
→ [smart-kitchen](../03-club/modules/smart-kitchen.md)

### `weekly_plans`
Недельные рационы участниц (сгенерированный план с рецептами по дням).
→ [meal-plans](../03-club/modules/meal-plans.md)

### `saved_recipes`
Рецепты из Умной кухни и Недельного плана, сохранённые участницей. Поля: `id, member_id, title, description, meal_type, ingredients (jsonb), steps (text[]), time_minutes, kbju_calories, kbju_protein, kbju_fat, kbju_carbs, created_at`. INSERT/DELETE — клиентом напрямую (anon-ключ), без API-роута. Лимит 50 на UI, серверно не защищён (R89).
→ [recipes](../03-club/modules/recipes.md)

### `member_recipes`
Собственные рецепты участниц из Калькулятора кухни. Поля: `id, member_id, name, ingredients (jsonb), total_calories, total_protein, total_fat, total_carbs, servings_count, created_at`. API: GET/POST `/api/member-recipes`, DELETE `/api/member-recipes/[id]`.
→ [recipes](../03-club/modules/recipes.md)

### `cooking_tips`
> [!warning] Не задокументирована.
Кулинарные советы (возможно блок в кухне или онбординге).
Источник: найдена в `.from()` вызовах, конкретный файл не установлен.

---

## Обучающие курсы

> Два курсовых модуля в одной группе: **Курс тела** (`body_*`) и **Вводный курс** (`intro_*`).
> Оба используют `/dashboard/courses` и `/dashboard/body/`. Модуль не написан.

### `body_sections`
> [!warning] Не задокументирована.
Разделы курса тела (блоки контента, порядок).
Источник: `src/app/api/body/sections/route.ts`, `src/app/api/admin/body/sections/route.ts`.

### `body_materials`
> [!warning] Слабо задокументирована (только сессии).
Материалы к разделам курса тела (PDF, видео, текст).
Источник: `src/app/api/admin/body/upload/route.ts`. Упомянута в `07-sessions/2026-04-06a.md`.

### `intro_courses`
> [!warning] Не задокументирована.
Вводные курсы (несколько курсов, каждый с уроками).
Источник: `supabase/migrations/intro_courses.sql`.

### `intro_lessons`
> [!warning] Не задокументирована.
Уроки внутри вводного курса.
Источник: `supabase/migrations/intro_courses.sql`.

### `intro_lesson_materials`
> [!warning] Не задокументирована.
Материалы к урокам вводного курса.
Источник: `supabase/migrations/intro_courses.sql`.

---

## Дневник и трекер

> Модуль «Дневник» не написан. Все таблицы — из сессий или кода.

### `diary_entries`
> [!warning] Слабо задокументирована (только сессии).
Записи дневника питания участницы (приёмы пищи, КБЖУ за день).
Источник: `src/app/api/diary/calendar/route.ts`. Упомянута в `07-sessions/2026-04-04b.md`.

### `diary_feelings`
> [!warning] Слабо задокументирована (только сессии).
Отметки самочувствия по дням.
Источник: `supabase/migrations/diary_feelings.sql`.

### `diary_notes`
> [!warning] Не задокументирована.
Текстовые заметки дневника.
Источник: `src/app/api/diary/` роуты.

### `diary_water`
> [!warning] Не задокументирована.
Учёт потребления воды.
Источник: `src/app/api/diary/` роуты.

### `measurements`
> [!warning] Слабо задокументирована (только сессии).
Замеры тела участницы (вес, объёмы, дата).
Источник: `src/app/api/tracker/measurements/route.ts`. Упомянута в `07-sessions/2026-05-18-vault-build.md`.

### `wins`
> [!warning] Слабо задокументирована (только сессии).
Победы и достижения участницы (ввод через WinInput).
Источник: `src/components/WinInput.tsx`. Упомянута в `07-sessions/2026-05-18-vault-build.md`.

---

## Партнёры / Аффилиаты

> Модуль «Партнёрская программа» не написан. Краткие находки — `02-public-site/_findings.md` § A6, B5.

### `affiliates`
> [!warning] Не задокументирована.
Партнёры (ref_code, status, total_earned, payment_details). Верифицируется при сохранении ref в `pending_refs`.
Источник: `src/app/api/partner/stats/route.ts`, `src/app/api/join/save-ref/route.ts`.

### `affiliate_clicks`
> [!warning] Не задокументирована.
Клики по реферальным ссылкам.
Источник: `src/app/api/partner/stats/route.ts`.

### `affiliate_commissions`
> [!warning] Не задокументирована.
Начисленные комиссии партнёрам.
Источник: `src/app/api/partner/stats/route.ts`.

---

## Публичный сайт

> Подробности — `02-public-site/_findings.md`.

### `page_views`
> [!warning] Слабо задокументирована (только _findings.md).
Внутренняя аналитика просмотров страниц (path, event, widget_type, referrer). Rate limit 30с/IP.
Источник: `src/app/api/public/track/route.ts`.

### `klub_diagnostics`
> [!warning] Слабо задокументирована (только _findings.md).
Квалификационные анкеты с лендинга клуба (возраст, проблемы, мотивация, контакты). Telegram-уведомление Наташе.
Источник: `src/app/api/public/club-diagnostic-submit/route.ts`.

### `results_stories`
> [!warning] Не задокументирована.
Истории результатов участниц для публичного раздела `/results`.
Источник: `src/app/public-site/results/page.tsx`, `supabase/migrations/create_results_stories.sql`.

### `result_cases`
> [!warning] Не задокументирована.
Кейсы (детальные истории) отдельных участниц (`/results/[slug]`).
Источник: `src/app/public-site/results/[slug]/page.tsx`.

---

## Помощь и контент

### `faq_items`
> [!warning] Слабо задокументирована (только сессии).
Вопросы-ответы для раздела помощи.
Источник: `src/app/api/help/route.ts`. Упомянута в `07-sessions/2026-05-context.md`.
→ [help-admin](../04-admin/modules/help-admin.md)

### `help_materials`
> [!warning] Слабо задокументирована (только сессии).
Обучающие материалы раздела помощи (статьи, видео).
Источник: `src/app/api/help/route.ts`. Упомянута в `07-sessions/2026-05-context.md`.
→ [help-admin](../04-admin/modules/help-admin.md)

### `onboarding_content`
> [!warning] Не задокументирована.
Контент онбординга для новых участниц.
Источник: `src/app/api/admin/onboarding/route.ts`.

### `page_content`
> [!warning] Не задокументирована.
CMS-контент страниц (предположительно редактируемые блоки на лендингах).
Источник: `src/app/api/admin/page-content/route.ts`.

### `seasonal_themes`
> [!warning] Не задокументирована.
Сезонные цветовые темы клуба (переключаются вручную через админку).
Источник: `src/app/api/admin/themes/route.ts`, `supabase/migrations/seasonal_themes.sql`.

---

## SEO / Блог

> SEO-блог вынесен в отдельный Vault (`Клуб разработка/БЛОГ + SEO/`). Таблицы обнаружены в коде, но не документируются в этом Vault. Подробнее: `08-roadmap/ideas.md` § «SEO-блог — отдельный Vault».

### `blog_posts`
> [!warning] Не задокументирована в техническом Vault.
Статьи SEO-блога.
Источник: `src/app/api/admin/blog/route.ts`.

### `blog_hubs`
> [!warning] Не задокументирована в техническом Vault.
Хаб-страницы блога (категории верхнего уровня).
Источник: `src/app/api/admin/blog-hubs/route.ts`.

### `blog_subcategory_hubs`
> [!warning] Не задокументирована в техническом Vault.
Подкатегории хабов.
Источник: `src/app/api/admin/blog-subcategory-hubs/route.ts`.

### `seo_clusters`
> [!warning] Не задокументирована в техническом Vault.
SEO-кластеры (группировка ключевых слов).
Источник: `src/app/api/yandex-parser/route.ts` или SEO_AGENTS.

### `seo_settings`
> [!warning] Не задокументирована в техническом Vault.
Настройки SEO (мета, структура сайта).
Источник: `src/app/api/admin/yandex-parser/route.ts`.

### `seo_topics`
> [!warning] Не задокументирована в техническом Vault.
Темы для SEO-контента.
Источник: SEO_AGENTS / `src/app/api/admin/generate-article/route.ts`.

### `keyword_queue`
> [!warning] Не задокументирована в техническом Vault.
Очередь ключевых слов для парсинга / генерации статей.
Источник: `src/app/api/admin/yandex-parser/route.ts`.

### `keyword_suggestions`
> [!warning] Не задокументирована в техническом Vault.
Предложенные ключевые слова из Яндекс-парсера.
Источник: `src/app/api/admin/yandex-parser/route.ts`.

---

## Связанные документы

- [payments](payments.md) — CloudPayments webhook, логика оплат
- [email-system](email-system.md) — каналы отправки, unsubscribe, серии
- [server](server.md) — cron-задачи, деплой
- [storage](storage.md) — Storage buckets (аватарки, медитации, медиа)
- [emails](../04-admin/modules/emails.md) — UI рассылок, сегменты
- `08-roadmap/todo.md` → R53 (детали email-серий), R57 (GoTrue SMTP)

---

*Обновлено: 2026-05-19. Источник: `.from()` вызовы в `src/`. Требует верификации с боевой БД.*
