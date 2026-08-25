-- Fix: leadership policies lost institution scoping in migration 012.
-- Add institution checks to prevent cross-tenant data leakage.

-- Helper: get the institution_id for the current user's courses/enrolments.
CREATE OR REPLACE FUNCTION get_user_institution_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT institution_id FROM users WHERE id = auth.uid() LIMIT 1
$$;

-- Helper: check if a course belongs to the user's institution.
CREATE OR REPLACE FUNCTION course_in_user_institution(cid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM courses WHERE id = cid AND institution_id = get_user_institution_id()
  )
$$;

-- Fix all leadership SELECT policies to include institution scoping.

-- course_enrolments
DROP POLICY IF EXISTS "Leadership view enrolments" ON course_enrolments;
CREATE POLICY "Leadership view enrolments" ON course_enrolments
  FOR SELECT USING (is_leadership() AND course_in_user_institution(course_id));

-- class_sections
DROP POLICY IF EXISTS "Leadership view class sections" ON class_sections;
CREATE POLICY "Leadership view class sections" ON class_sections
  FOR SELECT USING (is_leadership() AND course_in_user_institution(course_id));

-- assignments
DROP POLICY IF EXISTS "Leadership view assignments" ON assignments;
CREATE POLICY "Leadership view assignments" ON assignments
  FOR SELECT USING (is_leadership() AND course_in_user_institution(course_id));

-- submissions
DROP POLICY IF EXISTS "Leadership view submissions" ON submissions;
CREATE POLICY "Leadership view submissions" ON submissions
  FOR SELECT USING (is_leadership() AND EXISTS (
    SELECT 1 FROM assignments a WHERE a.id = submissions.assignment_id AND course_in_user_institution(a.course_id)
  ));

-- grade_entries
DROP POLICY IF EXISTS "Leadership view grade entries" ON grade_entries;
CREATE POLICY "Leadership view grade entries" ON grade_entries
  FOR SELECT USING (is_leadership() AND course_in_user_institution(course_id));

-- attendance_records
DROP POLICY IF EXISTS "Leadership view attendance" ON attendance_records;
CREATE POLICY "Leadership view attendance" ON attendance_records
  FOR SELECT USING (is_leadership() AND EXISTS (
    SELECT 1 FROM class_sections cs WHERE cs.id = attendance_records.class_section_id AND course_in_user_institution(cs.course_id)
  ));

-- assessments
DROP POLICY IF EXISTS "Leadership view assessments" ON assessments;
CREATE POLICY "Leadership view assessments" ON assessments
  FOR SELECT USING (is_leadership() AND course_in_user_institution(course_id));

-- assessment_submissions
DROP POLICY IF EXISTS "Leadership view assessment submissions" ON assessment_submissions;
CREATE POLICY "Leadership view assessment submissions" ON assessment_submissions
  FOR SELECT USING (is_leadership() AND EXISTS (
    SELECT 1 FROM assessments a WHERE a.id = assessment_submissions.assessment_id AND course_in_user_institution(a.course_id)
  ));

-- discussions
DROP POLICY IF EXISTS "Leadership view discussions" ON discussions;
CREATE POLICY "Leadership view discussions" ON discussions
  FOR SELECT USING (is_leadership() AND course_in_user_institution(course_id));

-- discussion_replies
DROP POLICY IF EXISTS "Leadership view replies" ON discussion_replies;
CREATE POLICY "Leadership view replies" ON discussion_replies
  FOR SELECT USING (is_leadership() AND EXISTS (
    SELECT 1 FROM discussions d WHERE d.id = discussion_replies.discussion_id AND course_in_user_institution(d.course_id)
  ));

-- Also fix: staff notifications should be institution-scoped.
DROP POLICY IF EXISTS "Staff view institution notifications" ON notifications;
CREATE POLICY "Staff view institution notifications" ON notifications
  FOR SELECT USING (
    get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin')
    AND (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = notifications.user_id AND u.institution_id = get_user_institution_id()
    ))
  );
