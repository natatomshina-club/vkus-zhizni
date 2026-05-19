# Сессия май 2026 — Клуб «Вкус Жизни»

Документ для передачи контекста в новую сессию Claude. Описывает что было сделано, как сейчас работают ключевые системы клуба, и операционные команды для типовых задач.

---

## Контекст проекта

**Проект:** Клуб «Вкус Жизни» — онлайн-клуб нутрициолога Натальи Томшиной. Веб-приложение Next.js (App Router) + Supabase + Tailwind. Хостинг на собственном сервере.

**Архитектура высокого уровня:**
- `src/app/(club)/` — клубная часть (закрытая, по подписке): `/dashboard/*`, `/admin/*`. Использует «клубную тему» (фиолетово-зелёная палитра: `--pur`, `--bg`, `--text` и т.д.).
- `src/app/public-site/` — публичный сайт `nata-tomshina.ru` (о методе, блог, лендинги). Использует отдельную палитру через scope `.public-theme` в `src/app/public-site/theme.css`.
- `src/proxy.ts` — middleware маршрутизации: для домена `nata-tomshina.ru` переписывает пути на `/public-site/*`.

**Рабочий процесс:**
- Я (пользователь) формулирую задачу в чат Claude.
- Claude собирает ТЗ для **Claude Code** (отдельный агент, работающий локально на машине пользователя с доступом к коду).
- Claude Code выполняет правки, деплоит (`bash deploy.sh`), возвращает отчёт.
- SQL миграции выполняются **вручную** в Supabase Studio — НЕ автоматически.
- После `ALTER TABLE` нужен рестарт PostgREST: `cd /opt/supabase/docker && sudo docker compose restart rest`

**Сервер:** SSH `deploy@155.212.130.228`, код в `/home/deploy/app/`. Деплой: `bash deploy.sh`.

**Важные правила проекта** (задокументированы в `CLAUDE.md`):
- Правило #24: `member.id ≠ auth.users.id`. Lookup в `members` всегда через `email`, не через `user.id`.
- `select('*')` после `ALTER TABLE` не подхватывает новые колонки → явный список колонок.
- Клуб и публичный сайт изолированы — переменные/компоненты не пересекаются.

---

## Что было сделано в этой сессии

### 1. Расширение поля ввода в чатах и комментариях

**Проблема:** На мобильном поле ввода однострочное, длинные сообщения уходили за экран.

**Решение:** Заменили `<input>` на `<textarea>` с авторасширением. Поле растёт по высоте до 4-5 строк, потом появляется внутренний скролл. `Enter` отправляет, `Shift+Enter` переносит строку. После отправки высота сбрасывается. `font-size >= 16px` чтобы iOS Safari не зумил при фокусе.

**Где применено:** комментарии к постам, чаты клуба, личные сообщения.

---

### 2. Закрытие чата завершённого марафона

**Проблема:** При нажатии «Завершить марафон» в админке статус менялся на `finished`, но вкладка чата оставалась видимой и участницы могли продолжать писать.

**Решение:** В `src/app/(club)/dashboard/channel/page.tsx` изменён запрос марафонов — теперь показываются только со статусом `'active'`. Завершённые марафоны автоматически скрываются из меню чатов клуба. Каждый новый марафон получает свой чат, старые становятся недоступными.

**Также добавлена защита на сервере:** в `src/app/api/channel/posts/route.ts` блок POST проверяет статус марафона — если `finished`, возвращает 403 для всех кроме админа/наставника.

---

### 3. Новый раздел «Карта помощи» (🆘 FAQ + Материалы)

**Что это:** Отдельный раздел клуба `/dashboard/help` с двумя вкладками:
- **FAQ** — вопросы-ответы (тот же функционал что был в чатах, переехал сюда).
- **Материалы** — инструкции в форматах PDF, видео, аудио, статья (новый функционал, по образцу «Я и моё тело»).

**БД:**
- Таблица `faq_items` — переиспользована как была. Поля: `id, question, answer, category, source_post_id, created_by, created_at`. Категории — хардкод в `src/types/channel.ts` (10 шт: питание, продукты, тяга, замеры, гормоны, здоровье, пищеварение, образ_жизни, психология, техническое) с цветными бейджами.
- Новая таблица `help_materials` (без секций, плоский список):
  ```
  id, title, description, format ('video'|'article'|'pdf'|'audio'),
  content_url, thumbnail_url, duration_label, attachments (jsonb),
  is_published, sort_order, views_count, created_at, updated_at
  ```

