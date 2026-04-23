CREATE OR REPLACE FUNCTION public.prevent_last_super_admin_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  super_admin_count integer;
  actor_is_super_admin boolean;
BEGIN
  SELECT count(*) INTO super_admin_count
  FROM public.user_roles
  WHERE role = 'super_admin';

  actor_is_super_admin := public.has_role(auth.uid(), 'super_admin');

  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'super_admin' THEN
      IF super_admin_count <= 1 THEN
        RAISE EXCEPTION 'Cannot remove the final Super Admin account';
      END IF;

      IF auth.uid() IS NOT NULL AND NOT actor_is_super_admin THEN
        RAISE EXCEPTION 'Only a Super Admin can remove a Super Admin role';
      END IF;
    END IF;

    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'super_admin' AND NEW.role <> 'super_admin' THEN
      IF super_admin_count <= 1 THEN
        RAISE EXCEPTION 'Cannot demote the final Super Admin account';
      END IF;

      IF auth.uid() IS NOT NULL AND NOT actor_is_super_admin THEN
        RAISE EXCEPTION 'Only a Super Admin can change a Super Admin role';
      END IF;
    END IF;

    IF NEW.role IN ('admin', 'super_admin') AND auth.uid() IS NOT NULL AND NOT actor_is_super_admin THEN
      RAISE EXCEPTION 'Only a Super Admin can assign protected roles';
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role IN ('admin', 'super_admin') AND auth.uid() IS NOT NULL AND NOT actor_is_super_admin THEN
      RAISE EXCEPTION 'Only a Super Admin can assign protected roles';
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS guard_last_super_admin_role ON public.user_roles;
CREATE TRIGGER guard_last_super_admin_role
BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_last_super_admin_change();

DROP POLICY IF EXISTS "Admins can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage non-protected user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_super_or_admin(auth.uid()));

CREATE POLICY "Super admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage non-protected user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') AND role IN ('student', 'instructor'))
WITH CHECK (public.has_role(auth.uid(), 'admin') AND role IN ('student', 'instructor'));