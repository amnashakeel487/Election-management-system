# Auth email setup (Resend SMTP — Option 1)

FortressVote uses Supabase Auth for sign-up and email verification. The default Supabase mailer has a low rate limit (`email rate limit exceeded`). Configure **Resend SMTP** in the Supabase dashboard so registration and verification emails work reliably.

**Order:** deploy to Vercel first ([DEPLOY.md](./DEPLOY.md)), then complete the steps below using your production URL.

## 1. Resend account

1. Sign in at [resend.com](https://resend.com).
2. **API Keys** → **Create API Key** → copy the key (starts with `re_`).
3. For **development only**, you can send from `onboarding@resend.dev` to **your own inbox** without a custom domain.
4. For **production / demos**, add and verify a domain under **Domains**, then use e.g. `noreply@yourdomain.com` as the sender.

## 2. Supabase SMTP settings

Open your project: `https://supabase.com/dashboard/project/prxgnpcolmfucunotcil`

1. **Authentication** → **Emails** (or **Project Settings** → **Authentication** → **SMTP Settings**).
2. Enable **Custom SMTP**.
3. Enter:

| Setting | Value |
|--------|--------|
| **Host** | `smtp.resend.com` |
| **Port** | `465` (recommended) or `587` |
| **Username** | `resend` |
| **Password** | Your Resend API key (`re_...`) |
| **Sender email** | `onboarding@resend.dev` only — **no** display name in this field |
| **Sender name** | `FortressVote` (separate field in Supabase) |

**Important:** Do not put `FortressVote <email@...>` in the sender email box. Use plain email only; put the name in **Sender name**.

4. Save. Confirm **Enable custom SMTP** stays on after save.

## 3. Redirect URLs (required for verify links)

**Authentication** → **URL configuration** (use your Vercel URL from [DEPLOY.md](./DEPLOY.md)):

| Field | Value |
|--------|--------|
| **Site URL** | `https://YOUR-APP.vercel.app` |
| **Redirect URLs** | `https://YOUR-APP.vercel.app/verify-email` |
| | `https://YOUR-APP.vercel.app/**` |
| | `http://localhost:5174/**` (local dev) |

## 4. Email confirmation

**Authentication** → **Providers** → **Email**:

- Keep **Confirm email** **enabled** if your requirements need verification.
- For quick local testing only, you may disable it temporarily (users can log in immediately after sign-up).

## 5. Register an admin

1. Open `https://YOUR-APP.vercel.app/register` (or `http://localhost:5174/register` locally)
3. Role: **Admin**
4. Email + password → **Create Secure Account**
5. Check inbox (and spam) for the Supabase confirmation email.
6. Click the link → sign in at `/login`

`public.users` should get `role = admin` automatically from signup metadata (migration `001_users.sql`).

## 6. Troubleshooting

### `Error sending confirmation email`

Work through this list in order:

1. **Resend dashboard → [Emails](https://resend.com/emails)**  
   Try sign-up again and look for a failed send. The error text there (e.g. domain not verified, invalid from address) is the real cause.

2. **Sender email format in Supabase**  
   - **Sender email:** `onboarding@resend.dev` (nothing else)  
   - **Sender name:** `FortressVote`  
   - **Password:** Resend API key (`re_...`), not Supabase anon/service key.

3. **Resend test sender limit**  
   With `onboarding@resend.dev`, you can usually only send **to the same email as your Resend account**.  
   Sign up with that address (e.g. `amnashakeel606@gmail.com`) **or** verify your own domain in Resend and use `noreply@yourdomain.com` as sender.

4. **SMTP connection**  
   - Host: `smtp.resend.com`  
   - Port: `465` — if it still fails, try `587`  
   - Username: `resend` (lowercase)

5. **Toggle SMTP off → on**  
   Save correct credentials again. A previous bad save can leave auth in a broken state ([Supabase issue](https://github.com/supabase/auth/issues/1238)).

6. **Vercel URL in Supabase**  
   Site URL: `https://election-manager-systm-three.vercel.app`  
   Redirect: `https://election-manager-systm-three.vercel.app/**`

7. **Unblock testing (temporary)**  
   **Authentication → Providers → Email** → turn off **Confirm email**, register once, then log in. Turn confirmation back on after SMTP works.

| Problem | Fix |
|--------|-----|
| `email rate limit exceeded` | Wait ~1 hour **or** finish SMTP above; avoid repeated sign-up clicks. |
| `Error sending confirmation email` | See checklist above; check Resend **Emails** log first. |
| No email received | Resend **Emails** tab; spam folder; test sender only sends to account email. |
| Link opens wrong site | Fix **Site URL** and **Redirect URLs** in Supabase. |
| User exists but not admin | Table Editor → `users` → set `role` to `admin`. |
| `row-level security policy` on `users` | Redeploy latest app (signup no longer inserts from client). Run migration `009_signup_profile_rls.sql`. Delete half-created auth user and register again. |

## Related

- Secret voter ID emails use the same Resend API key in the edge function (`RESEND_API_KEY` in Supabase **Edge Functions** secrets). One key can power both SMTP (Auth) and the API (edge function).
