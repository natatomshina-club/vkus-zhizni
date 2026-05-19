# Сессия апрель 2026 — Рефакторинг стиля публичного сайта nata-tomshina.ru

## Что было сделано

### Этап 2 — Полный рефакторинг хардкодных цветов

Цель: убрать все `#hex` в `style={{}}` из публичных страниц и общих компонентов, заменить на CSS-переменные в `theme.css`. После этого смена любого цвета на сайте = одна строка в `theme.css`.

#### Завершённые страницы

| Файл | Статус | Замен |
|------|--------|-------|
| `src/app/public-site/about/page.tsx` | ✅ 0 хардкодов | ~93 |
| `src/app/public-site/blog/page.tsx` | ✅ 0 хардкодов | ~30 |
| `src/app/public-site/blog/[category]/page.tsx` | ✅ 0 хардкодов | ~32 |
| `src/app/public-site/blog/[category]/[subcategory]/page.tsx` | ✅ 0 хардкодов | ~22 |
| `src/app/public-site/blog/[category]/[subcategory]/[slug]/page.tsx` | ✅ 0 хардкодов | ~12 |
| `src/app/public-site/blog-content.css` | ✅ 0 хардкодов | 5 |

#### Завершённые общие компоненты

| Компонент | Файл | Статус |
|-----------|------|--------|
| PublicNav | `src/components/public/PublicNav.tsx` | ✅ 0 хардкодов |
| PublicFooter | `src/components/public/PublicFooter.tsx` | ✅ 0 хардкодов |
| BlogSidebar | `src/components/public/BlogSidebar.tsx` | ✅ 0 хардкодов |
| HorizontalBanner | `src/components/public/HorizontalBanner.tsx` | ✅ 0 хардкодов |
| Breadcrumbs | `src/components/public/Breadcrumbs.tsx` | ✅ 0 хардкодов |
| BlogWidget | `src/components/public/BlogWidget.tsx` | ✅ 0 хардкодов |
| RelatedSubcategories | `src/components/public/RelatedSubcategories.tsx` | ✅ 0 хардкодов |

#### Не отрефакторено (отложено)

- `src/app/public-site/results/page.tsx` — истории участниц
- `src/app/public-site/marathon/page.tsx` — лендинг марафона
- `src/app/public-site/menyu/`, `recipes/`, `racion/page.tsx`, `free/page.tsx`
- `src/components/widgets/QuizEngine.tsx` — ~35 хардкодов (тесты)
- `src/components/widgets/CalcWidget.tsx` — ~19 хардкодов
- `src/app/public-site/club/page.tsx` — **отложен, будет переделан с нуля**

---

### Палитра CSS-переменных — текущее состояние

Файл: `src/app/public-site/theme.css` (все переменные внутри `.public-theme {}`)

