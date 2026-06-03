# ТЗ для Claude Code — Уроки 13, 14, 15, 16 (финал курса)

## Контекст

Последняя пачка. После этого все 16 уроков будут на проде.
ID курса: `0a1df7f9-7552-429b-93a7-698c06cc6140`

**Урок 16 — финальный.** sort_order=16 + lesson_type='text' → код автоматически
выставляет `isFinalLesson: true` (фикс из load-course.ts). Никаких дополнительных
действий не нужно — просто INSERT как обычно.

## Файлы в пакете

| Файл | Куда |
|------|------|
| `urok-13-text-content.html` | sort_order=13, ~9 KB |
| `urok-14-text-content.html` | sort_order=14, ~10 KB |
| `urok-15-text-content.html` | sort_order=15, ~8 KB |
| `urok-16-text-content.html` | sort_order=16, ~6 KB |
| `veggies-01.webp` | `public/lessons/intro/14/` — овощная тарелка |
| `veggies-02.webp` | `public/lessons/intro/14/` — морковь с зеленью |

Уроки 13, 15, 16 — без картинок.

## Правила

- Показывай SQL в чате, жди «делай» перед каждым шагом.
- `git status` после каждого шага.
- Один коммит в конце.

---

## Шаг 1 — Картинки (только для Урока 14)

```bash
mkdir -p public/lessons/intro/14
cp <пакет>/veggies-01.webp public/lessons/intro/14/
cp <пакет>/veggies-02.webp public/lessons/intro/14/
ls -la public/lessons/intro/14/
```

---

## Шаг 2 — INSERT Урок 13

```sql
INSERT INTO intro_lessons (course_id, sort_order, title, lesson_type, text_content, is_visible)
VALUES (
  '0a1df7f9-7552-429b-93a7-698c06cc6140',
  13,
  'Алкоголь. Без морали — только физиология',
  'text',
  $$<содержимое urok-13-text-content.html>$$,
  true
);
```

---

## Шаг 3 — INSERT Урок 14

Внимание: в docx у автора было «День __.» (незаполненный плейсхолдер) —
в title урока его не включаем.

```sql
INSERT INTO intro_lessons (course_id, sort_order, title, lesson_type, text_content, is_visible)
VALUES (
  '0a1df7f9-7552-429b-93a7-698c06cc6140',
  14,
  'Овощи и клетчатка. Не просто гарнир, а инструмент',
  'text',
  $$<содержимое urok-14-text-content.html>$$,
  true
);
```

---

## Шаг 4 — INSERT Урок 15

```sql
INSERT INTO intro_lessons (course_id, sort_order, title, lesson_type, text_content, is_visible)
VALUES (
  '0a1df7f9-7552-429b-93a7-698c06cc6140',
  15,
  'Анализы. Что сдать, чтобы понять своё метаболическое здоровье',
  'text',
  $$<содержимое urok-15-text-content.html>$$,
  true
);
```

---

## Шаг 5 — INSERT Урок 16 (финальный)

```sql
INSERT INTO intro_lessons (course_id, sort_order, title, lesson_type, text_content, is_visible)
VALUES (
  '0a1df7f9-7552-429b-93a7-698c06cc6140',
  16,
  'Две недели позади. Что это значит',
  'text',
  $$<содержимое urok-16-text-content.html>$$,
  true
);
```

---

## Шаг 6 — Проверка БД

```sql
SELECT sort_order, title, LENGTH(text_content) AS html_size
FROM intro_lessons
WHERE course_id = '0a1df7f9-7552-429b-93a7-698c06cc6140'
ORDER BY sort_order;
```

Должно быть **16 строк** (sort_order 1..16). Это финал — курс полностью загружен.

---

## Шаг 7 — Сброс прогресса localStorage у Наташи

Из прошлых сессий в браузере остался старый прогресс (150%).
Попросить Наташу: открыть DevTools (F12) → Application → Local Storage →
найти ключи `vkus-course-intro-*` → удалить.

---

## Шаг 8 — Коммит, push, деплой

```bash
git status
git add -A
git commit -m "feat(intro): уроки 13-16 (алкоголь, овощи, анализы, финал) — курс полностью загружен"
git push
bash deploy.sh
docker ps
```

---

## Шаг 9 — Проверки на проде

### Список курса
`/dashboard/courses/intro` — в меню слева **16 уроков**.
Счётчик в шапке — «16 уроков о питании, метаболизме и работе с телом».

### Урок 14
- 2 картинки встроены по одной в текст (после описания крахмалистых овощей и после H3 «Свежая морковь»)

```bash
curl -I https://club.nata-tomshina.ru/lessons/intro/14/veggies-01.webp
curl -I https://club.nata-tomshina.ru/lessons/intro/14/veggies-02.webp
```

### Урок 15
- H2 заголовки для каждого анализа: «1. Общий анализ крови...», «2. Биохимия крови», ..., «10. УЗИ печени»
- Резюме — список всех 10 анализов в градиентном блоке

### Урок 16 — финальный экран
Открыть Урок 16. Должно показывать:
- ✅ Текст урока начинается с «Сегодня не будет новой информации...»
- ✅ Кнопка внизу — **«✅ Курс пройден!»** (не «открыть следующий урок»)
- ✅ Блок «Хочешь результат с поддержкой? / Вступить в клуб» — виден ТОЛЬКО после
  нажатия «Курс пройден!» (или при isFinalLesson=true + урок просмотрен)

Если финальный экран показывается **вместо** текста урока — это регрессия фикса
из load-course.ts. Сообщить Наташе, не чинить самостоятельно.

---

## После проверки

**Курс полностью загружен. 🎉**

Передать Наташе:
- Все 16 уроков на проде
- Финальный экран (isFinalLesson) активируется только на Уроке 16
- Прогресс в браузере очистить через DevTools если показывает старые цифры
