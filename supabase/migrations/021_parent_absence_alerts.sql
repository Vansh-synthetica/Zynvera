-- =====================================================
-- PHYSICAL ATTENDANCE → REAL-TIME PARENT ALERTS
-- When a student is marked absent (school day), every
-- APPROVED parent gets their own notification instantly.
-- =====================================================

CREATE OR REPLACE FUNCTION get_approved_parents(sid uuid)
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT parent_user_id FROM parent_links
  WHERE student_user_id = sid AND status = 'approved'
$$;

CREATE OR REPLACE FUNCTION att_absence_notify()
RETURNS TRIGGER AS $$
DECLARE
  sec_name TEXT;
  crs_title TEXT;
  pid uuid;
BEGIN
  IF NEW.status <> 'absent' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'absent' THEN RETURN NEW; END IF;

  SELECT cs.name, c.title INTO sec_name, crs_title
  FROM class_sections cs JOIN courses c ON c.id = cs.course_id
  WHERE cs.id = NEW.class_section_id;

  -- Student notification.
  INSERT INTO notifications (user_id, title, message, category, action_url)
  VALUES (
    NEW.user_id,
    'Absence recorded',
    'An absence was recorded' ||
      COALESCE(' in ' || COALESCE(crs_title, sec_name), '') ||
      ' on ' || NEW.date || '.',
    'attendance',
    '/student/attendance'
  );

  -- Parent notifications (each approved parent of this student).
  FOR pid IN SELECT get_approved_parents(NEW.user_id)
  LOOP
    INSERT INTO notifications (user_id, title, message, category, action_url)
    VALUES (
      pid,
      'Your child is not in school',
      COALESCE((SELECT name FROM users WHERE id = NEW.user_id), 'Your child') ||
        ' was marked ABSENT' ||
        COALESCE(' in ' || COALESCE(crs_title, sec_name), '') ||
        ' on ' || NEW.date || '. Contact the school if this is unexpected.',
      'attendance',
      '/parent/dashboard'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