```css
/* АКЦЕНТНЫЕ ЦВЕТА */
--color-accent:          #F77D27;   /* яркий оранжевый CTA */
--color-accent-green:    #2E7D50;   /* средний зелёный */
--color-accent-rose:     #D9A6A0;   /* приглушённый розовый */
--color-accent-wine:     #8B2D2D;   /* винный/бордо */
--color-accent-border:   #E5E2DA;   /* нейтральный бежевый бордер */
--color-accent-forest:   #2D6A4F;   /* тёмный лесной зелёный */

/* ФОНЫ */
--color-bg-page:         #FAFAF8;   /* основной фон страницы */
--color-bg-page-rgb:     250, 250, 248; /* для rgba() */
--color-bg-cream:        #F5EFE3;   /* кремовый фон секций */
--color-bg-card:         #EFE6D4;   /* фон карточек */
--color-bg-surface:      #FFFFFF;   /* белый (карточки, бейджи) */
--color-bg-muted:        #FDF7F0;   /* очень светлый */
--color-bg-dark:         #2D2D2D;   /* тёмный фон (sidebar, CTA) */
--color-bg-green-soft:   #E8F5EE;   /* светло-зелёный */

/* HERO */
--color-hero-bg:         #2D5F3F;   /* тёмно-зелёный */
--color-hero-bg-2:       #4D6B40;   /* оливково-зелёный (стопы градиентов) */
--color-hero-bg-3:       #3D4D36;   /* тёмно-зелёный (statsBand) */
--color-hero-text:       #FFFFFF;

/* CTA */
--color-cta-bg:          #63BA6C;   /* яркий зелёный */
--color-cta-bg-rgb:      99, 186, 108; /* для rgba() */
--color-cta-text:        #FFFFFF;
--color-text-on-accent:  #FFFFFF;
--color-white-rgb:       255, 255, 255; /* для rgba(var(...), alpha) */

/* ТЕКСТ */
--color-text-primary:    #44474A;   /* графит */
--color-text-secondary:  #6B7280;   /* нейтральный серый */
--color-text-tertiary:   #B09880;   /* третичный (даты, метки) */
--color-text-muted:      #6B5A4A;

/* ПРОЧЕЕ */
--color-stat-number:     #F77D27;   /* оранжевый (числа статистики) */
--color-divider:         #C9B89D;   /* разделители */
--color-quote-border:    #B85450;   /* красная полоса у цитат */
--color-tag:             #A8754A;   /* охра для тегов */

/* УВЕДОМЛЕНИЯ */
--color-warning-bg:      #FFF8E1;
--color-warning-border:  #FFE082;
--color-warning-text:    #7A5C00;

/* СИГНАЛЬНЫЕ */
--color-highlight-bg:    #FFD93D;   /* жёлтый бэдж «✦ Заработай» */
--color-highlight-text:  #5C4200;
--color-error-text:      #A32D2D;

/* ШРИФТЫ */
--font-display: var(--font-serif-display), Georgia, serif; /* Lora */
--font-body: var(--font-sans), system-ui, sans-serif;      /* Manrope */
--font-ui: var(--font-sans), system-ui, sans-serif;
```

### Шрифты

Подключены через `next/font/google` в `src/app/public-site/layout.tsx`:
- **Lora** (serif) — заголовки. Переменная: `--font-serif-display`
- **Manrope** (sans-serif) — основной текст и UI. Переменная: `--font-sans`
- Оба шрифта поддерживают кириллицу (subsets: latin + cyrillic)

---

## Как сейчас работает смена стиля

### Поменять один цвет

Открыть `src/app/public-site/theme.css`, найти переменную, изменить значение. Деплой. Всё.

```css
/* Было */
--color-accent: #F77D27;
/* Стало */
--color-accent: #D4805C;
```

Это изменит цвет кнопок, акцентов, иконок, ссылок — везде где используется `var(--color-accent)`.

### Поменять всю палитру

Заменить значения переменных в блоке `.public-theme {}` в `theme.css`. Пример: смена с зелёно-оранжевой на earth-tones — изменение ~15 строк.

### Поменять шрифты

В `src/app/public-site/layout.tsx` заменить импорт Google Fonts:
```ts
// Было
import { Lora, Manrope } from 'next/font/google'
// Стало
import { Playfair_Display, Inter } from 'next/font/google'
```
И обновить переменные. Деплой. Всё.

### Для rgba с прозрачностью

Используются RGB-переменные:
```css
/* Полупрозрачный фон навигации */
background: rgba(var(--color-bg-page-rgb), 0.94);

/* Тень CTA кнопки */
box-shadow: 0 4px 14px rgba(var(--color-cta-bg-rgb), 0.3);

/* Приглушённый белый текст на тёмном фоне */
color: rgba(var(--color-white-rgb), 0.6);
```

---

## Отложенные задачи

### Технические (клуб)
1. **404 на `/images/authors/natalia.jpg`** — файл не загружен в `public/`
2. **OneSignal SDK грузится на `nata-tomshina.ru`** — должен только в клубе, перенести из RootLayout в `(club)/layout.tsx`
3. **Multiple GoTrueClient instances** — Supabase warning, сделать singleton

