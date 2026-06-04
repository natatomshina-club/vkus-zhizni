-- Таблица рецептов Кулинарной книги
CREATE TABLE cookbook_recipes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  -- Категории: 'breakfast' | 'soup' | 'salad_side' | 'main' |
  --            'savory_baking' | 'sweet_baking' | 'snacks' | 'sauces'

  photo_urls  TEXT[]  DEFAULT '{}',   -- 1-2 URL из Storage
  video_url   TEXT,                    -- Kinescope ссылка (необязательно)

  ingredients TEXT,                    -- свободный текст
  servings    INTEGER,
  calories    INTEGER,
  protein     NUMERIC(6,1),
  fat         NUMERIC(6,1),
  carbs       NUMERIC(6,1),

  instructions TEXT,                   -- пошаговое описание

  tags        TEXT[]  DEFAULT '{}',
  -- Теги: 'keto' | 'nup' | 'dairy_free' | 'aip'

  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cookbook_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club members read published"
  ON cookbook_recipes FOR SELECT
  USING (is_published = true);

CREATE POLICY "service role full access"
  ON cookbook_recipes FOR ALL
  USING (true);

CREATE INDEX ON cookbook_recipes(category);
CREATE INDEX ON cookbook_recipes(is_published);
CREATE INDEX ON cookbook_recipes USING GIN(tags);
