create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create or replace function handle_new_user() returns trigger language plpgsql as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  slug text not null unique,
  name text not null,
  access_mode text not null default 'public' check (access_mode in ('public', 'password')),
  password_hash text,
  password_salt text,
  expires_at timestamptz,
  disabled_at timestamptz,
  asset_count integer,
  total_bytes integer,
  manifest_json text,
  deployed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists analytics_daily (
  site_id uuid not null references sites(id) on delete cascade,
  day text not null,
  path text not null,
  status integer not null,
  country text not null default 'unknown',
  referrer_host text not null default 'direct',
  views integer not null default 0,
  primary key (site_id, day, path, status, country, referrer_host)
);

alter table profiles enable row level security;
alter table sites enable row level security;
alter table analytics_daily enable row level security;

create policy "profiles read own" on profiles for select to authenticated using (auth.uid() = id);
create policy "profiles insert own" on profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles update own" on profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "sites read own" on sites for select to authenticated using (auth.uid() = owner_id);
create policy "sites insert own" on sites for insert to authenticated with check (auth.uid() = owner_id);
create policy "sites update own" on sites for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "sites delete own" on sites for delete to authenticated using (auth.uid() = owner_id);

create policy "analytics read own" on analytics_daily for select to authenticated using (
  site_id in (select id from sites where owner_id = auth.uid())
);

-- supalite's SQLite backend does not grant service_role BYPASSRLS the way
-- Postgres does. The worker uses the service client for privileged, non-owner
-- operations (public/password serving, deploy, delete, analytics writes), so
-- grant service_role explicit full access to mirror BYPASSRLS.
create policy "profiles service" on profiles for all to service_role using (true) with check (true);
create policy "sites service" on sites for all to service_role using (true) with check (true);
create policy "analytics service" on analytics_daily for all to service_role using (true) with check (true);
