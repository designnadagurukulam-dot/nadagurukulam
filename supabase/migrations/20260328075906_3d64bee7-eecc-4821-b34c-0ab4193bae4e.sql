
CREATE TABLE public.curriculum_section_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.curriculum_sections(id) ON DELETE CASCADE,
  url text NOT NULL,
  label text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.curriculum_section_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view section links"
  ON public.curriculum_section_links FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and instructors can insert section links"
  ON public.curriculum_section_links FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructor'::app_role)
  );

CREATE POLICY "Admins and instructors can update section links"
  ON public.curriculum_section_links FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructor'::app_role)
  );

CREATE POLICY "Admins and instructors can delete section links"
  ON public.curriculum_section_links FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructor'::app_role)
  );