**Файлы:**
- Клиент: `src/app/(club)/dashboard/help/page.tsx` + `HelpClient.tsx` + `[id]/page.tsx`
- API: `src/app/api/help/materials/route.ts` (GET с триал-гейтингом + POST), `[id]/route.ts` (PATCH/DELETE), `[id]/view/route.ts`
- Админка: `src/app/(club)/admin/help/page.tsx` (CRUD материалов)
- FAQ управление — прямо на странице `/dashboard/help` (кнопки видны админу), API: `/api/channel/faq*` (не менялся)

**Триал-гейтинг:** участницы без активной подписки видят первые 3 материала открытыми, остальные с замком (как в курсе «Я и моё тело»).

**Изменения вокруг:**
- Из чатов клуба убрана вкладка FAQ (канал с `type: 'faq'` больше не показывается).
- В `PostCard.tsx` кнопка «📚 В FAQ» работает как раньше (создаёт запись в `faq_items` с `source_post_id` для трассировки). **Фикс:** свободный текст категории заменён на `<select>` из канонических `FAQ_CATEGORIES` — раньше можно было ввести «Питание» вместо «питание» и запись выпадала из фильтров.
- На главной `/dashboard` плитка «Карта помощи» заменила старый баннер «Стройность без голода» (вытянутый баннер на полную ширину внизу секции «Разделы клуба»).
- В Sidebar (десктоп) в блоке «Обучение» добавлен пункт «🆘 Карта помощи».
- Мобильный нижний меню не трогали — участницы попадают через плитку на Главной.

---

### 4. Фикс админки «Оформление» (сезонные темы)

**Проблема:** Кнопка «Выключить» для активной темы (`9 мая`) не срабатывала — тема оставалась включённой.

**Причина (три проблемы):**
1. **Главная:** В `/api/admin/themes/route.ts` использовался lookup по `user.id` вместо `email` — нарушение правила #24. `requireAdmin()` возвращал 403, обновление не проходило.
2. `handleForce()` на клиенте не проверял `res.ok` — ошибка 403 молча проглатывалась, `load()` показывал кэш.
3. `GET /api/admin/themes` не имел `force-dynamic` — Next.js мог отдавать кэш.

**Решение:** Заменили lookup на `.eq('email', user.email!)`, добавили `export const dynamic = 'force-dynamic'`, добавили проверку ошибки в `handleForce` с `alert()`.

---

### 5. Защита ручных «бриллиантов» от сброса при рекуррентном платеже

**Проблема:** Пользователь вручную выставлял участницам статус «бриллиант» через SQL:
```sql
UPDATE members SET 
  subscription_started_at = now() - interval '12 months',
  subscription_expires_at = now() + interval '999 years'
WHERE email = '...';
```

Но при срабатывании рекуррентного платежа CloudPayments webhook перезаписывал `subscription_expires_at` на `+30 дней` от текущей даты — ручной апгрейд уничтожался.

**Корневая причина:**
- Статус участницы (новичок/.../бриллиант) считается в `src/lib/webinars.ts` функциями `getEffectiveMonths()` + `getStatusLabel()` на основе `subscription_started_at ?? created_at`. Если эти поля сбиты — статус сбрасывается.
- В webhook `src/app/api/payments/cloudpayments/route.ts` блок RECURRENT перезаписывал `subscription_ends_at` и `subscription_expires_at` без проверки флага.
- Поле `is_manual_subscription` в БД существовало (boolean), но webhook его не читал.

**Решение:**
1. В webhook добавлена проверка: если `is_manual_subscription = true` — даты не перезаписываются. Обновляются только `last_payment_at`, `last_payment_amount`, `subscription_status: 'active'`. В логах: `[recurrent] manual subscription — skipping date overwrite for member: <id>`.
2. Все существующие ручные «бриллианты» (39 человек) защищены флагом:
   ```sql
   UPDATE members SET is_manual_subscription = true
   WHERE subscription_expires_at > '2050-01-01' AND is_manual_subscription = false;
   ```
3. Четыре участницы у которых статус уже слетел до фикса — восстановлены вручную через UPDATE с возвратом `+999 лет` и установкой флага: `anna-sagan@mail.ru, natorcha@mail.ru, lydov@inbox.ru, aksa-080571@mail.ru`. Плюс `sveta.sh.t69@gmail.com` (полугодовой платёж 6000₽ — оказался тоже ручным бриллиантом).

**Что это значит для будущих ручных апгрейдов:**
- Всегда добавлять `is_manual_subscription = true` в UPDATE.
- Webhook больше не сбивает даты для помеченных как ручные.

---

