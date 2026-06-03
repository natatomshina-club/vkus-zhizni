# ТЗ: Рефакторинг блога — Этап 3 (Reborn Style)

> Работаем только над публичным сайтом `nata-tomshina.ru`. Клуб `club.nata-tomshina.ru` (всё в `src/app/(club)/`) **не трогаем**, кроме API-роутов админки блога.

## Контекст

Этапы 1 и 2 сданы. Цель Этапа 3 — привести все 19 страниц блога (1 Pillar + 18 Hub + статьи) к единому дизайну в стиле **Reborn** на основе макета от заказчика. Дизайн-токены и эталонные стили — ниже в тексте ТЗ.

**Архитектура классов:**

- Структурные имена классов из существующих хабов (`.tip-block`, `.faq-block`, `.kratko-block`, `.principle-step`, `.mistake-step`, `.comparison-table`, `.testimonial-card`, `.sources-list`, `.cta-button`, `.disclaimer`, `.author-block`, `.subcat-card`, `.highlight-stat`) — **остаются как есть** в HTML.
- Стили под этими именами — **переписываются с нуля** в стиле Reborn. Существующие хабы автоматически получают новый вид без правок content_html.
- Новые классы из макета (`.article-pill`, `.quote-card`, `.lead-magnet`, `.checklist-card`, `.cta-card`, `.related-card`) — **добавляются как новые**, доступны для будущих статей.
- **Палитры через `data-theme="green | orange | blue | rose | wine | cream"`** — любой блок можно покрасить в одну из 6 палитр через атрибут.

После Этапа 3:
- Все хабы автоматически получат новый вид
- 6 палитр доступны через `data-theme` для разнообразия
- `UnifiedHero` рендерит шапку для article / pillar / hub в едином светлом стиле с декоративным «свечением»

---

## Этап делится на 4 секции с проверочными точками

После каждой — деплой и подтверждение от заказчика прежде чем идти дальше.

- **Секция А — Уборка и подготовка** (без визуальных изменений)
- **Секция Б — Дизайн-токены** (палитра, шрифты, тени, градиенты)
- **Секция В — `blog-content.css`** (стилизация всех классов)
- **Секция Г — Hero и страницы** (`UnifiedHero`, подключения, `AuthorCard`)

---

# СЕКЦИЯ А — УБОРКА И ПОДГОТОВКА

## А1. Удалить fallback в `BlogCategoryPage`

**Файл:** `src/app/public-site/blog/[category]/page.tsx`

**Что:** Fallback-ветка (~строки 336–451), которая срабатывает если category не в SILO_CONFIG. По разведке в БД нет таких постов. Мёртвый код.

**Действие:** удалить fallback. Если category не в SILO_CONFIG — `notFound()`. Удалить связанные импорты.

**Не трогать:** Pillar-путь (его перерабатываем в Г).

**Критерий:** файл короче на ~115 строк. Build проходит.

---

## А2. Починить дубль `.blog-content` в content_html хабов

**Шаги:**

1. Создать backup-поля:
```sql
ALTER TABLE blog_hubs ADD COLUMN IF NOT EXISTS content_html_backup TEXT;
ALTER TABLE blog_subcategory_hubs ADD COLUMN IF NOT EXISTS content_html_backup TEXT;
UPDATE blog_hubs SET content_html_backup = content_html WHERE content_html_backup IS NULL;
UPDATE blog_subcategory_hubs SET content_html_backup = content_html WHERE content_html_backup IS NULL;
```

2. **Preview перед UPDATE** — показать заказчику:
```sql
SELECT 
  id, category,
  LENGTH(content_html) AS before_length,
  LENGTH(
    regexp_replace(
      regexp_replace(content_html, '^\s*<div\s+class="blog-content"\s*>\s*', '', 'i'),
      '\s*</div>\s*$', '', 'i'
    )
  ) AS after_length,
  SUBSTRING(
    regexp_replace(
      regexp_replace(content_html, '^\s*<div\s+class="blog-content"\s*>\s*', '', 'i'),
      '\s*</div>\s*$', '', 'i'
    ),
    1, 200
  ) AS preview_after
FROM blog_hubs
WHERE content_html ~* '^\s*<div\s+class="blog-content"'
LIMIT 3;
```

3. **Жди подтверждение «выполнять».** Только после этого:

```sql
UPDATE blog_hubs
SET content_html = regexp_replace(
  regexp_replace(content_html, '^\s*<div\s+class="blog-content"\s*>\s*', '', 'i'),
  '\s*</div>\s*$', '', 'i'
)
WHERE content_html ~* '^\s*<div\s+class="blog-content"';

UPDATE blog_subcategory_hubs
SET content_html = regexp_replace(
  regexp_replace(content_html, '^\s*<div\s+class="blog-content"\s*>\s*', '', 'i'),
  '\s*</div>\s*$', '', 'i'
)
WHERE content_html ~* '^\s*<div\s+class="blog-content"';
```

4. Backup-поля **не удалять** до конца Этапа 3.

---

## А3. Убрать дубль `article_prompt` в `seo_settings`

```sql
SELECT id, key, LEFT(value, 200) AS preview, created_at, updated_at 
FROM seo_settings 
WHERE key = 'article_prompt' 
ORDER BY updated_at DESC NULLS LAST;
```

**Показать обе записи заказчику. Жди ответ — какую оставить.**

После подтверждения — удалить дубль и добавить unique constraint:
```sql
ALTER TABLE seo_settings ADD CONSTRAINT seo_settings_key_unique UNIQUE (key);
```

---

## А4. Расширение промпта генератора — ПРОПУСКАЕМ

Заказчик подтвердил: AI-генератор пока не используется, контент загружается вручную. Эта задача — на отдельный этап позже, при создании WYSIWYG-редактора.

**Действие:** ничего. Зафиксировать в отчёте.

---

## А5. Создать `AuthorCard` (структура; стили в секции В)

**Файл:** `src/components/public/article/AuthorCard.tsx` (новый)

```tsx
import Image from 'next/image'

type Props = {
  variant?: 'full' | 'compact'
}

const AUTHOR = {
  name: 'Наталья Томшина',
  role: 'нутрициолог',
  photoUrl: '/images/authors/natalia.jpg',
  bio: 'Нутрициолог с практическим опытом более 10 лет. Основатель клуба питания «Вкус Жизни». Помогает женщинам 40+ нормализовать вес и гормональный баланс через систему питания без запретов.',
} as const

export function AuthorCard({ variant = 'full' }: Props) {
  if (variant === 'compact') {
    return (
      <div className="author-card author-card--compact">
        <strong>{AUTHOR.name}</strong> · {AUTHOR.role}
      </div>
    )
  }

  return (
    <div className="author-card">
      <div className="author-card__photo">
        <Image
          src={AUTHOR.photoUrl}
          alt={AUTHOR.name}
          fill
          sizes="88px"
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div className="author-card__content">
        <div className="author-card__name">{AUTHOR.name}</div>
        <div className="author-card__role">{AUTHOR.role}</div>
        <p className="author-card__bio">{AUTHOR.bio}</p>
      </div>
    </div>
  )
}
```

