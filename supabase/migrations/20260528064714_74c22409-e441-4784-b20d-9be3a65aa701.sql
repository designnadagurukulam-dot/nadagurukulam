
-- 1. Profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS blood_group text,
  ADD COLUMN IF NOT EXISTS father_name text,
  ADD COLUMN IF NOT EXISTS father_occupation text,
  ADD COLUMN IF NOT EXISTS father_email text,
  ADD COLUMN IF NOT EXISTS father_phone text,
  ADD COLUMN IF NOT EXISTS mother_name text,
  ADD COLUMN IF NOT EXISTS mother_occupation text,
  ADD COLUMN IF NOT EXISTS mother_email text,
  ADD COLUMN IF NOT EXISTS mother_phone text,
  ADD COLUMN IF NOT EXISTS family_notes text,
  ADD COLUMN IF NOT EXISTS aadhar_number text,
  ADD COLUMN IF NOT EXISTS pan_number text,
  ADD COLUMN IF NOT EXISTS passport_number text,
  ADD COLUMN IF NOT EXISTS instructor_type text;

-- Backfill emails from auth.users for existing rows
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;

-- 2. Update handle_new_user trigger to capture email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role app_role;
BEGIN
  _role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'student'
  );

  INSERT INTO public.profiles (user_id, display_name, email, is_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE WHEN _role IN ('super_admin', 'admin') THEN true ELSE false END
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- 3. Profile change requests
CREATE TABLE IF NOT EXISTS public.profile_change_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  requested_changes jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_change_requests TO authenticated;
GRANT ALL ON public.profile_change_requests TO service_role;

ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own change requests"
  ON public.profile_change_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Users view own change requests"
  ON public.profile_change_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_super_or_admin(auth.uid()));

CREATE POLICY "Admins update change requests"
  ON public.profile_change_requests FOR UPDATE
  TO authenticated
  USING (public.is_super_or_admin(auth.uid()));

CREATE POLICY "Admins delete change requests"
  ON public.profile_change_requests FOR DELETE
  TO authenticated
  USING (public.is_super_or_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_pcr_status ON public.profile_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_pcr_user ON public.profile_change_requests(user_id);
