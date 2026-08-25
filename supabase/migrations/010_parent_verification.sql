-- =====================================================
-- FAMILY CODES & PARENT LINK VERIFICATION
-- =====================================================

-- ── Family access codes ──────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS family_code TEXT;

-- Backfill existing students.
UPDATE users
SET family_code = upper(substring(md5(random()::text) from 1 for 8))
WHERE role = 'student' AND (family_code IS NULL OR family_code = '');

-- Auto-generate for future students.
CREATE OR REPLACE FUNCTION ensure_family_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' AND (NEW.family_code IS NULL OR NEW.family_code = '') THEN
    NEW.family_code := upper(substring(md5(random()::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_family_code ON users;
CREATE TRIGGER trg_ensure_family_code
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION ensure_family_code();

-- Students can always read their own profile/code.
DROP POLICY IF EXISTS "Users read own profile" ON users;
CREATE POLICY "Users read own profile" ON users
  FOR SELECT USING (id = auth.uid());

-- ── Link verification workflow ───────────────────────────────────
ALTER TABLE parent_links ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE parent_links ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE parent_links ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE parent_links ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

ALTER TABLE parent_links DROP CONSTRAINT IF EXISTS parent_links_status_check;
ALTER TABLE parent_links ADD CONSTRAINT parent_links_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

UPDATE parent_links SET status = 'approved' WHERE status = 'pending' AND approved_at IS NOT NULL;

-- Parents may view their own requests in any state.
DROP POLICY IF EXISTS "Parents view own links" ON parent_links;
CREATE POLICY "Parents view own links" ON parent_links
  FOR SELECT USING (parent_user_id = auth.uid());

-- Parents may only CREATE pending requests for themselves.
DROP POLICY IF EXISTS "Staff manage parent links" ON parent_links;
CREATE POLICY "Parents request own links" ON parent_links
  FOR INSERT WITH CHECK (
    parent_user_id = auth.uid() AND status = 'pending'
  );

-- Leadership manages the full lifecycle (approve/reject/manual links).
CREATE POLICY "Leadership manage parent links" ON parent_links
  FOR ALL USING (
    get_user_institution() = institution_id
    AND get_user_role() IN ('principal', 'admin', 'super_admin')
  );

-- ── Tighten child-data policies to APPROVED links only ───────────

DROP POLICY IF EXISTS "Parents view child courses" ON courses;
CREATE POLICY "Parents view child courses" ON courses
  FOR SELECT USING (
    get_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM course_enrolments ce
      JOIN parent_links pl ON pl.student_user_id = ce.user_id
      WHERE ce.course_id = courses.id
        AND pl.parent_user_id = auth.uid()
        AND pl.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Parents view child enrolments" ON course_enrolments;
CREATE POLICY "Parents view child enrolments" ON course_enrolments
  FOR SELECT USING (
    get_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_links pl
      WHERE pl.student_user_id = course_enrolments.user_id
        AND pl.parent_user_id = auth.uid()
        AND pl.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Parents view child grades" ON grade_entries;
CREATE POLICY "Parents view child grades" ON grade_entries
  FOR SELECT USING (
    get_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_links pl
      WHERE pl.student_user_id = grade_entries.user_id
        AND pl.parent_user_id = auth.uid()
        AND pl.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Parents view child attendance" ON attendance_records;
CREATE POLICY "Parents view child attendance" ON attendance_records
  FOR SELECT USING (
    get_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_links pl
      WHERE pl.student_user_id = attendance_records.user_id
        AND pl.parent_user_id = auth.uid()
        AND pl.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Parents view assignments of child work" ON assignments;
CREATE POLICY "Parents view assignments of child work" ON assignments
  FOR SELECT USING (
    get_user_role() = 'parent'
    AND (
      status IN ('published', 'active', 'graded', 'returned')
      OR EXISTS (
        SELECT 1 FROM submissions s
        JOIN parent_links pl ON pl.student_user_id = s.user_id
        WHERE s.assignment_id = assignments.id
          AND pl.parent_user_id = auth.uid()
          AND pl.status = 'approved'
      )
    )
  );

DROP POLICY IF EXISTS "Parents view child submissions" ON submissions;
CREATE POLICY "Parents view child submissions" ON submissions
  FOR SELECT USING (
    get_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_links pl
      WHERE pl.student_user_id = submissions.user_id
        AND pl.parent_user_id = auth.uid()
        AND pl.status = 'approved'
    )
  );
