ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS expiry_followup_step integer DEFAULT 0;

COMMENT ON COLUMN public.members.expiry_followup_step IS
'Churn-серия: последний отправленный день после истечения подписки.
0 = ничего не отправлено; 1/2/3 = напоминание день 1/2/3;
15 = "скоро марафон"; 30 = "вернуться без потери статуса".
Сбрасывается в 0 при возобновлении подписки.';

-- index для быстрого поиска подходящих под churn-серию
CREATE INDEX IF NOT EXISTS idx_members_expiry_followup
  ON public.members (subscription_status, expiry_followup_step)
  WHERE subscription_status = 'expired' AND expiry_followup_step < 30;
