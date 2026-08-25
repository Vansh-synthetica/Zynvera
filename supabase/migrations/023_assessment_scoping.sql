-- =====================================================
-- ASSESSMENT SUBMISSIONS: enrolment-scoped access
-- Closes the hole where any student could submit to any
-- quiz by id. Enforces max_attempts at the DB level.
-- =====================================================

-- Helpers (definer, no nested RLS).
CREATE OR REPLACE FUNCTION enrolled_in_assessment(aid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM assessments a
    JOIN course_enrolments ce ON ce.course_id = a.course_id
    WHERE a.id = aid AND ce.user_id = auth.uid() AND ce.status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION teaches_assessment(aid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM assessments a
    WHERE a.id = aid AND teaches_course(a.course_id)
  )
$$;

-- Clean up cross-institution junk from before this fix.
DELETE FROM assessment_submissions s
WHERE NOT EXISTS (
  SELECT 1
  FROM assessments a
  JOIN course_enrolments ce ON ce.course_id = a.course_id
  WHERE a.id = s.assessment_id AND ce.user_id = s.user_id
);

-- ── Policies ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Students can view own assessment submissions" ON assessment_submissions;
CREATE POLICY "Students view own assessment submissions" ON assessment_submissions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can submit assessments" ON assessment_submissions;
CREATE POLICY "Students submit own assessments" ON assessment_submissions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND enrolled_in_assessment(assessment_id)
    AND (
      SELECT max_attempts FROM assessments WHERE id = assessment_id
    ) > (
      SELECT count(*) FROM assessment_submissions s
      WHERE s.assessment_id = assessment_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can view course assessment submissions" ON assessment_submissions;
CREATE POLICY "Teachers view course assessment submissions" ON assessment_submissions
  FOR SELECT USING (teaches_assessment(assessment_submissions.assessment_id));

DROP POLICY IF EXISTS "Teachers can grade assessment submissions" ON assessment_submissions;
CREATE POLICY "Teachers grade assessment submissions" ON assessment_submissions
  FOR UPDATE USING (teaches_assessment(assessment_submissions.assessment_id));

DROP POLICY IF EXISTS "Leadership view assessment submissions" ON assessment_submissions;
CREATE POLICY "Leadership view assessment submissions" ON assessment_submissions
  FOR SELECT USING (is_leadership());

-- ── Questions: enrolment/teaching scoped ─────────────────────────
DROP POLICY IF EXISTS "Students can view assessment questions" ON assessment_questions;
CREATE POLICY "Students can view assessment questions" ON assessment_questions
  FOR SELECT USING (
    enrolled_in_assessment(assessment_questions.assessment_id)
    OR teaches_assessment(assessment_questions.assessment_id)
    OR is_leadership()
  );

DROP POLICY IF EXISTS "Teachers can view own assessment questions" ON assessment_questions;
CREATE POLICY "Teachers can view own assessment questions" ON assessment_questions
  FOR SELECT USING (teaches_assessment(assessment_questions.assessment_id));

DROP POLICY IF EXISTS "Teachers can manage own assessment questions" ON assessment_questions;
CREATE POLICY "Teachers can manage own assessment questions" ON assessment_questions
  FOR ALL USING (teaches_assessment(assessment_questions.assessment_id))
  WITH CHECK (teaches_assessment(assessment_questions.assessment_id));

-- Assessments readable by enrolled students too.
DROP POLICY IF EXISTS "Students can view active assessments" ON assessments;
CREATE POLICY "Students can view active assessments" ON assessments
  FOR SELECT USING (
    enrolled_in_assessment(assessments.id)
    OR teaches_assessment(assessments.id)
    OR is_leadership()
  );

DROP POLICY IF EXISTS "Teachers can view own course assessments" ON assessments;
CREATE POLICY "Teachers can view own course assessments" ON assessments
  FOR SELECT USING (teaches_course(assessments.course_id));

DROP POLICY IF EXISTS "Teachers can manage own course assessments" ON assessments;
CREATE POLICY "Teachers can manage own course assessments" ON assessments
  FOR ALL USING (teaches_course(assessments.course_id))
  WITH CHECK (teaches_course(assessments.course_id));
