# Дизайн-система клуба

Описывает дизайн-токены, шрифты и CSS-архитектуру `club.nata-tomshina.ru`.

> [!info] Область модуля
> Описывает дизайн клубной части приложения (`/dashboard`).
> Дизайн публичного сайта — [[../02-public-site/design-system.md]].
> Два дизайна полностью изолированы через скоупирование CSS.

---

## 1. Архитектура CSS

```
src/app/
├── globals.css           ← единственный CSS-файл клуба (5.2 KB)
└── public-site/
    └── theme.css         ← CSS публичного сайта — ИЗОЛИРОВАН в .public-theme
```

Клуб не скоупирован явно — его переменные определены в `:root` и действуют
глобально. Публичный сайт обёрнут в класс `.public-theme` и не влияет на клуб.

**Два полностью изолированных дизайна:**

| | Клуб (`/dashboard`) | Публичный сайт |
|---|---|---|
| Layout | `src/app/layout.tsx` | `src/app/public-site/layout.tsx` |
| CSS | `globals.css` (5 KB) | `theme.css` + `blog-content.css` (121 KB) |
| Scope CSS-переменных | глобальный (`:root`) | изолированный (`.public-theme`) |
| Шрифты | Unbounded + Nunito | Playfair Display + Manrope |
| Главный цвет | Фиолетовый `#7C5CFC` | Зелёный `#1F5A33` + Оранжевый `#F77D27` |

---

## 2. Tailwind

