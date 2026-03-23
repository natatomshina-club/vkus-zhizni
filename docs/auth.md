# docs/auth.md — Авторизация и оплата

## Авторизация (Supabase Auth)

### Вход — magic link
- Участница вводит email на /auth
- Supabase отправляет письмо со ссылкой
- Клик → /auth/callback → сессия → /dashboard
- Пароля нет совсем

### Защита роутов (proxy.ts)
```typescript
// proxy.ts — защищает /dashboard/* и /admin
export async function proxy(request: NextRequest) {
  // проверяет Supabase session
  // нет сессии → редирект на /auth
}
```
⚠️ В Next.js 16 файл называется proxy.ts, функция proxy (не middleware!)

### Supabase настройки
- Site URL: https://vkuszhizni.ru (prod) / http://localhost:3000 (dev)
- Redirect URL: /auth/callback
- Email confirm: включён

## Оплата (Prodamus)

### Тарифы
- Триал: 49₽/7 дней → автосписание 1500₽
- Месяц: 1500₽/мес
- Полгода: 6000₽

### Флоу оплаты
1. Участница нажимает «Попробовать за 49₽»
2. Редирект на Prodamus (форма оплаты)
3. Оплата → Prodamus шлёт webhook на /api/webhook/prodamus
4. Webhook создаёт magic link через Supabase Admin API
5. Письмо с входом → участница попадает в /dashboard
6. Редирект после оплаты на /welcome?plan=trial

### Welcome экран (/welcome)
- Конфетти-анимация
- «Добро пожаловать в клуб!»
- 3 иконки что ждёт
- Кнопка «Войти в личный кабинет» → /dashboard

### Webhook /api/webhook/prodamus
```typescript
// Проверяет подпись Prodamus
// При успешной оплате:
// 1. Создаёт/обновляет запись в members
// 2. Устанавливает subscription_status = 'trial' или 'active'
// 3. Устанавливает access_until
// 4. Создаёт magic link (supabaseAdmin.auth.admin.generateLink)
// 5. Отправляет письмо через Resend
```

### Статусы подписки (members.subscription_status)
- `trial` — пробный 7 дней
- `active` — полный клуб
- `expired` — истёк

### Отмена подписки
- Профиль → Подписка → «Отменить подписку»
- Экран удержания: «Может сделать паузу?»
- Отмена через Prodamus API автоматически
- Доступ до конца оплаченного периода
- НЕ прятать кнопку отмены!

## Таблица members (ключевые поля)
```sql
id uuid,
email text,
full_name text,
subscription_status text, -- trial/active/expired
created_at timestamptz,
access_until timestamptz,
-- профиль тела
weight numeric, height numeric, age int,
goal_weight numeric, activity_level text,
-- здоровье
health_conditions jsonb, allergies text,
-- КБЖУ (рассчитывается из профиля)
kbju_calories int, kbju_protein int,
kbju_fat int, kbju_carbs int,
-- сегмент из онбординга
segment text, -- quick_start/mama/health/maintain
-- кухня
kitchen_requests_today int4 DEFAULT 0,
kitchen_date text,
-- часовой пояс
timezone text DEFAULT 'Europe/Moscow'
```

## Расчёт КБЖУ (из профиля)
```typescript
// Базовый обмен (Миффлин-Сан Жеор для женщин):
BMR = 10 * weight + 6.25 * height - 5 * age - 161

// Коэффициент активности:
// sedentary: x1.2 | light: x1.375 | moderate: x1.55
// active: x1.725 | on_feet: x1.25 (метод Натальи)

TDEE = BMR * activityCoeff
target_calories = TDEE - 300 // дефицит для похудения

// Метод Натальи:
protein = weight * 1.5  // г/кг веса
fat = 80                 // минимум 70г, норма 80-100г
carbs = (target_calories - protein*4 - fat*9) / 4
```

## Geography (оплата)
- Россия: все способы, рекурренты ✅
- Казахстан: prodamus.kz, тенге ✅
- Беларусь: Visa/MC ✅
- Прочие СНГ: нестабильно ❌
