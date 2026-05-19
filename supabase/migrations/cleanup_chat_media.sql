-- ─────────────────────────────────────────────────────────────────────────────
-- cleanup_expired_chat_media()
-- Возвращает список media_url которые нужно удалить из Storage,
-- затем обнуляет media_url / media_expires_at в channel_posts.
--
-- Вызывается из /api/cron/cleanup-media (Next.js route).
-- pg_cron дёргает этот API-роут каждый час через pg_net.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_expired_chat_media()
RETURNS TABLE(post_id uuid, media_url text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- 1. Вернуть список URL для удаления из Storage
  WITH expired AS (
    SELECT id, channel_posts.media_url
    FROM channel_posts
    WHERE media_expires_at < now()
      AND channel_posts.media_url IS NOT NULL
  ),
  -- 2. Обнулить поля
  cleared AS (
    UPDATE channel_posts
    SET media_url = NULL,
        media_expires_at = NULL
    WHERE id IN (SELECT id FROM expired)
  )
  SELECT id AS post_id, media_url FROM expired;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- pg_cron: вызывать API-роут каждый час (требует pg_net + pg_cron extensions).
-- Замените YOUR_CRON_SECRET на значение из .env CRON_SECRET.
-- Выполнить вручную в Supabase SQL Editor один раз.
-- ─────────────────────────────────────────────────────────────────────────────

-- Убедитесь что расширения включены:
-- CREATE EXTENSION IF NOT EXISTS pg_net;
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-expired-media',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://club.nata-tomshina.ru/api/cron/cleanup-media',
      headers := '{"Authorization": "Bearer YOUR_CRON_SECRET", "Content-Type": "application/json"}'::jsonb,
      body    := '{}'::jsonb
    )
  $$
);
