# Антиспам на формах захвата email

**Файл:** `src/lib/anti-spam.ts`  
**Добавлен:** 2026-06-14 (коммит `c96c503`)

---

## Функции

### `isHoneypotFilled(body, field?)`

```typescript
export function isHoneypotFilled(
  body: Record<string, unknown>,
  field = 'company_url',
): boolean
```

Возвращает `true` если поле-ловушка заполнено (бот). Люди его не видят и не заполняют.

### `rateLimit(ip, key, { limit, windowMs })`

```typescript
export function rateLimit(
  ip: string,
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): boolean
```

In-memory Map, сбрасывается при перезапуске контейнера. Достаточно для одного Docker-контейнера.  
Возвращает `true` если лимит превышен (блокировать).

---

## Honeypot-поле

**Имя:** `company_url` (намеренно нейтральное — не `website`/`email`/`name`/`url`, которые автозаполнение браузера/менеджеры паролей заполняют автоматически, ломая сабмит живых пользователей).

**В `EmailForm.tsx`:**
```tsx
<input
  ref={honeypotRef}
  name="company_url"
  type="text"
  autoComplete="off"
  tabIndex={-1}
  aria-hidden="true"
  style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
/>
```

Значение всегда отправляется в теле POST: `company_url: honeypotRef.current?.value ?? ''`.

**Двойная проверка:**
- Клиент: `if (honeypotRef.current?.value) return` — не делает fetch.
- Сервер: `isHoneypotFilled(body)` — не пишет в БД и не шлёт письмо.

---

## Где подключён

| Роут | Rate-limit key | Лимит |
|---|---|---|
| `POST /api/public/subscribe` | `'subscribe'` | 5 / час / IP |
| `POST /api/public/subscribe-menu` | `'subscribe-menu'` | 5 / час / IP |

**Порядок проверок в каждом роуте:**
1. Парсинг `body` как `Record<string, unknown>`
2. Валидация email (есть `@`)
3. IP из `x-forwarded-for` / `x-real-ip`
4. `isHoneypotFilled(body)` — если true → `return 200 {success:true}`
5. `rateLimit(ip, key, ...)` — если true → `return 200 {success:true}`
6. Основная логика (upsert + email)

---

## Поведение при блокировке

Бот или превышение лимита → **тихий `200 {success:true}`**. Trap не раскрывается.  
В БД ничего не пишется, письмо не уходит.

---

## Ограничения

- Map живёт в памяти процесса → при `docker restart` счётчики обнуляются.
- При масштабировании на несколько контейнеров лимит будет per-container, не global.
- Достаточно для текущего single-container деплоя.
