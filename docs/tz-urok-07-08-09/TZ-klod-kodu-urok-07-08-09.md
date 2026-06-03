# ТЗ для Claude Code — Уроки 7, 8, 9

## Контекст

Уроки 1–6 уже на проде. Добавляем Уроки 7, 8, 9.
CSS класс `.image-grid` уже есть в `globals.css` (добавлен при уроке 2).
ID курса: `0a1df7f9-7552-429b-93a7-698c06cc6140`

## Файлы в пакете

| Файл | Куда |
|------|------|
| `urok-07-text-content.html` | `intro_lessons.text_content` sort_order=7 (~17 KB) |
| `urok-08-text-content.html` | `intro_lessons.text_content` sort_order=8 (~33 KB) |
| `urok-09-text-content.html` | `intro_lessons.text_content` sort_order=9 (~38 KB) |
| `plate-01.webp` … `plate-09.webp` | `public/lessons/intro/08/` — 9 белковых тарелок |
| `sweet-safe.webp` | `public/lessons/intro/09/` — Cola Zero и конфеты без сахара |
| `choc-01.webp` … `choc-04.webp` | `public/lessons/intro/09/` — шоколад/батончики без сахара |
| `tea-aroma.webp` | `public/lessons/intro/09/` — ароматные чаи |

## Правила

- Показывай SQL и diff в чате, жди «делай» перед каждым шагом.
- `git status` после каждого шага.
- Никаких изменений вне scope ТЗ.
- Один коммит в конце.

---

## Шаг 1 — Картинки

```bash
mkdir -p public/lessons/intro/08
mkdir -p public/lessons/intro/09

# Урок 8 — 9 фото тарелок
cp <пакет>/plate-0{1,2,3,4,5,6,7,8,9}.webp public/lessons/intro/08/

# Урок 9 — 6 картинок
cp <пакет>/sweet-safe.webp public/lessons/intro/09/
cp <пакет>/choc-0{1,2,3,4}.webp public/lessons/intro/09/
cp <пакет>/tea-aroma.webp public/lessons/intro/09/

ls -la public/lessons/intro/08/
ls -la public/lessons/intro/09/
```

Ожидаемо: 9 файлов в `08/` (plate-01…09), 6 файлов в `09/`.

---

## Шаг 2 — INSERT Урок 7

```sql
INSERT INTO intro_lessons (course_id, sort_order, title, lesson_type, text_content, is_visible)
VALUES (
  '0a1df7f9-7552-429b-93a7-698c06cc6140',
  7,
  'Обед, ужин. Как устроен остальной день',
  'text',
  $$<содержимое urok-07-text-content.html>$$,
  true
);
```

Показать `LENGTH(text_content)` в чате. Ожидаемо: ~17 000 байт.

---

## Шаг 3 — INSERT Урок 8

```sql
INSERT INTO intro_lessons (course_id, sort_order, title, lesson_type, text_content, is_visible)
VALUES (
  '0a1df7f9-7552-429b-93a7-698c06cc6140',
  8,
  'Белок. Сколько и какого на самом деле нужно',
  'text',
  $$<содержимое urok-08-text-content.html>$$,
  true
);
```

Ожидаемо: ~33 000 байт.

---

## Шаг 4 — INSERT Урок 9

```sql
INSERT INTO intro_lessons (course_id, sort_order, title, lesson_type, text_content, is_visible)
VALUES (
  '0a1df7f9-7552-429b-93a7-698c06cc6140',
  9,
  'Сладкое и тяга. Когда дело не в воле',
  'text',
  $$<содержимое urok-09-text-content.html>$$,
  true
);
```

Ожидаемо: ~38 000 байт.

---

## Шаг 5 — Проверка БД

```sql
SELECT sort_order, title, is_visible, LENGTH(text_content) AS html_size
FROM intro_lessons
WHERE course_id = '0a1df7f9-7552-429b-93a7-698c06cc6140'
ORDER BY sort_order;
```

Должно быть 9 строк (sort_order 1..9). Уроки 7, 8, 9 — новые.

---

## Шаг 6 — Коммит, push, деплой

```bash
git status
git add -A
git commit -m "feat(intro): уроки 7-9 (обед/ужин, белок, сладкое)"
git push
bash deploy.sh
docker ps
```

---

## Шаг 7 — Проверки на проде

Открыть `/dashboard/courses/intro`. В меню слева — 9 уроков.

**Урок 7:**
- Нет картинок, только текст
- Accent: «скачок глюкозы снижается до 73%, скачок инсулина — до 48%»
- Зелёный callout: «Хорошая новость: фрукты – не запрет»
- Фиолетовый callout «📷 Чат «Тарелочки»» в конце текста
- Ссылки: «Карта помощи» → `/dashboard/courses`, «Тарелочки» → `/dashboard/channel`, «Умная кухня» → `/dashboard/kitchen`

**Урок 8:**
- Сетка из 9 фото тарелок участниц (в одном блоке `.image-grid`)
- 2 accent (про «достаточно белка» и про «Творог — это не белковый продукт»)
- Зелёный callout «разнообразие в течение недели» перед сеткой

```bash
curl -I https://club.nata-tomshina.ru/lessons/intro/08/plate-01.webp
```
Ожидаемо: 200 OK

**Урок 9:**
- 3 группы картинок в разных местах урока:
  - `sweet-safe.webp` — одна картинка (после «Cola Zero, конфеты без сахара»)
  - `choc-01…04.webp` — сетка из 4 (после «горький шоколад, батончики»)
  - `tea-aroma.webp` — одна картинка (после «ароматные чаи»)
- Accent: «Тяга к сладкому — это не слабость характера, не лень... Это физиология»
- Зелёный callout: «Хорошая новость: инсулинорезистентность лечится через питание»
- 3 ссылки «открыть памятку» (на PDF-документы в Карте помощи)

```bash
curl -I https://club.nata-tomshina.ru/lessons/intro/09/sweet-safe.webp
curl -I https://club.nata-tomshina.ru/lessons/intro/09/choc-01.webp
curl -I https://club.nata-tomshina.ru/lessons/intro/09/tea-aroma.webp
```
Все — 200 OK.

**Важно:** Урок 9 теперь последний из загруженных — но **не должен показывать финальный экран** (fix из предыдущего ТЗ: `isFinalLesson` = true только у sort_order=16). Кнопка — «✅ Я изучила — открыть следующий урок».

---

## После проверки

Всё ок — задача закрыта. Жди следующего ТЗ (Уроки 10, 11, 12).
Что-то не так — опиши/скриншот, не правь молча.
