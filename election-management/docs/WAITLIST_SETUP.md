# Waitlist system

When an election reaches `max_voters`, additional join attempts are stored as **waitlisted** with a position number. Open slots are filled from the waitlist in order (lowest position first).

## Database (migrations `023_waitlist_enums.sql` + `023_waitlist_system.sql`)

PostgreSQL requires enum values to be committed before use. Apply **in order**:

1. `023_waitlist_enums.sql` — run in SQL editor, wait for success
2. `023_waitlist_system.sql` — run second (or use `supabase db push`, which runs each file in its own transaction)

Via CLI both apply automatically in order:

```bash
supabase db push
```

### What the migrations add

- Enum: `voter_registration_status` adds `rejected`
- View: `election_participants` — maps `registered` → `approved`, `waitlisted` → `waitlist`
- RPCs:
  - `register_for_election` — auto-waitlist when full; tries `promote_waitlist_slots` first
  - `promote_waitlist_slots(election_id, max_promotions)`
  - `promote_waitlisted_participant(registration_id)`
  - `withdraw_from_election(election_id)` — frees a slot and auto-promotes #1
  - `reject_election_participant(registration_id, reason?)` — creator/admin
  - `get_election_waitlist(election_id)` — ordered queue for management UI

## Edge function

Deploy `send-waitlist-notification` (Brevo + `APP_URL`, same as other notification functions):

```bash
supabase functions deploy send-waitlist-notification --project-ref prxgnpcolmfucunotcil
```

Kinds: `waitlist_joined`, `waitlist_promoted`. Events are also logged via `log_notification`.

## UI

- Voters: election page shows **You are #N on the waitlist.**; dashboard lists waitlisted elections; leave waitlist button
- Creators: election detail → **Waitlist** panel (promote / remove)
- Admins: election detail waitlist panel; **Voters** page links to manage per election

## Flow example

Election limit = 1000 → first 1000 `registered`, next joiners `waitlisted` with positions 1, 2, 3… When a registered voter withdraws, `promote_waitlist_slots` moves position #1 to `registered` and renumbers the queue.
