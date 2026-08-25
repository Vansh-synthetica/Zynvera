-- =====================================================
-- REVIEW FIXES
-- 1. Teachers can look up students in their institution
--    (roster "Add Student" search was blocked by RLS).
-- 2. Course creation now requires a staff role - closes the
--    hole where any user could self-assign as teacher.
-- =====================================================

-- 1. Institution directory visibility for staff (read-only).
DROP POLICY IF EXISTS "Staff view institution members" ON users;
CREATE POLICY "Staff view institution members" ON users
  FOR SELECT USING (
    institution_id = get_user_institution()
    AND get_user_role() IN (
      'teacher', 'principal', 'admin', 'super_admin',
      'department_head', 'counselor'
    )
  );

-- 2. Course ownership requires a staff role.
DROP POLICY IF EXISTS "Teachers can manage own courses" ON courses;
CREATE POLICY "Teachers manage own courses" ON courses
  FOR ALL USING (
    teaches_course(courses.id)
    OR (
      teacher_id = auth.uid()
      AND get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin')
    )
  )
  WITH CHECK (
    teacher_id = auth.uid()
    AND get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin')
  );
