GRANT SELECT ON public.designations TO anon;
CREATE POLICY "Anyone can view active designations"
ON public.designations FOR SELECT TO anon USING (is_active = true);