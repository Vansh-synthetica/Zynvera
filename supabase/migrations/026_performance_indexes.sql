-- Performance indexes for RLS subqueries and frequently queried columns.

-- Announcements: RLS policies filter by course_id and institution_id
CREATE INDEX IF NOT EXISTS idx_announcements_course_id ON announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_announcements_institution_id ON announcements(institution_id);

-- Discussions: RLS policies filter by course_id
CREATE INDEX IF NOT EXISTS idx_discussions_course_id ON discussions(course_id);

-- Discussion replies: FK lookup
CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_id ON discussion_replies(discussion_id);

-- Meeting attendees: RLS policy queries
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting_id ON meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user_id ON meeting_attendees(user_id);

-- Meetings: RLS policy filters
CREATE INDEX IF NOT EXISTS idx_meetings_course_id ON meetings(course_id);
CREATE INDEX IF NOT EXISTS idx_meetings_host_id ON meetings(host_id);

-- Assessment submissions: can_submit_assessment() function
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_assessment_user ON assessment_submissions(assessment_id, user_id);

-- Class sections: FK relationship
CREATE INDEX IF NOT EXISTS idx_class_sections_course_id ON class_sections(course_id);

-- Verification requests
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_institution_id ON verification_requests(institution_id);

-- Campuses and academic terms
CREATE INDEX IF NOT EXISTS idx_campuses_institution_id ON campuses(institution_id);
CREATE INDEX IF NOT EXISTS idx_academic_terms_institution_id ON academic_terms(institution_id);
CREATE INDEX IF NOT EXISTS idx_programmes_institution_id ON programmes(institution_id);

-- Parent links
CREATE INDEX IF NOT EXISTS idx_parent_links_institution_id ON parent_links(institution_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_status ON parent_links(status);

-- Timetable slots
CREATE INDEX IF NOT EXISTS idx_timetable_slots_user_id ON timetable_slots(user_id);

-- Notifications: composite for unread count
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
