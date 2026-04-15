CREATE POLICY "Authenticated users can read roles for staff lookup" ON user_roles
FOR SELECT TO authenticated
USING (true);