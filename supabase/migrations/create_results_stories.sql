-- ============================================================
-- Таблица results_stories — истории участниц
-- Запустить в Supabase Studio → SQL Editor → Run
-- ============================================================

-- Включаем pgcrypto (безопасно если уже включено)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE results_stories (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT        UNIQUE NOT NULL,
  name             TEXT        NOT NULL,
  age              INTEGER,
  age_label        TEXT,
  before_kg        NUMERIC(5,1),
  after_kg         NUMERIC(5,1),
  metric_main      TEXT,
  metric_label     TEXT,
  tag_label        TEXT,
  tag_filter       TEXT[]      DEFAULT '{}',
  photo_before_url TEXT,
  photo_after_url  TEXT,
  summary_quote    TEXT,
  check_items      JSONB       DEFAULT '[]'::jsonb,
  content_html     TEXT,
  content_source   TEXT,
  seo_title        TEXT,
  seo_description  TEXT,
  published        BOOLEAN     NOT NULL DEFAULT FALSE,
  order_index      INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Slug: только lowercase латиница, цифры и дефисы
ALTER TABLE results_stories
  ADD CONSTRAINT results_stories_slug_format
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Индекс по slug
CREATE INDEX idx_results_stories_slug
  ON results_stories(slug);

-- Индекс по (published, order_index) для основного запроса публичного сайта
CREATE INDEX idx_results_stories_published_order
  ON results_stories(published, order_index)
  WHERE published = TRUE;

-- GIN-индекс для фильтрации по тегам: WHERE tag_filter && ARRAY['thyroid']
CREATE INDEX idx_results_stories_tag_filter
  ON results_stories USING GIN (tag_filter);

-- Функция автообновления updated_at (CREATE OR REPLACE — безопасна при повторном запуске)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_results_stories_updated_at
  BEFORE UPDATE ON results_stories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE results_stories ENABLE ROW LEVEL SECURITY;

-- Анонимы читают только опубликованные записи
CREATE POLICY "Public can read published stories"
  ON results_stories FOR SELECT
  TO anon
  USING (published = TRUE);

-- Авторизованные пользователи (сессия Supabase Auth) — полный доступ
-- Соответствует модели blog_posts в этом проекте
CREATE POLICY "Authenticated full access"
  ON results_stories FOR ALL
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- ── Проверка после запуска ────────────────────────────────────
-- Выполнить следующий SELECT — должна вернуться 1 строка с row_count = 0:
--
-- SELECT
--   table_name,
--   (SELECT COUNT(*) FROM results_stories) AS row_count
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name = 'results_stories';
