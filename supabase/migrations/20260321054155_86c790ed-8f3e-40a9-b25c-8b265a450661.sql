
-- Job postings table
CREATE TABLE public.job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT,
  location TEXT DEFAULT 'Muddenahalli, Karnataka',
  type TEXT DEFAULT 'full-time',
  description TEXT,
  requirements TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Volunteer applications table
CREATE TABLE public.volunteer_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  area_of_interest TEXT,
  availability TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS for job_postings
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active jobs" ON public.job_postings
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert jobs" ON public.job_postings
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update jobs" ON public.job_postings
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete jobs" ON public.job_postings
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for volunteer_applications
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit volunteer application" ON public.volunteer_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view volunteer applications" ON public.volunteer_applications
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update volunteer applications" ON public.volunteer_applications
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete volunteer applications" ON public.volunteer_applications
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_volunteer_applications_updated_at BEFORE UPDATE ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
