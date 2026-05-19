CREATE TABLE IF NOT EXISTS marathon_reminders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marathon_id  uuid NOT NULL REFERENCES marathons(id) ON DELETE CASCADE,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reminder_sent boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (marathon_id, member_id)
);

ALTER TABLE marathon_reminders ENABLE ROW LEVEL SECURITY;

-- Members can manage their own reminders
CREATE POLICY "members manage own reminders"
  ON marathon_reminders FOR ALL
  USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());
