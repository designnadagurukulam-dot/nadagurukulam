CREATE TABLE public.user_qualifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  degree_name text NOT NULL,
  specialization text,
  institution text,
  board_university text,
  year_of_completion integer,
  grade text,
  certificate_url text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_qualifications TO authenticated;
GRANT ALL ON public.user_qualifications TO service_role;

ALTER TABLE public.user_qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own qualifications"
ON public.user_qualifications FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_super_or_admin(auth.uid()));

CREATE POLICY "Users can add their own qualifications"
ON public.user_qualifications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_super_or_admin(auth.uid()));

CREATE POLICY "Users can update their own qualifications"
ON public.user_qualifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.is_super_or_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_super_or_admin(auth.uid()));

CREATE POLICY "Users can delete their own qualifications"
ON public.user_qualifications FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.is_super_or_admin(auth.uid()));

CREATE INDEX idx_user_qualifications_user ON public.user_qualifications(user_id, year_of_completion DESC);

CREATE TRIGGER trg_user_qualifications_updated_at
BEFORE UPDATE ON public.user_qualifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.user_qualifications (user_id, degree_name)
SELECT user_id, qualifications FROM public.profiles
WHERE qualifications IS NOT NULL AND btrim(qualifications) <> '';