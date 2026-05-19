-- Delete ALL elections (test cleanup) — run in Supabase SQL Editor on the CORRECT project only.
-- Irreversible. Related rows cascade (registrations, candidates, ballots, etc.).

-- Preview
SELECT id, title, status, created_at
FROM public.elections
ORDER BY created_at DESC;

SELECT COUNT(*) AS elections_to_delete FROM public.elections;

-- Delete everything
DELETE FROM public.elections;

-- Confirm
SELECT COUNT(*) AS elections_remaining FROM public.elections;
