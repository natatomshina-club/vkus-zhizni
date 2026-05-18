# Сервер и деплой

Beget VPS — продакшн-сервер проекта с апреля 2026. До этого был Vercel (см. [[07-sessions/project-history|project-history.md]]).

## Характеристики

| Параметр | Значение |
|---|---|
| IP | 155.212.130.228 |
| ОС | Ubuntu 22.04 |
| CPU / RAM / Диск | 4 CPU / 8 ГБ / 100 ГБ NVMe |
| SSH | `deploy@155.212.130.228` (root-логин закрыт) |
| Docker | `sudo docker ...` |

## Домены

| Домен | Назначение | Примечание |
|---|---|---|
| club.nata-tomshina.ru | Клуб (Next.js) | Cloudflare DNS only — без проксирования! |
| nata-tomshina.ru | Публичный сайт | |
| studio.nata-tomshina.ru | Supabase Studio | Basic Auth |

> [!warning] Cloudflare для club.nata-tomshina.ru — режим DNS only (серое облако).
> Оранжевое облако (проксирование) ломает CloudPayments webhook и авторизацию — проверено в апреле 2026.

## Схема сети

```
Пользователь
    ↓ HTTPS
Cloudflare (DNS only — не проксирует)
    ↓
Nginx (443) → SSL termination (certbot)
    ├→ club.nata-tomshina.ru → Next.js контейнер (port 3001)
    ├→ /supabase/, /auth/, /storage/ → Supabase Kong (port 8000)
    └→ studio.nata-tomshina.ru → Supabase Studio (port 3000, Basic Auth)

Next.js → Kong также напрямую через Docker network supabase_default
         (http://supabase-kong:8000 внутри контейнера)
```

## Файловая структура на сервере

```
/home/deploy/app/           — код Next.js + .env.production.local
/opt/supabase/docker/       — Supabase self-hosted (docker-compose + .env)
/opt/backups/               — pg_dump бэкапы
/etc/nginx/sites-available/ — nginx конфиги
/var/log/vkus-zhizni-backup.log — логи бэкапа
```

## Контейнеры

| Контейнер | Описание | Порт |
|---|---|---|
| vkus-zhizni | Next.js приложение | 3001→3000 |
| supabase-db | PostgreSQL | внутренний |
| supabase-kong | API Gateway | внутренний |
| supabase-auth | GoTrue | внутренний |
| supabase-rest | PostgREST | внутренний |
| supabase-storage | Storage API | внутренний |
| supabase-studio | Studio UI | внутренний |
| ... | ~13 контейнеров всего | |

Все контейнеры в сети `supabase_default`. Next.js подключён к ней через `--network supabase_default` — именно поэтому внутри работает `http://supabase-kong:8000`.

> На сервере также работает второй проект `pravo-final` (порт 3002) — не относится к vkus-zhizni.

## Деплой

### Команда
```bash
cd ~/Desktop/vkus-zhizni && bash deploy.sh
```

### Как работает deploy.sh
1. `rsync` — синхронизирует `src/`, `public/`, конфиги на `/home/deploy/app/` (без `node_modules`, `.next`, `.env*`)
2. `docker build` — собирает образ **на сервере** (не локально)
3. `docker stop` + `docker rm` + `docker run` — заменяет контейнер
4. `docker builder prune -f` + `docker image prune -f` — очищает кэш сборки