Стили `.author-card` — в `blog-content.css` (секция В).

---

## А6. Удалить author-block из HTML pillar pohudenie

**Preview:**
```sql
SELECT
  id,
  LENGTH(content_html) AS before_length,
  LENGTH(
    regexp_replace(
      content_html,
      '<!--\s*БЛОК АВТОРА\s*-->\s*<div\s+class="author-block">.*?</div>\s*',
      '',
      'gs'
    )
  ) AS after_length,
  SUBSTRING(content_html FROM POSITION('БЛОК АВТОРА' IN content_html) FOR 800) AS being_removed
FROM blog_hubs
WHERE category = 'pohudenie';
```

**Подтверждение → выполнить:**
```sql
UPDATE blog_hubs
SET content_html = regexp_replace(
  content_html,
  '<!--\s*БЛОК АВТОРА\s*-->\s*<div\s+class="author-block">.*?</div>\s*',
  '',
  'gs'
)
WHERE category = 'pohudenie';
```

**Критерий:** в content_html pohudenie нет `БЛОК АВТОРА` и `class="author-block"`.

---

## ПРОВЕРОЧНАЯ ТОЧКА после Секции А

`typecheck && lint && build`. Деплой. Открыть Pillar и пару хабов — рендерятся, ошибок нет, визуал примерно как был. Backup-поля созданы, миграции применены.

**Жди подтверждение «А ок» от заказчика.**

---

# СЕКЦИЯ Б — ДИЗАЙН-ТОКЕНЫ

## Б1. Переписать `theme.css` — токены Reborn

**Файл:** `src/app/public-site/theme.css`

**Действие:** заменить содержимое scope `.public-theme` целиком. Сохраняем имена существующих переменных через алиасы — чтобы код, использующий `var(--color-cta-bg)`, не сломался.

**Содержимое (полная замена scope `.public-theme`):**

