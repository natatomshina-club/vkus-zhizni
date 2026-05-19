# Storage (Supabase)

> [!note] Заглушка. Подробное наполнение — в Волне 5 (инфраструктура).

Используется Supabase Storage (self-hosted). Политика доступа по бакетам — описать в Волне 5.

## Известные buckets

Из кода и CLAUDE.md v15:

| Bucket | Назначение |
|---|---|
| `meditation-audio` | Аудио медитаций (presigned upload, до 500 МБ) |
| `marathon-files` | PDF марафонов |
| `body-materials` | Материалы «Я и моё тело» |
| `webinar-materials` | Материалы вебинаров |
| `channel-media` | Фото в чате (удаляются через 72 ч, лимит 10 МБ) |
| `chat-audio` | Аудиосообщения (bucket создан, голосовые отключены) |
| `avatars` | Аватары участниц |
| `attachments` | Вложения |
| `blog-images` | Картинки блога |
| `meditations` | Устаревший bucket для аудио (заменён на `meditation-audio`) |

## Особенности загрузки

Большие файлы (медитации, и т.п.) загружаются через presigned URL — файл идёт напрямую в Supabase, минуя Next.js и Nginx (обход лимита 500 МБ и таймаута 300s). Правило #5 в CLAUDE.md.

Nginx настроен с отдельным блоком для `/supabase/storage/`: лимит 500 МБ, таймауты 300s — нужен для presigned-запросов, которые всё равно идут через Nginx-прокси к Supabase.

## Связано

- [[03-club/modules/meditations]]
