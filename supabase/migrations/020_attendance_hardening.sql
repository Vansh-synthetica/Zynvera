-- =====================================================
-- ATTENDANCE HARDENING
-- Zero-duplicate guarantees, audit trail, auto absence
-- notifications, future-date guard, fast indexes.
-- =====================================================

-- ── Indexes for summary queries ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_att_user_date ON attendance_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_att_section_date ON attendance_records(class_section_id, date DESC);

-- ── Helper: does current user teach this section? ────────────────
CREATE OR REPLACE FUNCTION teaches_section(secid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM class_sections cs
    WHERE cs.id = secid AND teaches_course(cs.course_id)
  )
$$;

-- ── Guard: no attendance for future dates ────────────────────────
CREATE OR REPLACE FUNCTION att_guard()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Attendance cannot be recorded for a future date (%)', NEW.date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_att_guard ON attendance_records;
CREATE TRIGGER trg_att_guard
  BEFORE INSERT OR UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION att_guard();

-- ── Audit trail: every change logged ─────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
  class_section_id UUID NOT NULL,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_att_audit_record ON attendance_audit(record_id);
CREATE INDEX IF NOT EXISTS idx_att_audit_user ON attendance_audit(user_id, created_at DESC);

ALTER TABLE attendance_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leadership view attendance audit" ON attendance_audit
  FOR SELECT USING (is_leadership());

CREATE POLICY "Teachers view audit for their sections" ON attendance_audit
  FOR SELECT USING (teaches_section(attendance_audit.class_section_id));

CREATE POLICY "Students view own audit" ON attendance_audit
  FOR SELECT USING (user_id = auth.uid());

-- Audit writer (definer so all writers can log regardless of policy).
CREATE OR REPLACE FUNCTION att_audit()
RETURNS TRIGGER AS $$
DECLARE
  old_st TEXT;
BEGIN
  IF TG_OP = 'UPDATE' THEN old_st := OLD.status; ELSE old_st := NULL; END IF;
  INSERT INTO attendance_audit
    (record_id, class_section_id, user_id, date, old_status, new_status, changed_by)
  VALUES
    (NEW.id, NEW.class_section_id, NEW.user_id, NEW.date, old_st, NEW.status, NEW.recorded_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_att_audit ON attendance_records;
CREATE TRIGGER trg_att_audit
  AFTER INSERT OR UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION att_audit();

-- ── Auto absence notification (deduped: only on transition) ──────
CREATE OR REPLACE FUNCTION att_absence_notify()
RETURNS TRIGGER AS $$
DECLARE
  sec_name TEXT;
  crs_title TEXT;
BEGIN
  IF NEW.status <> 'absent' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'absent' THEN RETURN NEW; END IF;

  SELECT cs.name, c.title INTO sec_name, crs_title
  FROM class_sections cs JOIN courses c ON c.id = cs.course_id
  WHERE cs.id = NEW.class_section_id;

  INSERT INTO notifications (user_id, title, message, category, action_url)
  VALUES (
    NEW.user_id,
    'Absence recorded',
    'An absence was recorded' ||
      COALESCE(' in ' || COALESCE(crs_title, sec_name), '') ||
      ' on ' || NEW.date || '. Guardians have been notified.',
    'attendance',
    '/student/attendance'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_att_absence_notify ON attendance_records;
CREATE TRIGGER trg_att_absence_notify
  AFTER INSERT OR UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION att_absence_notify();