```css
.public-theme {
  /* ═══════════════════════════════════════════════════════
     REBORN STYLE — Дизайн-токены
     ═══════════════════════════════════════════════════════ */

  /* ── НЕЙТРАЛЬНЫЕ ─────────────────────────────────────── */
  --color-bg-page:        #FAFAF7;
  --color-bg-page-rgb:    250, 250, 247;
  --color-bg-surface:     #FFFFFF;
  --color-white-rgb:      255, 255, 255;
  --color-bg-cream:       #F4F2EC;
  --color-bg-card:        #F4F2EC;
  --color-bg-muted:       #FAFAF7;
  --color-border:         #E6E4DD;
  --color-divider:        #E6E4DD;
  --color-accent-border:  #E6E4DD;

  /* ── ТЕКСТ ───────────────────────────────────────────── */
  --color-text-primary:   #2A2D3A;
  --color-text-secondary: #5C6172;
  --color-text-tertiary:  #8B8F9D;
  --color-text-muted:     #5C6172;
  --color-text-on-accent: #FFFFFF;

  /* ── ЗЕЛЁНАЯ ПАЛИТРА ─────────────────────────────────── */
  --color-green-light:    #7FD287;
  --color-green:          #63BA6C;
  --color-green-dark:     #4A9E54;
  --color-green-deep:     #3F7C4A;
  --color-green-mid:      #2E8B4F;
  --color-green-base:     #1F5A33;
  --color-green-abyss:    #103A1F;
  --color-green-rgb:      99, 186, 108;

  /* Алиасы для совместимости с существующими стилями */
  --color-cta-bg:         var(--color-green);
  --color-cta-bg-rgb:     99, 186, 108;
  --color-cta-text:       #FFFFFF;
  --color-accent-green:   var(--color-green-mid);
  --color-accent-forest:  var(--color-green-deep);
  --color-bg-green-soft:  #DFEFE0;
  --color-hero-bg:        var(--color-green-base);
  --color-hero-bg-2:      var(--color-green-mid);
  --color-hero-bg-3:      var(--color-green-abyss);
  --color-hero-text:      #FFFFFF;

  /* ── ОРАНЖЕВАЯ ───────────────────────────────────────── */
  --color-orange:         #F77D27;
  --color-orange-light:   #FFA45F;
  --color-orange-dark:    #B84500;
  --color-orange-rgb:     247, 125, 39;
  --color-accent:         var(--color-orange);
  --color-stat-number:    var(--color-orange);

  /* ── СИНЯЯ (новая) ───────────────────────────────────── */
  --color-blue:           #5B7A8A;
  --color-blue-light:     #7FA1B5;
  --color-blue-dark:      #3F5A6B;
  --color-blue-soft:      #E8EFF3;

  /* ── РОЗОВАЯ (новая) ─────────────────────────────────── */
  --color-rose:           #D9A6A0;
  --color-rose-light:     #E8C5C0;
  --color-rose-dark:      #B07770;
  --color-rose-soft:      #FAEEEC;

  /* ── ВИННАЯ (новая) ──────────────────────────────────── */
  --color-wine:           #8B2D2D;
  --color-wine-light:     #A93737;
  --color-wine-dark:      #6B1F1F;
  --color-wine-soft:      #F4E4E4;

  /* ── КРЕМОВАЯ (для нейтральных) ──────────────────────── */
  --color-cream-bg:       #F4F2EC;
  --color-cream-deep:     #E6E4DD;
  --color-cream-text:     #5C4A2E;

  /* ── СЕМАНТИЧЕСКИЕ ──────────────────────────────────── */
  --color-warning-bg:     #FFF8E1;
  --color-warning-border: #FFE082;
  --color-warning-text:   #7A5C00;
  --color-error-text:     #A32D2D;
  --color-link:           var(--color-orange);
  --color-tag:            var(--color-orange);
  --color-quote-border:   var(--color-green-deep);
  --color-highlight-bg:   #FFD93D;
  --color-highlight-text: #5C4200;

  /* ── КОНТЕНТНЫЕ (старые имена, новые значения) ───────── */
  --color-accent-light:        var(--color-cream-bg);
  --color-tip-bg:              #FFF5EC;
  --color-tip-border:          var(--color-orange);
  --color-tip-text:            var(--color-text-primary);
  --color-kratko-bg:           var(--color-bg-green-soft);
  --color-kratko-title:        var(--color-green-deep);
  --color-kratko-bullet:       var(--color-green);
  --color-ps-num-bg:           var(--color-orange);
  --color-ps-border:           var(--color-orange);
  --color-ct-param-text:       var(--color-text-primary);
  --color-faq-q-text:          var(--color-text-primary);
  --color-tc-quote:            var(--color-text-primary);
  --color-sl-title:            var(--color-orange);
  --color-author-name:         var(--color-text-primary);
  --color-author-title:        var(--color-orange);
  --color-subcat-border-hover: var(--color-orange);
  --color-subcat-title:        var(--color-text-primary);
  --color-subcat-arrow:        var(--color-orange);

  /* ── ГРАДИЕНТЫ ────────────────────────────────────────── */
  --grad-green-btn:
    radial-gradient(ellipse at 30% 25%, rgba(180,230,185,0.55), transparent 60%),
    linear-gradient(180deg, #6FC57E 0%, #2E8B4F 60%, #1F5A33 100%);
  --grad-orange-btn:
    radial-gradient(ellipse at 30% 25%, rgba(255,210,170,0.60), transparent 60%),
    linear-gradient(180deg, #FFA45F 0%, #F77D27 55%, #B84500 100%);
  --grad-green-card:
    radial-gradient(ellipse 60% 50% at 75% 25%, rgba(180,230,185,0.50), transparent 55%),
    radial-gradient(circle at 95% 95%, rgba(16,58,31,0.65), transparent 50%),
    linear-gradient(135deg, #2E8B4F 0%, #1F5A33 60%, #103A1F 100%);
  --grad-orange-card:
    radial-gradient(ellipse 60% 50% at 75% 25%, rgba(255,210,170,0.50), transparent 55%),
    radial-gradient(circle at 95% 95%, rgba(184,69,0,0.55), transparent 50%),
    linear-gradient(135deg, #FFA45F 0%, #F77D27 55%, #B84500 100%);
  --grad-blue-card:
    radial-gradient(ellipse 60% 50% at 75% 25%, rgba(180,210,225,0.50), transparent 55%),
    radial-gradient(circle at 95% 95%, rgba(40,75,95,0.55), transparent 50%),
    linear-gradient(135deg, #7FA1B5 0%, #5B7A8A 60%, #3F5A6B 100%);
  --grad-rose-card:
    radial-gradient(ellipse 60% 50% at 75% 25%, rgba(245,210,200,0.55), transparent 55%),
    radial-gradient(circle at 95% 95%, rgba(160,90,80,0.50), transparent 50%),
    linear-gradient(135deg, #E8C5C0 0%, #D9A6A0 55%, #B07770 100%);
  --grad-wine-card:
    radial-gradient(ellipse 60% 50% at 75% 25%, rgba(220,160,160,0.40), transparent 55%),
    radial-gradient(circle at 95% 95%, rgba(60,15,15,0.60), transparent 50%),
    linear-gradient(135deg, #A93737 0%, #8B2D2D 60%, #6B1F1F 100%);
  --grad-green-pill: linear-gradient(135deg, #DFEFE0, #C2DEC4);
  --grad-cover:
    radial-gradient(ellipse at 70% 30%, rgba(127,210,135,0.20), transparent 60%),
    radial-gradient(ellipse at 20% 70%, rgba(255,164,95,0.13), transparent 60%);

  /* ── ТЕНИ ─────────────────────────────────────────────── */
  --shadow-card:        0 8px 20px rgba(40, 42, 55, 0.08);
  --shadow-card-lg:     0 16px 40px rgba(40, 42, 55, 0.08);
  --shadow-green-btn:   0 12px 28px rgba(99, 186, 108, 0.30);
  --shadow-green-card:  0 24px 50px rgba(31, 90, 51, 0.35);
  --shadow-green-cta:   0 30px 70px rgba(31, 90, 51, 0.40);
  --shadow-orange-card: 0 24px 50px rgba(184, 69, 0, 0.30);
  --shadow-orange-btn:  0 12px 28px rgba(247, 125, 39, 0.45);
  --shadow-blue-card:   0 24px 50px rgba(63, 90, 107, 0.30);
  --shadow-rose-card:   0 24px 50px rgba(176, 119, 112, 0.25);
  --shadow-wine-card:   0 24px 50px rgba(107, 31, 31, 0.30);

  /* ── ШРИФТЫ ──────────────────────────────────────────── */
  --font-display: var(--font-serif-display), Georgia, serif;
  --font-body:    var(--font-sans), system-ui, sans-serif;
  --font-ui:      var(--font-sans), system-ui, sans-serif;
  --font-serif:   var(--font-display);

  /* ── ШКАЛА ТИПОГРАФИКИ ───────────────────────────────── */
  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 16px;
  --text-md:   18px;
  --text-lg:   22px;
  --text-xl:   24px;
  --text-2xl:  36px;
  --text-3xl:  42px;
  --text-4xl:  46px;
  --text-5xl:  56px;
  --text-6xl:  76px;

  --leading-tight:   1.05;
  --leading-snug:    1.15;
  --leading-normal:  1.45;
  --leading-relaxed: 1.6;
  --leading-loose:   1.8;

  /* ── РАДИУСЫ ─────────────────────────────────────────── */
  --radius-sm:   8px;
  --radius-md:   16px;
  --radius-lg:   20px;
  --radius-xl:   24px;
  --radius-2xl:  28px;
  --radius-pill: 999px;

  /* ── ОТСТУПЫ ─────────────────────────────────────────── */
  --space-1:   4px;
  --space-2:   8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-14: 56px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;

  /* ── ШИРИНА КОЛОНОК ──────────────────────────────────── */
  --content-narrow: 720px;
  --content-mid:    900px;
  --content-wide:   1080px;
  --content-full:   1170px;
  --page-width:     1280px;
  --page-padding:   56px;

  /* ── ДЕФОЛТНАЯ ПАЛИТРА (когда data-theme не задан) ─── */
  --theme-bg-grad:     var(--grad-green-card);
  --theme-bg-soft:     var(--color-bg-green-soft);
  --theme-accent:      var(--color-green);
  --theme-accent-deep: var(--color-green-deep);
  --theme-accent-light:var(--color-green-light);
  --theme-text-on-grad:#FFFFFF;
  --theme-text-soft:   var(--color-green-deep);
  --theme-shadow:      var(--shadow-green-card);
}

/* ════════════════════════════════════════════════════════
   МОДИФИКАТОРЫ ПАЛИТР
   ════════════════════════════════════════════════════════ */

.public-theme [data-theme="green"] {
  --theme-bg-grad: var(--grad-green-card);
  --theme-bg-soft: var(--color-bg-green-soft);
  --theme-accent: var(--color-green);
  --theme-accent-deep: var(--color-green-deep);
  --theme-accent-light: var(--color-green-light);
  --theme-text-on-grad: #FFFFFF;
  --theme-text-soft: var(--color-green-deep);
  --theme-shadow: var(--shadow-green-card);
}

.public-theme [data-theme="orange"] {
  --theme-bg-grad: var(--grad-orange-card);
  --theme-bg-soft: #FFF5EC;
  --theme-accent: var(--color-orange);
  --theme-accent-deep: var(--color-orange-dark);
  --theme-accent-light: var(--color-orange-light);
  --theme-text-on-grad: #FFFFFF;
  --theme-text-soft: var(--color-orange-dark);
  --theme-shadow: var(--shadow-orange-card);
}

.public-theme [data-theme="blue"] {
  --theme-bg-grad: var(--grad-blue-card);
  --theme-bg-soft: var(--color-blue-soft);
  --theme-accent: var(--color-blue);
  --theme-accent-deep: var(--color-blue-dark);
  --theme-accent-light: var(--color-blue-light);
  --theme-text-on-grad: #FFFFFF;
  --theme-text-soft: var(--color-blue-dark);
  --theme-shadow: var(--shadow-blue-card);
}

.public-theme [data-theme="rose"] {
  --theme-bg-grad: var(--grad-rose-card);
  --theme-bg-soft: var(--color-rose-soft);
  --theme-accent: var(--color-rose);
  --theme-accent-deep: var(--color-rose-dark);
  --theme-accent-light: var(--color-rose-light);
  --theme-text-on-grad: #FFFFFF;
  --theme-text-soft: var(--color-rose-dark);
  --theme-shadow: var(--shadow-rose-card);
}

.public-theme [data-theme="wine"] {
  --theme-bg-grad: var(--grad-wine-card);
  --theme-bg-soft: var(--color-wine-soft);
  --theme-accent: var(--color-wine);
  --theme-accent-deep: var(--color-wine-dark);
  --theme-accent-light: var(--color-wine-light);
  --theme-text-on-grad: #FFFFFF;
  --theme-text-soft: var(--color-wine-dark);
  --theme-shadow: var(--shadow-wine-card);
}

.public-theme [data-theme="cream"] {
  --theme-bg-grad: linear-gradient(135deg, #FAFAF7 0%, #F4F2EC 100%);
  --theme-bg-soft: var(--color-cream-bg);
  --theme-accent: var(--color-cream-text);
  --theme-accent-deep: #3D2817;
  --theme-accent-light: var(--color-cream-deep);
  --theme-text-on-grad: var(--color-text-primary);
  --theme-text-soft: var(--color-cream-text);
  --theme-shadow: var(--shadow-card);
}
```

