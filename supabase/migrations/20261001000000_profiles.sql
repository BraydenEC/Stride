-- Profiles: one row per auth user.
-- `plan` / `entitlement` exist from day one so paid features can be switched
-- on later (RevenueCat webhooks will write `entitlement`) without restructuring.
-- During the free phase everyone is 'free' with full access.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'founding', 'pro')),
  entitlement text not null default 'all_access',
  units text not null default 'mi' check (units in ('mi', 'km')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- Users may change their own preferences, but not plan/entitlement
-- (column-level grant below). Those are only written server-side.
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke update on public.profiles from authenticated;
grant update (units) on public.profiles to authenticated;

-- Create the profile automatically when someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
