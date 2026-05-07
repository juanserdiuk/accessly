create table if not exists public.scans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade,
  url        text not null,
  score      integer not null,
  errors     integer not null default 0,
  warnings   integer not null default 0,
  passes     integer not null default 0,
  violations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.scans enable row level security;

create policy "Users can read own scans"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "Users can insert own scans"
  on public.scans for insert
  with check (auth.uid() = user_id);

create index scans_user_id_created_at_idx on public.scans (user_id, created_at desc);
