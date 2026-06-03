# ТЗ для Claude Code — Урок 2 «Зачем нужен завтрак»

## Контекст

Инфраструктура «Вводного курса» уже готова (миграция `is_visible`, рендеринг
HTML через `dangerouslySetInnerHTML`, базовые классы `.lesson-html` в `globals.css`,
кнопка «Я изучила — открыть следующий урок», новый курс со slug `intro`,
Урок 1 и заглушка Урока 3 в БД).

В этом ТЗ — добавление **Урока 2**. ID курса (уже известен из прошлой сессии):
`0a1df7f9-7552-429b-93a7-698c06cc6140`.

## Файлы в пакете

| Файл | Куда |
|------|------|
| `urok-02-text-content.html` | в поле `intro_lessons.text_content` для Урока 2 (~16 KB) |
| `plate-01.webp` ... `plate-05.webp` | `public/lessons/intro/02/` — фото завтраков участниц |
| `kitchen-01.webp` ... `kitchen-03.webp` | `public/lessons/intro/02/` — скриншоты Умной кухни |
| `image-grid-css.css` | дописывается в `src/app/globals.css` после уже добавленного блока `.lesson-html` |

## Правила выполнения

- **Никаких изменений на проде без явного «делай»** от Наташи.
- SQL — сначала показать в чате, ждать подтверждения, потом выполнять.
- После каждой правки файла — `git status`, показать в чате.
- Не правь ничего вне scope этого ТЗ.
- Сначала всё локально, потом один коммит и деплой.

---

## Шаг 1 — картинки в репо

```bash
mkdir -p public/lessons/intro/02
cp <путь_к_пакету>/plate-01.webp public/lessons/intro/02/plate-01.webp
cp <путь_к_пакету>/plate-02.webp public/lessons/intro/02/plate-02.webp
cp <путь_к_пакету>/plate-03.webp public/lessons/intro/02/plate-03.webp
cp <путь_к_пакету>/plate-04.webp public/lessons/intro/02/plate-04.webp
cp <путь_к_пакету>/plate-05.webp public/lessons/intro/02/plate-05.webp
cp <путь_к_пакету>/kitchen-01.webp public/lessons/intro/02/kitchen-01.webp
cp <путь_к_пакету>/kitchen-02.webp public/lessons/intro/02/kitchen-02.webp
cp <путь_к_пакету>/kitchen-03.webp public/lessons/intro/02/kitchen-03.webp
```

Проверить:

```bash
ls -la public/lessons/intro/02/
```

Должно быть 8 .webp файлов. Суммарный размер ~384 KB.

---

## Шаг 2 — добавить класс `.image-grid` в `globals.css`

В `src/app/globals.css` — найти блок `.lesson-html` (добавлен в прошлой сессии).
В конец этого блока (после правил для `.signature`, перед `@media` или внутри
файла там, где удобно) дописать содержимое `image-grid-css.css` из пакета:

```css
.lesson-html .image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin: 1.4em 0;
}

.lesson-html .image-grid img {
  margin: 0;
  width: 100%;
}
```

Показать diff в чате.

---

## Шаг 3 — INSERT Урок 2

Содержимое `urok-02-text-content.html` — это значение для поля `text_content`.
~16 KB HTML с заголовками, списками, цветными callout-блоками (жёлтый, зелёный,
фиолетовый), сеткой картинок (`.image-grid`), ссылками на `/dashboard/channel`
и `/dashboard/kitchen`, и 8 `<img>` на `/lessons/intro/02/...`.

```sql
INSERT INTO intro_lessons (course_id, sort_order, title, lesson_type, text_content, is_visible)
VALUES (
  '0a1df7f9-7552-429b-93a7-698c06cc6140',
  2,
  'Зачем нужен завтрак и каким он должен быть',
  'text',
  $$<содержимое urok-02-text-content.html>$$,
  true
);
```

**Использовать `$$...$$` quoting** (как для Урока 1) — внутри HTML есть кавычки,
эмодзи 🍞 🍽 🌅 и одинарные кавычки.

Показать SQL в чате (можно с `LENGTH('<content>')` для краткости). После «делай» — выполнить.

После INSERT — проверка:

```sql
SELECT id, sort_order, title, is_visible, LENGTH(text_content) AS html_size
FROM intro_lessons
WHERE course_id = '0a1df7f9-7552-429b-93a7-698c06cc6140'
ORDER BY sort_order;
```

Должно быть 3 строки: sort_order 1 (Что произойдёт с телом), 2 (Зачем нужен
завтрак), 3 (Видео об Умной кухне).

---

## Шаг 4 — коммит, push, деплой

```bash
git status                              # покажи в чате
git add -A
git status                              # покажи staged
git commit -m "feat(intro): Урок 2 «Зачем нужен завтрак» + класс .image-grid"
git push
bash deploy.sh                          # деплой на прод
docker ps                               # vkus-zhizni должен быть Up
```

---

## Шаг 5 — проверка на проде

Открыть `https://club.nata-tomshina.ru/dashboard/courses/intro`. В меню слева
должны быть видны три урока:

1. Что произойдёт с телом
2. **Зачем нужен завтрак и каким он должен быть** ← новый
3. Видео об Умной кухне (заглушка)

Открыть Урок 2. Проверить:

- ✅ Заголовок «Зачем нужен завтрак и каким он должен быть» сверху, «Урок 2 из 16»
- ✅ Текст читается, жирные выделения на местах
- ✅ Заголовки H2 фиолетовые Unbounded («Что такое «завтрак» в нашей системе», «Из чего состоит правильный завтрак», и т.д.)
- ✅ Подзаголовки H3 («Что такое «хороший белок» на завтрак», и т.д.)
- ✅ Жёлтый callout «🍞 Допустимо, но есть нюансы» — про углеводы
- ✅ Зелёный callout «Хорошая новость: отдельная еда не нужна» — про семью
- ✅ Фиолетовый callout «🍽 Инструменты клуба для завтрака» — с двумя сетками картинок (5 тарелок + 3 скриншота Умной кухни)
- ✅ Blockquote «Поэтому, даже если утром вам совсем не хочется есть, я очень прошу...»
- ✅ 2 accent с полосой слева («Едим, когда хочется есть...» и «Едим до сытости...»)
- ✅ Резюме в градиентном блоке в конце
- ✅ Подпись «— Наталья» курсивом справа
- ✅ Кнопка «✅ Я изучила — открыть следующий урок»

**Картинки** — проверить что грузятся (не битая иконка). Можно проверить напрямую:

```bash
curl -I https://club.nata-tomshina.ru/lessons/intro/02/plate-01.webp
curl -I https://club.nata-tomshina.ru/lessons/intro/02/kitchen-01.webp
```

Оба должны вернуть `200 OK`.

**Ссылки внутри урока:**

- В фиолетовом callout: «https://club.nata-tomshina.ru/dashboard/channel» (URL отдельной строкой) — кликабельный, ведёт на чаты
- Там же: «раздел «Умная кухня»» — кликабельный, ведёт на `/dashboard/kitchen`

**На мобильном** — открыть с телефона. Сетка картинок должна перестроиться
в 1-2 столбца (auto-fit).

---

## После проверки

Если всё ок — задача закрыта, жди следующего ТЗ (Уроки 4-6 пачкой).

Если что-то выглядит не так — опиши/покажи скриншот, **не правь молча**.
