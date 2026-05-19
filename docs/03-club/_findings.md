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

---

## 2026-05-23 из src/app/api/ (разведка для wins.md)

**Мёртвые API-роуты — паттерн, не единичный случай.**

В клубных модулях обнаружено два API-роута, которые существуют,
но не вызываются ни одним компонентом:

- `/api/diary/notes` — route.ts есть, ни один клиент не вызывает
  (зафиксировано в R70)
- `/api/wins/count` — route.ts есть, ни один клиент не вызывает
  (зафиксировано в R82)

Оба используют `user.id` напрямую, оба зарегистрированы в Next.js
роутинге и принимают запросы. Возможные причины:
- заготовки для будущей функциональности
- остатки от удалённого UI
- задумывались как public endpoints

Стоит проверить — нет ли подобных мёртвых роутов в других разделах
(emails-admin, marathons-admin, profile, ...).

---

## 2026-05-23 из src/app/globals.css (попутно при разведке публичного сайта)

**Дизайн-токены клуба — материал для будущего `03-club/design-system.md`.**

### Палитра клуба

Определена в `src/app/globals.css` в `:root` (глобально, не скоупировано):

```css
:root {
  --pur:       #7C5CFC;  /* фиолетовый — акцент, CTA, график трекера */
  --pur-light: #EDE9FF;
  --grn:       #A8E6CF;  /* зелёный */
  --yel:       #FFD93D;  /* жёлтый */
  --ora:       #FF9F43;  /* оранжевый */
  --bg:        #FAF8FF;  /* фон страниц */
  --text:      #2D1F6E;  /* основной текст */
  --card:      #FFFFFF;
  --border:    #EDE9FF;
  --muted:     rgba(45, 31, 110, 0.45);
}
```

### Шрифты клуба

Подключены через `next/font/google` в `src/app/layout.tsx`:
- **Unbounded** (400/600/700) → `--font-unbounded` → h1–h4
- **Nunito** (400–700) → `--font-nunito` → тело, кнопки
- Оба: subsets `['latin', 'cyrillic']`

### Tailwind

Тот же подход что и в публичном сайте: Tailwind v4 без конфига,
`@import "tailwindcss"` в `globals.css`. Нет `tailwind.config.ts`.

### Что писать в будущем модуле 03-club/design-system.md

- Дополнить компонентами клуба (DiaryClient карточки, ProgressBlock,
  WinFeed, формы трекера)
- Стили графика Chart.js (фиолетовый `#7C5CFC`, `fill: true`)
- Стили chips в WinInput и DiaryClient
- Адаптив (mobile-first или desktop-first?)
- Сравнить с палитрой публичного сайта — разные «вселенные» (фиолетовая vs зелёная)
