-- =====================================================
-- STAFF CONTENT POLICIES
-- Fills RLS gaps found during the full-app walkthrough:
-- teachers couldn't create timetable slots, calendar events,
-- meeting attendees, or notifications.
-- =====================================================

-- Timetable: staff manage slots for their courses; users read their own.
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage course timetable" ON timetable_slots;
CREATE POLICY "Staff manage course timetable" ON timetable_slots
  FOR ALL USING (teaches_course(timetable_slots.course_id))
  WITH CHECK (teaches_course(timetable_slots.course_id));

DROP POLICY IF EXISTS "Users view own timetable" ON timetable_slots;
CREATE POLICY "Users view own timetable" ON timetable_slots
  FOR SELECT USING (user_id = auth.uid());

-- Calendar: staff create within institution; members view.
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage institution events" ON calendar_events;
CREATE POLICY "Staff manage institution events" ON calendar_events
  FOR ALL USING (
    institution_id = get_user_institution()
    AND get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin')
  )
  WITH CHECK (
    institution_id = get_user_institution()
    AND get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Members view institution events" ON calendar_events;
CREATE POLICY "Members view institution events" ON calendar_events
  FOR SELECT USING (
    institution_id = get_user_institution()
    OR user_id = auth.uid()
  );

-- Meeting attendees: hosts manage; users see their own rows.
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hosts manage attendees" ON meeting_attendees;
CREATE POLICY "Hosts manage attendees" ON meeting_attendees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_attendees.meeting_id AND m.host_id = auth.uid()
    )
    OR is_leadership()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_attendees.meeting_id AND m.host_id = auth.uid()
    )
    OR is_leadership()
  );

DROP POLICY IF EXISTS "Users view own attendance rows" ON meeting_attendees;
CREATE POLICY "Users view own attendance rows" ON meeting_attendees
  FOR SELECT USING (user_id = auth.uid());

-- Meetings readable by attendees too (students need to see invites).
DROP POLICY IF EXISTS "Attendees view meetings" ON meetings;
CREATE POLICY "Attendees view meetings" ON meetings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meeting_attendees ma
      WHERE ma.meeting_id = meetings.id AND ma.user_id = auth.uid()
    )
    OR host_id = auth.uid()
  );

-- Notifications: staff can send within institution; users manage own.
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff send notifications" ON notifications;
CREATE POLICY "Staff send notifications" ON notifications
  FOR INSERT WITH CHECK (
    get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
CREATE POLICY "Users manage own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());