**Не трогать:** layout.tsx подключение шрифтов — `--font-serif-display` (Lora) и `--font-sans` (Manrope) уже подключены.

**Критерий:**
- Все хардкоды в палитре заменены переменными
- Build проходит
- Сайт открывается, может слегка измениться визуал акцентов — это ок

---

## ПРОВЕРОЧНАЯ ТОЧКА после Секции Б

Build, деплой. Сайт работает. Жди «Б ок».

---

# СЕКЦИЯ В — `blog-content.css`

## В1. Полностью переписать `blog-content.css`

**Файл:** `src/app/public-site/blog-content.css`

**Стратегия:** удалить всё старое содержимое, написать новое по структуре ниже.

**Полное содержимое файла:**

```css
/* ═══════════════════════════════════════════════════════
   BLOG CONTENT — Reborn Style
   Стилизует тело статей, Pillar и Hub
   ═══════════════════════════════════════════════════════ */

/* ── ОСНОВНАЯ ОБЁРТКА ─────────────────────────────────── */
.public-theme .blog-content {
  font-family: var(--font-body);
  color: var(--color-text-primary);
  line-height: var(--leading-loose);
  max-width: var(--content-narrow);
  margin: 0 auto;
}

.public-theme .hub-content {
  max-width: var(--content-narrow);
}

/* ── БАЗОВАЯ ТИПОГРАФИКА ──────────────────────────────── */
.public-theme .blog-content p {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-loose);
  color: var(--color-text-primary);
  margin: 0 0 18px;
}

.public-theme .blog-content p:last-child { margin-bottom: 0; }

/* Буквица для первого параграфа */
.public-theme .blog-content > p:first-of-type {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  font-weight: 400;
  margin-bottom: var(--space-8);
}

.public-theme .blog-content > p:first-of-type::first-letter {
  font-family: var(--font-display);
  font-size: 96px;
  font-weight: 700;
  line-height: 0.85;
  float: left;
  color: var(--color-green-dark);
  padding-right: 14px;
  padding-top: 8px;
}

/* H2 — курсивный с жирным первым словом через <span> */
.public-theme .blog-content h2 {
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--text-3xl);
  font-weight: 500;
  line-height: var(--leading-snug);
  color: var(--color-text-primary);
  margin: var(--space-14) 0 var(--space-5);
  letter-spacing: -0.01em;
}

.public-theme .blog-content h2 span {
  font-style: normal;
  font-weight: 700;
}

/* H3 */
.public-theme .blog-content h3 {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  line-height: var(--leading-snug);
  color: var(--color-text-primary);
  margin: var(--space-10) 0 var(--space-4);
}

.public-theme .blog-content strong {
  font-weight: 700;
  color: var(--color-text-primary);
}

.public-theme .blog-content em {
  font-style: italic;
}

.public-theme .blog-content a {
  color: var(--color-link);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  transition: opacity 0.15s;
}

.public-theme .blog-content a:hover {
  opacity: 0.7;
  text-decoration: none;
}

.public-theme .blog-content ul,
.public-theme .blog-content ol {
  margin: 0 0 18px;
  padding-left: var(--space-6);
}

.public-theme .blog-content ul li,
.public-theme .blog-content ol li {
  margin-bottom: var(--space-2);
  line-height: var(--leading-relaxed);
}

.public-theme .blog-content img {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-lg);
  margin: var(--space-8) 0;
}

.public-theme .blog-content table {
  width: 100%;
  border-collapse: collapse;
  margin: var(--space-8) 0;
  font-size: var(--text-sm);
}

/* ═══════════════════════════════════════════════════════
   BLOCKQUOTE
   ═══════════════════════════════════════════════════════ */
.public-theme .blog-content blockquote {
  margin: var(--space-10) 0;
  padding: var(--space-8) var(--space-10);
  background: var(--grad-green-pill);
  border: 1px solid var(--color-green-light);
  border-radius: var(--radius-lg);
  position: relative;
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--text-xl);
  color: var(--color-text-primary);
  line-height: var(--leading-normal);
  font-weight: 500;
}

.public-theme .blog-content blockquote::before {
  content: '"';
  display: block;
  font-family: var(--font-display);
  font-size: 64px;
  font-style: italic;
  color: var(--color-green-deep);
  line-height: 0.4;
  margin-bottom: 8px;
}

.public-theme .blog-content blockquote p {
  font: inherit;
  margin: 0;
}

.public-theme .blog-content blockquote cite,
.public-theme .blog-content blockquote footer {
  display: block;
  margin-top: 14px;
  font-family: var(--font-body);
  font-style: normal;
  font-size: var(--text-xs);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-green-deep);
  font-weight: 700;
}

/* ═══════════════════════════════════════════════════════
   .tip-block
   ═══════════════════════════════════════════════════════ */
.public-theme .tip-block {
  margin: var(--space-8) 0;
  padding: var(--space-6) var(--space-8);
  background: var(--color-tip-bg);
  border-left: 4px solid var(--theme-accent, var(--color-tip-border));
  border-radius: var(--radius-md);
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  color: var(--color-tip-text);
  font-family: var(--font-body);
  line-height: var(--leading-relaxed);
}

.public-theme .tip-block .tip-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.public-theme .tip-block strong {
  color: var(--theme-accent-deep, var(--color-orange-dark));
}

.public-theme .tip-block[data-theme="green"]   { background: var(--color-bg-green-soft); }
.public-theme .tip-block[data-theme="orange"]  { background: #FFF5EC; }
.public-theme .tip-block[data-theme="blue"]    { background: var(--color-blue-soft); }
.public-theme .tip-block[data-theme="rose"]    { background: var(--color-rose-soft); }
.public-theme .tip-block[data-theme="wine"]    { background: var(--color-wine-soft); }
.public-theme .tip-block[data-theme="cream"]   { background: var(--color-cream-bg); }

/* ═══════════════════════════════════════════════════════
   .kratko-block — «Кратко»
   ═══════════════════════════════════════════════════════ */
.public-theme .kratko-block {
  margin: var(--space-10) 0;
  padding: var(--space-8) var(--space-10);
  background: var(--theme-bg-soft, var(--color-bg-green-soft));
  border: 1px solid var(--color-green-light);
  border-radius: var(--radius-lg);
}

.public-theme .kratko-block h3 {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--theme-text-soft, var(--color-kratko-title));
  margin: 0 0 var(--space-5);
}

.public-theme .kratko-block ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.public-theme .kratko-block ul li {
  padding-left: var(--space-8);
  position: relative;
  margin-bottom: var(--space-3);
  line-height: var(--leading-relaxed);
  color: var(--color-text-primary);
  font-family: var(--font-body);
}

.public-theme .kratko-block ul li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--color-green-light), var(--color-green));
}

.public-theme .kratko-block ul li::after {
  content: '✓';
  position: absolute;
  left: 4px;
  top: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #FFFFFF;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ═══════════════════════════════════════════════════════
   .faq-block
   ═══════════════════════════════════════════════════════ */
.public-theme .faq-block {
  margin: var(--space-12) 0;
}

.public-theme .faq-block .faq-item {
  padding: var(--space-6) 0;
  border-top: 1px solid var(--color-divider);
}

.public-theme .faq-block .faq-item:first-child {
  border-top: none;
  padding-top: 0;
}

.public-theme .faq-block .faq-item h3 {
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--color-faq-q-text);
  margin: 0 0 var(--space-3);
  line-height: var(--leading-snug);
}

.public-theme .faq-block .faq-item p {
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin: 0;
}

/* ═══════════════════════════════════════════════════════
   .comparison-table
   ═══════════════════════════════════════════════════════ */
.public-theme .comparison-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: var(--space-10) 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}

.public-theme .comparison-table thead th {
  background: var(--color-bg-cream);
  padding: var(--space-4) var(--space-5);
  font-family: var(--font-body);
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  font-weight: 700;
  text-align: left;
}

.public-theme .comparison-table tbody td {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-divider);
  color: var(--color-ct-param-text);
  font-family: var(--font-body);
  font-size: 15px;
  vertical-align: top;
}

.public-theme .comparison-table tbody tr:hover td {
  background: var(--color-bg-cream);
}

/* ═══════════════════════════════════════════════════════
   .principle-step / .mistake-step
   ═══════════════════════════════════════════════════════ */
.public-theme .principle-step,
.public-theme .mistake-step {
  display: flex;
  gap: var(--space-5);
  margin: var(--space-8) 0;
  padding: var(--space-6) var(--space-8);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--theme-accent, var(--color-ps-border));
}

.public-theme .principle-step .ps-num,
.public-theme .principle-step > span:first-child,
.public-theme .mistake-step .ms-num,
.public-theme .mistake-step > span:first-child {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-pill);
  background: var(--theme-accent, var(--color-ps-num-bg));
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: 700;
}

.public-theme .mistake-step {
  border-left-color: var(--color-error-text);
}

.public-theme .mistake-step .ms-num,
.public-theme .mistake-step > span:first-child {
  background: var(--color-error-text);
}

.public-theme .principle-step h3,
.public-theme .mistake-step h3 {
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 6px;
}

.public-theme .principle-step p,
.public-theme .mistake-step p {
  margin: 0;
  font-size: 15px;
  line-height: var(--leading-relaxed);
}

/* ═══════════════════════════════════════════════════════
   .testimonial-card
   ═══════════════════════════════════════════════════════ */
.public-theme .testimonial-card {
  margin: var(--space-10) 0;
  padding: var(--space-8);
  background: var(--color-bg-cream);
  border-radius: var(--radius-lg);
  font-family: var(--font-display);
  font-style: italic;
  font-size: 17px;
  color: var(--color-tc-quote);
  line-height: var(--leading-relaxed);
}

.public-theme .testimonial-card cite {
  display: block;
  margin-top: var(--space-4);
  font-family: var(--font-body);
  font-style: normal;
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-orange);
  font-weight: 700;
}

/* ═══════════════════════════════════════════════════════
   .sources-list
   ═══════════════════════════════════════════════════════ */
.public-theme .sources-list {
  margin: var(--space-12) 0;
  padding: var(--space-8) var(--space-10);
  background: var(--color-bg-cream);
  border-radius: var(--radius-md);
}

.public-theme .sources-list h3,
.public-theme .sources-list .sl-title {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-sl-title);
  margin: 0 0 var(--space-5);
}

.public-theme .sources-list ol {
  list-style: none;
  counter-reset: src;
  padding: 0;
  margin: 0;
}

.public-theme .sources-list ol li {
  counter-increment: src;
  padding: var(--space-4) 0 var(--space-4) var(--space-10);
  border-top: 1px solid var(--color-divider);
  position: relative;
  font-size: 14px;
  line-height: var(--leading-relaxed);
}

.public-theme .sources-list ol li:first-child { border-top: none; }

.public-theme .sources-list ol li::before {
  content: counter(src);
  position: absolute;
  left: 0;
  top: var(--space-4);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-orange);
  color: #FFFFFF;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.public-theme .sources-list a {
  color: var(--color-orange);
}

/* ═══════════════════════════════════════════════════════
   .cta-button — старая кнопка
   ═══════════════════════════════════════════════════════ */
.public-theme .cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 18px 40px;
  border-radius: var(--radius-pill);
  background: var(--grad-orange-btn);
  color: #FFFFFF !important;
  text-decoration: none !important;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: var(--text-sm);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  box-shadow: var(--shadow-orange-btn);
  transition: opacity 0.2s, transform 0.15s;
  margin: var(--space-8) auto;
}

.public-theme .cta-button:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

.public-theme .cta-button[data-theme="green"] {
  background: var(--grad-green-btn);
  box-shadow: var(--shadow-green-btn);
}

/* ═══════════════════════════════════════════════════════
   .highlight-stat
   ═══════════════════════════════════════════════════════ */
.public-theme .highlight-stat {
  display: inline;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.4em;
  color: var(--color-stat-number);
  line-height: 1;
}

/* ═══════════════════════════════════════════════════════
   .disclaimer
   ═══════════════════════════════════════════════════════ */
.public-theme .disclaimer,
.public-theme p.disclaimer {
  margin: var(--space-8) 0;
  padding: var(--space-4) var(--space-5);
  background: var(--color-warning-bg);
  border-left: 4px solid var(--color-warning-border);
  border-radius: var(--radius-sm);
  color: var(--color-warning-text);
  font-size: 14px;
  line-height: var(--leading-relaxed);
}

/* ═══════════════════════════════════════════════════════
   .author-block (legacy) и .author-card (новый компонент)
   ═══════════════════════════════════════════════════════ */
.public-theme .author-block,
.public-theme .author-card {
  margin: var(--space-12) 0;
  padding: var(--space-6);
  background: var(--color-bg-cream);
  border-radius: var(--radius-lg);
  display: flex;
  gap: var(--space-6);
  align-items: flex-start;
}

.public-theme .author-card__photo {
  flex-shrink: 0;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  background: var(--color-bg-surface);
}

.public-theme .author-block img {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  margin: 0;
}

.public-theme .author-card__content,
.public-theme .author-block > div {
  flex: 1;
}

.public-theme .author-card__name,
.public-theme .author-block strong {
  display: block;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-author-name);
  margin-bottom: var(--space-1);
}

.public-theme .author-card__role {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--color-author-title);
  margin-bottom: var(--space-3);
}

.public-theme .author-card__bio,
.public-theme .author-block p {
  font-family: var(--font-body);
  font-size: 15px;
  line-height: var(--leading-relaxed);
  color: var(--color-text-primary);
  margin: 0;
}

.public-theme .author-card--compact {
  padding: 0;
  background: none;
  display: inline-block;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.public-theme .author-card--compact strong {
  display: inline;
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}

/* ═══════════════════════════════════════════════════════
   .subcat-card — карточка подкатегории
   ═══════════════════════════════════════════════════════ */
.public-theme .subcat-card {
  display: block;
  padding: var(--space-6);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}

.public-theme .subcat-card:hover {
  border-color: var(--color-subcat-border-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}

.public-theme .subcat-card h3 {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  color: var(--color-subcat-title);
  margin: 0 0 var(--space-2);
  font-weight: 700;
}

.public-theme .subcat-card p {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-3);
  line-height: var(--leading-relaxed);
}

.public-theme .subcat-card .arrow,
.public-theme .subcat-card::after {
  color: var(--color-subcat-arrow);
  font-weight: 700;
}

.public-theme .placeholder-block {
  margin: var(--space-10) 0;
  padding: var(--space-10);
  border: 2px dashed var(--color-divider);
  border-radius: var(--radius-md);
  text-align: center;
  color: var(--color-text-secondary);
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--text-md);
}

/* ═══════════════════════════════════════════════════════
   НОВЫЕ КЛАССЫ ИЗ МАКЕТА REBORN
   ═══════════════════════════════════════════════════════ */

/* ── .article-pill ──────────────────────────────────────── */
.public-theme .article-pill {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 8px 20px;
  border-radius: var(--radius-pill);
  background: var(--grad-green-pill);
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-green-deep);
}

.public-theme .article-pill .article-pill__sep {
  color: var(--color-green);
}

/* ── .quote-card ──────────────────────────────────────── */
.public-theme .quote-card {
  margin: var(--space-10) 0;
  padding: var(--space-8) var(--space-10);
  background: var(--theme-bg-soft, var(--grad-green-pill));
  border: 1px solid var(--theme-accent-light, var(--color-green-light));
  border-radius: var(--radius-lg);
  position: relative;
}

.public-theme .quote-card .quote-card__mark {
  display: block;
  font-family: var(--font-display);
  font-size: 64px;
  font-style: italic;
  color: var(--theme-text-soft, var(--color-green-deep));
  line-height: 0.4;
  margin-bottom: 8px;
}

.public-theme .quote-card .quote-card__text {
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--text-xl);
  color: var(--color-text-primary);
  line-height: var(--leading-normal);
  font-weight: 500;
  margin: 0;
}

.public-theme .quote-card .quote-card__author {
  margin-top: 14px;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--theme-text-soft, var(--color-green-deep));
  font-weight: 700;
}

/* ── .lead-magnet ───────────────────────────────────────── */
.public-theme .lead-magnet {
  margin: var(--space-12) 0;
  padding: var(--space-10) 44px;
  border-radius: var(--radius-xl);
  background: var(--theme-bg-grad, var(--grad-orange-card));
  box-shadow: var(--theme-shadow, var(--shadow-orange-card));
  position: relative;
  overflow: hidden;
  color: var(--theme-text-on-grad, #FFFFFF);
}

.public-theme .lead-magnet::before {
  content: '';
  position: absolute;
  width: 220px;
  height: 220px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  top: -60px;
  right: -60px;
  pointer-events: none;
}

.public-theme .lead-magnet[data-theme="green"]::before {
  bottom: -80px;
  right: -60px;
  top: auto;
}

.public-theme .lead-magnet .lead-magnet__badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.22);
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #FFFFFF;
  font-weight: 700;
  margin-bottom: var(--space-5);
  position: relative;
}

.public-theme .lead-magnet .lead-magnet__title {
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--text-2xl);
  color: #FFFFFF;
  font-weight: 500;
  line-height: var(--leading-snug);
  margin: 0;
  position: relative;
}

.public-theme .lead-magnet .lead-magnet__title span {
  font-style: normal;
  font-weight: 700;
}

.public-theme .lead-magnet .lead-magnet__desc {
  font-family: var(--font-body);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 14px 0 var(--space-6);
  line-height: var(--leading-relaxed);
  max-width: 520px;
  position: relative;
}

.public-theme .lead-magnet .lead-magnet__form {
  display: flex;
  max-width: 480px;
  background: var(--color-bg-surface);
  border-radius: var(--radius-pill);
  padding: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.10);
  position: relative;
}

.public-theme .lead-magnet .lead-magnet__input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 14px 22px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-primary);
}

.public-theme .lead-magnet .lead-magnet__input::placeholder { color: #aaa; }

.public-theme .lead-magnet button,
.public-theme .lead-magnet .btn {
  border: none;
  padding: 14px 24px;
  border-radius: var(--radius-pill);
  background: var(--grad-green-btn);
  color: #FFFFFF;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: var(--shadow-green-btn);
}

.public-theme .lead-magnet[data-theme="green"] button,
.public-theme .lead-magnet[data-theme="green"] .btn {
  background: var(--grad-orange-btn);
  box-shadow: var(--shadow-orange-btn);
}

/* ── .checklist-card ─────────────────────────────────── */
.public-theme .checklist-card {
  margin: var(--space-8) 0;
  padding: 28px 36px;
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-divider);
  box-shadow: var(--shadow-card);
}

.public-theme .checklist-card .checklist-card__label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-green);
  font-weight: 700;
  margin-bottom: var(--space-4);
}

.public-theme .checklist {
  list-style: none;
  padding: 0;
  margin: 0;
}

.public-theme .checklist .checklist__item {
  display: flex;
  gap: 14px;
  padding: 10px 0;
  border-top: 1px dashed var(--color-divider);
}

.public-theme .checklist .checklist__item:first-child {
  border-top: none;
}

.public-theme .checklist .checklist__icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--color-green-light), var(--color-green));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 700;
}

.public-theme .checklist .checklist__name {
  font-family: var(--font-body);
  font-size: 14.5px;
  color: var(--color-text-primary);
  font-weight: 700;
  line-height: 1.3;
}

.public-theme .checklist .checklist__note {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

/* ── .cta-card ──────────────────────────────────────────── */
.public-theme .cta-card {
  margin: var(--space-14) 0;
  padding: var(--space-14) var(--space-16);
  background: var(--theme-bg-grad, var(--grad-green-card));
  border-radius: var(--radius-2xl);
  box-shadow: var(--theme-shadow, var(--shadow-green-cta));
  display: grid;
  grid-template-columns: 1.4fr auto;
  gap: var(--space-10);
  align-items: center;
  position: relative;
  overflow: hidden;
  color: var(--theme-text-on-grad, #FFFFFF);
}

.public-theme .cta-card .cta-card__glow {
  position: absolute;
  top: -100px;
  left: -100px;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(255, 164, 95, 0.18), transparent 60%);
  pointer-events: none;
}

.public-theme .cta-card .cta-card__content { position: relative; }

.public-theme .cta-card .cta-card__badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.18);
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #FFFFFF;
  font-weight: 700;
  margin-bottom: var(--space-5);
}

.public-theme .cta-card .cta-card__title {
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--text-4xl);
  color: #FFFFFF;
  font-weight: 500;
  line-height: var(--leading-snug);
  margin: 0;
}

.public-theme .cta-card .cta-card__title span {
  font-style: normal;
  font-weight: 700;
}

.public-theme .cta-card .cta-card__desc {
  font-family: var(--font-body);
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  margin: var(--space-5) 0 28px;
  line-height: var(--leading-relaxed);
  max-width: 520px;
}

.public-theme .cta-card .cta-card__icon {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56px;
  color: var(--color-green-deep);
  font-weight: 700;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

/* ── .related-card (для RelatedArticles) ─────────────── */
.public-theme .related-card {
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-divider);
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s, transform 0.2s;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
}

.public-theme .related-card:hover {
  box-shadow: var(--shadow-card-lg);
  transform: translateY(-3px);
}

.public-theme .related-card .related-card__thumb {
  aspect-ratio: 16 / 9;
  position: relative;
  background: linear-gradient(135deg, var(--color-green-light), var(--color-green));
}

.public-theme .related-card .related-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.public-theme .related-card .related-card__tag {
  position: absolute;
  top: 16px;
  left: 16px;
  background: var(--color-bg-surface);
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--color-green-deep);
}

.public-theme .related-card .related-card__body {
  padding: var(--space-6) 26px 28px;
}

.public-theme .related-card .related-card__title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  color: var(--color-text-primary);
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 14px;
}

.public-theme .related-card .related-card__meta {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-secondary);
  letter-spacing: 0.08em;
}

/* ── ADAPTIVE 768px ───────────────────────────────────── */
@media (max-width: 768px) {
  .public-theme .blog-content { padding: 0 var(--space-4); }
  .public-theme .blog-content h2 { font-size: var(--text-2xl); }
  .public-theme .blog-content h3 { font-size: var(--text-md); }
  .public-theme .blog-content > p:first-of-type::first-letter { font-size: 64px; }

  .public-theme .lead-magnet { padding: var(--space-8) var(--space-6); }
  .public-theme .lead-magnet .lead-magnet__title { font-size: var(--text-xl); }
  .public-theme .lead-magnet .lead-magnet__form { flex-direction: column; gap: var(--space-3); padding: var(--space-3); }

  .public-theme .cta-card { padding: var(--space-10) var(--space-6); grid-template-columns: 1fr; }
  .public-theme .cta-card .cta-card__title { font-size: var(--text-2xl); }
  .public-theme .cta-card .cta-card__icon { width: 96px; height: 96px; font-size: 40px; margin: 0 auto; }

  .public-theme .quote-card { padding: var(--space-6) var(--space-8); }
  .public-theme .quote-card .quote-card__text { font-size: var(--text-md); }
}
```

