# Accessly Launch Checklist

Single-page launch readiness doc, parity with ClearShield. Run through it top-to-bottom the day before launch. Each section calls out where to verify and what a healthy state looks like.

Accessly is the **WCAG accessibility scanner** brand. ClearShield is the **ADA/EAA lawsuit-defense** sibling brand. The two share a code template but have separate Vercel projects, Supabase projects, Stripe accounts (both under 99 Trees Media), and Resend domains.

---

## Recent hardening (May 2026)

Same security + quality pass that ClearShield got, in case a future maintainer wonders what changed:

| Area | What was wrong | Fix |
|---|---|---|
| `/admin` | Layout-level `redirect()` didn't stop parallel page data fetches → anonymous responses leaked customer emails in the RSC payload. | `requireAdmin()` helper called as first `await` in every admin page (9 pages on Accessly). |
| `proxy.ts` | Anonymous `/admin` and `/sales` got an internal rewrite (HTTP 200) instead of a proper redirect. | `proxy.ts` now returns 307 for anonymous `/admin/*` AND `/sales/*` requests. |
| Stripe webhook | No idempotency. Retried deliveries double-sent Slack pings + emails. | New `stripe_events` table (migration `20260516000000_stripe_events.sql`); event ID inserted before side-effects, `unique_violation` short-circuits with 200. Graceful degradation if table not yet migrated. |
| Scan endpoints | Accepted any URL — could be coaxed into hitting cloud metadata endpoints / private IPs / non-http schemes. | New `lib/urlGuard.ts` blocks localhost, RFC1918, link-local (169.254.x), IPv6 equivalents, .local/.internal/.lan/.arpa, and non-http(s) protocols. |
| Rate limiting | `/api/v1/scan` (shared API key for all CI/CD users) and `/api/contact` had no rate limit. | Ported `lib/rateLimit` from ClearShield. 100 scans / 10min / IP and 8 contact messages / 24h / IP. |
| Security headers | Vercel didn't add CSP/X-Frame-Options/Permissions-Policy by default. | Baseline headers via `next.config.ts` `headers()`. Skipped for `/api/badge/*` (intentionally embeddable). |
| SEO | `/about`, `/privacy`, `/terms`, `/upgrade` either inherited the wrong social card or lost the og:image when overriding metadata. | Per-page `openGraph` + `twitter` blocks with explicit `images: ['/opengraph-image']`. |
| Smoke testing | No automated smoke test. | New `scripts/smoke.sh` — 34 checks across marketing pages, SEO, auth gating, API surfaces. |

---

## 0. Pre-flight — should already be done

- [ ] Domain `accessly.us` purchased and connected to Vercel
- [ ] Apex (`accessly.us`) is the Primary domain in Vercel — verified ✅
- [ ] GitHub repo `juanserdiuk/accessly` connected to Vercel (auto-deploy from `main`)
- [ ] Supabase project provisioned
- [ ] Stripe organization "Accessly" exists (separate account under 99 Trees Media parent)
- [ ] Resend domain `accessly.us` verified

### ⚠ Known gap: `NEXT_PUBLIC_SITE_URL` env var

As of 2026-05-17, this is set to `https://accessly-eight.vercel.app` (the auto-generated Vercel preview URL) on the Accessly Vercel project. Visible side-effects:

- `og:url` on every page links to the preview deploy
- All canonicals point at the preview deploy
- `robots.txt` `Host:` + `Sitemap:` directives wrong
- All `<loc>` entries in `sitemap.xml` wrong

**Fix:** Vercel → Accessly project → Settings → Environment Variables → edit `NEXT_PUBLIC_SITE_URL` → `https://accessly.us` → save → redeploy. Code is correct — this is purely a Vercel config drift.

---

## 1. Environment variables on Vercel

Set on the **Production** scope. Re-deploy after any change.

| Var | Value | Source |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://accessly.us` | Hard-coded |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon public key) | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | (service_role secret) | Supabase → Project Settings → API — **NEVER commit** |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe → Accessly account → Developers → API keys (Live mode) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe → Webhooks → endpoint signing secret |
| `RESEND_API_KEY` | `re_...` | Resend Dashboard |
| `EMAIL_FROM` | `Accessly <noreply@accessly.us>` | Once Resend domain is verified |
| `ADMIN_EMAIL` | `juanserdiuk@juanserdiuk.com` | Hard-coded |
| `ADMIN_EMAILS` | (CSV, same as ADMIN_EMAIL) | Hard-coded |
| `CRON_SECRET` | random 32-byte hex | `openssl rand -hex 32` |
| `BROWSERLESS_API_KEY` | (from browserless.io) | Browserless dashboard |
| `CICD_API_KEY` | random 32-byte hex | `openssl rand -hex 32` — for `/api/v1/scan` |
| `OPS_WEBHOOK_URL` | Slack/Discord webhook | Optional but recommended (founder phone notifications) |

**Verify:** `curl https://accessly.us/api/health` — returns JSON with `status: "ok"` and every `env.has*: true`.

---

## 2. Supabase migrations

```bash
supabase login
supabase link --project-ref <accessly-project-ref>
supabase db push
```

