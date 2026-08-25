-- Staff may read notifications within their institution.
-- Needed because INSERT ... RETURNING requires SELECT on the new row
-- (teachers sending absence/grade alerts via the API).
DROP POLICY IF EXISTS "Staff view institution notifications" ON notifications;
CREATE POLICY "Staff view institution notifications" ON notifications
  FOR SELECT USING (
    get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin')
  );
