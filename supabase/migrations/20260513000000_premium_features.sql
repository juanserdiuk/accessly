-- =============================================================================
-- Premium features schema: country tracking, contact messages, portfolios,
-- scheduled scans, promo codes / referrals, salespeople, user roles.
-- All tables follow the existing pattern: uuid PKs, RLS on, owner_id FKs,
-- created_at/updated_at timestamps, set_updated_at trigger.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Country on profiles (best-effort geolocation captured at signup)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists country text,
  add column if not exists city    text,
  add column if not exists region  text;

-- ---------------------------------------------------------------------------
-- 2. Contact messages (tracked in admin, in addition to the email blast)
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  website      text,
  message      text not null,
  country      text,
  city         text,
  region       text,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
-- Admin-only (service-role bypasses RLS). No policies = nobody reads by default.

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

-- ---------------------------------------------------------------------------
-- 3. User roles (admin / salesperson / customer)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin', 'salesperson', 'customer');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.user_roles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

create policy "Users can read their own role"
  on public.user_roles for select
  using (auth.uid() = user_id);

create trigger set_user_roles_updated_at
  before update on public.user_roles
  for each row execute procedure public.set_updated_at();

-- Helper function to check role from RLS policies
create or replace function public.current_user_role()
returns public.app_role
language sql
security definer
set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- 4. Salespeople profiles (1099 prep + commission setup)
-- ---------------------------------------------------------------------------
create table if not exists public.salespeople (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique not null references auth.users (id) on delete cascade,
  full_name           text not null,
  email               text not null,
  phone               text,
  address_line1       text,
  address_line2       text,
  city                text,
  region              text,
  postal_code         text,
  country             text,
  commission_percent  numeric(5,2) not null default 10.00,  -- 0-100, two decimals
  avatar_url          text,
  status              text not null default 'active',        -- 'active' | 'inactive'
  notes               text,                                  -- admin-only notes
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.salespeople enable row level security;

create policy "Salespeople can read their own row"
  on public.salespeople for select
  using (auth.uid() = user_id);

create policy "Salespeople can update their own profile (non-financial)"
  on public.salespeople for update
  using (auth.uid() = user_id);

create trigger set_salespeople_updated_at
  before update on public.salespeople
  for each row execute procedure public.set_updated_at();

create index if not exists salespeople_status_idx on public.salespeople (status);

-- ---------------------------------------------------------------------------
-- 5. Promo codes (linked to a salesperson optionally)
-- ---------------------------------------------------------------------------
create table if not exists public.promo_codes (
  id                  uuid primary key default gen_random_uuid(),
  code                text unique not null,                   -- public-facing, e.g. "JUAN5"
  salesperson_id      uuid references public.salespeople (id) on delete set null,
  discount_percent    int not null check (discount_percent between 1 and 100),
  stripe_coupon_id    text not null,                          -- pre-created in Stripe
  max_uses            int,                                    -- null = unlimited
  uses_count          int not null default 0,
  expires_at          timestamptz,                            -- null = never
  status              text not null default 'active',         -- 'active' | 'disabled'
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.promo_codes enable row level security;
create trigger set_promo_codes_updated_at
  before update on public.promo_codes
  for each row execute procedure public.set_updated_at();

create policy "Salespeople can read their own codes"
  on public.promo_codes for select
  using (
    salesperson_id in (
      select id from public.salespeople where user_id = auth.uid()
    )
  );

create index if not exists promo_codes_salesperson_idx
  on public.promo_codes (salesperson_id);

-- ---------------------------------------------------------------------------
-- 6. Promo redemptions (one row per successful checkout w/ code)
-- ---------------------------------------------------------------------------
create table if not exists public.promo_redemptions (
  id                  uuid primary key default gen_random_uuid(),
  code_id             uuid not null references public.promo_codes (id) on delete restrict,
  salesperson_id      uuid references public.salespeople (id) on delete set null,
  user_id             uuid references auth.users (id) on delete set null,
  customer_email      text not null,
  amount_cents        int not null,
  currency            text not null default 'usd',
  plan                text not null,
  product_type        text not null,                            -- 'subscription' | 'pack'
  stripe_session_id   text not null unique,
  commission_cents    int not null default 0,                   -- snapshot at time of sale
  payout_status       text not null default 'unpaid',           -- 'unpaid' | 'paid'
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);

alter table public.promo_redemptions enable row level security;

create policy "Salespeople can read their own redemptions"
  on public.promo_redemptions for select
  using (
    salesperson_id in (
      select id from public.salespeople where user_id = auth.uid()
    )
  );

create index if not exists promo_redemptions_salesperson_idx
  on public.promo_redemptions (salesperson_id);
create index if not exists promo_redemptions_created_at_idx
  on public.promo_redemptions (created_at desc);
create index if not exists promo_redemptions_payout_status_idx
  on public.promo_redemptions (payout_status);

-- ---------------------------------------------------------------------------
-- 7. Portfolios — groups of sites that pro/agency users organize per client
-- ---------------------------------------------------------------------------
create table if not exists public.portfolios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  color       text not null default '#34d399',  -- chip color
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.portfolios enable row level security;

create policy "Users can manage their own portfolios"
  on public.portfolios for all
  using (auth.uid() = user_id);

create trigger set_portfolios_updated_at
  before update on public.portfolios
  for each row execute procedure public.set_updated_at();

create index if not exists portfolios_user_id_idx on public.portfolios (user_id);

-- Link sites to portfolios (a site can be in one portfolio, nullable)
alter table public.sites
  add column if not exists portfolio_id uuid references public.portfolios (id) on delete set null;

create index if not exists sites_portfolio_id_idx on public.sites (portfolio_id);

-- ---------------------------------------------------------------------------
-- 8. Scheduled scans — cadence per site
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.scan_cadence as enum ('hourly', 'every_6h', 'daily', 'weekly');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.scheduled_scans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  site_id       uuid references public.sites (id) on delete cascade,
  url           text not null,
  cadence       public.scan_cadence not null default 'daily',
  next_run_at   timestamptz not null default now(),
  last_run_at   timestamptz,
  last_score    int,
  last_status   text,                                          -- 'success' | 'failed'
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.scheduled_scans enable row level security;

create policy "Users can manage their own scheduled scans"
  on public.scheduled_scans for all
  using (auth.uid() = user_id);

create trigger set_scheduled_scans_updated_at
  before update on public.scheduled_scans
  for each row execute procedure public.set_updated_at();

create index if not exists scheduled_scans_next_run_idx
  on public.scheduled_scans (next_run_at) where active = true;
create index if not exists scheduled_scans_user_id_idx
  on public.scheduled_scans (user_id);
