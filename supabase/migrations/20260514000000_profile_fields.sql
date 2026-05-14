-- =============================================================================
-- Extended profile fields: name, company, avatar, plus avatars storage bucket.
-- Powers the customer profile cards in admin and the rich profile form in
-- /dashboard/settings.
-- =============================================================================

alter table public.profiles
  add column if not exists first_name  text,
  add column if not exists last_name   text,
  add column if not exists company     text,
  add column if not exists avatar_url  text;

-- Backfill first_name / last_name from existing auth user_metadata if we never
-- copied them over.
update public.profiles p
   set first_name = (u.raw_user_meta_data ->> 'first_name')
  from auth.users u
 where p.id = u.id
   and p.first_name is null
   and (u.raw_user_meta_data ->> 'first_name') is not null;

update public.profiles p
   set last_name = (u.raw_user_meta_data ->> 'last_name')
  from auth.users u
 where p.id = u.id
   and p.last_name is null
   and (u.raw_user_meta_data ->> 'last_name') is not null;

-- =============================================================================
-- Avatars storage bucket — public read, authenticated write to own folder.
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow any signed-in user to upload to a folder matching their UID
drop policy if exists "Users upload to their own avatar folder" on storage.objects;
create policy "Users upload to their own avatar folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update their own avatar files" on storage.objects;
create policy "Users update their own avatar files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete their own avatar files" on storage.objects;
create policy "Users delete their own avatar files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatars are publicly readable" on storage.objects;
create policy "Avatars are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');
