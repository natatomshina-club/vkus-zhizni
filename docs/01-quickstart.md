# 🚀 Быстрый старт

## Доступы

- **Сервер:** `ssh deploy@155.212.130.228`
- **Код:** `/home/deploy/app/`
- **Supabase Docker:** `/opt/supabase/docker/`
- **Supabase Studio:** [studio.nata-tomshina.ru](https://studio.nata-tomshina.ru) (Beget, неполноценная)

## Деплой

```bash
# Локально, из ~/Desktop/vkus-zhizni:
bash deploy.sh
```

Это билдит Docker, пушит на сервер, перезапускает контейнер app.

## Перезапуск PostgREST (после ALTER TABLE)

```bash
ssh deploy@155.212.130.228 "cd /opt/supabase/docker && sudo docker compose restart rest"
```

## Логи приложения

```bash
ssh deploy@155.212.130.228 "cd /home/deploy/app && sudo docker compose logs app --tail 100 -f"
```

## Бэкап БД

Автоматический: `/home/deploy/backups/backup.sh` каждый день в 02:00 (cron).

## Cron на сервере

| Время | Задача | Описание |
|---|---|---|
| 02:00 | `backup.sh` | Бэкап БД |
| 03:00 | `/api/cron/cleanup-posts` | Удаление старых фото чата |
| каждый час | `/api/cron/cleanup-media` | Удаление старых медиа |
| 09:00 | `/api/cron/email-sequences` | Серии писем (welcome/evergreen) |
| 10:00 | `/api/cron/level-up` | Push-уведомления об уровне |

## Ключевые правила проекта

См. полностью в `CLAUDE.md` в корне репозитория. Главное:

- **Правило #24:** `member.id ≠ auth.users.id`. Lookup в `members` всегда через `email`, не через `user.id`.
- После `ALTER TABLE` — рестарт PostgREST.
- При ручном изменении подписки — обязательно `is_manual_subscription = true`, иначе рекуррент сотрёт даты.
- `NEXT_PUBLIC_*` переменные встраиваются в bundle при сборке — менять в `deploy.sh`, не в `.env`.
- Cloudflare Proxy для `club.*` всегда DNS only (несовместим с CloudPayments вебхуками).

## Связано

- [[05-infrastructure/server|Сервер]]
- [[05-infrastructure/database|База данных]]
- [[06-operations/INDEX|Операционные процедуры]]
