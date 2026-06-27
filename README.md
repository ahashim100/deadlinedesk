# DeadlineDesk

Deadline reminders for small independent landlords (1–10 units). Its one job:
never let you miss a date that costs money — lease renewals, rent-increase
notices, security-deposit returns, inspections, insurance renewals, and
license/registration renewals.

This is **not** property management: no rent collection, no accounting, no
tenant portal, no maintenance tickets. Just reminders.

## Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind → Vercel
- **Backend/DB/Auth:** Supabase (Postgres + Auth + Edge Functions + pg_cron)
- **Email:** Resend · **SMS:** Twilio (both called from the Edge Function)
- **Billing:** Stripe (single ~$10/month subscription)

## How it fits together

```
Browser ──► Next.js (Vercel) ──► Supabase Postgres (RLS per user)
                  │                     ▲
                  └─ Stripe Checkout    │ daily cron (pg_cron)
                     + webhook ─────────┤
                                        ▼
                        Edge Function: daily-reminders
                              ├─ Resend (email)
                              └─ Twilio (SMS)
```

The reminder job runs **server-side every day** regardless of whether anyone
opens the app. Reminder sending is gated behind an active Stripe subscription;
signup and data entry are free so users see value first.

---

## Local setup

Prereqs: Node 18+ (this repo was built on Node 24) and a Supabase project.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#    then fill in the values (see "Environment variables" below)

# 3. Create the database schema
#    Paste each migration in supabase/migrations/ (in order) into the Supabase
#    SQL editor and run them: 0001_init.sql then 0003_pro_features.sql.
#    (0002 and 0004 are cron schedules — run them after deploying functions.)
#    Or with the CLI:
#       supabase link --project-ref <your-ref>
#       supabase db push

# 4. (Optional) Seed demo data
npm run seed
#    Signs you in with demo@deadlinedesk.test / demo-password-123

# 5. Run
npm run dev      # http://localhost:3000
```

Useful scripts: `npm run typecheck`, `npm run lint`, `npm run build`, and
`npm run verify` (runs all three — the same checks as CI). A GitHub Actions
workflow in `.github/workflows/ci.yml` runs `verify` on every push/PR.

## Environment variables

Set these in `.env.local` (and in Vercel for production). Full reference with
notes is in [`.env.example`](.env.example).

| Variable | Used by | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | app | no |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | app | no |
| `SUPABASE_SERVICE_ROLE_KEY` | Stripe webhook, seed | **yes** |
| `NEXT_PUBLIC_SITE_URL` | Stripe redirect URLs | no |
| `STRIPE_SECRET_KEY` | billing | **yes** |
| `STRIPE_PRICE_ID` | billing (the $10/mo price) | no |
| `STRIPE_WEBHOOK_SECRET` | webhook verification | **yes** |

These belong to the **Edge Function** — set them as Supabase function secrets,
not in `.env.local`:

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | send reminder emails |
| `EMAIL_FROM` | from-address, e.g. `DeadlineDesk <reminders@yourdomain.com>` |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | send reminder SMS |

> `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected into the Edge
> Function automatically by Supabase — you don't set those.

---

## Stripe setup

1. Create a Product with a recurring **$10/month** Price → copy its `price_…`
   into `STRIPE_PRICE_ID`.
2. Add a webhook endpoint pointing to `https://YOUR_DOMAIN/api/stripe/webhook`
   for events: `checkout.session.completed`,
   `customer.subscription.created|updated|deleted`. Copy the signing secret into
   `STRIPE_WEBHOOK_SECRET`.
3. Local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   and use the secret it prints.

---

## Deploying

### Frontend → Vercel
1. Push this repo to GitHub and import it in Vercel.
2. Add all `NEXT_PUBLIC_*` and Stripe/Supabase variables in Vercel → Settings →
   Environment Variables. Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL.
3. Deploy.

### Database + Edge Function → Supabase
```bash
supabase link --project-ref <your-ref>
supabase db push                          # applies migrations/0001_init.sql

# Set the function's secrets (email/SMS):
supabase secrets set \
  RESEND_API_KEY=... \
  EMAIL_FROM="DeadlineDesk <reminders@yourdomain.com>" \
  TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_FROM_NUMBER=+1...

# Deploy the reminder job:
supabase functions deploy daily-reminders
```

Then schedule it: open `supabase/migrations/0002_schedule_reminders.sql`,
replace the `<PROJECT_REF>` and `<SERVICE_ROLE_KEY>` placeholders, and run it in
the SQL editor. It registers a daily pg_cron job that calls the function.

---

## Testing the daily reminder job manually

You don't have to wait for cron. Any of these work:

**A. Invoke the deployed function directly**
```bash
curl -X POST \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  https://<PROJECT_REF>.supabase.co/functions/v1/daily-reminders
```

**B. Run it locally**
```bash
supabase functions serve daily-reminders --env-file ./supabase/.env.functions
# in another terminal:
curl -X POST http://localhost:54321/functions/v1/daily-reminders
```

The response is JSON like `{ ok: true, today, sent, skipped, errors }`. Sends
are recorded in the `reminder_log` table, and the unique index on
`(deadline_id, channel, lead_time)` guarantees the same milestone is never sent
twice — so it's safe to re-run.

To see reminders actually fire against the seed data, make sure the demo
profile has `subscription_status = 'active'` (the seed sets this) and that
`RESEND_API_KEY` / Twilio secrets are configured.

---

## How deadlines are computed

A plain TypeScript config table (no AI) in
[`src/lib/rules/`](src/lib/rules/) derives deadlines from lease dates. v1
covers **California**; adding a state is one config entry — see
[`RULES.md`](RULES.md) for the legal basis and citations.

> ⚠️ The legal timeframes are a best-effort starting point. **Verify every rule
> against the current statute before launch** — each is marked in code with
> `// TODO: verify against current CA statute`.

## Data model

`profiles` (1:1 with auth users; plan + notification prefs) → `properties` →
`units` → `leases` → `deadlines` → `reminder_log`. Row-Level Security restricts
every row to its owning landlord; the Edge Function uses the service role to
scan across users. Full schema: `supabase/migrations/0001_init.sql`.