### 6. Перенос строк в описаниях марафонов

**Проблема:** В админке марафона текст в textarea вводился с переносами строк, но на странице марафона в клубе всё слипалось в одну простыню (HTML схлопывает `\n` в пробелы).

**Решение:** В компоненте страницы марафона добавлен `style={{ whiteSpace: 'pre-wrap' }}` для текстовых блоков типа «Как подготовиться», «О марафоне», «Что внутри». Переносы сохраняются как введены.

---

### 7. База продуктов в Умной кухне

**Таблица:** `nutrition`. Колонки: `id, name, name_alt, category, calories, protein, fat, carbs, unit, source`.

**Что сделано:**
- **Нормализация «ё»:** 27 продуктов переименованы (сёмга→семга, свёкла→свекла, чёрный→черный и т.д.). Те где «ё» правильнее (мёд, тёртый, топлёное, подберёзовики) — оставлены. **Также** в коде поиска добавлена нормализация `s.toLowerCase().replace(/ё/g, 'е')` — теперь любой продукт с «ё» находится через «е» и наоборот.
- **Добавлен батат:**
  ```sql
  INSERT INTO nutrition (name, name_alt, category, calories, protein, fat, carbs, unit, source)
  VALUES ('батат', 'сладкий картофель, ямс', 'овощи', 86, 1.6, 0.1, 20.1, 'г', 'Скурихин');
  ```

---

## Операционные команды (типовые задачи)

### Присвоить участнице статус «N месяцев» (ручной апгрейд)

**ВАЖНО:** всегда выставлять `is_manual_subscription = true`, иначе при рекурренте даты сбьются.

```sql
-- Вариант 1: ручной "бриллиант" (старт 12 месяцев назад + истекает через 999 лет)
UPDATE members SET 
  subscription_status = 'active',
  subscription_plan = 'month',
  subscription_started_at = now() - interval '12 months',
  subscription_expires_at = now() + interval '999 years',
  is_manual_subscription = true
WHERE email = 'example@mail.ru';

-- Вариант 2: конкретный план (например halfyear) с реальным сроком
UPDATE members SET 
  subscription_plan = 'halfyear',
  subscription_started_at = now(),
  subscription_expires_at = now() + interval '6 months',
  is_manual_subscription = true
WHERE email = 'example@mail.ru';
```

Если у участницы `subscription_started_at` и `subscription_expires_at` уже корректные — обновляем только нужное поле.

### Сбросить лимит запросов в Умной кухне

```sql
SELECT email, kitchen_requests_today, kitchen_date 
FROM members 
WHERE email = 'example@mail.ru';

UPDATE members 
SET kitchen_requests_today = 0
WHERE email = 'example@mail.ru';
```

`kitchen_date` оставляем — сегодняшняя.

### Сбросить лимит рационов на неделю

Лимит проверяется в коде по `kitchen_requests_today` (общий счётчик «запросов кухни» включает и рационы). Если просто сброс не помог — нужна разведка через Claude Code где конкретно для рационов считается лимит. **Заметка из прошлого опыта:** для `nata.tomshina@gmail.com` сброс `kitchen_requests_today = 0` не сработал — значит для генерации рационов отдельная логика, которую мы тогда не докопали.

### Восстановить «слетевший бриллиант»

```sql
UPDATE members SET 
  subscription_started_at = now() - interval '12 months',
  subscription_expires_at = now() + interval '999 years',
  is_manual_subscription = true
WHERE email = 'example@mail.ru';
```

Не трогаем `subscription_status`, `subscription_plan`, `last_payment_at`, `last_payment_amount` — реальный платёж пусть остаётся в истории.

### Найти кандидатов на слетевшие бриллианты

```sql
-- Кто зарегистрирован давно но subscription_started_at свежий и совпадает с last_payment
SELECT email, created_at::date AS registered, subscription_started_at::date AS sub_start,
       last_payment_at::date AS last_pay, last_payment_amount, is_manual_subscription
FROM members 
WHERE subscription_status = 'active'
  AND created_at < now() - interval '6 months'
  AND subscription_started_at > now() - interval '60 days'
  AND is_manual_subscription = false
ORDER BY created_at;
```

---

## Структура БД (ключевые таблицы)