**Критерий:** файл переписан, все правила в scope `.public-theme`, build проходит.

---

## ПРОВЕРОЧНАЯ ТОЧКА после Секции В

Деплой. Открыть Pillar и хабы — тело контента в новом стиле: kratko-block с зелёными чекбоксами, h2 курсивные, ссылки оранжевые, источники в кремовой карточке с цифрами в кружках. **Скриншоты двух страниц в отчёт.**

Жди подтверждение «В ок».

---

# СЕКЦИЯ Г — HERO И СТРАНИЦЫ

## Г1. Создать `UnifiedHero`

**Файл:** `src/components/public/article/UnifiedHero.tsx` (новый)

Все три варианта (`article` / `pillar` / `hub`) — в светлом стиле с декоративным «свечением».

```tsx
import Image from 'next/image'
import { ArticleMeta } from './ArticleMeta'

type Variant = 'article' | 'pillar' | 'hub'

type Props = {
  variant: Variant
  category?: string
  subcategory?: string
  readingTimeMin?: number
  title: string
  excerpt?: string | null
  authorName?: string
  authorRole?: string | null
  publishedAt?: string | null
  coverImageUrl?: string | null
}

const PILL_LABELS: Record<Variant, string> = {
  article: 'Статья',
  pillar: 'Путеводитель',
  hub: 'Раздел',
}

export function UnifiedHero(props: Props) {
  const showCover = props.variant === 'article' && props.coverImageUrl
  const showMeta = props.variant === 'article' && props.authorName

  return (
    <>
      <section className="unified-hero">
        <div className="unified-hero__glow" aria-hidden />

        <div className="unified-hero__inner">
          <div className="article-pill">
            <span>● {PILL_LABELS[props.variant]}</span>
            {props.readingTimeMin && (
              <>
                <span className="article-pill__sep">·</span>
                <span>{props.readingTimeMin} мин чтения</span>
              </>
            )}
            {props.category && (
              <>
                <span className="article-pill__sep">•</span>
                <span>{props.category}</span>
              </>
            )}
            {props.subcategory && (
              <>
                <span className="article-pill__sep">•</span>
                <span>{props.subcategory}</span>
              </>
            )}
          </div>

          <h1
            className="unified-hero__title"
            dangerouslySetInnerHTML={{ __html: props.title }}
          />

          {props.excerpt && (
            <p className="unified-hero__lead">{props.excerpt}</p>
          )}

          {showMeta && (
            <div className="unified-hero__meta">
              <ArticleMeta
                authorName={props.authorName!}
                authorRole={props.authorRole}
                publishedAt={props.publishedAt ?? null}
              />
            </div>
          )}
        </div>
      </section>

      {showCover && (
        <section className="article-cover">
          <div className="article-cover__inner">
            <div className="article-cover__frame">
              <Image
                src={props.coverImageUrl!}
                alt={typeof props.title === 'string' ? props.title.replace(/<[^>]*>/g, '') : ''}
                fill
                priority
                sizes="(max-width: 1080px) 100vw, 1080px"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        </section>
      )}
    </>
  )
}
```

