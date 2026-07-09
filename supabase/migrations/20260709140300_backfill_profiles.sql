CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));

INSERT INTO public.profiles (id, email)
SELECT u.id, u.email
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);