Expected public tables after push:
- `profiles`, `scans`, `sites`, `team_members`, `guest_tokens`
- `portfolios`, `scheduled_scans`, `contact_messages`, `user_roles`
- `salespeople`, `promo_codes`, `promo_redemptions` (Accessly uses these — unlike ClearShield where they're dead)
- `stripe_events` (idempotency table added 2026-05-16)

Verify in Supabase SQL editor:
```sql
-- All public tables, RLS check:
select tablename, rowsecurity from pg_tables where schemaname = 'public';

-- Idempotency table present?
select count(*) from public.stripe_events;  -- should return 0, not 'relation does not exist'

-- Signup trigger working?
select count(*) from auth.users;
select count(*) from public.profiles;
-- These should match (handle_new_user() trigger creates a profile row per auth user)
```

---

## 3. Stripe live-mode setup (Accessly account)

> Confirm you're in the **Accessly** account, not "99 Trees Media" or "Clear Shield". The dashboard remembers the last account visited.

Accessly's `create-checkout` route uses inline `price_data`, so persistent Products/Prices aren't strictly required, but they make Stripe Dashboard reporting much cleaner.

### 3a. Products

| Product | Description |
|---|---|
| Accessly Pro | Unlimited scans, monitoring, regression alerts — $29/mo |
| Accessly Agency | Unlimited everything, white-label, team — $99/mo |
| Accessly Starter Scan Pack | 10 one-time scans — $9 |
| Accessly Basic Scan Pack | 25 one-time scans — $19 |
| Accessly Pro Scan Pack | 50 one-time scans — $29 |
| Accessly Agency Scan Pack | 100 one-time scans — $49 |

### 3b. Prices (subscriptions)

| Product | Nickname | Amount | Interval |
|---|---|---|---|
| Pro | Pro Monthly | $29.00 USD | Month |
| Pro | Pro Annual | $278.40 USD | Year |
| Agency | Agency Monthly | $99.00 USD | Month |
| Agency | Agency Annual | $950.40 USD | Year |

(Annual = monthly × 12 × 0.8 — 20% off, matches the marketing site.)

### 3c. Webhook endpoint

Stripe → Developers → Webhooks → + Add endpoint:
- URL: `https://accessly.us/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.deleted`
- Copy signing secret → `STRIPE_WEBHOOK_SECRET` on Vercel

### 3d. Customer Portal

Stripe → Settings → Customer portal:
- Cancel: at end of billing period
- Allow plan switching between Pro and Agency

### 3e. Statement descriptor

Stripe → Settings → Public details:
- Statement descriptor: `ACCESSLY` (max 22 chars)
- Prefix (per-payment, where supported): `ACCESSLY`

Without this, charges show as the legal business name on file ("99 Trees Media") — a common dispute trigger.

---

## 4. Resend final wiring

- [ ] Domain `accessly.us` verified (green checkmark)
- [ ] SPF + DKIM passing
- [ ] `EMAIL_FROM=Accessly <noreply@accessly.us>` set on Vercel
- [ ] Test send → confirm landing in inbox (not spam)

Until verified, emails ship from `Accessly <onboarding@resend.dev>`.

---

## 5. Vercel Cron

`vercel.json` declares `/api/cron/scheduled-scans` daily at midnight UTC.

- [ ] Vercel → Settings → Cron Jobs → confirm the job is listed and enabled
- [ ] `CRON_SECRET` set on Vercel
- [ ] Hobby tier supports daily only; upgrade to Pro for hourly / every_6h cadences

Manual test:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://accessly.us/api/cron/scheduled-scans
# Expect: { "ok": true, "processed": N, "succeeded": N, ... }
```

---

## 6. End-to-end smoke test

Automated: `./scripts/smoke.sh` — 34 checks. Run before every deploy.

```bash
./scripts/smoke.sh                            # against accessly.us
./scripts/smoke.sh https://accessly.us        # explicit
./scripts/smoke.sh https://accessly-gray.vercel.app   # against preview
```

Manual (Live mode, incognito):

1. Landing page renders pricing + hero
2. Free scan from homepage works (URL input → score in ~10s)
3. Signup → email verify → land on `/dashboard`
4. Run a scan from dashboard — succeeds, persists
5. Quota gate fires for Free users on 4th scan in a month
6. **Upgrade to Pro** → Stripe Checkout in **Live mode** with real test card (4242…)
7. Webhook fires `200` in Stripe Dashboard for `checkout.session.completed`
8. Plan flips to Pro in `/dashboard/settings`
9. Buy a scan pack — confirm `pack` metadata in webhook → `scan_count` increments
10. Cancel via Customer Portal → webhook fires `customer.subscription.deleted` → plan drops to free
11. Salesperson onboarding (`/sales`) works if you have a test salesperson row

Fix any failure before flipping the launch switch.

---

## 7. Monitoring

- [ ] Vercel → Logs → "Error" filter pinned
- [ ] Stripe → Webhooks → email alerts for failed deliveries
- [ ] Supabase → daily backups enabled (Pro tier)
- [ ] Resend → bounce + complaint notifications
- [ ] (Optional) Sentry — defer until first 5 paying customers

---

## 8. Marketing / launch comms

- [ ] LinkedIn post drafted (Juan personal + 99 Trees Media if relevant)
- [ ] X/Twitter post
- [ ] Cold outreach: design + dev agencies (they need scanners for client work) — personalized email, not mass
- [ ] First-week support coverage: who's monitoring `contact@accessly.us`

---

## Useful links

- Vercel: https://vercel.com/juanserdiuk/accessly
- Supabase: https://supabase.com/dashboard/project/<accessly-ref>
- Stripe: https://dashboard.stripe.com/ → Accessly account
- Resend: https://resend.com/domains
- GitHub: https://github.com/juanserdiuk/accessly
- Production: https://accessly.us