**Стили `UnifiedHero`** — добавить в `theme.css` (в конец, **после** scope `.public-theme`):

```css
/* ── UNIFIED HERO ─────────────────────────────────────── */
.public-theme .unified-hero {
  padding: var(--space-10) var(--space-14) var(--space-16);
  position: relative;
  text-align: center;
  background: var(--color-bg-page);
}

.public-theme .unified-hero__glow {
  position: absolute;
  left: -40px;
  top: 220px;
  width: 380px;
  height: 220px;
  background: linear-gradient(110deg, transparent, rgba(127, 210, 135, 0.33) 50%, transparent);
  transform: rotate(-15deg);
  border-radius: var(--radius-md);
  pointer-events: none;
}

.public-theme .unified-hero__inner {
  max-width: var(--content-mid);
  margin: 0 auto;
  position: relative;
}

.public-theme .unified-hero__title {
  font-family: var(--font-display);
  font-size: clamp(36px, 5vw, var(--text-6xl));
  font-weight: 700;
  line-height: var(--leading-tight);
  letter-spacing: -0.025em;
  color: var(--color-text-primary);
  margin: var(--space-8) 0 0;
}

.public-theme .unified-hero__title em {
  font-style: italic;
  font-weight: 500;
}

.public-theme .unified-hero__lead {
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  margin: var(--space-8) auto 0;
  line-height: var(--leading-relaxed);
  max-width: 720px;
}

.public-theme .unified-hero__meta { margin-top: 36px; }

.public-theme .article-cover {
  padding: 0 var(--space-14) var(--space-20);
}

.public-theme .article-cover__inner {
  max-width: var(--content-wide);
  margin: 0 auto;
}

.public-theme .article-cover__frame {
  aspect-ratio: 16 / 7;
  background: linear-gradient(135deg, var(--color-cream-bg), var(--color-bg-surface));
  border-radius: var(--radius-2xl);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-card-lg);
}

.public-theme .article-cover__frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 768px) {
  .public-theme .unified-hero { padding: var(--space-8) var(--space-4) var(--space-10); }
  .public-theme .unified-hero__glow { display: none; }
  .public-theme .article-cover { padding: 0 var(--space-4) var(--space-12); }
  .public-theme .article-cover__frame { aspect-ratio: 4 / 3; }
}
```

