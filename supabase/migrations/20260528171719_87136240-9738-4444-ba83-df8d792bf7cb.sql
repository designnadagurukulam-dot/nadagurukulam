
CREATE TABLE public.periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_number integer NOT NULL UNIQUE,
  label text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.periods TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.periods TO authenticated;
GRANT ALL ON public.periods TO service_role;

ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view periods" ON public.periods FOR SELECT USING (true);
CREATE POLICY "Admins manage periods" ON public.periods FOR ALL TO authenticated
  USING (is_super_or_admin(auth.uid())) WITH CHECK (is_super_or_admin(auth.uid()));

CREATE TRIGGER trg_periods_updated_at BEFORE UPDATE ON public.periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.periods (period_number, label, start_time, end_time, sort_order) VALUES
  (1, '1st Period', '08:00', '08:45', 1),
  (2, '2nd Period', '09:00', '09:45', 2),
  (3, '3rd Period', '09:45', '10:30', 3),
  (4, '4th Period', '10:45', '11:30', 4),
  (5, '5th Period', '11:30', '12:15', 5),
  (6, '6th Period', '13:00', '13:45', 6),
  (7, '7th Period', '13:45', '14:30', 7),
  (8, '8th Period', '14:45', '15:30', 8);

ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS period_id uuid REFERENCES public.periods(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_schedules_period ON public.schedules(period_id);

ALTER TABLE public.class_logs
  ADD COLUMN IF NOT EXISTS lecture_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS theory_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS practical_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remarks text;
