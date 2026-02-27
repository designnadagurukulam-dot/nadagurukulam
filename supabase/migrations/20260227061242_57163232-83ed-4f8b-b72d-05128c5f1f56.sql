
-- Create program_inquiries table for storing course/program inquiries
CREATE TABLE public.program_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_slug TEXT NOT NULL,
  program_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.program_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an inquiry (public form)
CREATE POLICY "Anyone can submit inquiry"
  ON public.program_inquiries FOR INSERT
  WITH CHECK (true);

-- Only admins can view all inquiries
CREATE POLICY "Admins can view all inquiries"
  ON public.program_inquiries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update inquiries (change status)
CREATE POLICY "Admins can update inquiries"
  ON public.program_inquiries FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete inquiries
CREATE POLICY "Admins can delete inquiries"
  ON public.program_inquiries FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_program_inquiries_updated_at
  BEFORE UPDATE ON public.program_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
