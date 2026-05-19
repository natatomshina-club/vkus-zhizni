-- Таблица для блока "Как я себя чувствовала" в дневнике питания
-- Запустить вручную в Supabase Studio → SQL Editor

CREATE TABLE IF NOT EXISTS diary_feelings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id  uuid        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date       date        NOT NULL,
  mood       text,
  digestion  text[]      DEFAULT '{}',
  energy     text[]      DEFAULT '{}',
  note       text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (member_id, date)
);

ALTER TABLE diary_feelings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own feelings" ON diary_feelings
  FOR ALL USING (auth.uid() = member_id);
