-- Drop the weak leftover INSERT policy (name from migration 002).
DROP POLICY IF EXISTS "Students can create own assessment submissions" ON assessment_submissions;

-- Also drop any other weak variants that may exist across renames.
DROP POLICY IF EXISTS "Students can create assessment submissions" ON assessment_submissions;
DROP POLICY IF EXISTS "Anyone can submit assessments" ON assessment_submissions;

-- Clean the bogus cross-institution rows created before the fix.
DELETE FROM assessment_submissions s
WHERE NOT EXISTS (
  SELECT 1
  FROM assessments a
  JOIN course_enrolments ce ON ce.course_id = a.course_id
  WHERE a.id = s.assessment_id AND ce.user_id = s.user_id
);
