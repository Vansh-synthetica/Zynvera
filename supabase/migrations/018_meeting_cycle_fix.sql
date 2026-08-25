-- =====================================================
-- BREAK CYCLE: meetings <-> meeting_attendees
-- =====================================================

CREATE OR REPLACE FUNCTION hosts_meeting(mid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = mid AND m.host_id = auth.uid()
  )
$$;

DROP POLICY IF EXISTS "Hosts manage attendees" ON meeting_attendees;
CREATE POLICY "Hosts manage attendees" ON meeting_attendees
  FOR ALL USING (hosts_meeting(meeting_attendees.meeting_id) OR is_leadership())
  WITH CHECK (hosts_meeting(meeting_attendees.meeting_id) OR is_leadership());

DROP POLICY IF EXISTS "Users view own attendance rows" ON meeting_attendees;
CREATE POLICY "Users view own attendance rows" ON meeting_attendees
  FOR SELECT USING (user_id = auth.uid());

-- Helper: current user is an attendee (definer, no nested RLS).
CREATE OR REPLACE FUNCTION ma_exists_for(mid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM meeting_attendees ma
    WHERE ma.meeting_id = mid AND ma.user_id = auth.uid()
  )
$$;

DROP POLICY IF EXISTS "Attendees view meetings" ON meetings;
CREATE POLICY "Attendees view meetings" ON meetings
  FOR SELECT USING (
    hosts_meeting(meetings.id)
    OR is_leadership()
    OR ma_exists_for(meetings.id)
  );
