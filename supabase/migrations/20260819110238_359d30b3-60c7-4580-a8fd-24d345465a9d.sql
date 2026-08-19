CREATE TABLE public.faculty_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX faculty_types_name_lower_idx ON public.faculty_types (lower(name));

GRANT SELECT ON public.faculty_types TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.faculty_types TO authenticated;
GRANT ALL ON public.faculty_types TO service_role;

ALTER TABLE public.faculty_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view faculty types"
ON public.faculty_types FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert faculty types"
ON public.faculty_types FOR INSERT TO authenticated WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE POLICY "Admins can update faculty types"
ON public.faculty_types FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid())) WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE POLICY "Admins can delete faculty types"
ON public.faculty_types FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()));

CREATE TRIGGER trg_faculty_types_updated_at BEFORE UPDATE ON public.faculty_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.faculty_types (name, slug, sort_order) VALUES
  ('Regular Staff', 'regular', 1),
  ('Guest Faculty', 'guest', 2),
  ('Lecture Demonstrator', 'lec_dem', 3),
  ('Honorarium Faculty', 'honorarium', 4),
  ('Visiting Faculty', 'visiting', 5);