# 🌿 ВКУС ЖИЗНИ — Мозг проекта v7
## Вставляй этот файл в начало каждой новой сессии с Claude

**Последнее обновление:** 31 марта 2026
**Статус:** MVP фаза 3 — партнёрская программа добавлена и протестирована ✅

---

## 👤 О ПРОЕКТЕ

**Название:** Клуб стройных и здоровых «Вкус Жизни»
**Основатель:** Наталья Томшина — нутрициолог (не врач), мама двоих детей, практикует метод с 2017 года
**Суть метода:** Питание влияет на гормональный баланс → снижение веса как побочный эффект здоровья. Белок + некрахмалистые овощи + полезные жиры, без быстрых углеводов и сахара.

**КРИТИЧЕСКОЕ ПРАВИЛО:** Никогда не использовать слова «кето», «лоукарб», «LCHF». Заменять на: «питание для гормонального баланса», «метод Натальи», «умное питание», «питание без голода», «система Вкус Жизни», «метаболическое питание».

---

## 🏗 ТЕХНИЧЕСКАЯ АРХИТЕКТУРА

### Стек
- **Frontend + Backend:** Next.js 14 (App Router) + TypeScript
- **База данных:** Supabase (PostgreSQL + Auth) — FREE план (нужен апгрейд до Pro перед запуском)
- **Хостинг:** Vercel — регион **fra1 (Франкфурт)** — Hobby план (нужен апгрейд до Pro)
- **CDN/Защита:** Cloudflare (Free) — подключён 28.03.2026, SSL Full (strict)
- **Домен клуба:** club.nata-tomshina.ru ✅
- **Публичный сайт:** nata-tomshina.ru ✅
- **Деплой:** `npx vercel --prod` (автодеплой с GitHub не работает)
- **Оплата:** CloudPayments ✅ РАБОТАЕТ
- **Push-уведомления:** OneSignal ✅ РАБОТАЕТ
- **Email рассылки:** Resend ✅ + /admin/emails ✅
- **PWA:** настроен ✅ manifest.json + иконки
- **ИИ-бот:** YandexGPT
- **Email:** Resend, noreply@nata-tomshina.ru ✅
- **Видео:** Kinescope (embed через iframe)
- **Хранилище:** Supabase Storage
- **Генерация картинок:** fal.ai (flux/schnell)
- **ИИ для статей:** Anthropic API (claude-sonnet-4-20250514)
- **Аналитика:** Яндекс.Метрика (счётчик 108262096) + своя таблица page_views

### Данные Supabase
- URL: https://byykvsjamtcklwtnjkpf.supabase.co
- Anon key: sb_publishable_2V678YWUVeSiT0g1mUOHKg_zfOUFSVj
- Проект: natatomshina-club / регион: fra1

### Vercel env (все добавлены)
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY, CRON_SECRET, NEXT_PUBLIC_SITE_URL
- YANDEX_API_KEY, YANDEX_FOLDER_ID
- ANTHROPIC_API_KEY, FAL_KEY
- JWT_SECRET (для /free лид-магнита и partner_token)
- NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID=pk_ef164a2e6a2ab9c21f55a72eb6d35 ✅
- CLOUDPAYMENTS_API_SECRET=94e2750be00e370189423df2fc83616d ✅
- NEXT_PUBLIC_ONESIGNAL_APP_ID=1e761684-fb38-45be-a996-5265a2e5f4aa ✅
- ONESIGNAL_APP_ID=1e761684-fb38-45be-a996-5265a2e5e4aa ✅
- ONESIGNAL_REST_API_KEY=os_v2_app_dz3bnbh3hbc35kmwkjs2fzpevljwgobaul2urz5hzi2jyggk4yk7dfa7yewfdqdcadzeym27lgwwwwhpyqguomcspuysotmykhuwycq ✅

---

## 💳 ТАРИФЫ (актуальные цены на 31.03.2026)

- **Пробный:** 149 ₽ за 7 дней + рекуррент 1500₽/мес через 7 дней автоматически
- **Месяц:** 1 500 ₽/мес автопродление
- **Полгода:** 6 000 ₽ разовый платёж (экономия 3 000 ₽, марафоны включены)

---

## 🔑 КРИТИЧЕСКИ ВАЖНО: Проблема синхронизации IDs

### Суть проблемы
В проекте два хранилища пользователей:
1. `auth.users` (Supabase Auth) — UUID создаётся при первом входе через OTP
2. `members` (наша таблица) — UUID создаётся при регистрации/оплате

Эти UUID могут **не совпадать**!

### Паттерн для всех API роутов
Везде где нужен member_id — использовать lookup по email через service role, НЕ user.id:
```typescript
const supabaseAdmin = createServiceClient() // service role key, обходит RLS
const { data: member } = await supabaseAdmin
  .from('members')
  .select('id')
  .eq('email', user.email)
  .single()
// Использовать member.id, НЕ user.id
```

