CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 80),
  avatar_path text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY "Students create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()) AND (avatar_path IS NULL OR avatar_path LIKE id::text || '/%'));
CREATE POLICY "Students update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()) AND (avatar_path IS NULL OR avatar_path LIKE id::text || '/%'));

CREATE TABLE public.student_workspaces (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND data->>'version' = '1'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.student_workspaces TO authenticated;
GRANT ALL ON public.student_workspaces TO service_role;
ALTER TABLE public.student_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own workspace" ON public.student_workspaces FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Students create own workspace" ON public.student_workspaces FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Students update own workspace" ON public.student_workspaces FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

CREATE FUNCTION public.create_student_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, display_name)
  VALUES (NEW.id, left(coalesce(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', ''), 80))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_student_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER create_student_profile_on_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_student_profile();
INSERT INTO public.profiles(id, display_name) SELECT id, left(coalesce(raw_user_meta_data->>'display_name', raw_user_meta_data->>'full_name', ''), 80) FROM auth.users ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Students read own avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'student-avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "Students upload own avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'student-avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "Students delete own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'student-avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);