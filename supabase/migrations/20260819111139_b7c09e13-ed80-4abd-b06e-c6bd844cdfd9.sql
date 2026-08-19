CREATE TABLE public.designations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.designations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.designations TO authenticated;
GRANT ALL ON public.designations TO service_role;

ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view designations"
ON public.designations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert designations"
ON public.designations FOR INSERT TO authenticated
WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE POLICY "Admins can update designations"
ON public.designations FOR UPDATE TO authenticated
USING (public.is_super_or_admin(auth.uid()))
WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE POLICY "Admins can delete designations"
ON public.designations FOR DELETE TO authenticated
USING (public.is_super_or_admin(auth.uid()));

CREATE TRIGGER trg_designations_updated_at
BEFORE UPDATE ON public.designations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.designations (name, slug, sort_order) VALUES
  ('Principal', 'principal', 10),
  ('Vice Principal', 'vice_principal', 20),
  ('Head of Department', 'head_of_department', 30),
  ('Professor', 'professor', 40),
  ('Associate Professor', 'associate_professor', 50),
  ('Assistant Professor', 'assistant_professor', 60),
  ('Lecturer', 'lecturer', 70),
  ('Senior Faculty', 'senior_faculty', 80),
  ('Guest Faculty', 'guest_faculty', 90),
  ('Lecture Demonstrator', 'lecture_demonstrator', 100),
  ('Accompanist', 'accompanist', 110),
  ('Librarian', 'librarian', 120),
  ('Office Staff', 'office_staff', 130),
  ('Accountant', 'accountant', 140);