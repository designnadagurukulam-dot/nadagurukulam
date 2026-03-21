
-- Create a sequence for enrollment IDs
CREATE SEQUENCE IF NOT EXISTS public.enrollment_id_seq START WITH 1;

-- Add enrollment_id column to profiles
ALTER TABLE public.profiles ADD COLUMN enrollment_id text UNIQUE;

-- Create function to generate enrollment ID
CREATE OR REPLACE FUNCTION public.generate_enrollment_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  seq_val integer;
  year_part text;
BEGIN
  -- Only generate for students (check user_roles or default)
  seq_val := nextval('public.enrollment_id_seq');
  year_part := to_char(now(), 'YYYY');
  NEW.enrollment_id := 'NG-' || year_part || '-' || lpad(seq_val::text, 5, '0');
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate enrollment_id on profile insert
CREATE TRIGGER set_enrollment_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.enrollment_id IS NULL)
  EXECUTE FUNCTION public.generate_enrollment_id();
