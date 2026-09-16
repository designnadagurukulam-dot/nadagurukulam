-- Fix: deleting a batch fails whenever it has curriculum modules, live
-- classes, assignments, or feedback linked to it. Those batch_id foreign
-- keys were created without an ON DELETE action, which defaults to
-- NO ACTION and blocks the delete with a foreign key violation.
--
-- curriculum_modules / live_classes are owned by the batch (same pattern
-- as batch_enrollments and student_grades, which already cascade), so they
-- cascade-delete along with it. assignments / feedback are independent
-- records (assignments belong primarily to a course; feedback is a
-- student's historical submission), so they are preserved and just lose
-- the batch reference.
DO $$
DECLARE
  t record;
  cname text;
BEGIN
  FOR t IN
    SELECT * FROM (VALUES
      ('curriculum_modules', 'CASCADE'),
      ('live_classes', 'CASCADE'),
      ('assignments', 'SET NULL'),
      ('feedback', 'SET NULL')
    ) AS x(table_name, action)
  LOOP
    SELECT con.conname INTO cname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = t.table_name
      AND con.contype = 'f'
      AND con.confrelid = 'public.batches'::regclass
      AND EXISTS (
        SELECT 1 FROM unnest(con.conkey) k
        JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k
        WHERE a.attname = 'batch_id'
      );

    IF cname IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', t.table_name, cname);
    END IF;

    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE %s',
      t.table_name, t.table_name || '_batch_id_fkey', t.action
    );
  END LOOP;
END $$;
