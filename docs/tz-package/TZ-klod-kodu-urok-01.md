# ТЗ для Claude Code — раздел «Вводный курс» (новый) + Урок 1

## Контекст

Ранее ты подготовил план на 5 шагов (миграция `is_visible`, архивация старого
«Волшебного пенделя» через смену slug, новый курс с slug='intro', замена
рендеринга `text_content` на `dangerouslySetInnerHTML`, CSS `.lesson-html`,
фильтр `is_visible` на странице списка). План одобрен с дополнениями:

1. Картинки в уроках — в `/public/lessons/intro/<номер>/` (без Storage)
2. CSS расширен под классы оформления: `.lead`, `.accent`, `.callout`,
   `.callout-warm`, `.callout-mint`, `.callout-title`, `.summary`, `.signature`
3. Текст кнопки в конце урока меняется на «Я изучила — открыть следующий урок»
4. Сразу залить Урок 1 + заглушку для Урока 3 (там будет видео об Умной кухне)

## Файлы в пакете

В архиве, который тебе передаст Наташа, лежат:

| Файл | Куда |
|------|------|
| `urok-01-text-content.html` | в поле `intro_lessons.text_content` для Урока 1 |
| `pobedy.png` | `public/lessons/intro/01/pobedy.png` |
| `dnevnik.png` | `public/lessons/intro/01/dnevnik.png` |
| `lesson-html.css` | блок дописывается в конец `src/app/globals.css` |

## Правила выполнения

- **Никаких изменений на проде без явного «делай»** от Наташи.
- Каждый SQL — **сначала показать в чате**, ждать подтверждения, потом выполнять.
- После каждой правки файла — `git status`, показать в чате.
- Если что-то неясно — **спросить, не угадывать**.
- Никаких изменений вне scope этого ТЗ.
- Сначала все правки локально (без commit/push), потом одним коммитом и деплоем.

---

## Шаг 1 — миграция `is_visible` в `intro_courses`

Файл: `supabase/migrations/intro_courses_is_visible.sql`

```sql
ALTER TABLE intro_courses ADD COLUMN is_visible BOOLEAN NOT NULL DEFAULT TRUE;
```

Показать файл в чате. Затем выполнить SQL в Supabase Studio.

---

## Шаг 2 — архивация старого «Волшебного пенделя»

```sql
UPDATE intro_courses
SET slug = 'volshebnyy-pendel',
    is_visible = false
WHERE slug = 'intro';
```

Сначала показать SQL и текущую запись (`SELECT * FROM intro_courses WHERE slug = 'intro'`). После «делай» — выполнить и подтвердить через `SELECT`.

---

## Шаг 3 — создать новый «Вводный курс»

```sql
INSERT INTO intro_courses (slug, title, description, sort_order, is_visible)
VALUES (
  'intro',
  'Вводный курс',
  '16 уроков о питании, метаболизме и работе с телом',
  1,
  true
)
RETURNING id;
```

**Сохрани `id` нового курса — он нужен для INSERT уроков (Шаг 7).**

---

## Шаг 4 — изменить рендеринг `text_content` в `CoursePageClient.tsx`

В `src/components/CoursePageClient.tsx`:

1. Удалить компонент `TextCard` (он рендерил plain text через `whiteSpace: 'pre-wrap'`).
2. В JSX где он использовался — заменить на:

```tsx
{lesson.type === 'text' && !lesson.isFinalLesson && lesson.textContent && (
  <div style={{ marginBottom: 16 }}>
    <div
      className="lesson-html"
      dangerouslySetInnerHTML={{ __html: lesson.textContent }}
    />
  </div>
)}
```

Показать diff в чате.

---

## Шаг 5 — поменять текст кнопки

В том же `CoursePageClient.tsx` найти кнопку «✅ Я посмотрела — открыть урок N+1» (или похожую). Поменять на:

```
✅ Я изучила — открыть следующий урок
```

Применяется ко всем курсам (текстовым и видео). Формулировка нейтральная.

Показать diff.

---

## Шаг 6 — добавить CSS в `globals.css`

Содержимое файла `lesson-html.css` (из пакета) дописать в конец `src/app/globals.css`.

CSS использует существующие переменные проекта: `--pur`, `--pur-light`, `--text`, `--font-unbounded`. Дополнительные цвета (жёлтый/зелёный для callout-блоков, мягкие оттенки) — заданы hex прямо в правилах, переменные не загрязняются.

Показать diff.

---

## Шаг 7 — фильтр `is_visible=true` на странице списка курсов

В `src/app/(club)/dashboard/courses/page.tsx`, функция `getCourses`:

```diff
 const { data, error } = await admin
   .from('intro_courses')
   .select('id, slug, title, description, sort_order')
+  .eq('is_visible', true)
   .order('sort_order')
```

Также обновить `FALLBACK_COURSES` — у курса с slug='intro' поменять название и описание:

