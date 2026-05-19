# _findings — 04-admin

Находки по коду и БД, обнаруженные при написании модулей Vault.
Каждая запись — повод для todo или осознанного решения «живём с этим».

---

## 2026-05-23 из src/app/api/tracker/* (разведка для diary)

**members.initial_weight vs members.start_weight — два поля веса.**

- `/api/tracker/summary` использует `initial_weight`
- `/dashboard/tracker/page.tsx` использует `start_weight`

Семантика неясна: дублирование или разные смыслы?
Не задокументировано ни в одном из модулей. См. todo R74.

---

## 2026-05-23 из src/app/api/tracker/* (детализация R74)

**initial_weight vs start_weight — точные места использования.**

Уточнение к ранее зафиксированной R74:
- `initial_weight` читается в `/api/tracker/summary` и в профиле (`/dashboard/profile/page.tsx`)
- `start_weight` используется в `tracker/page.tsx` и `wins/page.tsx`

Оба поля существуют в `members`. Семантика неясна. POST measurement
не трогает ни одно из них (трогает только `weight`).
