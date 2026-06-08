# 📜 Сессии работы с Claude

Хронология рабочих сессий. Новые — сверху.

Имена файлов: `YYYY-MM-DD.md`. Суффикс `a/b` — несколько сессий за день. Суффикс-дескриптор (например `2026-04-style-refactor`) — когда точная дата неизвестна.

## 2026

### Июнь
- [[07-sessions/2026-06-08|8 июня — subscription_started_at сброс + видео в курсе]] — баг started_at (9 восстановлено); lesson_type data-driven рендер; R114–R122 оформлены
- [[07-sessions/2026-06-06|6 июня — 4 бага, legacy Vercel, churn-серия]] — R3/R4/R57/R78/рекуррент закрыты; обезврежен Vercel deployment (полгода работал параллельно); создана churn-серия 1/2/3/15/30

### Май
- [[07-sessions/SESSION_2026-05-22_VAULT_HANDOFF|22 мая — R54 закрыт]] — push 14 коммитов на GitHub (прод и репо синхронизированы), Vercel disconnected, раздел «Git-дисциплина» в CLAUDE-RULES.md
- [[07-sessions/SESSION_2026-05-21_VAULT_HANDOFF|20–21 мая — database и members]] — database.md (72 таблицы), members.md (последний админский модуль), исправлены R55 и R56 (email-баги)
- [[07-sessions/SESSION_2026-05-20_VAULT_HANDOFF|19 мая (вечер) — операции и email]] — manual-procedures.md, emails.md, email-system.md, копилка `_findings.md`, R55/R56 найдены
- [[07-sessions/SESSION_2026-05-19_VAULT_HANDOFF|19 мая — инфраструктура и cron-fix]] — server.md, payments.md, marathons.md, subscriptions.md; cron `check-subscriptions` и `subscription-reminders` запущены на проде
- [[07-sessions/2026-05-18-vault-build|18 мая — сборка Vault]] — Волна 4 (медитации, вебинары), частично Волна 3.5 (кухня); зафиксирована методика «код = первый источник истины»
- [[07-sessions/2026-05-18-vault-plan|18 мая — план Vault]] — архитектура «мозга проекта», скелет Vault, страховочный архив
- [[07-sessions/2026-05-17|17 мая — фиксы]] — PDF-превью race condition, заглушка check-subscriptions, исследование Resend, фикс `subscription_plan = 'halfyear'`
- [[07-sessions/2026-05-16|16 мая — мини-курс и лендинг]] — переделка мини-курса, лендинг
- [[07-sessions/2026-05-15|15 мая — диагностика клуба и free-курс]] — общая диагностика, бесплатный курс
- [[07-sessions/2026-05-context|Май — контекст]] — обзорный handoff-документ за май (без точной даты)

### Апрель
- [[07-sessions/2026-04-style-refactor|Апрель — рефакторинг стилей]] — CSS публичного сайта, theme.css (точная дата неизвестна)
- [[07-sessions/2026-04-18|18-20 апреля]] — серии писем, EmailBuilder, история рассылок
- [[07-sessions/2026-04-16|16 апреля]] — управление днями марафона, HTML-презентации вебинаров, `is_active`
- [[07-sessions/2026-04-10|10 апреля]] — переход на SMTP Beget
- [[07-sessions/2026-04-07|7 апреля — безопасность]] — аудит безопасности
- [[07-sessions/2026-04-06b|6 апреля (вечер)]] — CloudPayments боевой
- [[07-sessions/2026-04-06a|6 апреля (день)]] — медитации, presigned URL
- [[07-sessions/2026-04-05|5 апреля]] — SMTP Beget и др.
- [[07-sessions/2026-04-04b|4 апреля (v4)]] — переезд: итоговый стек
- [[07-sessions/2026-04-04|4 апреля (v3)]] — переезд: БД, FK
- [[07-sessions/2026-04-03b|3 апреля (v2)]] — переезд на Beget, вечер 3-го / утро 4-го
- [[07-sessions/2026-04-03|3 апреля]] — переезд на Beget, день 1

## Хронология решений

- [[07-sessions/project-history|История проекта]] — R01–R55: ключевые архитектурные решения апреля–мая 2026 с контекстом «почему»

## Связано

- [[_templates/session-template|Шаблон сессии]]
