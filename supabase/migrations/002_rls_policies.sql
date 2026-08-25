-- Zynvera Row Level Security Policies
-- Enable RLS on all tables and create policies

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrolments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's institution
CREATE OR REPLACE FUNCTION get_user_institution()
RETURNS UUID AS $$
  SELECT institution_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'super_admin') FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is principal or admin
CREATE OR REPLACE FUNCTION is_principal_or_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('principal', 'admin', 'super_admin') FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- INSTITUTION POLICIES
-- =====================================================

-- Everyone can view approved institutions
CREATE POLICY "Public can view approved institutions" ON institutions
  FOR SELECT USING (approved = true AND status = 'active');

-- Admins can manage all institutions
CREATE POLICY "Admins can manage institutions" ON institutions
  FOR ALL USING (is_admin());

-- Principals can view their own institution
CREATE POLICY "Principals can view own institution" ON institutions
  FOR SELECT USING (
    id = get_user_institution() AND 
    get_user_role() IN ('principal', 'admin', 'super_admin')
);

-- =====================================================
-- CAMPUS POLICIES
-- =====================================================

-- Everyone can view campuses of approved institutions
CREATE POLICY "Public can view campuses" ON campuses
  FOR SELECT USING (
    institution_id IN (SELECT id FROM institutions WHERE approved = true AND status = 'active')
  );

-- Principals can manage campuses in their institution
CREATE POLICY "Principals can manage campuses" ON campuses
  FOR ALL USING (
    institution_id = get_user_institution() AND
    get_user_role() IN ('principal', 'admin', 'super_admin')
);

-- =====================================================
-- ACADEMIC TERM POLICIES
-- =====================================================

-- Everyone can view terms of approved institutions
CREATE POLICY "Public can view terms" ON academic_terms
  FOR SELECT USING (
    institution_id IN (SELECT id FROM institutions WHERE approved = true AND status = 'active')
  );

-- Principals can manage terms in their institution
CREATE POLICY "Principals can manage terms" ON academic_terms
  FOR ALL USING (
    institution_id = get_user_institution() AND
    get_user_role() IN ('principal', 'admin', 'super_admin')
);

-- =====================================================
-- PROGRAMME POLICIES
-- =====================================================

-- Everyone can view programmes of approved institutions
CREATE POLICY "Public can view programmes" ON programmes
  FOR SELECT USING (
    institution_id IN (SELECT id FROM institutions WHERE approved = true AND status = 'active')
  );

-- Principals can manage programmes in their institution
CREATE POLICY "Principals can manage programmes" ON programmes
  FOR ALL USING (
    institution_id = get_user_institution() AND
    get_user_role() IN ('principal', 'admin', 'super_admin')
);

-- =====================================================
-- USER POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Principals can view users in their institution
CREATE POLICY "Principals can view institution users" ON users
  FOR SELECT USING (
    institution_id = get_user_institution() AND
    get_user_role() IN ('principal', 'admin', 'super_admin')
  );

-- Principals can manage users in their institution
CREATE POLICY "Principals can manage institution users" ON users
  FOR ALL USING (
    institution_id = get_user_institution() AND
    get_user_role() IN ('principal', 'admin', 'super_admin')
);

