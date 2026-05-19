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

---

## 2026-05-23 из src/app/api/tracker/measurements/route.ts (разведка для measurements.md)

**craving vs sweet_craving — критическое расхождение DDL и кода.**

В TRACKER_IMPL.md (DDL) поле тяги к сладкому называется `craving`.
В коде (route.ts, TypeScript interface) — `sweet_craving`.

Если в боевой БД поле названо как в DDL (`craving`), то весь учёт
тяги к сладкому работает с несуществующим полем — `sweet_craving`
будет возвращаться как null/undefined, и достижения «Месяц без тяги»
и «Квартал без тяги» никогда не выполнятся.

Проверка:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'measurements' AND column_name LIKE '%craving%';
```

См. todo R76 (высокий).
