CREATE SCHEMA IF NOT EXISTS auth;

SET check_function_bodies = false;

CREATE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$function$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE public.analytics_daily (site_id uuid NOT NULL, day text NOT NULL, path text NOT NULL, status integer NOT NULL, country text DEFAULT 'unknown'::text NOT NULL, referrer_host text DEFAULT 'direct'::text NOT NULL, views integer DEFAULT 0 NOT NULL);

ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.analytics_daily ADD CONSTRAINT analytics_daily_pkey PRIMARY KEY (site_id, day, path, status, country, referrer_host);

CREATE TABLE public.deployments (id uuid DEFAULT gen_random_uuid() NOT NULL, site_id uuid NOT NULL, worker_id text NOT NULL, asset_count integer NOT NULL, total_bytes integer NOT NULL, manifest_json text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);

ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.deployments ADD CONSTRAINT deployments_pkey PRIMARY KEY (id);

ALTER TABLE public.deployments ADD CONSTRAINT deployments_worker_id_key UNIQUE (worker_id);

CREATE TABLE public.profiles (id uuid NOT NULL, email text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

CREATE POLICY "profiles read own" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));

CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

CREATE TABLE public.sites (id uuid DEFAULT gen_random_uuid() NOT NULL, owner_id uuid NOT NULL, slug text NOT NULL, name text NOT NULL, access_mode text DEFAULT 'public'::text NOT NULL, password_hash text, password_salt text, expires_at timestamp with time zone, disabled_at timestamp with time zone, active_deployment_id uuid, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);

CREATE POLICY "analytics read own" ON public.analytics_daily FOR SELECT TO authenticated USING ((site_id IN ( SELECT sites.id
   FROM sites
  WHERE (sites.owner_id = auth.uid()))));

CREATE POLICY "deployments read own" ON public.deployments FOR SELECT TO authenticated USING ((site_id IN ( SELECT sites.id
   FROM sites
  WHERE (sites.owner_id = auth.uid()))));

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sites ADD CONSTRAINT sites_access_mode_check CHECK (access_mode = ANY (ARRAY['public'::text, 'password'::text]));

ALTER TABLE public.sites ADD CONSTRAINT sites_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public.sites ADD CONSTRAINT sites_pkey PRIMARY KEY (id);

ALTER TABLE public.analytics_daily ADD CONSTRAINT analytics_daily_site_id_fkey FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE;

ALTER TABLE public.deployments ADD CONSTRAINT deployments_site_id_fkey FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE;

ALTER TABLE public.sites ADD CONSTRAINT sites_slug_key UNIQUE (slug);

CREATE POLICY "sites delete own" ON public.sites FOR DELETE TO authenticated USING ((auth.uid() = owner_id));

CREATE POLICY "sites insert own" ON public.sites FOR INSERT TO authenticated WITH CHECK ((auth.uid() = owner_id));

CREATE POLICY "sites read own" ON public.sites FOR SELECT TO authenticated USING ((auth.uid() = owner_id));

CREATE POLICY "sites update own" ON public.sites FOR UPDATE TO authenticated USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));