---

## Г2. Подключить `UnifiedHero` в трёх местах

### Г2.1. SiloArticlePage
**Файл:** `src/app/public-site/blog/[category]/[subcategory]/[slug]/page.tsx`

Заменить `<ArticleHero ... />` на:
```tsx
<UnifiedHero
  variant="article"
  category={categoryLabel}
  readingTimeMin={readingTimeMin}
  title={post.title}
  excerpt={post.excerpt}
  authorName={author.name}
  authorRole={author.role}
  publishedAt={post.published_at}
  coverImageUrl={post.cover_image_url}
/>
```

После замены — старый `ArticleHero.tsx` удалить.

### Г2.2. BlogCategoryPage (Pillar)
**Файл:** `src/app/public-site/blog/[category]/page.tsx`

Заменить инлайн зелёный hero на:
```tsx
<UnifiedHero
  variant="pillar"
  category={cat.label}
  title={catExt.pillarH1 ?? cat.label}
  excerpt={catExt.pillarDescription ?? cat.description}
/>
```

### Г2.3. SubcategoryPage (Hub)
**Файл:** `src/app/public-site/blog/[category]/[subcategory]/page.tsx`

Заменить инлайн hero на:
```tsx
<UnifiedHero
  variant="hub"
  category={cat.label}
  subcategory={subData?.h1 ?? subLabel}
  title={subData?.h1 ?? subLabel}
  excerpt={description}
/>
```

