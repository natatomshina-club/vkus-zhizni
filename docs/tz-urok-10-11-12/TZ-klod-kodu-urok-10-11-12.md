# ТЗ для Claude Code — Уроки 10, 11, 12

## Контекст

Уроки 1–9 уже на проде. Добавляем Уроки 10, 11, 12.
ID курса: `0a1df7f9-7552-429b-93a7-698c06cc6140`

## Файлы в пакете

| Файл | Куда |
|------|------|
| `urok-10-text-content.html` | sort_order=10 (~22 KB) |
| `urok-11-text-content.html` | sort_order=11 (~32 KB) |
| `urok-12-text-content.html` | sort_order=12 (~12 KB) |
| `food-01.webp` … `food-07.webp` | `public/lessons/intro/10/` — 7 фото блюд |
| `olive-brands.webp` | `public/lessons/intro/11/` — 1 фото брендов масла |
| `buffet-01.webp` | `public/lessons/intro/12/` — фото фуршета |
| `boxes-01.webp` … `boxes-04.webp` | `public/lessons/intro/12/` — 4 фото фуршетных боксов |

## Правила

- Показывай SQL/diff в чате, жди «делай» перед каждым шагом.
- `git status` после каждого шага.
- Один коммит в конце.

---

## Шаг 1 — Картинки

```bash
mkdir -p public/lessons/intro/10
mkdir -p public/lessons/intro/11
mkdir -p public/lessons/intro/12

cp <пакет>/food-0{1,2,3,4,5,6,7}.webp public/lessons/intro/10/
cp <пакет>/olive-brands.webp           public/lessons/intro/11/
cp <пакет>/buffet-01.webp              public/lessons/intro/12/
cp <пакет>/boxes-0{1,2,3,4}.webp       public/lessons/intro/12/

ls public/lessons/intro/10/
ls public/lessons/intro/11/
ls public/lessons/intro/12/
```

Ожидаемо: 7 файлов в `10/`, 1 в `11/`, 5 в `12/`.

---

## Шаг 2 — INSERT Урок 10

```sql
INSERT INTO intro_lessons (course_id, sort_order, title, lesson_type, text_content, is_visible)
VALUES (
  '0a1df7f9-7552-429b-93a7-698c06cc6140',
  10,
  'Готовим на всю семью. Без отдельной готовки',
  'text',
  $$<содержимое urok-10-text-content.html>$$,
  true
);
```

---

## Шаг 3 — INSERT Урок 11

```sql
INSERT INTO intro_lessons (course_id, sort_order, title, lesson_type, text_content, is_visible)
VALUES (
  '0a1df7f9-7552-429b-93a7-698c06cc6140',
  11,
  'Растительные масла. Главная проблема современного питания, о которой не говорят',
  'text',
  $$<содержимое urok-11-text-content.html>$$,
  true
);
```

---

## Шаг 4 — INSERT Урок 12

```sql
INSERT INTO intro_lessons (course_id, sort_order, title, lesson_type, text_content, is_visible)
VALUES (
  '0a1df7f9-7552-429b-93a7-698c06cc6140',
  12,
  'В гостях, в общепите, в командировке, в отпуске',
  'text',
  $$<содержимое urok-12-text-content.html>$$,
  true
);
```

---

## Шаг 5 — Проверка БД

```sql
SELECT sort_order, title, LENGTH(text_content) AS html_size
FROM intro_lessons
WHERE course_id = '0a1df7f9-7552-429b-93a7-698c06cc6140'
ORDER BY sort_order;
```

Должно быть 12 строк (sort_order 1..12).

---

## Шаг 6 — Коммит, push, деплой

```bash
git status
git add -A
git commit -m "feat(intro): уроки 10-12 (семья, масла, питание вне дома)"
git push
bash deploy.sh
docker ps
```

---

## Шаг 7 — Проверки

Открыть `/dashboard/courses/intro`. В меню — 12 уроков.

**Урок 10:**
- 7 фото блюд встроены по одному в текст (после описания каждого варианта)
- Кнопка — «✅ Я изучила — открыть следующий урок» (не «Курс пройден!»)

```bash
curl -I https://club.nata-tomshina.ru/lessons/intro/10/food-01.webp
```

**Урок 11:**
- Одна картинка ближе к концу урока — фото 5 брендов оливкового масла
- Жёлтый callout «На чём готовим. Конкретный список»

```bash
curl -I https://club.nata-tomshina.ru/lessons/intro/11/olive-brands.webp
```

**Урок 12:**
- Структура из H2 секций: «Ресторан, кафе, бизнес-ланч» / «Фастфуд» / «В гостях» / «Командировка» / «Отпуск и отель» / «Поход или дача» / «Резюме» / «И главное»
- Одна картинка (фуршет) + сетка из 4 картинок (боксы) ниже по тексту

```bash
curl -I https://club.nata-tomshina.ru/lessons/intro/12/buffet-01.webp
curl -I https://club.nata-tomshina.ru/lessons/intro/12/boxes-01.webp
```

Все — 200 OK.

**Кнопка у всех трёх** — «✅ Я изучила — открыть следующий урок» (не финальная).
