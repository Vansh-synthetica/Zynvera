-- Fix: the correlated subquery in "Students submit own assessments" has an ambiguous
-- assessment_id reference. Inside the subquery, bare `assessment_id` resolves to
-- s.assessment_id (always true), counting ALL submissions by the user across ALL
-- quizzes instead of just the target quiz. Fix: move logic into a definer function
-- with explicit parameters.

-- 1. Create a helper that does the full insert-check as definer (no ambiguity).
CREATE OR REPLACE FUNCTION can_submit_assessment(p_assessment_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT
    -- Must be enrolled
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN course_enrolments ce ON ce.course_id = a.course_id
      WHERE a.id = p_assessment_id AND ce.user_id = p_user_id AND ce.status = 'active'
    )
    AND
    -- Must have attempts remaining
    (SELECT max_attempts FROM assessments WHERE id = p_assessment_id)
    >
    (SELECT count(*) FROM assessment_submissions
     WHERE assessment_id = p_assessment_id AND user_id = p_user_id)
$$;

-- 2. Replace the broken policy.
DROP POLICY IF EXISTS "Students submit own assessments" ON assessment_submissions;
CREATE POLICY "Students submit own assessments" ON assessment_submissions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND can_submit_assessment(assessment_id, auth.uid())
  );