---

## 📊 БАЗА ДАННЫХ — КЛЮЧЕВЫЕ ТАБЛИЦЫ

### Таблица members (важные поля)
```
subscription_status     — 'inactive'|'trial'|'active'|'expired'|'cancelled'
subscription_plan       — 'trial'|'month'|'halfyear'
subscription_ends_at    — дата окончания (ОСНОВНОЕ поле)
onboarding_completed    — bool, заполнена анкета (квиз при первом входе)
tour_completed          — bool, показан обучающий тур (ОТДЕЛЬНО от онбординга!)
role                    — 'member'|'curator'|'admin'
referred_by             — uuid → affiliates.id (партнёр который привёл участницу)
ref_code_used           — text (какой ref_code был использован)
```

### Таблица subscribers (холодная база, лид-магнит)
```
email, name, source, status (active|unsubscribed), converted_to_member, converted_at
sequence_step, tags, subscribed_at, unsubscribed_at, lead_magnet_sent_at
```

### Таблица email_campaigns
```
id, title, subject, body_html, body_text, segment, sent_at, sent_count, created_by, created_at
```

### Таблица push_subscriptions
```
id, member_id, player_id (text, UNIQUE), active, platform, subscribed_at, unsubscribed_at, updated_at
```

### Таблицы партнёрской программы
```
affiliates              — партнёры (ref_code, commission_rate, recurring_rate, status, otp_code...)
affiliate_clicks        — переходы по реф-ссылкам (ip_hash, user_agent_hash)
affiliate_commissions   — начисления (payment_amount, commission_amount, type, status, approve_after)
pending_refs            — временное хранилище ref_code до оплаты (email PRIMARY KEY, ref_code)
```

---

## 📧 EMAIL-РАССЫЛКИ

### Инфраструктура
- **Transactional:** Resend (домен верифицирован, noreply@nata-tomshina.ru)
- **Страница управления:** /admin/emails
- **Лимит бесплатного плана:** 3000 писем/мес, 100/день → нужен Pro ($20/мес) перед запуском рассылок

### Две базы
1. **subscribers** — холодная база (лид-магнит с сайта, импорт из Геткурса)
2. **members** — участницы клуба (сегменты: trial, active, expired)

### API
- `POST /api/subscribe` — подписка с сайта
- `POST /api/admin/emails/send-announcement` — анонс по сегменту (батчи по 50, задержка 1с)
- `POST /api/admin/emails/import-csv` — импорт из Геткурса
- `GET /api/unsubscribe?token=TOKEN` — отписка (token = base64url(email))

### Конверсия подписчика
При оплате (вебхук CloudPayments) → `subscribers.converted_to_member = true`
Конвертированные не получают письма с предложением вступить в клуб.

### Anti-spam
- Ссылка отписки в каждом письме (обязательна по закону)
- Батчинг по 50 писем с задержкой 1с
- Не слать по купленным базам (риск потерять домен)

### Импорт из Геткурса
Геткурс экспортирует CSV: email, имя, фамилия, телефон, дата регистрации, статус.
Страница /admin/emails → вкладка «Подписчики» → кнопка «Импорт CSV» → 3 шага: загрузка → маппинг колонок → подтверждение.
Участницы клуба при импорте пропускаются автоматически.

---

## 🔔 PUSH-УВЕДОМЛЕНИЯ (OneSignal)

### Настройки OneSignal
- App ID: 1e761684-fb38-45be-a996-5265a2e5e4aa
- Платформа: Web, URL: https://club.nata-tomshina.ru
- Service Worker: /OneSignalSDKWorker.js (файл в public/)
- autoPrompt: false, autoRegister: false, notifyButton: false
- defaultIconUrl: /icons/icon-192.png

### Как работает
1. Кнопка «Включить» в онбординге или профиле
2. Хук `usePushNotifications` → `requestPermission()` ПЕРВЫМ в обработчике клика
3. После разрешения → слушаем `PushSubscription.change` → сохраняем player_id в push_subscriptions
4. Отправка из админки: /admin/emails → «📲 Push» → OneSignal REST API

### Важно для iOS
- Web Push работает ТОЛЬКО если клуб установлен как PWA (iOS 16.4+)
- В Safari без PWA — показываем текст «Установите клуб на главный экран»

### API
- `POST /api/push/register` — сохранить player_id (lookup по email через service role!)
- `POST /api/push/unregister` — active=false
- `POST /api/admin/push/send` — отправка через OneSignal REST API

---

## 📱 PWA

### Файлы
- `public/manifest.json` — name: «Клуб Вкус Жизни», start_url: /dashboard, theme_color: #6B4FA0
- `public/OneSignalSDKWorker.js` — Service Worker для push
- `public/icons/` — icon-192.png, icon-512.png, icon-180.png, icon-32.png

