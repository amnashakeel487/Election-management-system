# Security module

FortressVote layers defense across the database, edge functions, and React client.

## Coverage

| Control | Implementation |
|---------|----------------|
| **Row Level Security** | RLS on all core tables; migration `022` locks `election_secret_id_sequences` and revokes direct ballot writes |
| **Encrypted / sealed votes** | Anonymous ballots (no voter link) + HMAC `ballot_choice_seal` per ballot (tamper detection) |
| **CAPTCHA** | Cloudflare Turnstile when `VITE_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` are set; checkbox fallback via `verify-turnstile` |
| **Rate limiting** | `enforce_rate_limit` RPC on vote verify/cast; edge CAPTCHA bucket; Supabase Auth limits on email |
| **Secure APIs** | Security definer RPCs only for sensitive writes; JWT on edge functions; admin-only settings RPC |
| **Input validation** | Zod schemas (`src/lib/validation/schemas.ts`); SQL-side length/charset checks on secret voter ID |
| **XSS / SQL injection** | React text escaping; `sanitizeText()` for display; parameterized Supabase queries; no raw SQL from client |

## Database

Apply `supabase/migrations/022_security_module.sql`.

If you see `function hmac(text, text, unknown) does not exist`, use the latest migration file (it uses `extensions.hmac` with `bytea` via `convert_to`). On Supabase, enable **Database → Extensions → pgcrypto** if needed, then re-run the script.

Admin UI: **Security Center** loads `get_security_posture` and saves via `admin_update_security_settings`.

## Turnstile (optional)

1. Create a Turnstile site at [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Vercel / `.env`: `VITE_TURNSTILE_SITE_KEY=...`
3. Supabase Edge secrets: `TURNSTILE_SECRET_KEY=...`
4. Deploy: `npx supabase@latest functions deploy verify-turnstile --project-ref YOUR_REF`

Without keys, login/signup use the checkbox and the edge function accepts `checkbox-fallback` in dev.

## Vote integrity secret

Migration 022 generates `vote_integrity_secret` in `platform_security_settings`. Rotate in production (SQL update) and restrict admin access.

## Maintenance mode

Enable in **Admin → Security Center** to block `verify_secret_voter_for_voting` and `cast_anonymous_vote`.

## HTTP headers

Production deploys on Vercel include `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` via `vercel.json`.
