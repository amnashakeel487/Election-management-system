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
| **Sender email** | `onboarding@resend.dev` (dev) or `FortressVote <noreply@yourdomain.com>` |
| **Sender name** | `FortressVote` (optional) |

4. Save.

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

| Problem | Fix |
|--------|-----|
| `email rate limit exceeded` | Wait ~1 hour **or** finish SMTP setup above; avoid repeated sign-up clicks. |
| No email received | Check Resend **Emails** dashboard; confirm sender domain or use `onboarding@resend.dev` + your email only. |
| Link opens wrong site | Fix **Site URL** and **Redirect URLs** in Supabase. |
| User exists but not admin | Table Editor → `users` → set `role` to `admin`. |

## Related

- Secret voter ID emails use the same Resend API key in the edge function (`RESEND_API_KEY` in Supabase **Edge Functions** secrets). One key can power both SMTP (Auth) and the API (edge function).
