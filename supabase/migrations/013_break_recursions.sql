-- =====================================================
-- BREAK ALL RECURSIONS
-- Root cause: get_user_role()/get_user_institution() ran with RLS,
-- and legacy policies cross-referenced users <-> course_enrolments.
-- Helpers become SECURITY DEFINER; legacy policies use them.
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_user_institution()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT institution_id FROM users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION is_principal_or_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('principal', 'admin', 'super_admin')
  )
$$;

-- Helper for teachers viewing their own students' profiles.
CREATE OR REPLACE FUNCTION teaches_student(sid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM course_enrolments ce
    JOIN courses c ON c.id = ce.course_id
    WHERE ce.user_id = sid AND c.teacher_id = auth.uid()
  )
$$;

-- ── Replace the cycling legacy policies ──────────────────────────

DROP POLICY IF EXISTS "Teachers can view course students" ON users;
CREATE POLICY "Teachers can view course students" ON users
  FOR SELECT USING (teaches_student(id));

DROP POLICY IF EXISTS "Principals can manage enrolments" ON course_enrolments;
CREATE POLICY "Principals can manage enrolments" ON course_enrolments
  FOR ALL USING (is_leadership())
  WITH CHECK (is_leadership());

DROP POLICY IF EXISTS "Principals can manage courses" ON courses;
CREATE POLICY "Principals can manage courses" ON courses
  FOR ALL USING (is_leadership())
  WITH CHECK (is_leadership());

DROP POLICY IF EXISTS "Principals can manage institution users" ON users;
CREATE POLICY "Principals can manage institution users" ON users
  FOR ALL USING (is_leadership() AND institution_id = get_user_institution())
  WITH CHECK (is_leadership() AND institution_id = get_user_institution());

DROP POLICY IF EXISTS "Principals can view institution users" ON users;
CREATE POLICY "Principals can view institution users" ON users
  FOR SELECT USING (is_leadership() AND institution_id = get_user_institution());