### Мета-теги в layout.tsx
```html
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icons/icon-180.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="Вкус Жизни" />
<meta name="theme-color" content="#6B4FA0" />
```

### Установка для участниц
- **iPhone:** Safari → Поделиться → «На экран Домой»
- **Android:** Chrome → баннер «Установить приложение» или меню → «Добавить на главный экран»
- **Windows/Mac:** Chrome → иконка установки в адресной строке

---

## 🎓 ОНБОРДИНГ И ТУР

### Два отдельных флага (ВАЖНО!)
- `onboarding_completed` — заполнена анкета (квиз) → ставится в `/api/onboarding/profile`
- `tour_completed` — показан тур на /dashboard → ставится в `/api/onboarding/complete`

### Флоу для новой участницы
```
Оплата → /auth?from=payment → OTP → "Активируем доступ" (4с) → /onboarding (квиз)
→ onboarding_completed=true → /dashboard → тур (800мс задержка) → tour_completed=true
```

### API
- `POST /api/onboarding/profile` — сохранение данных анкеты + onboarding_completed=true
- `POST /api/onboarding/complete` — только tour_completed=true (НЕ трогает onboarding_completed!)

### Push в онбординге
Карточка уведомлений показывается ВСЕГДА:
- Если isSupported → кнопка «Включить»
- Если не поддерживается (Safari без PWA) → текст «Установите клуб на главный экран»
- Push НЕ блокирует сабмит формы — обёрнут в отдельный try/catch

---

## 🤝 ПАРТНЁРСКАЯ ПРОГРАММА

Подробная документация: **AFFILIATE_TECH.md**

### Кратко
- Реф-ссылка: `https://nata-tomshina.ru/club?ref={ref_code}` → ведёт на лендинг /club
- Комиссия: 20% от первой оплаты 1500 ₽ (300 ₽) + 10% с каждого продления (150 ₽)
- Триал 149 ₽ — комиссия не начисляется, но ref_code сохраняется
- Выплаты: вручную 1-го числа, минимум 1000 ₽, через 14 дней после начисления

### Страницы (на nata-tomshina.ru)
- `/partner` — публичный лендинг + форма заявки
- `/partner/login` — вход партнёра по OTP
- `/partner/verify` — ввод кода
- `/partner/dashboard` — кабинет партнёра
- `/legal/affiliate` — оферта партнёрской программы

### Страницы (на club.nata-tomshina.ru)
- `/admin/affiliates` — управление партнёрами и выплатами

### Ключевой технический момент
CloudPayments НЕ передаёт кастомное поле `data` из виджета в `JsonData` webhook.
Решение: сохранять ref_code в таблицу `pending_refs` через `POST /api/join/save-ref` ДО открытия виджета.
Webhook читает ref_code из `pending_refs` по email и удаляет запись после использования.

---

## 🗂 СТРУКТУРА САЙТА

### Публичный сайт nata-tomshina.ru
- `/` — Главная ✅
- `/about` — Об авторе ✅
- `/results` — Результаты участниц ✅
- `/club` — Продающий лендинг ✅
- `/free` — Лид-магнит (OTP доступ) ✅
- `/blog` — Каталог статей ✅
- `/unsubscribed` — Страница после отписки ✅
- `/partner` — Партнёрская программа (лендинг + форма) ✅
- `/partner/login` — Вход партнёра ✅
- `/partner/verify` — Верификация OTP партнёра ✅
- `/partner/dashboard` — Кабинет партнёра ✅
- `/legal/affiliate` — Оферта партнёрской программы ✅

### Клуб club.nata-tomshina.ru
- `/auth` — Вход по OTP ✅
- `/join` — Страница оплаты ✅ (ПУБЛИЧНАЯ, без middleware!)
- `/onboarding` — Анкета при первом входе ✅
- `/dashboard` — Главный экран ✅
- `/dashboard/upgrade` — Апгрейд подписки ✅
- `/dashboard/profile` — Профиль (с блоком уведомлений) ✅

### Админка /admin
- `/admin/members` — Участницы ✅
- `/admin/emails` — Email-рассылки и Push ✅
- `/admin/marathons` — Марафоны ✅
- `/admin/webinars` — Вебинары ✅
- `/admin/blog` — SEO-блог ✅
- `/admin/affiliates` — Партнёры и выплаты ✅

---

## 👥 РОЛИ ПОЛЬЗОВАТЕЛЕЙ

| Роль | Доступ |
|------|--------|
| `admin` | Всё |
| `curator` | Только /admin/marathons + удаление постов в чатах |
| `member` | Только клуб |

---

## ✅ ЧТО СДЕЛАНО (31.03.2026)

