-- Шаг 1: Таблица расписания личных сообщений (вводный курс)
-- Запустить в Supabase Studio → SQL Editor

CREATE TABLE IF NOT EXISTS intro_course_pm_schedule (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  day_number  INTEGER NOT NULL,   -- 1-14 (11 пропускается)
  message     TEXT NOT NULL,
  send_at     TIMESTAMPTZ NOT NULL,
  sent_at     TIMESTAMPTZ,        -- NULL = ещё не отправлено
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intro_pm_send_at ON intro_course_pm_schedule(send_at) WHERE sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_intro_pm_member_id ON intro_course_pm_schedule(member_id);
