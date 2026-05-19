-- Resend secret voter ID emails for one election (replace UUID)
-- Election "asdf" example: FV-46AE20FB → use full id from Supabase Table Editor

-- 1) Auto-finalize roll + assign IDs if not done yet
select public.maybe_auto_finalize_election_voter_roll('46ae20fb-d24a-4b69-9815-4fdd6d037964');

-- 2) See who still needs email
select id, user_id, secret_voter_id, secret_voter_id_emailed_at
from public.voter_registrations
where election_id = '46ae20fb-d24a-4b69-9815-4fdd6d037964'
  and status = 'registered';

-- Emails are sent by Edge Function send-secret-voter-ids (Brevo).
-- Open the voter dashboard or creator election page after deploying edge functions,
-- OR use Creator → Finalize / Send IDs in the app.
