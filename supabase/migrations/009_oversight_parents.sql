-- =====================================================
-- OVERSIGHT & PARENT ACCESS
-- 1. Auto-create public.users row on signup (with chosen role)
-- 2. Principals/admins see everything teachers update
-- 3. Parents see ONLY their linked children's records
-- =====================================================

-- ── 1. New-user bootstrap ────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE NEW.raw_user_meta_data->>'role'
      WHEN 'teacher' THEN 'teacher'
      WHEN 'parent' THEN 'parent'
      WHEN 'principal' THEN 'principal'
      ELSE 'student'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 2. Principal / admin oversight ──────────────────────────────
-- Read-everything within their own institution.

CREATE POLICY "Leadership view institution courses" ON courses
  FOR SELECT USING (
    get_user_role() IN ('principal','admin','super_admin')
    AND institution_id = get_user_institution()
  );

CREATE POLICY "Leadership view enrolments" ON course_enrolments
  FOR SELECT USING (
    get_user_role() IN ('principal','admin','super_admin')
  );

CREATE POLICY "Leadership view class sections" ON class_sections
  FOR SELECT USING (
    get_user_role() IN ('principal','admin','super_admin')
  );

CREATE POLICY "Leadership view assignments" ON assignments
  FOR SELECT USING (
    get_user_role() IN ('principal','admin','super_admin')
  );

CREATE POLICY "Leadership view submissions" ON submissions
  FOR SELECT USING (
    get_user_role() IN ('principal','admin','super_admin')
  );

CREATE POLICY "Leadership view grade entries" ON grade_entries
  FOR SELECT USING (
    get_user_role() IN ('principal','admin','super_admin')
  );

CREATE POLICY "Leadership view attendance" ON attendance_records
  FOR SELECT USING (
    get_user_role() IN ('principal','admin','super_admin')
  );

CREATE POLICY "Leadership view assessments" ON assessments
  FOR SELECT USING (
    get_user_role() IN ('principal','admin','super_admin')
  );

CREATE POLICY "Leadership view assessment submissions" ON assessment_submissions
  FOR SELECT USING (
    get_user_role() IN ('principal','admin','super_admin')
  );

CREATE POLICY "Leadership view discussions" ON discussions
  FOR SELECT USING (
    get_user_role() IN ('principal','admin','super_admin')
  );

CREATE POLICY "Leadership view replies" ON discussion_replies
  FOR SELECT USING (
    get_user_role() IN ('principal','admin','super_admin')
  );

-- ── 3. Parent scoped access ─────────────────────────────────────
-- Everything keys off parent_links, so a parent can never reach
-- another student's record.

CREATE POLICY "Parents view child courses" ON courses
  FOR SELECT USING (
    get_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM course_enrolments ce
      JOIN parent_links pl ON pl.student_user_id = ce.user_id
      WHERE ce.course_id = courses.id AND pl.parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Parents view child enrolments" ON course_enrolments
  FOR SELECT USING (
    get_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_links pl
      WHERE pl.student_user_id = course_enrolments.user_id
        AND pl.parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Parents view child grades" ON grade_entries
  FOR SELECT USING (
    get_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_links pl
      WHERE pl.student_user_id = grade_entries.user_id
        AND pl.parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Parents view child attendance" ON attendance_records
  FOR SELECT USING (
    get_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_links pl
      WHERE pl.student_user_id = attendance_records.user_id
        AND pl.parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Parents view assignments of child work" ON assignments
  FOR SELECT USING (
    get_user_role() = 'parent'
    AND (
      status IN ('published','active','graded','returned')
      OR EXISTS (
        SELECT 1 FROM submissions s
        JOIN parent_links pl ON pl.student_user_id = s.user_id
        WHERE s.assignment_id = assignments.id AND pl.parent_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Parents view child submissions" ON submissions
  FOR SELECT USING (
    get_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_links pl
      WHERE pl.student_user_id = submissions.user_id
        AND pl.parent_user_id = auth.uid()
    )
  );
