# Assignment requirements coverage — FortressVote

Stack: **React 19 + Vite + TypeScript + Tailwind + Supabase** (Auth, Postgres, RLS, Edge Functions).

Run migrations **001 → 010** in Supabase SQL Editor before testing.

## Module checklist

| Module | Status | Notes |
|--------|--------|--------|
| 1. Authentication | Done | Signup (name, email, phone, role), login/logout, email verify, forgot/reset password, RBAC, protected routes |
| 2. Admin approval | Done | Review purpose/org/phone, approve/reject + reason, audit logs |
| 3. Election creation | Done | Wizard: title, description, category, dates, registration deadline, max voters, publish |
| 4. Candidates | Partial | Name, description/manifesto, designation, photo URL (paste URL; no file storage UI) |
| 5. Landing page | Done | Upcoming/active/completed, search/filter, live stats RPC, registration counts |
| 6. Voter registration | Done | “I Want to Participate”, terms checkbox, waitlist (#N), auto-promote, notifications, duplicate prevention |
| 7. Voter lock/finalize | Done | Finalize roll RPC, secret IDs, frozen list |
| 8. Secret IDs | Done | POLL-A-0001 format, email edge function, masked UI |
| 9. Voting | Done | Secret ID verify, anonymous ballot, one vote, timer |
| 10. Live results | Done | Recharts, realtime, winner, turnout |
| 11. Audit | Done | Login/vote/election/approval logs, admin CSV download |
| 12. Notifications | Partial | Email verify (Supabase), secret IDs (Resend); approval email = audit only |
| 13. Security | Done | RLS (022), ballot seals, rate limits, Turnstile CAPTCHA, Zod validation, `docs/SECURITY_SETUP.md` |
| 14. Dashboards | Done | Admin, creator, voter dashboards |
| 15. Deployment | Done | Vercel + `docs/DEPLOY.md` + env vars |

## Roles

- **Admin** (`admin`) — `/admin/dashboard`, approve creators, audit trail
- **Election Creator** (`election_creator`) — pending until approved; then create elections
- **Voter** (`voter`) — register for polls, vote with secret ID

## Key routes

| Path | Purpose |
|------|---------|
| `/` | Public landing |
| `/register` | Sign up with role |
| `/login` | Sign in |
| `/forgot-password` | Reset email |
| `/reset-password` | New password (from email link) |
| `/admin/dashboard` | Admin |
| `/admin/audit-logs` | Full audit + CSV |
| `/creator/dashboard` | Creator |
| `/voter/dashboard` | Voter |
| `/elections/:id` | Details + participate |
| `/elections/:id/vote` | Ballot |
| `/elections/:id/results` | Results |

## Demo flow (presentation)

1. Register **Admin** → verify email → login → admin dashboard  
2. Register **Creator** with purpose/org → admin approves  
3. Creator: new election → add candidates → publish  
4. Register **Voter** → open election → accept terms → **I Want to Participate**  
5. Creator: **Finalize & Email IDs** (Resend configured)  
6. Voter: vote with secret ID → view results  
7. Admin: audit trail + CSV export  

## Optional / bonus (not implemented)

- 2FA, SMS OTP, QR invites, PDF export, PWA, i18n, blockchain audit UI
