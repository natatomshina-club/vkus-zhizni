# Дизайн-система публичного сайта

Описывает дизайн-токены, шрифты и CSS-архитектуру `nata-tomshina.ru`.

> [!info] Область модуля
> Описывает дизайн-токены, шрифты и стили `nata-tomshina.ru`.
> Дизайн клуба отличается; материал к нему — в [[../03-club/_findings.md]],
> полноценный модуль будет создан позже.

---

## 1. Архитектура CSS

```
src/app/
├── globals.css                  ← глобальные стили КЛУБА
└── public-site/
    ├── theme.css                ← дизайн-система публичного сайта (79 KB)
    ├── blog-content.css         ← типографика статей блога (42 KB)
    └── club/styles.css          ← стили лендинга /club
```

**Два полностью изолированных дизайна:**

| | Клуб (`/dashboard`) | Публичный сайт |
|---|---|---|
| Layout | `src/app/layout.tsx` | `src/app/public-site/layout.tsx` |
| CSS | `globals.css` | `theme.css` + `blog-content.css` |
| Scope CSS-переменных | глобальный (`:root`) | изолированный (`.public-theme`) |
| Шрифты | Unbounded + Nunito | Playfair Display + Manrope |
| Главный цвет | Фиолетовый `#7C5CFC` | Зелёный `#1F5A33` + Оранжевый `#F77D27` |

Изоляция реализована через класс `.public-theme` на корневом `<div>` в
`src/app/public-site/layout.tsx` — переменные публичного сайта не текут
в клуб, и наоборот.

---

## 2. Tailwind

**Tailwind v4 без конфига:**
- Нет `tailwind.config.ts` / `tailwind.config.js` в репо
- Подключение: `@import "tailwindcss"` первой строкой в `globals.css`
- Токены задаются через CSS-переменные, не через `theme.extend`
- PostCSS-плагин: `@tailwindcss/postcss` (postcss.config.mjs)

В `theme.css` Tailwind-утилиты используются напрямую в JSX-разметке
компонентов; CSS-файл содержит кастомные компоненты поверх них.

---

## 3. Цветовая палитра публичного сайта

Определена в `src/app/public-site/theme.css` внутри `.public-theme`:

### Основные цвета

```css
--color-bg-page:      #FAFAF7;  /* тёплый белый, фон страниц */
--color-white:        #FFFFFF;
--color-cream:        #F4F2EC;  /* карточки, фоны секций */
--color-ink:          #2A2D3A;  /* основной текст */
--color-ink-soft:     #5C6172;  /* вторичный текст */
--color-border:       #E6E4DD;  /* границы, разделители */
```

### Зелёная палитра (главный акцент)

```css
--color-green-light:  #7FD287;
--color-green:        #63BA6C;  /* CTA-кнопки */
--color-green-dark:   #4A9E54;
--color-green-mid:    #2E8B4F;  /* hero-bg, акцентные секции */
--color-green-base:   #1F5A33;  /* nav, footer, тёмные hero */
--color-green-abyss:  #103A1F;
```

### Оранжевая палитра (вторичный акцент)

```css
--color-orange:       #F77D27;  /* статистика, акценты, цифры */
--color-orange-light: #FFA45F;
--color-orange-dark:  #B84500;
```

### Сигнальные и резервные

```css
--color-coral:        #F4756A;  /* ошибки */
--color-warning-bg:   #FFF8E1;
--color-highlight-bg: #FFD93D;  /* выделение текста */
```

### Алиасы компонентов

```css
--color-accent:       #F77D27;  /* = orange, совместимость */
--color-cta-bg:       #63BA6C;  /* = green */
--color-nav-bg:       #1F5A33;  /* = green-base */
--color-footer-bg:    #1F5A33;  /* = green-base */
--color-hero-bg:      #2E8B4F;  /* = green-mid */
```

---

## 4. Типографика публичного сайта