```
members              — участницы клуба (email, subscription_*, kitchen_*, kbju_*, role и др.)
faq_items            — FAQ вопросы-ответы (question, answer, category, source_post_id)
help_materials       — материалы «Карты помощи» (PDF/видео/аудио/статья)
body_sections        — разделы курса «Я и моё тело»
body_materials       — материалы курса «Я и моё тело»
channel_posts        — посты в чатах клуба
channel_likes        — лайки
channel_last_seen    — отметки прочтения
nutrition            — справочник продуктов (для Умной кухни)
recipes              — рецепты
member_recipes       — личные рецепты участниц (с servings_count)
weekly_plans         — еженедельные планы Умной кухни
meal_plans           — отдельные планы питания
marathons            — марафоны (status: active|finished|archived|draft)
marathon_landing     — контент лендинга марафона (с textarea-полями)
marathon_days        — дни марафона
notifications        — уведомления
private_messages     — личные сообщения
diary_*              — дневник питания
measurements         — замеры тела
webinars, webinar_*  — вебинары
meditations          — медитации
seasonal_themes      — сезонные темы оформления (с полем is_forced)
onboarding_content   — обучающие экраны при первом входе
email_*              — email рассылки
affiliate_*          — реферальная программа
prodamus_order_id, payment_transaction_id — связь с платёжными системами (Prodamus + CloudPayments)
```

---

## Открытые задачи

### Из этой сессии — недоделанное
1. **Лимит рационов не сбрасывается** простым `UPDATE` `kitchen_requests_today = 0` — нужна разведка где логика лимита рационов отдельно от лимита кухни. Воспроизводилось у `nata.tomshina@gmail.com`.

### Из предыдущей сессии (рефакторинг публичного сайта)
2. Создать **новую главную страницу `nata-tomshina.ru/`** — сейчас редирект на `/about` через `proxy.ts`. Нужна полноценная с SEO, разделами сайта, переходами.
3. **Переделать лендинг клуба** `src/app/public-site/club/page.tsx` с нуля. Старая страница имеет собственную CSS-тему (~30 хардкодов в `<style>`), не интегрирована с `theme.css`.
4. **Переделать остальные публичные лендинги** под новый дизайн (Главная, О методе, Марафон, Результаты, Бесплатный мини-курс, Рецепты, Меню, Рацион). Цель — насыщенные блоки с декором (волны, ленты, градиенты), как на референсах в стиле RebornGroup.
5. **Рефакторинг hardcoded цветов**:
   - `src/components/widgets/QuizEngine.tsx` (~35 хардкодов)
   - `src/components/widgets/CalcWidget.tsx` (~19 хардкодов)
   - 8 контентных переменных в `theme.css` (`--color-tip-*`, `--color-kratko-*`, `--color-ps-*`, `--color-faq-*`, `--color-tc-*`, `--color-author-*`, `--color-subcat-*`, `--color-link`) — остались на старой earth-tones палитре.

### Технический долг
6. **404 на `/images/authors/natalia.jpg`** — файл не загружен в `public/`.
7. **OneSignal SDK грузится на `nata-tomshina.ru`** — должен только в клубе. Перенести инициализацию из `RootLayout` в `(club)/layout.tsx`.
8. **Multiple GoTrueClient instances** — Supabase warning в консоли, не критично, но шумно. Сделать singleton.
9. **Скролл к посту из уведомлений на iOS Safari** — на десктопе работает, на iPhone `getBoundingClientRect()` возвращает нули. Решено пока оставить как есть — участница видит подсвеченный пост, ищет визуально.
10. **Возможный фикс категорий FAQ при переносе старых записей** — некоторые `faq_items` могут иметь категории с заглавных букв (баг до фикса). Если фильтры в новой «Карте помощи» что-то не показывают — проверить и нормализовать.

---

## Как давать новые задания в новой сессии

1. **Опиши задачу простыми словами** — что не работает или что хочется добавить.
2. **Прикрепи скриншоты** если визуально (баг в UI, дизайн-задача).
3. **Если задача про данные** — я подскажу какой SQL выполнить в Supabase Studio для разведки, потом дам команду для правки.
4. **Если задача про код** — я соберу ТЗ для Claude Code с детальным описанием изменений и форматом отчёта.
5. **Если нужна разведка** — я сначала пошлю Claude Code только на чтение/исследование без правок, чтобы понять архитектуру.

**Что я (Claude) спрашиваю у Claude Code сам:**
- Структуру кода/файлов которые мне неизвестны.
- Содержимое конкретных функций до их правки.
- Текущее поведение системы до диагноза.

**Что ты выполняешь сам в Supabase Studio:**
- SELECT для разведки данных.
- UPDATE/INSERT/DELETE по моим подтверждённым SQL.
- ALTER TABLE с последующим рестартом PostgREST.

**Команда деплоя:** `bash deploy.sh` (Claude Code выполняет сам после правок).