### Партнёрская программа
- Таблицы affiliates, affiliate_clicks, affiliate_commissions, pending_refs ✅
- Middleware: перехват ?ref=, запись куки на 60 дней с domain=.nata-tomshina.ru ✅
- Дедупликация кликов по SHA-256(IP+UA) за 24ч ✅
- /api/join/save-ref — сохранение ref_code до оплаты (обход ограничения CloudPayments) ✅
- Webhook CloudPayments расширен: начисление комиссий, триал→рекуррент корректно ✅
- Логика first/recurring: первое списание 1500₽ после триала = 20% first ✅
- Защита от самореферала (email партнёра ≠ email участницы) ✅
- /partner — лендинг с формой заявки ✅
- /partner/dashboard — кабинет с реф-ссылкой, статистикой, начислениями ✅
- /partner/login + /partner/verify — OTP авторизация партнёров ✅
- /admin/affiliates — управление партнёрами и выплатами ✅
- /legal/affiliate — публичная оферта ✅
- Партнёрка в меню и футере сайта (цветная плашка) ✅
- Протестировано: ref_code сохраняется, комиссия 300₽ начисляется ✅

### Email-рассылки (29-30.03.2026)
- Таблицы subscribers и email_campaigns ✅
- Страница /admin/emails с двумя вкладками ✅
- Импорт CSV из Геткурса ✅
- Отправка анонсов по сегментам (батчи по 50) ✅
- Конверсия подписчика при оплате ✅
- Отписка по токену /api/unsubscribe ✅

### Push-уведомления (29-30.03.2026)
- OneSignal подключён, Service Worker настроен ✅
- Кнопка в онбординге и профиле ✅
- Регистрация player_id в push_subscriptions ✅
- Отправка из /admin/emails ✅

---

## ⚠️ НЕЗАВЕРШЕНО / СЛЕДУЮЩИЕ ЗАДАЧИ

### Срочное (блокирует запуск)
1. **CloudPayments боевой режим** — переключить в ЛК
2. **Upgrade Supabase → Pro** ($25/мес)
3. **Upgrade Vercel → Pro** ($20/мес)
4. **Upgrade Resend → Pro** ($20/мес) — перед рассылками по большой базе

### Email
5. **Импорт базы из Геткурса** — выгрузить CSV, загрузить через /admin/emails
6. **Тестовая рассылка** — проверить попадание в inbox vs спам
7. **Серии писем в Make.com** — прогревающая серия для холодной базы (5 писем)
8. **Форма подписки на /free** — сохранять в subscribers при получении доступа к лид-магниту

### Баги (активные)
9. **Профиль участницы в админке** — показывает устаревший тариф после апгрейда
10. **Чат: отправка фото без текста** — ошибка NOT NULL в Болталке и личном чате с Наташей
11. **Плашка «Пробный период»** — не скрывается при скролле в чатах
12. **404 на dashboard/about и dashboard/body** — тур ищет несуществующие страницы
13. **Куратор** — не видит марафоны (API проверяет только role='admin')
14. **Вводный курс** — открывается не с первого урока
15. **OneSignal ошибка на nata-tomshina.ru** — инициализируется на публичном сайте, должен только на club.nata-tomshina.ru. Добавить проверку домена перед инициализацией.

### Функционал (запланировано)
16. **Удаление участницы из админки** — каскадное удаление
17. **Онбординг-квиз** — заменить текущий тур на 6-шаговый квиз
18. **Self-hosted шрифты** — убрать Google CDN
19. **Перенос на российский хостинг** — для участниц без VPN
20. **Очистка кода от Продамуса** — удалить поле prodamus_order_id
21. **Автоочистка pending_refs** — удалять записи старше 7 дней (pg_cron или cron job)

---

## 🌐 CLOUDFLARE — НАСТРОЙКИ

- Домен: nata-tomshina.ru
- SSL/TLS: Full (strict) ✅
- Email Address Obfuscation: ВЫКЛЮЧИТЬ (ломает форму авторизации)
- Rocket Loader: выключен ✅
- Bot fight mode: выключен ✅

**Важно:** Участницы из России без VPN не могут зайти в клуб (провайдеры блокируют Vercel).

---

## 📋 ПРАВИЛА РАБОТЫ С CLAUDE CODE

1. **Никогда** не использовать слова «кето», «лоукарб», «LCHF»
2. **SQL миграции** — выполняю вручную в Supabase, не просить Claude Code делать это автоматически
3. **Деплой** после каждой задачи: `npx vercel --prod`
4. **member_id** — всегда lookup по email через service role, НЕ user.id
5. **Push кнопки** — requestPermission() должен быть ПЕРВЫМ вызовом в обработчике клика
6. **tour_completed** и **onboarding_completed** — разные поля, не путать!
7. **ref_code передача** — CloudPayments НЕ передаёт data из виджета в JsonData. Использовать pending_refs!
