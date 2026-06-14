# Лид-захват email на публичном сайте

Документ описывает инфраструктуру захвата email на `nata-tomshina.ru`: компонент формы, API-роуты, БД, поток письма и редиректа.

---

## Компонент EmailForm

**Файл:** `src/app/public-site/free/components/EmailForm.tsx`  
**Экспорт:** default

Переиспользуемый клиентский компонент (`'use client'`). Параметризован пропсами — один компонент обслуживает все точки захвата.

### Пропсы

| Проп | Тип | Default | Описание |
|---|---|---|---|
| `endpoint` | string | `/api/public/subscribe` | Куда POST |
| `source` | string | — | Тег источника (пишется в `subscribers.source`) |
| `redirectTo` | string | `/free-kurs` | Куда редиректить после успеха |
| `buttonVariant` | `'green'` \| `'orange'` | `'green'` | Цвет кнопки |
| `size` | `'lg'` \| `'md'` | `'lg'` | Размер |
| `ymGoal` | string | `'free_email_sent'` | Цель Яндекс.Метрики |

### Где используется

| Страница | endpoint | source | redirectTo |
|---|---|---|---|
| `/free` | `/api/public/subscribe` | — (NULL) | `/free-kurs` |
| `/metabolicheskoe-pohudenie/menu` | `/api/public/subscribe-menu` | `menu-racion` | `/free-kurs/racion` |

### Honeypot

Поле `name="company_url"`, `type="text"`, `autoComplete="off"`, `tabIndex={-1}`, `aria-hidden="true"`, спрятано абсолютным позиционированием за экраном.  
Значение всегда передаётся в теле POST (`company_url: ""` для людей, `"filled"` для ботов).  
Клиент не пускает сабмит если поле непустое; сервер тоже проверяет (двойная защита).

---

## API-роуты

### POST `/api/public/subscribe`

**Файл:** `src/app/api/public/subscribe/route.ts`  
**Назначение:** форма на `/free` (бесплатный мини-курс «Волшебный пендель»).

Поток:
1. Anti-spam guard (honeypot + rate-limit 5/час/IP) → если спам: тихий `200 {success:true}`, без записи.
2. Upsert в `subscribers` (`email, ip, user_agent, email_sent:false`). Поле `source` не пишется (NULL).
3. Отправка письма «Ваш доступ к курсу» со ссылкой `https://nata-tomshina.ru/free-kurs` — неблокирующая (`.catch()`).
4. Возвращает `200 {success:true}`, клиент редиректит на `/free-kurs`.

### POST `/api/public/subscribe-menu`

**Файл:** `src/app/api/public/subscribe-menu/route.ts`  
**Назначение:** форма лид-магнита на `/metabolicheskoe-pohudenie/menu`.

Поток:
1. Anti-spam guard → тихий `200 {success:true}`, без записи.
2. Upsert в `subscribers` (`email, source:'menu-racion', ip, user_agent, email_sent:false`).
3. Отправка письма «Ваше меню на неделю готово» со ссылкой на PDF `/pdf/racion-7-dney.pdf` — неблокирующая.
4. Возвращает `200 {success:true}`, клиент редиректит на `/free-kurs/racion`.

---

## БД: таблица `subscribers`

Ключевые колонки:

| Колонка | Тип | Описание |
|---|---|---|
| `email` | text (uq) | PRIMARY KEY-эквивалент для upsert |
| `source` | text | Источник: `'menu-racion'` или NULL (форма `/free`) |
| `ip` | text | IP из `x-forwarded-for` |
| `user_agent` | text | |
| `email_sent` | bool | false → после отправки → true |
| `email_sent_at` | timestamptz | Проставляется при успехе |
| `email_error` | text | `'send_failed'` при ошибке SMTP |
| `converted_to_member` | bool | Обновляется при вступлении в клуб |

---

## Email

Отправляется через `sendEmail()` из `src/lib/mailer.ts` (SMTP Beget, env: `SMTP_HOST/PORT/USER/PASS`).  
**Без вложений** — только ссылка в теле письма. Шаблон HTML inline-styles (email-клиенты не поддерживают CSS vars).

---

## Принципы (не менять без причины)

- **Без double opt-in** — подтверждение не требуется, письмо уходит сразу.
- **Upsert, не insert** — повторный email не создаёт дубль, обновляет запись.
- **Неблокирующая отправка** — `sendEmail().catch()`, пользователь не ждёт SMTP.
- **Тег `source`** — обязателен для новых лид-форм, чтобы сегментировать в рассылках.

---

## История

| Дата | Событие |
|---|---|
| до 2026-06 | `/api/public/subscribe` — единственный роут, `source` не писался (NULL) |
| 2026-06-08 | `EmailForm` параметризован (`endpoint`/`source`/`redirectTo`); добавлен `/api/public/subscribe-menu` с `source:'menu-racion'`; лид-магнит на `/metabolicheskoe-pohudenie/menu` |
| 2026-06-14 | Anti-spam (`src/lib/anti-spam.ts`) подключён во все subscribe-роуты |