### Публичный сайт — следующие шаги
4. **Создать главную страницу `nata-tomshina.ru/`** — полноценную, с SEO, разделами сайта, переходами. Поменять `proxy.ts`: убрать rewrite `/ → /public-site/about`, направить на новую главную
5. **Переделать с нуля все лендинговые страницы** в новом дизайне:
   - Главная
   - О методе (about)
   - Клуб (club)
   - Марафон
   - Результаты участниц
   - Бесплатный мини-курс (free)
   - Рацион, Меню, Рецепты
6. **Виджеты** (`QuizEngine.tsx` ~35 хардкодов, `CalcWidget.tsx` ~19) — рефакторинг на переменные
7. **Контентные переменные блога** — 8 переменных в `theme.css` с хардкодными старыми цветами (`--color-tip-bg`, `--color-kratko-*`, `--color-ps-*` и др.) остались на прежней палитре. Нужно обновить под новую схему.

---

## Архитектура публичного сайта

```
src/
├── app/
│   ├── public-site/
│   │   ├── layout.tsx          ← шрифты (Lora + Manrope)
│   │   ├── theme.css           ← ВСЯ ПАЛИТРА ЗДЕСЬ
│   │   ├── about/page.tsx      ← О методе/авторе
│   │   ├── blog/               ← Блог (все уровни)
│   │   ├── club/page.tsx       ← Лендинг клуба (будет переделан)
│   │   ├── marathon/page.tsx
│   │   ├── results/page.tsx
│   │   ├── free/page.tsx
│   │   ├── menyu/, recipes/, racion/
│   │   └── blog-content.css    ← стили контента статей
│   └── (club)/                 ← Клубная часть (НЕ ТРОГАТЬ)
├── components/
│   ├── public/                 ← общие компоненты публичного сайта
│   │   ├── PublicNav.tsx       ✅ на переменных
│   │   ├── PublicFooter.tsx    ✅ на переменных
│   │   ├── BlogSidebar.tsx     ✅ на переменных
│   │   ├── HorizontalBanner.tsx ✅ на переменных
│   │   ├── Breadcrumbs.tsx     ✅ на переменных
│   │   ├── BlogWidget.tsx      ✅ на переменных
│   │   └── RelatedSubcategories.tsx ✅ на переменных
│   └── widgets/                ← интерактивные виджеты (тесты, калькулятор)
│       ├── QuizEngine.tsx      ⚠️ ~35 хардкодов
│       └── CalcWidget.tsx      ⚠️ ~19 хардкодов
└── proxy.ts                    ← маршрутизация nata-tomshina.ru → /public-site/*
```

**Scope `.public-theme`** — все CSS-переменные живут внутри `.public-theme {}`. Этот класс навешивается на `<body>` в `public-site/layout.tsx`. Клубная часть `(club)/` не использует `.public-theme` и никогда не должна его получать.

---

## Итог: что изменилось за сессию

**До сессии:** ~200+ хардкодных `#hex` разбросаны по страницам и компонентам. Смена цвета кнопки = поиск по всему репозиторию.

**После сессии:** Навигация, футер, блог, сайдбар, хлебные крошки, баннеры — всё на переменных. Палитра переключается в одном файле.

**Что попробовали в конце:** сменили earth-tones → зелёно-оранжевую медицинскую палитру + Lora + Manrope. Результат — сайт стал более современным, но **структура страниц не изменилась**, поэтому до референс-дизайна далеко. Референс (скриншоты RebornGroup) требует не просто смены цветов, а переделки JSX: волнистые разделители, декоративные элементы, фото-наложения, цветные блоки тарифов, градиентные кнопки.

**Следующий шаг:** переделать лендинговые страницы с нуля под новый дизайн. Начать с одной (Главная или О методе) — отработать подход, потом остальные.