---

## Г3. Подключить `AuthorCard`

**SiloArticlePage:** после `<div className="blog-content" dangerouslySetInnerHTML />` и перед `<RelatedArticles>`:
```tsx
<AuthorCard variant="full" />
```

**BlogCategoryPage:** после `partAfter` (после основного content_html):
```tsx
<AuthorCard variant="full" />
```

**SubcategoryPage:**
1. **Удалить** старый инлайн-JSX автора (тот что с `<img src="/natalia.png" />`)
2. Подключить:
```tsx
<AuthorCard variant="full" />
```

---

## Г4. Проверить `RelatedArticles`

Открыть `src/components/public/article/RelatedArticles.tsx`. Проверить какие классы используют карточки. Если структура и имена классов отличаются от `.related-card`/`.related-card__thumb`/`.related-card__tag`/`.related-card__body`/`.related-card__title`/`.related-card__meta` — привести к ним.

Стили `.related-card` уже добавлены в `blog-content.css` (секция В).

Если в `RelatedArticles` используется inline `style={{}}` — заменить на `className="related-card"` и т.д., чтобы стили из CSS подхватились.

---

## Г5. Финальные проверки

```bash
npm run typecheck && npm run lint && npm run build
```

Деплой. Проверить:

**`/blog/pohudenie/`** (Pillar):
- Светлый hero, пилюля `● ПУТЕВОДИТЕЛЬ · ПОХУДЕНИЕ`, заголовок Lora
- Декоративное «крыло» слева
- Тело Pillar в новом стиле
- AuthorCard
- Сетка подкатегорий

**`/blog/pohudenie/posle-40/`** (Hub):
- Светлый hero, пилюля `● РАЗДЕЛ · ПОХУДЕНИЕ · ПОСЛЕ 40`
- Тело Hub
- AuthorCard

**Любая статья** (если есть):
- Hero с пилюлей `● СТАТЬЯ · N МИН ЧТЕНИЯ · КАТЕГОРИЯ`
- Заголовок Lora с курсивом если в title есть `<em>`
- Лид курсивом
- Мета
- Обложка
- Тело с буквицей
- AuthorCard
- RelatedArticles

**Мобильный 375px:** заголовки переносятся, карточки стак вертикально, лид-магнит — кнопка под полем.

---

## Что НЕ делаем в этом этапе

- Расширение промпта генератора
- Превью статьи в админке
- WYSIWYG-редактор
- Регенерация хабов
- Sanitize HTML
- Перенос автора в БД
- Honeypot/rate-limit
- Шаблон OTP-письма

---

## Запреты

1. Не трогать `(club)/` кроме API-роутов админки блога.
2. SQL-миграции — только после preview и подтверждения.
3. Не вводить новые npm-зависимости.
4. Никаких `any`-типов.
5. Не использовать Tailwind в новых компонентах.
6. Все стили — через CSS-переменные. Хардкоды цветов запрещены кроме `rgba(255,255,255, X)`.

---

## Формат отчёта

Заполняй посекционно, после каждой секции жди подтверждение от заказчика прежде чем идти дальше.

```
## Этап 3 — отчёт

### СЕКЦИЯ А
- А1 (fallback): ...
- А2 (дубль blog-content): preview приведён, подтверждение получено, UPDATE выполнен (N записей)
- А3 (дубль article_prompt): preview, подтверждение, удалено id=...
- А4 (промпт): пропущено по решению заказчика
- А5 (AuthorCard): создан
- А6 (author-block из pohudenie): preview, подтверждение, UPDATE выполнен

### СЕКЦИЯ Б
- theme.css переписан, build pass, deploy ok
- Скриншот любой страницы (визуал должен быть примерно как до этапа)

### СЕКЦИЯ В
- blog-content.css переписан, build pass, deploy ok
- Скриншоты Pillar и Hub в новом стиле

### СЕКЦИЯ Г
- UnifiedHero создан, подключён в 3 местах
- AuthorCard подключен в 3 местах, инлайн-JSX автора удалён
- RelatedArticles проверен/допилен
- Скриншоты с прода: Pillar, Hub, Article (если есть), мобила

### Финальные проверки
- typecheck/lint/build: pass
- Замечания по ходу: ...
```