-- Teachers can view students in their courses
CREATE POLICY "Teachers can view course students" ON users
  FOR SELECT USING (
    id IN (
      SELECT ce.user_id FROM course_enrolments ce
      JOIN courses c ON ce.course_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- =====================================================
-- COURSE POLICIES
-- =====================================================

-- Everyone can view courses of approved institutions
CREATE POLICY "Public can view courses" ON courses
  FOR SELECT USING (
    institution_id IN (SELECT id FROM institutions WHERE approved = true AND status = 'active')
  );

-- Teachers can manage their own courses
CREATE POLICY "Teachers can manage own courses" ON courses
  FOR ALL USING (teacher_id = auth.uid());

-- Principals can manage courses in their institution
CREATE POLICY "Principals can manage courses" ON courses
  FOR ALL USING (
    institution_id = get_user_institution() AND
    get_user_role() IN ('principal', 'admin', 'super_admin')
);

-- =====================================================
-- COURSE ENROLMENT POLICIES
-- =====================================================

-- Students can view their own enrolments
CREATE POLICY "Students can view own enrolments" ON course_enrolments
  FOR SELECT USING (user_id = auth.uid());

-- Teachers can view enrolments in their courses
CREATE POLICY "Teachers can view course enrolments" ON course_enrolments
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- Teachers can manage enrolments in their courses
CREATE POLICY "Teachers can manage course enrolments" ON course_enrolments
  FOR ALL USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- Principals can manage enrolments in their institution
CREATE POLICY "Principals can manage enrolments" ON course_enrolments
  FOR ALL USING (
    course_id IN (
      SELECT id FROM courses WHERE institution_id = get_user_institution()
    ) AND
    get_user_role() IN ('principal', 'admin', 'super_admin')
  );

-- =====================================================
-- COURSE MODULE POLICIES
-- =====================================================

-- Everyone can view modules of courses they're enrolled in
CREATE POLICY "Students can view enrolled course modules" ON course_modules
  FOR SELECT USING (
    course_id IN (SELECT course_id FROM course_enrolments WHERE user_id = auth.uid())
  );

-- Teachers can view modules of their courses
CREATE POLICY "Teachers can view own course modules" ON course_modules
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- Teachers can manage modules of their courses
CREATE POLICY "Teachers can manage own course modules" ON course_modules
  FOR ALL USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- =====================================================
-- COURSE LESSON POLICIES
-- =====================================================

-- Students can view lessons of modules they have access to
CREATE POLICY "Students can view course lessons" ON course_lessons
  FOR SELECT USING (
    module_id IN (
      SELECT cm.id FROM course_modules cm
      JOIN course_enrolments ce ON cm.course_id = ce.course_id
      WHERE ce.user_id = auth.uid()
    )
  );

-- Teachers can view lessons of their courses
CREATE POLICY "Teachers can view own course lessons" ON course_lessons
  FOR SELECT USING (
    module_id IN (
      SELECT cm.id FROM course_modules cm
      JOIN courses c ON cm.course_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- Teachers can manage lessons of their courses
CREATE POLICY "Teachers can manage own course lessons" ON course_lessons
  FOR ALL USING (
    module_id IN (
      SELECT cm.id FROM course_modules cm
      JOIN courses c ON cm.course_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- =====================================================
-- COURSE RESOURCE POLICIES
-- =====================================================

-- Students can view resources of courses they're enrolled in
CREATE POLICY "Students can view course resources" ON course_resources
  FOR SELECT USING (
    course_id IN (SELECT course_id FROM course_enrolments WHERE user_id = auth.uid())
  );

-- Teachers can view resources of their courses
CREATE POLICY "Teachers can view own course resources" ON course_resources
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- Teachers can manage resources of their courses
CREATE POLICY "Teachers can manage own course resources" ON course_resources
  FOR ALL USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- =====================================================
-- SYLLABUS ITEMS POLICIES
-- =====================================================

-- Students can view syllabus of courses they're enrolled in
CREATE POLICY "Students can view course syllabus" ON syllabus_items
  FOR SELECT USING (
    course_id IN (SELECT course_id FROM course_enrolments WHERE user_id = auth.uid())
  );

-- Teachers can view syllabus of their courses
CREATE POLICY "Teachers can view own course syllabus" ON syllabus_items
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- Teachers can manage syllabus of their courses
CREATE POLICY "Teachers can manage own course syllabus" ON syllabus_items
  FOR ALL USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- =====================================================
-- GRADE WEIGHTS POLICIES
-- =====================================================

-- Students can view grade weights of courses they're enrolled in
CREATE POLICY "Students can view course grade weights" ON grade_weights
  FOR SELECT USING (
    course_id IN (SELECT course_id FROM course_enrolments WHERE user_id = auth.uid())
  );

-- Teachers can view grade weights of their courses
CREATE POLICY "Teachers can view own course grade weights" ON grade_weights
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- Teachers can manage grade weights of their courses
CREATE POLICY "Teachers can manage own course grade weights" ON grade_weights
  FOR ALL USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- =====================================================
-- CLASS SECTION POLICIES
-- =====================================================

-- Students can view class sections of courses they're enrolled in
CREATE POLICY "Students can view course class sections" ON class_sections
  FOR SELECT USING (
    course_id IN (SELECT course_id FROM course_enrolments WHERE user_id = auth.uid())
  );

-- Teachers can view class sections of their courses
CREATE POLICY "Teachers can view own course class sections" ON class_sections
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- Teachers can manage class sections of their courses
CREATE POLICY "Teachers can manage own course class sections" ON class_sections
  FOR ALL USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- =====================================================
-- ASSIGNMENT POLICIES
-- =====================================================

-- Students can view published assignments of courses they're enrolled in
CREATE POLICY "Students can view published assignments" ON assignments
  FOR SELECT USING (
    course_id IN (SELECT course_id FROM course_enrolments WHERE user_id = auth.uid()) AND
    status IN ('published', 'active', 'graded', 'returned')
  );

-- Teachers can view all assignments of their courses
CREATE POLICY "Teachers can view own course assignments" ON assignments
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- Teachers can manage assignments of their courses
CREATE POLICY "Teachers can manage own course assignments" ON assignments
  FOR ALL USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- =====================================================
-- ASSIGNMENT ATTACHMENT POLICIES
-- =====================================================

-- Students can view attachments of published assignments
CREATE POLICY "Students can view assignment attachments" ON assignment_attachments
  FOR SELECT USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE
        course_id IN (SELECT course_id FROM course_enrolments WHERE user_id = auth.uid()) AND
        status IN ('published', 'active', 'graded', 'returned')
    )
  );

-- Teachers can view attachments of their course assignments
CREATE POLICY "Teachers can view own assignment attachments" ON assignment_attachments
  FOR SELECT USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
    )
  );

-- Teachers can manage attachments of their course assignments
CREATE POLICY "Teachers can manage own assignment attachments" ON assignment_attachments
  FOR ALL USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
    )
  );