```diff
 const FALLBACK_COURSES = [
-  { slug: 'intro', title: 'Волшебный пендель', description: 'Правило волшебной тарелки...', lessons_count: null as number | null },
+  { slug: 'intro', title: 'Вводный курс', description: '16 уроков о питании, метаболизме и работе с телом', lessons_count: null as number | null },
   { slug: 'stop-diabet', title: 'Стоп Диабет', description: 'Лечебное питание...', lessons_count: null as number | null },
 ]
```

Показать diff.

---

## Шаг 8 — картинки в репо

```bash
mkdir -p public/lessons/intro/01
cp <путь_к_пакету>/pobedy.png public/lessons/intro/01/pobedy.png
cp <путь_к_пакету>/dnevnik.png public/lessons/intro/01/dnevnik.png
```

Проверить:

```bash
ls -la public/lessons/intro/01/
```

Должны быть `pobedy.png` (~120KB) и `dnevnik.png` (~165KB).

---

## Шаг 9 — INSERT Урока 1

Содержимое `urok-01-text-content.html` (из пакета) — это значение для поля `text_content`. ~14KB HTML с заголовками, списками, цветными блоками, ссылками на /dashboard/wins, /dashboard/diary и двумя `<img>` на `/lessons/intro/01/pobedy.png` и `/lessons/intro/01/dnevnik.png`.

```sql
INSERT INTO intro_lessons (course_id, sort_order, title, lesson_type, text_content, is_visible)
VALUES (
  '<ID нового курса из Шага 3>',
  1,
  'Что произойдёт с телом',
  'text',
  '<содержимое urok-01-text-content.html>',
  true
);
```

**Внимание:** text_content содержит апострофы, кавычки и эмодзи. Через Supabase SQL Editor — вставить через PASTE (он сам экранирует). Через psql — использовать одинарные кавычки с экранированием, или `$$...$$` quoting.

Показать SQL в чате (можно с `LENGTH('<content>')` вместо самого content для краткости). После «делай» — выполнить.

После INSERT — `SELECT id, sort_order, title FROM intro_lessons WHERE course_id = '<ID>'` для подтверждения.

---

## Шаг 10 — заглушка для Урока 3 (видео об Умной кухне)

Между уроками 2 и 4 должно быть видео об Умной кухне. Чтобы при добавлении уроков 2, 4, 5...16 нумерация в меню шла подряд (1, 2, 3, 4...) — сейчас залить заглушку:

```sql
INSERT INTO intro_lessons (course_id, sort_order, title, lesson_type, text_content, is_visible)
VALUES (
  '<ID нового курса>',
  3,
  'Видео об Умной кухне',
  'text',
  '<p>Здесь скоро появится видеоурок об Умной кухне 🌿</p>',
  true
);
```

Показать, выполнить после «делай».

---

## Шаг 11 — деплой

```bash
git status                              # покажи в чате
git add -A
git status                              # покажи staged
git commit -m "feat(intro): архивация Волшебного пенделя, новый Вводный курс с HTML-уроками + Урок 1"
git push
bash deploy.sh                          # деплой на прод
docker ps                               # подтверждение что vkus-zhizni поднялся (Up)
```

---

## Шаг 12 — проверка на проде

Открой `https://club.nata-tomshina.ru/dashboard/courses` — должны быть 3 карточки:

- **Вводный курс** — «16 уроков о питании, метаболизме и работе с телом»
- **Стоп-диабет** — без изменений
- **Базовые продукты: подготовка, хранение, готовка** — без изменений

«Волшебного пенделя» в списке быть **не должно**.

Кликни на «Вводный курс» (URL `/dashboard/courses/intro`):
- Слева — список уроков (видны минимум Урок 1 «Что произойдёт с телом» и Урок 3 «Видео об Умной кухне»; остальные появятся позже).
- Справа — открывается Урок 1: видны заголовки H2 фиолетовые Unbounded, лид-абзац крупно, жирные выделения, accent-блоки с полосой слева, жёлтый callout с 💧, фиолетовый blockquote, зелёный callout, фиолетовый callout «📝 Очень важное» с двумя картинками внутри (Победы + Дневник), градиентное резюме в конце.
- Кнопка внизу: «✅ Я изучила — открыть следующий урок».

Картинки должны загрузиться (не «битая иконка»). Если не загрузились — `curl -I https://club.nata-tomshina.ru/lessons/intro/01/pobedy.png` должен вернуть `200 OK`.

Открой `https://club.nata-tomshina.ru/dashboard/courses/volshebnyy-pendel` — должен открыться старый «Волшебный пендель» (для тех, у кого сохранена закладка).

---

## После проверки

Если всё ок — задача закрыта, жди следующего ТЗ (остальные 14 уроков пакетом).

Если что-то не так — опиши в чате, **не правь молча**.
