-- =====================================================
-- KILL THE LAST CYCLE: courses <-> course_enrolments
-- Idempotent rewrite using SECURITY DEFINER helpers.
-- =====================================================

CREATE OR REPLACE FUNCTION parent_sees_course(cid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM course_enrolments ce
    JOIN parent_links pl ON pl.student_user_id = ce.user_id
    WHERE ce.course_id = cid
      AND pl.parent_user_id = auth.uid()
      AND pl.status = 'approved'
  )
$$;

DROP POLICY IF EXISTS "Parents view child courses" ON courses;
CREATE POLICY "Parents view child courses" ON courses
  FOR SELECT USING (parent_sees_course(courses.id));

DROP POLICY IF EXISTS "Teachers can manage course enrolments" ON course_enrolments;
CREATE POLICY "Teachers can manage course enrolments" ON course_enrolments
  FOR ALL USING (teaches_course(course_enrolments.course_id))
  WITH CHECK (teaches_course(course_enrolments.course_id));

DROP POLICY IF EXISTS "Teachers can view course enrolments" ON course_enrolments;
CREATE POLICY "Teachers can view course enrolments" ON course_enrolments
  FOR SELECT USING (teaches_course(course_enrolments.course_id));

-- ── Assignments / submissions / grades ───────────────────────────

CREATE OR REPLACE FUNCTION teaches_assignment(aid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.id = aid AND teaches_course(a.course_id)
  )
$$;

DROP POLICY IF EXISTS "Teachers can view own course assignments" ON assignments;
CREATE POLICY "Teachers can view own course assignments" ON assignments
  FOR SELECT USING (teaches_course(assignments.course_id));

DROP POLICY IF EXISTS "Teachers can manage own course assignments" ON assignments;
CREATE POLICY "Teachers can manage own course assignments" ON assignments
  FOR ALL USING (teaches_course(assignments.course_id))
  WITH CHECK (teaches_course(assignments.course_id));

DROP POLICY IF EXISTS "Teachers can view course submissions" ON submissions;
CREATE POLICY "Teachers can view course submissions" ON submissions
  FOR SELECT USING (teaches_assignment(submissions.assignment_id));

DROP POLICY IF EXISTS "Teachers can grade course submissions" ON submissions;
CREATE POLICY "Teachers can grade course submissions" ON submissions
  FOR UPDATE USING (teaches_assignment(submissions.assignment_id))
  WITH CHECK (teaches_assignment(submissions.assignment_id));

DROP POLICY IF EXISTS "Teachers can view course grade entries" ON grade_entries;
CREATE POLICY "Teachers can view course grade entries" ON grade_entries
  FOR SELECT USING (teaches_course(grade_entries.course_id));

DROP POLICY IF EXISTS "Teachers can manage course grade entries" ON grade_entries;
CREATE POLICY "Teachers can manage course grade entries" ON grade_entries
  FOR ALL USING (teaches_course(grade_entries.course_id))
  WITH CHECK (teaches_course(grade_entries.course_id));