-- =====================================================
-- RUBRIC ITEMS POLICIES
-- =====================================================

-- Students can view rubric of published assignments
CREATE POLICY "Students can view assignment rubric" ON rubric_items
  FOR SELECT USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE
        course_id IN (SELECT course_id FROM course_enrolments WHERE user_id = auth.uid()) AND
        status IN ('published', 'active', 'graded', 'returned')
    )
  );

-- Teachers can view rubric of their course assignments
CREATE POLICY "Teachers can view own assignment rubric" ON rubric_items
  FOR SELECT USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
    )
  );

-- Teachers can manage rubric of their course assignments
CREATE POLICY "Teachers can manage own assignment rubric" ON rubric_items
  FOR ALL USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
    )
  );

-- =====================================================
-- SUBMISSION POLICIES
-- =====================================================

-- Students can view their own submissions
CREATE POLICY "Students can view own submissions" ON submissions
  FOR SELECT USING (user_id = auth.uid());

-- Students can create their own submissions
CREATE POLICY "Students can create own submissions" ON submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Students can update their own submissions (for resubmission)
CREATE POLICY "Students can update own submissions" ON submissions
  FOR UPDATE USING (user_id = auth.uid());

-- Teachers can view submissions for their courses
CREATE POLICY "Teachers can view course submissions" ON submissions
  FOR SELECT USING (
    assignment_id IN (SELECT id FROM assignments WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid()))
  );

-- Teachers can grade submissions for their courses
CREATE POLICY "Teachers can grade course submissions" ON submissions
  FOR UPDATE USING (
    assignment_id IN (SELECT id FROM assignments WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid()))
  );

-- =====================================================
-- SUBMISSION HISTORY POLICIES
-- =====================================================

-- Students can view their own submission history
CREATE POLICY "Students can view own submission history" ON submission_history
  FOR SELECT USING (
    submission_id IN (SELECT id FROM submissions WHERE user_id = auth.uid())
  );

