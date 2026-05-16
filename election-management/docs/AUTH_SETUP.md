# Email setup with Brevo

FortressVote uses **Brevo** (formerly Sendinblue) for:

1. **Supabase Auth** — sign-up verification, password reset (SMTP)
2. **Edge functions** — secret voter IDs, creator approval/rejection (API)

**Order:** deploy the app first ([DEPLOY.md](./DEPLOY.md)), then complete Brevo + Supabase below.

---

## Part 1 — Brevo account setup

### 1. Create API key (edge functions)

1. Sign in at [app.brevo.com](https://app.brevo.com).
2. Go to **SMTP & API** → **API Keys**.
3. **Generate a new API key** → name it e.g. `FortressVote Production`.
4. Copy the key (starts with `xkeysib-`). Store it safely — you will add it to Supabase as `BREVO_API_KEY`.

### 2. Verify a sender (required)

Brevo will not send until the **From** address is allowed.

1. **Senders, domains & dedicated IPs** → **Senders**.
2. **Add a sender**:
   - **From email:** e.g. `noreply@yourdomain.com` (must be an address you control)
   - **From name:** `FortressVote`
3. Brevo sends a verification email to that address — **click the link** to confirm.

For production, also **authenticate your domain** (SPF/DKIM) under **Domains** so deliverability is good.

### 3. SMTP key (Supabase Auth only)

Auth emails use SMTP, not the REST API.

1. **SMTP & API** → **SMTP**.
2. Note:
   - **SMTP server:** `smtp-relay.brevo.com`
   - **Port:** `587` (TLS) or `465` (SSL)
   - **Login:** your Brevo account email (shown on that page)
3. **Generate SMTP key** (if you do not have one) and copy it — this is the **password** for Supabase SMTP, **not** the API key.

---

## Part 2 — Supabase Auth (SMTP)

Open your project in the [Supabase dashboard](https://supabase.com/dashboard).

1. **Authentication** → **Email** (or **Project Settings** → **Authentication** → **SMTP**).
2. Enable **Custom SMTP**.
3. Enter:

| Setting | Value |
|--------|--------|
| **Host** | `smtp-relay.brevo.com` |
| **Port** | `587` (try `465` if 587 fails) |
| **Username** | Your Brevo login email (from SMTP page) |
| **Password** | Your Brevo **SMTP key** (not the API key) |
| **Sender email** | Same verified sender, e.g. `noreply@yourdomain.com` — plain email only |
| **Sender name** | `FortressVote` |

4. Save and keep **Enable custom SMTP** on.

### Redirect URLs

**Authentication** → **URL configuration**:

| Field | Value |
|--------|--------|
| **Site URL** | `https://YOUR-APP.vercel.app` |
| **Redirect URLs** | `https://YOUR-APP.vercel.app/verify-email` |
| | `https://YOUR-APP.vercel.app/reset-password` |
| | `https://YOUR-APP.vercel.app/**` |
| | `http://localhost:5174/**` |

### Email confirmation

**Authentication** → **Providers** → **Email** → keep **Confirm email** enabled if voters must verify before login.

---

## Part 3 — Edge function secrets (Brevo API)

> **Step-by-step only for secret voter ID emails:** see [SECRET_VOTER_ID_EMAIL_SETUP.md](./SECRET_VOTER_ID_EMAIL_SETUP.md)

Secret voter IDs and creator approval emails use the **Brevo REST API**.

1. Supabase dashboard → **Edge Functions** → **Secrets** (or Project Settings → Edge Functions).
2. Add:

| Secret | Example | Purpose |
|--------|---------|---------|
| `BREVO_API_KEY` | `xkeysib-...` | API key from Part 1 |
| `BREVO_SENDER_EMAIL` | `noreply@yourdomain.com` | Must match a **verified sender** in Brevo |
| `BREVO_SENDER_NAME` | `FortressVote` | Optional display name |
| `APP_URL` | `https://your-app.vercel.app` | Links in creator approval emails |

3. Deploy functions (from repo root, with [Supabase CLI](https://supabase.com/docs/guides/cli)):

```bash
supabase functions deploy send-secret-voter-ids
supabase functions deploy send-creator-approval-notification
```

Without `BREVO_API_KEY`, functions run in **dev mode** (IDs logged in function logs, no real email).

### Deploy without CLI (Supabase Dashboard)

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/prxgnpcolmfucunotcil/functions).
2. **Create a new function** named exactly `send-secret-voter-ids`.
3. Paste the code from `supabase/functions/send-secret-voter-ids/index.ts` and `brevo.ts` (combine or upload both files if the editor supports imports).
4. **Deploy** the function.
5. **Edge Functions** → **Secrets** → add `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`.
6. Repeat for `send-creator-approval-notification` if you use creator approval emails.

Or from the `election-management` folder use `npx supabase@latest login`, `npx supabase@latest link --project-ref prxgnpcolmfucunotcil`, and `npx supabase@latest functions deploy send-secret-voter-ids` (do **not** use `npm install -g supabase` — not supported). See [SECRET_VOTER_ID_EMAIL_SETUP.md](./SECRET_VOTER_ID_EMAIL_SETUP.md).

---

## Part 4 — Test

### Auth (sign-up)

1. Register a new voter with a real inbox.
2. Check **Brevo** → **Transactional** → **Email logs** (or **Statistics** → **Email**) for send status.
3. Open the verification link → `/verify-email`.

### Secret voter ID

1. Finalize a voter roll from the creator dashboard (**Finalize & email IDs**).
2. Confirm the email in Brevo logs and the voter inbox.
3. Voter can use **Email again** on the dashboard if needed.

### Creator approval

1. Approve/reject a creator at `/admin/approvals`.
2. Applicant should receive the Brevo message.

---

## Troubleshooting

| Problem | What to check |
|--------|----------------|
| **`Failed to send a request to the Edge Function`** | Function `send-secret-voter-ids` is **not deployed**. Deploy it (Part 3) and set secrets. If finalize already ran, IDs exist but emails did not send — redeploy, set Brevo secrets, then voters use **Email again**. |
| `Error sending confirmation email` (sign-up) | Supabase SMTP: host `smtp-relay.brevo.com`, SMTP **key** as password, sender **verified** in Brevo |
| Edge function `dev_mode: true` | Set `BREVO_API_KEY` and redeploy the function |
| `Sender not found` / invalid sender | `BREVO_SENDER_EMAIL` must be a **verified** sender in Brevo |
| API `401` | Wrong or expired `BREVO_API_KEY` |
| API `400` | Brevo response body in function logs; often unverified sender or blocked recipient |
| Email in spam | Complete domain authentication (SPF/DKIM) in Brevo |
| `email rate limit exceeded` | Custom SMTP fixes Auth limits; wait if you hit Supabase default limits before SMTP was enabled |

Check sends in Brevo: **Transactional** → **Email** (or **Logs**).

---

## Super Admin (optional)

Super Admin is not on the public signup form. After a user exists:

```sql
update public.users
set role = 'admin', approval_status = 'approved'
where email = 'you@example.com';
```

---

## Related

- Migration `016` — secret ID format `POLL-A-0001`
- `send-secret-voter-ids` — batch + voter **Email again** (`scope: self`)
- `send-creator-approval-notification` — admin approve/reject
