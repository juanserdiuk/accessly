-- =============================================================================
-- Stripe webhook idempotency.
--
-- Stripe retries webhook deliveries with exponential backoff for any non-2xx
-- response. Network blips between us and Stripe also trigger retries. Without
-- idempotency tracking, that means duplicate side-effects on every retry:
-- duplicate "💰 New subscription" emails, duplicate Slack pings, etc.
-- (Profile upserts are idempotent on their own, but the *notifications* are not.)
--
-- We store every successfully-processed Stripe event id here. The webhook
-- handler INSERTs the row BEFORE running its side-effects; if INSERT fails with
-- unique_violation, the event was already processed and the handler short-
-- circuits with 200 (telling Stripe "got it, stop retrying").
--
-- TTL: rows are kept indefinitely. At Stripe's typical webhook volume this is
-- ~10s of MB even over years. If size ever becomes a concern, prune rows older
-- than 30 days (Stripe stops retrying long before then).
-- =============================================================================

create table if not exists public.stripe_events (
  id           text primary key,                       -- Stripe event.id (evt_xxx)
  type         text,                                   -- denormalised for debugging
  created_at   timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- No policies = nobody reads through the user-facing API. Service-role
-- (used by the webhook handler) bypasses RLS as expected.

create index if not exists stripe_events_created_at_idx
  on public.stripe_events (created_at desc);