-- Teachers can view submission history for their courses
CREATE POLICY "Teachers can view course submission history" ON submission_history
  FOR SELECT USING (
    submission_id IN (
      SELECT s.id FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- =====================================================
-- ASSESSMENT POLICIES
-- =====================================================

-- Students can view active assessments of courses they're enrolled in
CREATE POLICY "Students can view active assessments" ON assessments
  FOR SELECT USING (
    course_id IN (SELECT course_id FROM course_enrolments WHERE user_id = auth.uid()) AND
    status IN ('active', 'completed', 'graded')
  );

-- Teachers can view assessments of their courses
CREATE POLICY "Teachers can view own course assessments" ON assessments
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- Teachers can manage assessments of their courses
CREATE POLICY "Teachers can manage own course assessments" ON assessments
  FOR ALL USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- =====================================================
-- ASSESSMENT QUESTION POLICIES
-- =====================================================

-- Students can view questions of active assessments
CREATE POLICY "Students can view assessment questions" ON assessment_questions
  FOR SELECT USING (
    assessment_id IN (
      SELECT id FROM assessments WHERE
        course_id IN (SELECT course_id FROM course_enrolments WHERE user_id = auth.uid()) AND
        status IN ('active', 'completed', 'graded')
    )
  );

-- Teachers can view questions of their course assessments
CREATE POLICY "Teachers can view own assessment questions" ON assessment_questions
  FOR SELECT USING (
    assessment_id IN (
      SELECT id FROM assessments WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
    )
  );

-- Teachers can manage questions of their course assessments
CREATE POLICY "Teachers can manage own assessment questions" ON assessment_questions
  FOR ALL USING (
    assessment_id IN (
      SELECT id FROM assessments WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
    )
  );

-- =====================================================
-- ASSESSMENT SUBMISSION POLICIES
-- =====================================================

-- Students can view their own assessment submissions
CREATE POLICY "Students can view own assessment submissions" ON assessment_submissions
  FOR SELECT USING (user_id = auth.uid());

-- Students can create their own assessment submissions
CREATE POLICY "Students can create own assessment submissions" ON assessment_submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Students can update their own assessment submissions
CREATE POLICY "Students can update own assessment submissions" ON assessment_submissions
  FOR UPDATE USING (user_id = auth.uid());

-- Teachers can view assessment submissions for their courses
CREATE POLICY "Teachers can view course assessment submissions" ON assessment_submissions
  FOR SELECT USING (
    assessment_id IN (SELECT id FROM assessments WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid()))
  );

-- =====================================================
-- GRADE ENTRY POLICIES
-- =====================================================

-- Students can view their own grade entries
CREATE POLICY "Students can view own grade entries" ON grade_entries
  FOR SELECT USING (user_id = auth.uid());

-- Teachers can view grade entries for their courses
CREATE POLICY "Teachers can view course grade entries" ON grade_entries
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- Teachers can manage grade entries for their courses
CREATE POLICY "Teachers can manage course grade entries" ON grade_entries
  FOR ALL USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- =====================================================
-- ATTENDANCE RECORD POLICIES
-- =====================================================

-- Students can view their own attendance
CREATE POLICY "Students can view own attendance" ON attendance_records
  FOR SELECT USING (user_id = auth.uid());

-- Teachers can view attendance for their class sections
CREATE POLICY "Teachers can view own class attendance" ON attendance_records
  FOR SELECT USING (
    class_section_id IN (
      SELECT cs.id FROM class_sections cs
      JOIN courses c ON cs.course_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- Teachers can manage attendance for their class sections
CREATE POLICY "Teachers can manage own class attendance" ON attendance_records
  FOR ALL USING (
    class_section_id IN (
      SELECT cs.id FROM class_sections cs
      JOIN courses c ON cs.course_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- =====================================================
-- CALENDAR EVENT POLICIES
-- =====================================================

-- Users can view calendar events for their institution
CREATE POLICY "Users can view institution calendar events" ON calendar_events
  FOR SELECT USING (
    institution_id = get_user_institution() OR
    course_id IN (SELECT course_id FROM course_enrolments WHERE user_id = auth.uid()) OR
    user_id = auth.uid()
  );

-- Users can create their own calendar events
CREATE POLICY "Users can create own calendar events" ON calendar_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own calendar events
CREATE POLICY "Users can update own calendar events" ON calendar_events
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- TIMETABLE SLOT POLICIES
-- =====================================================

-- Students can view their own timetable
CREATE POLICY "Students can view own timetable" ON timetable_slots
  FOR SELECT USING (user_id = auth.uid());

-- Teachers can view their own timetable
CREATE POLICY "Teachers can view own timetable" ON timetable_slots
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- MEETING POLICIES
-- =====================================================

-- Students can view meetings for courses they're enrolled in
CREATE POLICY "Students can view course meetings" ON meetings
  FOR SELECT USING (
    course_id IN (SELECT course_id FROM course_enrolments WHERE user_id = auth.uid())
  );

-- Teachers can view meetings they're hosting
CREATE POLICY "Teachers can view own meetings" ON meetings
  FOR SELECT USING (host_id = auth.uid());

-- Teachers can manage meetings they're hosting
CREATE POLICY "Teachers can manage own meetings" ON meetings
  FOR ALL USING (host_id = auth.uid());

-- =====================================================
-- MEETING ATTENDEE POLICIES
-- =====================================================

-- Students can view attendees of meetings they're invited to
CREATE POLICY "Students can view meeting attendees" ON meeting_attendees
  FOR SELECT USING (
    meeting_id IN (
      SELECT m.id FROM meetings m
      JOIN course_enrolments ce ON m.course_id = ce.course_id
      WHERE ce.user_id = auth.uid()
    )
  );

-- Users can update their own attendance status
CREATE POLICY "Users can update own meeting attendance" ON meeting_attendees
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- ANNOUNCEMENT POLICIES
-- =====================================================

-- Students can view announcements for courses they're enrolled in
CREATE POLICY "Students can view course announcements" ON announcements
  FOR SELECT USING (
    course_id IN (SELECT course_id FROM course_enrolments WHERE user_id = auth.uid()) OR
    (institution_id = get_user_institution() AND course_id IS NULL)
  );

-- Teachers can view announcements for their courses
CREATE POLICY "Teachers can view own course announcements" ON announcements
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid()) OR
    (institution_id = get_user_institution() AND course_id IS NULL)
  );

-- Teachers can manage announcements for their courses
CREATE POLICY "Teachers can manage own course announcements" ON announcements
  FOR ALL USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid()) OR
    (institution_id = get_user_institution() AND course_id IS NULL)
  );

-- =====================================================
-- MESSAGE POLICIES
-- =====================================================

-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Users can send messages
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Users can update read status of messages they received
CREATE POLICY "Users can update received messages" ON messages
  FOR UPDATE USING (recipient_id = auth.uid());

-- =====================================================
-- DISCUSSION POLICIES
-- =====================================================

-- Students can view discussions for courses they're enrolled in
CREATE POLICY "Students can view course discussions" ON discussions
  FOR SELECT USING (
    course_id IN (SELECT course_id FROM course_enrolments WHERE user_id = auth.uid())
  );

-- Teachers can view discussions for their courses
CREATE POLICY "Teachers can view own course discussions" ON discussions
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- Students can create discussions in courses they're enrolled in
CREATE POLICY "Students can create course discussions" ON discussions
  FOR INSERT WITH CHECK (
    course_id IN (SELECT course_id FROM course_enrolments WHERE user_id = auth.uid()) AND
    author_id = auth.uid()
  );

-- Teachers can create discussions in their courses
CREATE POLICY "Teachers can create own course discussions" ON discussions
  FOR INSERT WITH CHECK (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid()) AND
    author_id = auth.uid()
  );