Подключение через `next/font/google` в `src/app/public-site/layout.tsx`
(автооптимизация Next.js — нет внешних HTTP-запросов в runtime, шрифты
встраиваются в `/_next/static/media/`):

```ts
const playfairDisplay = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-serif-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})
```

**Применение:**
- **Playfair Display** → `--font-serif-display` → редакционные заголовки, hero, pull-цитаты в статьях
- **Manrope** → `--font-sans` → основной текст, навигация, кнопки, подписи

---

## 5. Структура theme.css (79 KB)

Основные блоки:

1. CSS-переменные (полная палитра + типографика + тени + градиенты)
2. `.public-theme` базовые стили (body, reset, ссылки)
3. Типографика (заголовки, параграфы, иерархия)
4. Хедер и навигация (фиксированный, прозрачный / цветной в зависимости от страницы)
5. Hero-секции (несколько вариантов: главная, /club, /about)
6. Карточки (отзывы, преимущества, результаты)
7. Кнопки (primary зелёная, secondary оранжевая, ghost)
8. Формы (подписка на лид-магнит, контакты)
9. Компоненты блога (tip-block, kratko-block, principle-step, comparison-table)
10. Footer (тёмно-зелёный `#1F5A33`)
11. Медиа-запросы (адаптив, mobile-first)

> [!warning] Один файл на весь сайт — 79 KB
> theme.css загружается на каждой странице публичного сайта целиком.
> Нет route-based code splitting по разделам. См. R88.

---

## 6. blog-content.css (42 KB)

Отдельный CSS для типографики статей блога. Подключается через
`src/app/public-site/layout.tsx` (т.е. на всех страницах public-site,
не только на страницах блога). Содержит:

- Заголовки h1–h6 с редакционной иерархией (Playfair Display)
- Параграфы, lead, dropcap
- Списки (ul, ol с кастомными маркерами)
- Цитаты (несколько стилей: pull-quote, blockquote)
- Изображения с подписями (figure + figcaption)
- Code, pre, inline code
- Таблицы (адаптивные)
- Специфические блоки: `.tip-block`, `.kratko-block`, `.principle-step`,
  `.mistake-step`, `.comparison-table`

---

## 7. club/styles.css

Отдельные стили для лендинга `/club` (страница вступления в клуб).
Скоуп: `.club-page`. Поверх `theme.css`, добавляет специфику страницы
продажи — тарифные карточки, FAQ, отзывы участниц, градиентные кнопки.

Содержит собственный набор CSS-переменных в `.club-page { ... }`
(дублирует ключевые токены из `theme.css` для автономности компонента).

---

## 8. Связи с другими модулями

| Модуль | Связь |
|---|---|
| [[site-routing.md]] | Структура `public-site/`, как домен попадает в эти файлы |
| [[../03-club/_findings.md]] | Заметка по дизайн-токенам клуба (`--pur`, `--bg`, Unbounded/Nunito) |
| [[../05-infrastructure/server.md]] | Next.js процесс, шрифты в build output |

---

## 9. Шпаргалка

```css
/* Использование токенов публичной темы в компонентах */
.my-component {
  background: var(--color-cream);
  color: var(--color-ink);
  border: 1px solid var(--color-border);
}

/* CTA-кнопка */
.btn-cta {
  background: var(--color-green);   /* #63BA6C */
  color: white;
  font-family: var(--font-sans);    /* Manrope */
}

/* Hero-заголовок */
h1.hero {
  font-family: var(--font-serif-display);   /* Playfair Display */
  color: var(--color-hero-text);            /* #FFFFFF на зелёном фоне */
}

/* Акцент на статистике */
.stat-number {
  color: var(--color-orange);   /* #F77D27 */
}
```

---

## 10. История изменений

| Дата | Событие |
|---|---|
| Апрель 2026 | Разработка публичного сайта. Источник: `_drafts/KITCHEN_CONSOLIDATED.md`, `SITE_STRUCTURE_FINAL.md`. |
| 23.05.2026 | Модуль записан в Vault по результатам разведки. |
