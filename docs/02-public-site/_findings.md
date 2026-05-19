# Копилка находок: открытый сайт (nata-tomshina.ru)

> Попутные находки о публичном сайте, встретившиеся при работе над другими модулями Vault.
> Накапливаются до момента создания финальных модулей в `02-public-site/`.
>
> Правила работы с копилкой — `_templates/CLAUDE-RULES.md` § «Попутные находки — копилка».

## Что входит в «открытый сайт»

`https://nata-tomshina.ru/` — публичная часть **отдельно** от клуба (`https://club.nata-tomshina.ru/` — другой поддомен, отдельная вселенная).

Известные разделы (по разведкам предыдущих сессий):
- Главная страница (оффер, что в клубе)
- Лендинги (`/club`, `/free`, marathon-лендинги)
- Блог (если активны SEO_AGENTS)
- `/join`-флоу (попадание в email-серии)
- `/unsubscribe` — endpoint отписки для CRM-лидов
- Партнёрская программа (внешние ссылки)
- Платёжные интеграции на лендингах

## Архитектура (обнаружено 2026-05-19)

- Весь публичный сайт живёт в `src/app/public-site/` — отдельная папка внутри одного Next.js-приложения
- Корень `src/app/page.tsx` редиректит на `/auth` (клубная зона)
- Одно Next.js-приложение обслуживает оба домена (`nata-tomshina.ru` и `club.nata-tomshina.ru`). Роутинг по поддоменам — предположительно в middleware или `src/proxy.ts` (не проверено)
- Прежние папки `src/app/free/`, `src/app/club/` удалены — контент мигрировал в `public-site/`

Известные разделы внутри `public-site/`: главная, `/about`, `/club` (лендинг), `/free` (free-курс), `/free-kurs/` (+ `/plan`, `/racion`), `/marathon`, `/menyu/[category]`, `/recipes/[category]`, `/results/[slug]`.

## Находки

> Формат:
> ```
> ## YYYY-MM-DD из <путь-к-источнику>
> <суть находки в 2-3 предложениях>
> ```

### A1. 2026-05-19 из `src/app/api/join/track-email/route.ts`
При вводе email на лендинге `/join` (до оплаты) email добавляется в Resend Audience через `resend.contacts.create()` с `RESEND_AUDIENCE_ID`. Это единственное место использования Resend SDK в проекте — только CRM-список лидов, не для отправки писем. Env: `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`.

### A2. 2026-05-19 из `src/app/api/unsubscribe/route.ts`
`GET /api/unsubscribe?token=XXX` — декодирует токен через `tokenToEmail()`, ставит `status = 'unsubscribed'` и `unsubscribed_at = now()` в таблице `subscribers`. В `members` ничего не меняет. Редирект на `/unsubscribed`.

### A3. 2026-05-19 из `src/lib/email-templates/base.ts:33`
Все email-шаблоны содержат жёстко зашитую ссылку `href="https://nata-tomshina.ru/unsubscribe?token={{unsubscribe_token}}"`. Домен публичного сайта захардкожен в шаблоне — при смене домена потребуется правка кода.

### A4. 2026-05-19 из `src/app/api/public/verify-email/route.ts:60`
Подтверждение email на лендинге free mini-course (`verify-email`) триггерит INSERT в `subscriber_sequence_progress` с `series='welcome_leads'`. По завершении серии cron автоматически стартует `series='evergreen'` (`cron/email-sequences/route.ts:95`).

### A5. 2026-05-19 из `src/app/api/racion/send-otp/route.ts`, `verify-otp/route.ts:61`
Существует публичный инструмент `/racion` с собственным OTP через `mailer.ts` (не GoTrue). Требует JWT `free_token` (выдаётся после `verify-otp` через `verifyFreeToken`). Подтверждение OTP добавляет email в серию `welcome_leads` и запускает `racion/generate`.

### A6. 2026-05-19 из `src/app/api/partner/*`
Партнёрский кабинет имеет публичную часть на главном домене: страница входа, форма заявки `/partner/apply`, OTP-авторизация `/partner/auth/send-otp` через `mailer.ts` (не GoTrue), дашборд со статистикой кликов/комиссий. Авторизация через cookie из `src/lib/partner-auth.ts`. Подробности логики аффилиатов — в будущий `03-club/modules/affiliate.md`.

### B3. 2026-05-19 из `src/app/api/public/club-diagnostic-submit/route.ts`
**[вероятно станет модулем]** Квалификационная анкета на лендинге клуба (возраст, проблемы, что пробовала, мотивация, готовность, контакты). Пишет в таблицу `klub_diagnostics` + Telegram-уведомление Наташе (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`). Rate limit 1 запрос/IP/60с.

### B4. 2026-05-19 из `src/app/api/public/track/route.ts`
Внутренняя аналитика просмотров: `POST /api/public/track` пишет в таблицу `page_views` (path, event, widget_type, referrer). Rate limit: 1 событие `view` на IP+path каждые 30 сек (in-memory Map). Своя система трекинга, отдельно от внешних аналитик.

### B5. 2026-05-19 из `src/app/api/join/save-ref/route.ts`
**[вероятно станет модулем — связка с `affiliate.md`]** `POST /api/join/save-ref` сохраняет `{email, ref_code}` в таблицу `pending_refs` при вводе email на `/join`, если партнёр активен в `affiliates`. Связывает лид с аффилиатом до завершения оплаты.

### B6. 2026-05-19 из `src/app/api/payments/cloudpayments/route.ts`
Единственный платёжный webhook — `src/app/api/payments/cloudpayments/route.ts`. Других платёжных провайдеров в коде нет. Папка `src/app/api/payments/` содержит только директорию `cloudpayments/` с одним route.ts.

---

*Создано: 2026-05-19*