Tailwind v4 без конфига — аналогично публичному сайту (подробнее:
[[../02-public-site/design-system.md#2-tailwind]]):
- Нет `tailwind.config.ts` / `tailwind.config.js`
- Подключение: `@import "tailwindcss"` первой строкой в `globals.css`
- Токены задаются через CSS-переменные в `:root`, не через `theme.extend`
- PostCSS-плагин: `@tailwindcss/postcss`

В коде компонентов Tailwind-утилиты (`rounded-2xl`, `flex`, `gap-3`,
`text-sm`, `font-bold` и т.д.) комбинируются с `style={{ ... }}` на основе
CSS-переменных для состояний (hover, active, selected).

---

## 3. Цветовая палитра

### Объявленные токены (`:root` в `globals.css`)

| Токен | Hex / значение | Применение |
|---|---|---|
| `--pur` | `#7C5CFC` | Главный акцент: CTA-кнопки, ссылки, фокус-бордеры, график трекера |
| `--pur-light` | `#EDE9FF` | Бейджи, фоны чипов победы, светлые элементы |
| `--grn` | `#A8E6CF` | Зелёный акцент (нейтральный) |
| `--grn-light` | `#E8FFF4` | Фон «Победа записана!» и успешных уведомлений |
| `--yel` | `#FFD93D` | Жёлтый акцент |
| `--yel-light` | `#FFFBE6` | Светло-жёлтый фон |
| `--ora` | `#FF9F43` | Оранжевый: превышение нормы КБЖУ, toggle тяги к сладкому |
| `--ora-light` | `#FFF3E6` | Светло-оранжевый фон |
| `--bg` | `#FAF8FF` | Фон страниц (тёплый белый с фиолетовым оттенком) |
| `--text` | `#2D1F6E` | Основной текст |
| `--card` | `#FFFFFF` | Фон карточек |
| `--border` | `#EDE9FF` | Границы карточек, инпутов, разделители |
| `--muted` | `rgba(45,31,110,0.45)` | Вторичный текст, метки, подписи |

### Hardcoded цвета в компонентах

| Hex | Компонент | Назначение |
|---|---|---|
| `#4CAF78` | DiaryClient | Зелёный дневника: заполненные дни, активный чип, прогресс КБЖУ, «Сохранено» |
| `#2D7A4A` | DiaryClient | Тёмно-зелёный текст поверх `#4CAF78` |
| `#E8845A` | DiaryClient | Кнопки удаления приёма пищи |
| `#1A7A4F` | WinInput | Текст сообщения «Победа записана!» |
| `#6B4CE5` | globals.css | Hover для `--pur` в Driver.js туре |
| `#2A9D5C` | WinFeed | Зелёный бордер в ленте побед (2-й цвет) |
| `#FF6B9D` | WinFeed | Розовый бордер в ленте побед (5-й цвет) |

### Незадекларированные переменные

> [!warning] `--pale` и `--pur-lt` используются, но не объявлены в globals.css
> - `var(--pale)` — используется в WinFeed и admin-страницах как очень тусклый текст.
>   В globals.css не объявлена → браузер возвращает `undefined` / пустое значение.
>   Вероятно задумывалась как более слабая версия `--muted`.
> - `var(--pur-lt)` — используется в 10+ admin-страницах как светло-фиолетовый фон.
>   В globals.css не объявлена → аналогично `undefined`.
>   Вероятно задумывалась как алиас для `--pur-light` (`#EDE9FF`).
>
> Обе переменные отсутствуют в globals.css — добавить или заменить на объявленные.

---

## 4. Типографика

Подключение через `next/font/google` в `src/app/layout.tsx`:

```ts
const unbounded = Unbounded({
  variable: '--font-unbounded',
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600', '700'],
})

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
})
```

Автооптимизация Next.js — шрифты встроены в `/_next/static/media/`,
нет внешних HTTP-запросов в runtime.

**Применение (из `globals.css`):**
```css
body {
  font-family: var(--font-nunito), system-ui, sans-serif;
}
h1, h2, h3, h4 {
  font-family: var(--font-unbounded), system-ui, sans-serif;
}
```

| Шрифт | Переменная | Применение |
|---|---|---|
| **Unbounded** | `--font-unbounded` | Заголовки h1–h4, название раздела, числа в прогресс-блоке |
| **Nunito** | `--font-nunito` | Всё остальное: тело, кнопки, чипы, подписи, формы |

---

## 5. Структура globals.css

Файл 5.2 KB, 7 смысловых блоков в порядке объявления:

| № | Блок | Содержимое |
|---|---|---|
| 1 | Импорт + reset | `@import "tailwindcss"`, `html { scroll-behavior: smooth }` |
| 2 | CSS-переменные | `:root { --pur, --bg, --text, ... }` — 13 токенов |
| 3 | Базовая типографика | `body`, `h1–h4` с шрифтовыми переменными |
| 4 | Hover-утилиты | `.btn-lift`, `.card-lift` — translateY + box-shadow |
| 5 | Driver.js тур | `.vkus-tour-popover` и дочерние — онбординг-поповер |
| 6 | Анимации | `@keyframes pulse` (медитации), `@keyframes fadeIn` (уведомления) |
| 7 | Глобальные tap/press | Убирает tap-highlight iOS, transition на всех кнопках, `.btn-back`, `.channel-pill`, `.pressable`, `.no-press`, `.protected-content` |

> [!info] Один файл — весь клуб
> В отличие от публичного сайта (121 KB CSS), клуб живёт в одном
> небольшом `globals.css` (5.2 KB). Компонентная стилизация — через
> `style={{ ... }}` с CSS-переменными, без отдельных CSS-модулей.

---

## 6. Компоненты клуба

### DiaryClient (`src/components/DiaryClient.tsx`)

Дневник питания — самый стилистически насыщенный компонент клуба.

**Ключевые паттерны:**
- Карточки: `rounded-2xl`, `background: var(--card)`, `border: 1px solid var(--border)`
- Прогресс-бары КБЖУ: `background: #4CAF78` в норме / `#FF9F43` при превышении
- Календарь: выбранный день `background: #4CAF78`, заполненный `#4CAF7826` (с alpha)
- Чипы самочувствия (wellness): неактивный `var(--border)/var(--muted)`, активный `border: 2px solid #4CAF78`, `color: white` при выборе

**Три группы wellness-чипов:**
```ts
{ label: 'Настроение',     chips: ['😊 Отлично', '🙂 Хорошо', '😐 Нормально', '😴 Устала', '🤕 Плохо'] }
{ label: 'Пищеварение',    chips: ['✅ Всё хорошо', '🫧 Вздутие', '💢 Тяжесть', '🔥 Изжога', '😣 Дискомфорт в животе'] }
{ label: 'Энергия/тяга',   chips: ['⚡ Энергии много', '😌 Спокойная', '🍬 Тяга к сладкому была', '😤 Раздражительность', '😶 Голод между едой'] }
```

### ProgressBlock (`src/app/(club)/dashboard/wins/components/ProgressBlock.tsx`)

Блок прогресса 2×2 на странице побед.

- Обёртка: `rounded-2xl`, `var(--card)`, `var(--border)`
- Карточки внутри: `rounded-xl`, `var(--bg)`, `var(--border)`
- Дельта (−X кг): `color` зелёный / красный в зависимости от знака
- Значение: `font-family: var(--font-unbounded)`, `color: var(--text)`
- Ссылки: `color: var(--pur)`

### WinFeed (`src/app/(club)/dashboard/wins/components/WinFeed.tsx`)

Лента побед с 5-цветным левым бордером по кругу:

```ts
const BORDER_COLORS = ['#7C5CFC', '#2A9D5C', '#FFD93D', '#FF9F43', '#FF6B9D']
// стиль: borderLeft: `4px solid ${BORDER_COLORS[idx % 5]}`
```

Бейдж «с Главной»: `background: var(--pur-light)`, `color: var(--pur)` (rounded-full, text-[10px]).

### TrackerClient (`src/components/TrackerClient.tsx`)

Форма замера + ачивки + график.

- Инпуты: `borderColor: active ? 'var(--pur)' : 'var(--border)'`
- Toggle тяги к сладкому: активный `borderColor: #FF9F43`, `background: #FFF3E5`
- Кнопки метрики/периода графика: активный `borderColor: var(--pur)`, иначе `var(--border)`
- Ачивки: активная `opacity: 1`, неактивная `opacity: 0.35 + grayscale(1)`

### Chart.js (в TrackerClient)

```ts
// Линейный график, react-chartjs-2
{
  borderColor: '#7C5CFC',
  backgroundColor: 'rgba(124,92,252,0.10)',
  fill: true,
  tension: 0.35,
  pointBackgroundColor: '#7C5CFC',
  pointRadius: 4,
}
```

Зарегистрированные компоненты: `CategoryScale`, `LinearScale`, `PointElement`, `LineElement`, `Filler`, `Tooltip`.

### Chips победы (WinInput) (`src/components/WinInput.tsx`)

Пассивные чипы (только подставляют текст, без toggle-состояния):

```
rounded-full + border + borderColor: var(--border) + color: var(--muted) + bg: var(--bg)
```

Textarea при фокусе: `borderColor → var(--pur)`, при blur → `var(--border)`.
Кнопка «Записать»: `background: var(--pur)`, белый текст.
Сообщение успеха: `background: var(--grn-light)`, `color: #1A7A4F`.

---

## 7. Иконки

В клубе **нет иконочной библиотеки** (lucide-react, heroicons и др. не установлены).

Все декоративные элементы — emoji:
```
🌱 ⭐ 🏆 💚 🍬 👑  — ачивки трекера
🎉 🏆              — победы
😊 🙂 😐 😴 🤕    — настроение
💢 🫧 🔥 😣 ✅    — пищеварение
⚡ 😌 🍬 😤 😶    — энергия
📏 ⚖️ 🔵 💗       — параметры тела в ProgressBlock
```

SVG-графика — только в нескольких специфичных местах:
- Иконка «←» в хедере (кастомный SVG)
- Лого в Sidebar

---

## 8. Связи с другими модулями

| Модуль | Связь |
|---|---|
| [[../02-public-site/design-system.md]] | Параллельная дизайн-система публичного сайта (другая палитра, другие шрифты) |
| [[modules/diary.md]] | DiaryClient — основной потребитель `#4CAF78` и wellness-чипов |
| [[modules/measurements.md]] | TrackerClient — Chart.js `#7C5CFC`, toggle `--ora` |
| [[modules/wins.md]] | WinFeed (5-цветный бордер), WinInput, ProgressBlock |
| [[../02-public-site/site-routing.md]] | Изоляция через `.public-theme` — клуб = глобальный `:root` |

---

## 9. Шпаргалка

```tsx
// Карточка в стиле клуба
<div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16 }}>
  <h3 style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
    Заголовок
  </h3>
  <p style={{ fontFamily: 'var(--font-nunito)', color: 'var(--muted)' }}>
    Подпись
  </p>
</div>

// Кнопка-акцент
<button style={{ background: 'var(--pur)', color: '#fff', fontFamily: 'var(--font-nunito)' }}>
  Действие
</button>

// Чип (пассивный)
<span style={{
  borderRadius: 9999,
  border: '1px solid var(--border)',
  color: 'var(--muted)',
  background: 'var(--bg)',
  fontFamily: 'var(--font-nunito)',
  fontSize: 12,
  padding: '4px 10px',
}}>
  Метка
</span>

// Бейдж (accent)
<span style={{
  background: 'var(--pur-light)',
  color: 'var(--pur)',
  fontFamily: 'var(--font-nunito)',
  borderRadius: 9999,
  fontSize: 10,
  padding: '2px 8px',
  fontWeight: 600,
}}>
  с Главной
</span>

// Фон страницы
<div style={{ background: 'var(--bg)', minHeight: '100dvh' }}>

// НЕ использовать: var(--pale), var(--pur-lt) — не объявлены
// Вместо --pale:   var(--muted)
// Вместо --pur-lt: var(--pur-light)
```

---

## 10. История изменений

| Дата | Событие |
|---|---|
| Март 2026 | Разработка клубной части. CSS-переменные заложены в globals.css. |
| Май 2026 | Добавлен Driver.js онбординг-тур, tap-эффекты, `protected-content`. |
| 23.05.2026 | Модуль записан в Vault по результатам разведки. |
