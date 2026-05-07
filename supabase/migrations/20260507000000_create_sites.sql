create table if not exists public.sites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  url        text not null,
  created_at timestamptz not null default now(),
  unique(user_id, url)
);

alter table public.sites enable row level security;

create policy "Users can read own sites"
  on public.sites for select
  using (auth.uid() = user_id);

create policy "Users can insert own sites"
  on public.sites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own sites"
  on public.sites for delete
  using (auth.uid() = user_id);

create index if not exists sites_user_id_idx on public.sites(user_id);
