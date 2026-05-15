# Deploy FortressVote on Vercel

Deploy the frontend first, then configure Supabase URLs and Resend SMTP (see [AUTH_SETUP.md](./AUTH_SETUP.md)).

## Prerequisites

- GitHub repo pushed (e.g. `Election-management-system`)
- Supabase project with migrations `001`–`008` applied
- Supabase **anon** key and **Project URL** from **Project Settings → API**

## 1. Import project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) → import your GitHub repository.
2. **Root Directory:** set to `election-management` (not the repo root).
3. Vercel should detect **Vite** automatically (`vercel.json` is included).

| Setting | Value |
|--------|--------|
| Framework Preset | Vite |
| Root Directory | `election-management` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

4. Do **not** deploy yet — add environment variables first.

## 2. Environment variables (Vercel)

**Project → Settings → Environment Variables** — add for **Production**, **Preview**, and **Development**:

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your Supabase **anon** `public` key |

Redeploy after changing env vars (Vite bakes them in at build time).

## 3. Deploy

Click **Deploy**. When finished, copy your URL, e.g.:

`https://fortress-vote-xyz.vercel.app`

## 4. Configure Supabase for production

**Authentication → URL configuration**

| Field | Value |
|--------|--------|
| **Site URL** | `https://YOUR-APP.vercel.app` |
| **Redirect URLs** | `https://YOUR-APP.vercel.app/verify-email` |
| | `https://YOUR-APP.vercel.app/**` |
| | `http://localhost:5174/**` (keep for local dev) |

Save. Email confirmation links will redirect to your Vercel app.

## 5. Resend SMTP (after deploy)

Follow [AUTH_SETUP.md](./AUTH_SETUP.md) to enable Resend SMTP, then register users on:

`https://YOUR-APP.vercel.app/register`

## 6. Verify deployment

- [ ] Home page loads
- [ ] `/login` and `/register` work (no blank page on refresh — SPA rewrite)
- [ ] Register → verify email → login
- [ ] Admin dashboard for `role = admin` users

## Troubleshooting

| Issue | Fix |
|--------|-----|
| 404 on `/login` refresh | Ensure `vercel.json` rewrites are committed; redeploy. |
| “Supabase env vars missing” in console | Set `VITE_*` in Vercel and **redeploy**. |
| Auth works locally, not on Vercel | Add Vercel URL to Supabase **Redirect URLs**. |
| Build fails on Vercel | Confirm **Root Directory** is `election-management`. |
| **`Failed to fetch` on register/login** | Vercel env vars missing/wrong or Supabase project **paused**. Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`, **redeploy**. Unpause project in Supabase dashboard. Disable ad-blockers for `*.supabase.co`. |

## Custom domain (optional)

Vercel → **Domains** → add your domain, then add that URL to Supabase **Redirect URLs** and update **Site URL**.
