# 🏠 Клуб `club.nata-tomshina.ru`

Закрытая часть проекта — приложение для участниц по подписке.

## Архитектура

- [[03-club/architecture|Архитектура]] — структура клубной части
- [[03-club/auth-otp|Вход (OTP)]] — как работает аутентификация
- [[03-club/subscriptions|Подписки и статусы]] — тарифы, бриллианты, эффективный возраст

## Модули клуба

### Контент
- [[03-club/modules/courses|Я и моё тело — курсы и материалы]] — вводные курсы + материалы клуба
- [[03-club/modules/marathons|Марафоны]]
- [[03-club/modules/webinars|Вебинары]]
- [[03-club/modules/meditations|Медитации]]
- [[03-club/modules/karta-pomoshi|Карта помощи (FAQ + Материалы)]]

### Питание
- [[03-club/modules/smart-kitchen|Умная кухня]]
- [[03-club/modules/recipes|Избранные рецепты]] — saved_recipes, member_recipes, saved_sauces (localStorage), `/dashboard/favorites`
- [[03-club/modules/meal-plans|Рацион / план питания]]
- [[03-club/modules/diary|Дневник питания]]

### Тело
- [[03-club/modules/measurements|Замеры]]

### Коммуникация
- [[03-club/modules/channel|Канал (чаты, личные сообщения, объявления)]]
- [[03-club/modules/notifications|Уведомления]]

### Монетизация
- [[03-club/modules/affiliate|Партнёрская программа]] — реф-ссылки, комиссии, кабинет партнёра

## UI

- [[design-system|Дизайн-система клуба]] — CSS-переменные, шрифты (Unbounded + Nunito), компоненты
- [[03-club/ui/sidebar|Sidebar]]
- [[03-club/ui/mobile-pwa|Мобильный PWA]]

## Участница

- [[03-club/modules/profile|Профиль участницы]] — личные данные, КБЖУ-норма, здоровье, аватар, подписка, выход

## Прочее

- [[03-club/onboarding|Онбординг]]

## Связано

- [[02-public-site/INDEX|Публичный сайт]]
- [[04-admin/INDEX|Админка]]
