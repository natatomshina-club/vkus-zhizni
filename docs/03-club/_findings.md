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

## май 2026 из src/components/FavoritesClient.tsx (разведка для recipes.md)

**`saved_sauces` хранятся только в `localStorage` — не в БД.**

Соусы из раздела «🥣 Соусы» в Умной кухне сохраняются в `localStorage`
под ключом `saved_sauces`. В таблице `saved_recipes` и в любой другой
таблице БД запись не создаётся.

Следствия:
- При смене устройства или браузера соусы исчезают
- При очистке данных сайта (incognito, DevTools → Clear Storage) — то же
- Счётчик виджета `FavoritesStat` на главной включает соусы из localStorage,
  поэтому цифра на виджете может не совпадать с числом записей в `saved_recipes`

Это архитектурное решение (не баг). Соусы генерируются Умной кухней и
не привязаны к членству — localStorage достаточно для текущего UX.
При масштабировании (синхронизация между устройствами) потребует миграции
в БД. Статус: наблюдение, не требует срочного действия.

---

## май 2026 из src/app/api/member/me и src/app/api/onboarding/profile (разведка для profile.md)

**Debug console.log в двух API-роутах профиля.**

В `/api/member/me/route.ts` — `console.log` при каждом чтении профиля.
В `/api/onboarding/profile/route.ts` — два `console.log`: email и результат UPDATE.

Оба роута в продакшне. Логи замусоривают серверный вывод и могут засветить email участниц.
Статус: техдолг. Убрать в рамках R93.

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
