-- =====================================================
-- FIX POLICY RECURSION
-- Cross-referencing policies (courses <-> course_enrolments)
-- caused infinite recursion. All checks now route through
-- SECURITY DEFINER helpers that bypass RLS internally.
-- =====================================================

CREATE OR REPLACE FUNCTION is_leadership()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('principal', 'admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION is_parent_of(student uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM parent_links
    WHERE parent_user_id = auth.uid()
      AND student_user_id = student
      AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION teaches_course(cid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM courses
    WHERE id = cid AND teacher_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION enrolled_in(cid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM course_enrolments
    WHERE course_id = cid AND user_id = auth.uid() AND status = 'active'
  );
$$;

-- ── Rebuild the cycling policies ─────────────────────────────────

DROP POLICY IF EXISTS "Leadership view institution courses" ON courses;
CREATE POLICY "Leadership view institution courses" ON courses
  FOR SELECT USING (is_leadership());

DROP POLICY IF EXISTS "Parents view child courses" ON courses;
CREATE POLICY "Parents view child courses" ON courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM course_enrolments ce
      WHERE ce.course_id = courses.id AND is_parent_of(ce.user_id)
    )
  );

DROP POLICY IF EXISTS "Leadership view enrolments" ON course_enrolments;
CREATE POLICY "Leadership view enrolments" ON course_enrolments
  FOR SELECT USING (is_leadership());

DROP POLICY IF EXISTS "Parents view child enrolments" ON course_enrolments;
CREATE POLICY "Parents view child enrolments" ON course_enrolments
  FOR SELECT USING (is_parent_of(course_enrolments.user_id));

-- Grade/attendance/submission parent policies also switch to helpers
-- so nothing under them can recurse through users RLS.

DROP POLICY IF EXISTS "Parents view child grades" ON grade_entries;
CREATE POLICY "Parents view child grades" ON grade_entries
  FOR SELECT USING (is_parent_of(grade_entries.user_id));

DROP POLICY IF EXISTS "Parents view child attendance" ON attendance_records;
CREATE POLICY "Parents view child attendance" ON attendance_records
  FOR SELECT USING (is_parent_of(attendance_records.user_id));

DROP POLICY IF EXISTS "Parents view child submissions" ON submissions;
CREATE POLICY "Parents view child submissions" ON submissions
  FOR SELECT USING (is_parent_of(submissions.user_id));

DROP POLICY IF EXISTS "Parents view assignments of child work" ON assignments;
CREATE POLICY "Parents view assignments of child work" ON assignments
  FOR SELECT USING (
    status IN ('published', 'active', 'graded', 'returned')
    OR EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.assignment_id = assignments.id AND is_parent_of(s.user_id)
    )
  );

DROP POLICY IF EXISTS "Leadership view assignments" ON assignments;
CREATE POLICY "Leadership view assignments" ON assignments
  FOR SELECT USING (is_leadership());

DROP POLICY IF EXISTS "Leadership view submissions" ON submissions;
CREATE POLICY "Leadership view submissions" ON submissions
  FOR SELECT USING (is_leadership());

DROP POLICY IF EXISTS "Leadership view grade entries" ON grade_entries;
CREATE POLICY "Leadership view grade entries" ON grade_entries
  FOR SELECT USING (is_leadership());

DROP POLICY IF EXISTS "Leadership view attendance" ON attendance_records;
CREATE POLICY "Leadership view attendance" ON attendance_records
  FOR SELECT USING (is_leadership());

DROP POLICY IF EXISTS "Leadership view class sections" ON class_sections;
CREATE POLICY "Leadership view class sections" ON class_sections
  FOR SELECT USING (is_leadership());

DROP POLICY IF EXISTS "Leadership view assessments" ON assessments;
CREATE POLICY "Leadership view assessments" ON assessments
  FOR SELECT USING (is_leadership());

DROP POLICY IF EXISTS "Leadership view assessment submissions" ON assessment_submissions;
CREATE POLICY "Leadership view assessment submissions" ON assessment_submissions
  FOR SELECT USING (is_leadership());

DROP POLICY IF EXISTS "Leadership view discussions" ON discussions;
CREATE POLICY "Leadership view discussions" ON discussions
  FOR SELECT USING (is_leadership());

DROP POLICY IF EXISTS "Leadership view replies" ON discussion_replies;
CREATE POLICY "Leadership view replies" ON discussion_replies
  FOR SELECT USING (is_leadership());
