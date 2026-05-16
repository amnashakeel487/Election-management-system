# Secret voter ID email — step-by-step setup (Brevo)

Use this guide after **signup / verify-email** already works with Brevo.

- **Signup email** = Supabase **Authentication → SMTP** (you did this already).
- **Secret voter ID email** = Supabase **Edge Function** + Brevo **API key** (do this guide).

Same Brevo account. Two different setups.

---

## Before you start

You need:

- A Brevo account ([app.brevo.com](https://app.brevo.com))
- A **verified sender** in Brevo (e.g. `noreply@yourdomain.com`) — same one used for signup is fine
- Access to Supabase project: **prxgnpcolmfucunotcil**  
  Dashboard: https://supabase.com/dashboard/project/prxgnpcolmfucunotcil

---

## Part A — Brevo: create an API key

Signup uses an **SMTP key**. Secret IDs need an **API key**. They are different.

| What | Where in Brevo | Used for |
|------|----------------|----------|
| SMTP key | SMTP & API → **SMTP** | Signup / verify email |
| API key | SMTP & API → **API Keys** | Secret voter ID emails |

### Steps

1. Log in to [app.brevo.com](https://app.brevo.com).
2. Open **SMTP & API** → **API Keys**.
3. Click **Generate a new API key**.
4. Name it e.g. `FortressVote Secret IDs`.
5. Copy the key. It starts with **`xkeysib-`**.
6. Save it somewhere safe (you will paste it into Supabase in Part B).

You do **not** need a new sender if signup already works — reuse the same verified email.

---

## Part B — Supabase: add Edge Function secrets

1. Open: https://supabase.com/dashboard/project/prxgnpcolmfucunotcil/settings/functions  
   (Or: **Project Settings** → **Edge Functions** → **Secrets**)

2. Click **Add new secret** for each row:

| Secret name | What to paste | Example |
|-------------|---------------|---------|
| `BREVO_API_KEY` | API key from Part A | `xkeysib-xxxxxxxx` |
| `BREVO_SENDER_EMAIL` | Your **verified** sender in Brevo | `noreply@yourdomain.com` |
| `BREVO_SENDER_NAME` | Display name (optional) | `FortressVote` |

3. Click **Save** after each secret.

**Do not** put `BREVO_API_KEY` under Authentication → SMTP. That page is only for signup emails.

---

## Part C — Supabase: deploy the Edge Function

The app calls a function named **`send-secret-voter-ids`**.  
If it is not deployed, you see: **"Failed to send a request to the Edge Function"**.

Choose **one** method below.

> **Do not run** `npm install -g supabase` — Supabase removed global npm install. You will see: *"Installing Supabase CLI as a global module is not supported."*

### Method 1A — `npx` + access token (recommended on Windows)

Browser login (`npx supabase login`) often fails with **"Unable to create CLI sign-in session"**.  
Use a **personal access token** instead — no browser step.

#### Step 1 — Create a token in Supabase

1. Open: https://supabase.com/dashboard/account/tokens  
2. Click **Generate new token**.
3. Name it e.g. `FortressVote CLI`.
4. Copy the token (starts with `sbp_`). You only see it once.

#### Step 2 — Deploy from PowerShell

```powershell
cd C:\GitHub\Election-management-system\election-management

# Paste your real token between the quotes:
$env:SUPABASE_ACCESS_TOKEN = "sbp_paste_your_token_here"

npx supabase@latest functions deploy send-secret-voter-ids --project-ref prxgnpcolmfucunotcil
```

You do **not** need `supabase login` or `supabase link` when you use the token + `--project-ref`.

Optional (creator approval emails):

```powershell
npx supabase@latest functions deploy send-creator-approval-notification --project-ref prxgnpcolmfucunotcil
```

When deploy finishes, you should see success for `send-secret-voter-ids`.

#### If you prefer login with a token (instead of env var)

```powershell
npx supabase@latest login --token sbp_paste_your_token_here
npx supabase@latest functions deploy send-secret-voter-ids --project-ref prxgnpcolmfucunotcil
```

Close the browser tab that shows the login error — you do not need it when using `--token`.

### Method 1B — Install CLI with Scoop (optional, permanent `supabase` command)

Only if you want `supabase` available without `npx` every time:

```powershell
# PowerShell (install Scoop first if needed: https://scoop.sh)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
supabase --version
```

Then use `supabase login`, `supabase link`, `supabase functions deploy` (no `npx`).

### Method 2 — Supabase Dashboard (no CLI at all)

1. Open: https://supabase.com/dashboard/project/prxgnpcolmfucunotcil/functions
2. Click **Deploy a new function** or **Create function**.
3. Name it exactly: **`send-secret-voter-ids`** (spelling matters).
4. Copy code from your repo:
   - `supabase/functions/send-secret-voter-ids/index.ts`
   - `supabase/functions/send-secret-voter-ids/brevo.ts`  
   If the editor only allows one file, create both files or merge `brevo.ts` into `index.ts` and fix the import.
5. Click **Deploy**.
6. Confirm the function appears in the list as **Active**.

---

## Part D — Test secret voter ID email

### 1. Prepare an election

1. Sign in as **Election Creator**.
2. Create or open a **published** election.
3. Sign in as a **Voter** (approved account).
4. Join the election (**I want to participate**).
5. Confirm capacity shows at least **1** registered voter (e.g. `1/300`).

Do **not** finalize when there are **0** voters — registration closes and nobody can join.

### 2. Finalize and send emails

1. Sign in as **Creator** again.
2. Go to **Creator dashboard**.
3. Find the election → click **Finalize & email IDs**.
4. Confirm the dialog.

**Success message** should look like:

`Assigned 1 new ID(s). Emailed 1 voter(s).`

### 3. Check delivery

| Where | What to look for |
|-------|------------------|
| Voter inbox | Email subject: **Your Secret Voter ID — [election name]** |
| Brevo | **Transactional** → **Email** (or **Logs**) — sent status |
| Supabase | **Edge Functions** → `send-secret-voter-ids` → **Logs** — no errors |

### 4. If the roll was already finalized earlier

Emails may have failed before the function was deployed. After Part B + C:

1. Voter signs in.
2. Opens the election or **Voter dashboard**.
3. Clicks **Email again** next to their secret ID.

---

## Part E — Troubleshooting

### "Unable to create CLI sign-in session" (browser login)

| Cause | Fix |
|-------|-----|
| Browser CLI login failed | **Do not use** `npx supabase login` without a token. Use **Method 1A** (access token + `$env:SUPABASE_ACCESS_TOKEN`) or **Method 2** (Dashboard only). |
| Unknown error in browser | Same — get token from https://supabase.com/dashboard/account/tokens |

### "Failed to send a request to the Edge Function"

| Cause | Fix |
|-------|-----|
| Function not deployed | Do **Part C** again |
| Wrong function name | Must be exactly `send-secret-voter-ids` |
| Wrong Supabase project | App `VITE_SUPABASE_URL` must match project `prxgnpcolmfucunotcil` |

### "Voter roll finalized … but emailing failed"

| Cause | Fix |
|-------|-----|
| Missing `BREVO_API_KEY` | Part B |
| Missing `BREVO_SENDER_EMAIL` | Part B |
| Sender not verified in Brevo | Brevo → Senders → verify email |
| Brevo API error | Read **Edge Function logs** and Brevo email log |

### Dev mode message (no real email)

If you see text about **dev mode** or **BREVO_API_KEY**:

- Add `BREVO_API_KEY` in Edge Function secrets (Part B).
- Redeploy the function (Part C).

Without the API key, IDs are only written in function logs, not emailed.

### Signup works but secret ID does not

That is normal until Part B + C are done. Signup = SMTP. Secret ID = API + Edge Function.

---

## Quick checklist

Copy and tick off:

```
[ ] Brevo API key created (xkeysib-...)
[ ] BREVO_API_KEY added in Supabase Edge Function secrets
[ ] BREVO_SENDER_EMAIL added (same verified sender as signup)
[ ] BREVO_SENDER_NAME added (optional)
[ ] send-secret-voter-ids deployed (CLI or Dashboard)
[ ] At least 1 voter registered on a test election
[ ] Finalize & email IDs clicked
[ ] Email received OR Brevo transactional log shows "sent"
```

---

## What you do NOT need to change

| Item | Change? |
|------|---------|
| Vercel env vars (`VITE_SUPABASE_*`) | No — same as now |
| Supabase Auth SMTP (signup) | No — leave as is |
| Brevo SMTP key | No — still only for signup |
| Database migrations | No — for email only |

---

## Related docs

- [AUTH_SETUP.md](./AUTH_SETUP.md) — full auth + Brevo overview
- [DEPLOY.md](./DEPLOY.md) — Vercel deploy (if needed)
