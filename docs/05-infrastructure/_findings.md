# _findings — 05-infrastructure

Находки по инфраструктуре, обнаруженные при написании модулей Vault.
Каждая запись — повод для todo или осознанного решения «живём с этим».

---

## май 2026 из src/lib/club-mode.ts (разведка для decoration-admin)

**NEXT_PUBLIC_CLUB_MODE — назначение раскрыто.**

Переменная висела как открытый вопрос с 19 мая 2026 (SESSION_2026-05-19_VAULT_HANDOFF.md, «назначение неизвестно»).

**Назначение:** переключатель режима лендинга клуба (`nata-tomshina.ru/club`).

| Значение | Что показывает лендинг `/club` |
|---|---|
| `'pricing'` | Секция с ценами (`<Pricing />`) + стандартный CTA (`<FinalCta />`) |
| `'diagnostic'` | Диагностическая анкета (`<DiagnosticSection />`) + `<FinalCtaDiagnostic />`; убирает пункт «Стоимость» из навигации |

**Текущее на проде:** `diagnostic` (выставлено в `deploy.sh`).
**Дефолт в Dockerfile:** `pricing`.

Затрагивает только `src/app/public-site/club/` — Header, Hero, Faq, ClubPage.
**Никак не влияет на сам клуб** (`club.nata-tomshina.ru`) и на сезонное оформление.

Реализация: `src/lib/club-mode.ts` — функция `getClubMode()`. Переменная — build-time (`NEXT_PUBLIC_*`), вшивается в бандл при сборке Docker-образа.

Связано: `docs/05-infrastructure/server.md:88`.

---

## 2026-05-23 из supabase/migrations/ (разведка для diary)

**Пропущенные миграции — общая проблема, не только дневника.**

Из 6 таблиц «Дневника и трекера» только `diary_feelings` имеет
миграцию (`diary_feelings.sql`, 04.04.2026). Остальные 5
(`diary_entries`, `diary_water`, `diary_notes`, `measurements`, `wins`)
миграций не имеют — схема выведена только из кода.

Скорее всего созданы вручную через Supabase UI. Это пробел
в воспроизводимости: при разворачивании на новой БД таблицы
не появятся.

Проблема, вероятно, затрагивает и другие модули — не только дневник.
При написании очередного модуля проверять наличие миграции.

См. todo R72.

---

## 2026-06-08 — R119: NULL subscription_plan при last_payment_amount = 1500

При аудите webhook-записей обнаружено: 14 участниц имеют `subscription_plan = NULL`
при `last_payment_amount = 1500`. Функционально не сломаны — для тарифа `month` бонус = 0,
уровень считается правильно. Проблема косметическая: NULL вместо `'month'`.

Причина: ранние версии webhook не заполняли `subscription_plan` из `Data.Metadata.plan`.
Исправлено с мая 2026 — новые платежи пишут корректный план.

SQL-диагностика: `SELECT email FROM members WHERE last_payment_amount = 1500 AND subscription_plan IS NULL;`

См. todo R119 (SQL-чистка).

---

## 2026-06-08 — R120: RECURRENT-блок webhook никогда не срабатывает

При анализе `src/app/api/payments/cloudpayments/route.ts` установлено:
CloudPayments присылает **все** транзакции (первый платёж + рекуррентные) как
`OperationType = 'Payment'`. Блок `OperationType === 'Recurrent'` в коде
никогда не получает управления на проде.

Последствия:
- Рекуррентные платежи обрабатываются PAY-блоком — работает корректно.
- RECURRENT-блок — мёртвый код, но содержит аналогичную защитную логику.
- **Не удалять:** если CloudPayments изменит поведение — блок станет активным.

См. todo R120.