-- =====================================================
-- DISCUSSION REPLY POLICIES
-- =====================================================

-- Students can view replies in discussions they have access to
CREATE POLICY "Students can view discussion replies" ON discussion_replies
  FOR SELECT USING (
    discussion_id IN (
      SELECT d.id FROM discussions d
      JOIN course_enrolments ce ON d.course_id = ce.course_id
      WHERE ce.user_id = auth.uid()
    )
  );

-- Students can create replies in discussions they have access to
CREATE POLICY "Students can create discussion replies" ON discussion_replies
  FOR INSERT WITH CHECK (
    discussion_id IN (
      SELECT d.id FROM discussions d
      JOIN course_enrolments ce ON d.course_id = ce.course_id
      WHERE ce.user_id = auth.uid()
    ) AND
    author_id = auth.uid()
  );

-- =====================================================
-- NOTIFICATION POLICIES
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update read status of their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System can create notifications for users
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- VERIFICATION REQUEST POLICIES
-- =====================================================

-- Users can view their own verification requests
CREATE POLICY "Users can view own verification requests" ON verification_requests
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own verification requests
CREATE POLICY "Users can create own verification requests" ON verification_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Principals can view verification requests for their institution
CREATE POLICY "Principals can view institution verification requests" ON verification_requests
  FOR SELECT USING (
    institution_id = get_user_institution() AND
    get_user_role() IN ('principal', 'admin', 'super_admin')
  );

-- Principals can manage verification requests for their institution
CREATE POLICY "Principals can manage institution verification requests" ON verification_requests
  FOR ALL USING (
    institution_id = get_user_institution() AND
    get_user_role() IN ('principal', 'admin', 'super_admin')
  );

-- =====================================================
-- INSTITUTION REQUEST POLICIES
-- =====================================================

-- Anyone can create institution requests
CREATE POLICY "Anyone can create institution requests" ON institution_requests
  FOR INSERT WITH CHECK (true);

-- Admins can view all institution requests
CREATE POLICY "Admins can view institution requests" ON institution_requests
  FOR SELECT USING (is_admin());

-- Admins can manage institution requests
CREATE POLICY "Admins can manage institution requests" ON institution_requests
  FOR ALL USING (is_admin());
