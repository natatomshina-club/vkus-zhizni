# CLAUDE.md — Вкус Жизни (главный файл)

## ⚠️ КРИТИЧЕСКОЕ ПРАВИЛО
НИКОГДА не использовать слова «кето», «лоукарб», «LCHF».
Заменять на: «питание для гормонального баланса», «метод Натальи», «умное питание», «питание без голода».

---

## 🏗 СТЕК
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL + Auth) — URL: https://byykvsjamtcklwtnjkpf.supabase.co
- Vercel (хостинг)
- YandexGPT (ИИ-бот) — YANDEX_FOLDER_ID=b1g69djak9cp81fs17a7
- Prodamus (оплата)
- Crisp (чат с Наташей)
- Kinescope (видео embed)
- Resend (email)

## 🔑 КОМАНДЫ
```bash
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

## ⚙️ ВАЖНО: Next.js 16
- middleware.ts переименован в proxy.ts
- Функция должна называться `proxy`, не `middleware`

---

## 🗂 РОУТЫ

### Публичные
- `/` — лендинг
- `/auth` — вход magic link
- `/join` — страница оплаты (49₽ триал)
- `/minicourse` — бесплатный мини-курс

### ЛК (защищены proxy.ts)
- `/dashboard` — главная
- `/dashboard/kitchen` — умная кухня (YandexGPT)
- `/dashboard/rations` — примеры рационов PDF
- `/dashboard/favorites` — избранные рецепты
- `/dashboard/diary` — дневник питания
- `/dashboard/tracker` — трекер замеров
- `/dashboard/wins` — маленькие победы
- `/dashboard/body` — я и моё тело
- `/dashboard/webinars` — вебинары
- `/dashboard/meditations` — медитации
- `/dashboard/minicourse` — мини-курс
- `/dashboard/marathon` — марафон
- `/dashboard/profile` — профиль
- `/dashboard/chat` — чат с Наташей (Crisp)
- `/dashboard/about` — о клубе

### API
- `/api/kitchen/generate` — YandexGPT рецепты
- `/api/webhook/prodamus` — вебхук оплаты
- `/auth/callback` — Supabase OAuth callback

### Админка
- `/admin` — только Наташа

---

## 🎨 ДИЗАЙН

### Шрифты (next/font/google)
```tsx
import { Unbounded, Nunito } from 'next/font/google'
// Unbounded — заголовки (700, 800)
// Nunito — текст (400, 600, 700, 800)
// subsets: ['cyrillic', 'latin']
```

### CSS переменные
```css
--pur: #7C5CFC;       /* фиолетовый основной */
--pur-lt: #F0EEFF;    /* фиолетовый светлый */
--pur-br: #DDD5FF;    /* фиолетовый рамка */
--grn: #A8E6CF;       /* зелёный */
--grn-dk: #2D6A4F;    /* зелёный тёмный */
--yel: #FFD93D;       /* жёлтый */
--yel-dk: #5C4200;    /* жёлтый тёмный */
--ora: #FF9F43;       /* оранжевый */
--red: #FF6B6B;       /* красный */
--bg: #FAF8FF;        /* фон страницы */
--card: #ffffff;      /* фон карточек */
--text: #2D1F6E;      /* основной текст */
--muted: #7B6FAA;     /* приглушённый текст */
--pale: #9B8FCC;      /* очень приглушённый */
--border: #EDE8FF;    /* рамки */
```

---

## 📐 АДАПТИВНОСТЬ (ОБЯЗАТЕЛЬНО)
```tsx
// Layout структура
<div className="flex h-screen overflow-hidden">
  <Sidebar className="hidden lg:flex w-[220px] flex-shrink-0" />
  <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
    {children}
  </main>
  <MobileNav className="lg:hidden fixed bottom-0 left-0 right-0" />
</div>
```
- Кнопки: минимум `min-h-[48px]`
- Текст: минимум `text-sm` (14px), `text-base` на мобайле

---

## 🗄 БАЗА ДАННЫХ (Supabase)

### Таблицы
- `members` — участницы (email, статус, профиль, КБЖУ, здоровье, сегмент)
- `measurements` — замеры (вес, объёмы, энергия)
- `diary_entries` — дневник питания
- `saved_recipes` — избранные рецепты из кухни
- `wins` — маленькие победы
- `lessons` — уроки мини-курса
- `lesson_progress` — прогресс уроков
- `meal_plans` — рационы от Наташи

### Ключевые поля members
```sql
id, email, full_name, status (trial/active/expired),
created_at, access_until,
weight, height, age, goal_weight, activity_level,
health_conditions (jsonb), allergies (text),
kbju_calories, kbju_protein, kbju_fat, kbju_carbs,
segment (quick_start/mama/health/maintain),
kitchen_requests_today (int4), kitchen_date (text)
```

---

## 🔐 АВТОРИЗАЦИЯ
- Magic link через Supabase Auth (без пароля)
- proxy.ts защищает все роуты /dashboard/* и /admin
- Редирект неавторизованных на /auth
- После входа — редирект на /dashboard

---

## 📱 МОБИЛЬНОЕ МЕНЮ (5 пунктов)
🏠 Главная | 🍳 Кухня | 📓 Дневник | 👤 Профиль | 💬 Чат

---

## 🖥 САЙДБАР ДЕСКТОП (220px)
- Логотип: текст «Вкус Жизни» + «Клуб» (БЕЗ иконки)
- Блок участницы: имя, день N · статус, 4 чипа КБЖУ
- Меню: Главная, О клубе → Кухня, Избранное, Дневник, Трекер, Победы → [Обучение]: Мини-курс, Я и тело, Вебинары, Медитации → Марафон, Чат, Профиль
- Плашка триал (фиолетовая) или полный клуб (зелёная)

---

## 💳 ТАРИФЫ
- Триал: 49₽/7 дней → автосписание 1500₽
- Месяц: 1500₽
- Полгода: 6000₽

### Доступ в триале
✅ Кухня (3 запроса/день), Дневник, Трекер, Победы, Мини-курс (6 уроков)
🔒 Марафон, Карточки-спасалки, расширенная библиотека

---

## 📧 EMAIL (Resend)
- Письмо входа: кастомизировать под стиль «Вкус Жизни» (TODO)
- Серия триала: дни 0,1,2,3,4,5,6,7 (Make.com)
- Webhook Prodamus: https://vkuszhizni.ru/api/webhook/prodamus
