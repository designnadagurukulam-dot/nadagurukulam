-- Update courses table with LMS fields
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS instructor_id uuid,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS price numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS preview_video_url text;

-- Allow instructors to insert their own courses
CREATE POLICY "Instructors can insert own courses" ON public.courses
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'instructor') AND instructor_id = auth.uid()
  );

-- Allow instructors to update their own courses
CREATE POLICY "Instructors can update own courses" ON public.courses
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'instructor') AND instructor_id = auth.uid()
  );
