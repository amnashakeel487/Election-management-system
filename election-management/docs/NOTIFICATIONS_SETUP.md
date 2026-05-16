# Notifications module setup

FortressVote logs every outbound email in `notification_logs` and sends through Brevo edge functions.

## Email types

| Type | Trigger | Edge function |
|------|---------|---------------|
| Email verification | User resends on `/verify-email` | Supabase Auth + optional `send-verification-reminder` |
| Creator approval / rejection | Admin approves or rejects creator | `send-creator-approval-notification` |
| Secret voter ID | Voter roll finalize or voter “Email again” | `send-secret-voter-ids` |
| Election start reminder | Voting window open, roll finalized | `send-election-notifications` (`election_start`) |
| Election end | After `end_date` | `send-election-notifications` (`election_end`) |
| Winner | Results locked | `send-election-notifications` (`winner`) |

## Database

Apply migration `supabase/migrations/021_notifications_module.sql` (Supabase CLI `db push` or SQL Editor).

## Secrets (Supabase → Project Settings → Edge Functions)

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME` (optional)
- `APP_URL` — e.g. `https://your-app.vercel.app`
- `CRON_SECRET` (optional) — for scheduled milestone processing without a user JWT

Supabase Auth SMTP (Dashboard → Authentication → SMTP) remains the source of the **official** verification link. The Brevo reminder is branded copy that points users to `/verify-email`.

## Deploy functions

From `election-management`:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF

npx supabase@latest functions deploy send-creator-approval-notification --project-ref YOUR_PROJECT_REF
npx supabase@latest functions deploy send-secret-voter-ids --project-ref YOUR_PROJECT_REF
npx supabase@latest functions deploy send-verification-reminder --project-ref YOUR_PROJECT_REF
npx supabase@latest functions deploy send-election-notifications --project-ref YOUR_PROJECT_REF
npx supabase@latest functions deploy process-notification-milestones --project-ref YOUR_PROJECT_REF
```

## Admin UI

**Admin → Notifications** shows delivery logs, 30-day summary, and **Process pending emails** (calls `process-notification-milestones`).

Locking results from the creator results page also triggers winner emails automatically.

## Scheduled milestones (optional)

Call `process-notification-milestones` on a schedule (e.g. every 15 minutes) with header `x-cron-secret: YOUR_CRON_SECRET` or body `{ "cron_secret": "..." }`.

Example (Supabase cron HTTP or external scheduler):

```http
POST https://YOUR_PROJECT.supabase.co/functions/v1/process-notification-milestones
Content-Type: application/json
x-cron-secret: YOUR_CRON_SECRET

{}
```

## Troubleshooting

- **No rows in log** — Migration `021` not applied, or function not deployed.
- **dev_mode in response** — `BREVO_API_KEY` missing; emails are logged but not sent via Brevo.
- **Winner not sent** — Ensure results are locked and `winner_notified_at` is null; retry from Admin → Process pending or lock flow.
- **Verification** — User must be signed in to call `send-verification-reminder`; email must match session.

See also [SECRET_VOTER_ID_EMAIL_SETUP.md](./SECRET_VOTER_ID_EMAIL_SETUP.md) and [AUTH_SETUP.md](./AUTH_SETUP.md).