### Переменные сборки (build-args в Dockerfile)
Передаются через `--build-arg` при `docker build`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID`
- `NEXT_PUBLIC_CLUB_MODE` — в `deploy.sh` значение `"diagnostic"`; дефолт в Dockerfile: `"pricing"`

Runtime-переменные (без `NEXT_PUBLIC_`) читаются из `/home/deploy/app/.env.production.local` напрямую при старте контейнера.

## Nginx

Reverse proxy с SSL. Конфиги: `/etc/nginx/sites-available/`.
- Проксирует `club.nata-tomshina.ru` → `localhost:3001`
- Поддержка WebSocket (upgrade headers)
- Security headers (добавлены 7 апреля 2026):
  ```nginx
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  ```
- Блок `/supabase/storage/` — лимит 500 МБ, таймауты 300 с (для загрузки медитаций)
- SSL через certbot (Let's Encrypt), авторенью через systemd timer

## Бэкапы

### Серверный бэкап
- Скрипт: `deploy/backup.sh`
- Путь на сервере: `/opt/backups/`
- Формат файла: `backup_YYYY-MM-DD_HH-MM.sql.gz`
- Логи: `/var/log/vkus-zhizni-backup.log`
- Расписание: `0 3 * * *` (ежедневно в 03:00 UTC)
- Хранение: 7 дней (старше удаляются автоматически)
- Способ: `pg_dump | gzip`

### Локальное зеркало
- Папка: `~/Desktop/vkus-backup/` (db/, storage/, configs/)
- Скрипт: `pull-backup.sh` — лежит локально на машине Наташи, не в репозитории проекта
- Расписание: по воскресеньям

## CRON задачи

| Расписание | Задача | Способ |
|---|---|---|
| `0 3 * * *` | pg_dump бэкап БД | bash-скрипт на сервере |
| `0 3 * * *` | cleanup-expired-posts — удаление фото чата | pg_cron (внутри Postgres) |
| `0 10 * * *` | `/api/cron/level-up` — уведомления об уровне | curl с сервера |
| ? | `/api/cron/cleanup-media` | роут есть в коде, статус cron-задачи неизвестен |

Авторизация curl-запросов: заголовок `x-cron-secret: $CRON_SECRET` (из `.env.production.local`).

## Безопасность

- **ufw**: открыты только 22 (SSH), 80, 443. Supabase-порты (5432, 8000, 6543) привязаны к `127.0.0.1` в docker-compose — иначе Docker обходит ufw.
- **SSH hardening**: `PasswordAuthentication no`, только ключи. Root-логин закрыт (`PermitRootLogin no`). Пользователь `deploy` с passwordless sudo.
- **Supabase Studio**: Basic Auth через Nginx (`/etc/nginx/.htpasswd`). URL: `https://studio.nata-tomshina.ru`.
- **HMAC**: проверка подписи webhook'ов CloudPayments (оба секрета — боевой и тестовый).
- **Security headers**: настроены в Nginx (7 апреля 2026).

## Шпаргалка

### Посмотреть логи Next.js
```bash
sudo docker logs vkus-zhizni --tail=100 -f
```

### Задеплоить
```bash
cd ~/Desktop/vkus-zhizni && bash deploy.sh
```

### После ALTER TABLE — перезапустить PostgREST
```bash
ssh deploy@155.212.130.228
cd /opt/supabase/docker && sudo docker compose restart rest
```

### Пересобрать Supabase контейнеры
```bash
ssh deploy@155.212.130.228
cd /opt/supabase/docker && sudo docker compose pull && sudo docker compose up -d
```

### Восстановить БД из бэкапа
```bash
ssh deploy@155.212.130.228
gunzip -c /opt/backups/backup_YYYY-MM-DD_HH-MM.sql.gz \
  | sudo docker exec -i supabase-db psql -U postgres -d postgres
```

### Создать участницу через Admin API
```bash
# На сервере — создать в auth.users:
curl -X POST http://localhost:8000/auth/v1/admin/users \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"EMAIL","email_confirm":true}'
# Скопировать UUID из ответа → вставить в INSERT INTO members (...)
```

## История изменений

| Дата | Событие |
|---|---|
| 3 апр 2026 | Первый деплой на Beget VPS, Supabase self-hosted запущен — [[07-sessions/2026-04-03\|сессия]] |
| 4 апр 2026 | Supabase Studio на постоянном URL, `deploy.sh` создан — [[07-sessions/2026-04-04\|сессия]] |
| 6 апр 2026 | nata-tomshina.ru перенесён, SSL certbot, Vercel удалён — [[07-sessions/2026-04-06a\|сессия]] |
| 7 апр 2026 | Безопасность: ufw, SSH hardening, HMAC, пользователь deploy — [[07-sessions/2026-04-07\|сессия]] |

## Связано

- [[01-quickstart]] — команды деплоя и доступы (краткая версия)
- [[05-infrastructure/database]] — схема БД
- [[05-infrastructure/secrets]] — список переменных окружения
