# _findings — 03-club

Находки по коду клуба, обнаруженные при написании модулей Vault.
Каждая запись — повод для todo или осознанного решения «живём с этим».

---

## 2026-05-23 из src/app/api/diary/* (разведка для diary.md)

**member_id vs user.id — inconsistency в diary роутах.**

В разных API-роутах дневника member_id определяется по-разному:
- `/api/diary/entries`, `/api/diary/water`, `/api/diary/notes`
  → используют `user.id` напрямую (auth.uid())
- `/api/diary/feelings`, `/api/diary/calendar`
  → делают email lookup в members

Правило CLAUDE.md #1 говорит, что `auth.users.id` и `members.id`
могут различаться. Если они различаются у кого-то на проде —
половина дневника покажет одно, половина другое.

Связано: tracker (`/api/tracker/measurements`), wins (`/api/wins`) —
тоже используют `user.id` напрямую.
Статус: не проверено на боевой БД. См. todo R71.
