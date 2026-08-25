import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// ── Institutions ──────────────────────────────────────────────────
export async function getInstitution(id: string) {
  const { data, error } = await supabase
    .from('institutions')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function listInstitutions() {
  const { data, error } = await supabase
    .from('institutions')
    .select('*')
    .eq('status', 'active')
    .order('name')
  if (error) throw error
  return data
}

// ── Users ─────────────────────────────────────────────────────────
export async function getUser(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getUsersByInstitution(institutionId: string, role?: string) {
  let query = supabase
    .from('users')
    .select('*')
    .eq('institution_id', institutionId)
  if (role) query = query.eq('role', role)
  const { data, error } = await query.order('name')
  if (error) throw error
  return data
}

// ── Academic Terms ────────────────────────────────────────────────
export async function getCurrentTerm(institutionId: string) {
  const { data, error } = await supabase
    .from('academic_terms')
    .select('*')
    .eq('institution_id', institutionId)
    .eq('status', 'active')
    .single()
  if (error) throw error
  return data
}

export async function getTerms(institutionId: string) {
  const { data, error } = await supabase
    .from('academic_terms')
    .select('*')
    .eq('institution_id', institutionId)
    .order('start_date', { ascending: false })
  if (error) throw error
  return data
}

// ── Programmes ────────────────────────────────────────────────────
export async function getProgrammes(institutionId: string) {
  const { data, error } = await supabase
    .from('programmes')
    .select('*')
    .eq('institution_id', institutionId)
    .order('name')
  if (error) throw error
  return data
}

// ── Courses ───────────────────────────────────────────────────────
export async function getCourses(institutionId: string, termId?: string) {
  let query = supabase
    .from('courses')
    .select(`
      *,
      users!courses_teacher_id_fkey(name, avatar, email),
      programmes(name, department)
    `)
    .eq('institution_id', institutionId)
    .eq('status', 'active')
  if (termId) query = query.eq('term_id', termId)
  const { data, error } = await query.order('title')
  if (error) throw error
  return data
}

export async function getCourse(id: string) {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      users!courses_teacher_id_fkey(name, avatar, email),
      programmes(name, department)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getCoursesByTeacher(teacherId: string, termId?: string) {
  let query = supabase
    .from('courses')
    .select(`
      *,
      programmes(name, department),
      course_enrolments(id)
    `)
    .eq('teacher_id', teacherId)
    .eq('status', 'active')
  if (termId) query = query.eq('term_id', termId)
  const { data, error } = await query.order('title')
  if (error) throw error
  return data
}

export async function getCoursesByStudent(studentId: string, termId?: string) {
  const { data: enrollments, error: enrollError } = await supabase
    .from('course_enrolments')
    .select('course_id')
    .eq('user_id', studentId)
    .eq('status', 'active')
  if (enrollError) throw enrollError

  const courseIds = enrollments.map(e => e.course_id)
  if (courseIds.length === 0) return []

  let query = supabase
    .from('courses')
    .select(`
      *,
      users!courses_teacher_id_fkey(name, avatar, email),
      programmes(name, department)
    `)
    .in('id', courseIds)
  if (termId) query = query.eq('term_id', termId)
  const { data, error } = await query.order('title')
  if (error) throw error
  return data
}

// ── Enrollments ───────────────────────────────────────────────────
export async function getEnrollments(courseId: string) {
  const { data, error } = await supabase
    .from('course_enrolments')
    .select(`
      *,
      users(name, avatar, email)
    `)
    .eq('course_id', courseId)
    .eq('status', 'active')
  if (error) throw error
  return data
}

export async function getEnrollmentCount(courseId: string) {
  const { count, error } = await supabase
    .from('course_enrolments')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('status', 'active')
  if (error) throw error
  return count ?? 0
}

// ── Assignments ───────────────────────────────────────────────────
export async function getAssignments(courseId: string) {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .order('due_date', { ascending: true })
  if (error) throw error
  return data
}

export async function getAssignment(id: string) {
  const { data, error } = await supabase
    .from('assignments')
    .select('*, courses(title, code)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getAssignmentsDueSoon(courseIds: string[], days: number = 7) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)

  const { data, error } = await supabase
    .from('assignments')
    .select('*, courses(title, code)')
    .in('course_id', courseIds)
    .lte('due_date', futureDate.toISOString())
    .gte('due_date', new Date().toISOString())
    .eq('status', 'published')
    .order('due_date')
  if (error) throw error
  return data
}

// ── Assessments ───────────────────────────────────────────────────
export async function getAssessments(courseId: string) {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('course_id', courseId)
    .order('start_date', { ascending: false })
  if (error) throw error
  return data
}

// ── Grades ────────────────────────────────────────────────────────
export async function getGradesByStudent(studentId: string, courseId?: string) {
  let query = supabase
    .from('grade_entries')
    .select(`
      *,
      courses(title, code)
    `)
    .eq('user_id', studentId)
  if (courseId) query = query.eq('course_id', courseId)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getGradesByCourse(courseId: string) {
  const { data, error } = await supabase
    .from('grade_entries')
    .select(`
      *,
      users(name, avatar)
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getSubmissionsByAssignment(assignmentId: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      users(name, avatar, email)
    `)
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ── Attendance ────────────────────────────────────────────────────
export async function getAttendanceByClassSection(classSectionId: string, date?: string) {
  let query = supabase
    .from('attendance_records')
    .select(`
      *,
      users(name, avatar)
    `)
    .eq('class_section_id', classSectionId)
  if (date) query = query.eq('date', date)
  const { data, error } = await query.order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function getAttendanceByStudent(studentId: string) {
  const { data, error } = await supabase
    .from('attendance_records')
    .select(`
      *,
      class_sections(name, courses(title, code))
    `)
    .eq('user_id', studentId)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function getAttendanceSummary(studentId: string) {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('status')
    .eq('user_id', studentId)
  if (error) throw error

  const total = data.length
  const present = data.filter(r => r.status === 'present').length
  const absent = data.filter(r => r.status === 'absent').length
  const late = data.filter(r => r.status === 'late').length
  const excused = data.filter(r => r.status === 'excused').length

  return { total, present, absent, late, excused, rate: total > 0 ? (present / total) * 100 : 0 }
}

// ── Meetings ──────────────────────────────────────────────────────
export async function getMeetingsByUser(userId: string) {
  const { data: attendeeMeetings, error: partError } = await supabase
    .from('meeting_attendees')
    .select('meeting_id, status')
    .eq('user_id', userId)
  if (partError) throw partError

  const meetingIds = attendeeMeetings.map(p => p.meeting_id)
  if (meetingIds.length === 0) return []

  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      users!meetings_host_id_fkey(name, avatar),
      meeting_attendees(user_id, status)
    `)
    .in('id', meetingIds)
    .order('scheduled_at')
  if (error) throw error
  return data
}

export async function getMeetingsByHost(hostId: string) {
  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      meeting_attendees(user_id, status)
    `)
    .eq('host_id', hostId)
    .order('scheduled_at')
  if (error) throw error
  return data
}

// ── Announcements ─────────────────────────────────────────────────
export async function getAnnouncements(institutionId: string) {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      users!announcements_author_id_fkey(name, avatar)
    `)
    .eq('institution_id', institutionId)
    .order('published_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getCourseAnnouncements(courseId: string) {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      users!announcements_author_id_fkey(name, avatar)
    `)
    .eq('course_id', courseId)
    .order('published_at', { ascending: false })
  if (error) throw error
  return data
}

// ── Messages ──────────────────────────────────────────────────────
export async function getMessages(userId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      users!messages_sender_id_fkey(name, avatar),
      users!messages_recipient_id_fkey(name, avatar)
    `)
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

// ── Notifications ─────────────────────────────────────────────────
export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function getUnreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw error
  return count ?? 0
}

// ── Calendar Events ───────────────────────────────────────────────
export async function getCalendarEvents(institutionId: string, userId?: string) {
  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('institution_id', institutionId)
  if (userId) query = query.or(`user_id.is.null,user_id.eq.${userId}`)
  const { data, error } = await query.order('date')
  if (error) throw error
  return data
}

// ── Class Sections ────────────────────────────────────────────────
export async function getClassSectionsByCourse(courseId: string) {
  const { data, error } = await supabase
    .from('class_sections')
    .select('*')
    .eq('course_id', courseId)
    .order('day')
  if (error) throw error
  return data
}

export async function getClassSectionsByTeacher(teacherId: string) {
  const { data, error } = await supabase
    .from('class_sections')
    .select(`
      *,
      courses!class_sections_course_id_fkey(title, code, teacher_id)
    `)
    .eq('courses.teacher_id', teacherId)
    .order('day')
  if (error) throw error
  return data
}

// ── Analytics Helpers ─────────────────────────────────────────────
export async function getGradeDistribution(courseId: string) {
  const { data, error } = await supabase
    .from('grade_entries')
    .select('score, max_score')
    .eq('course_id', courseId)
  if (error) throw error

  const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  data.forEach(g => {
    const pct = (g.score / g.max_score) * 100
    if (pct >= 90) distribution.A++
    else if (pct >= 80) distribution.B++
    else if (pct >= 70) distribution.C++
    else if (pct >= 60) distribution.D++
    else distribution.F++
  })
  return distribution
}

export async function getTeacherStats(teacherId: string) {
  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('id, title')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')
  if (courseError) throw courseError

  let totalStudents = 0
  for (const course of courses) {
    const { count } = await supabase
      .from('course_enrolments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', course.id)
      .eq('status', 'active')
    totalStudents += count ?? 0
  }

  return { courseCount: courses.length, totalStudents }
}

export async function getStudentStats(studentId: string) {
  const { data: enrollments, error: enrollError } = await supabase
    .from('course_enrolments')
    .select('course_id')
    .eq('user_id', studentId)
    .eq('status', 'active')
  if (enrollError) throw enrollError

  const courseIds = enrollments.map(e => e.course_id)

  const { data: grades, error: gradeError } = await supabase
    .from('grade_entries')
    .select('score, max_score')
    .eq('user_id', studentId)
  if (gradeError) throw gradeError

  let averageGrade = 0
  if (grades.length > 0) {
    const totalPoints = grades.reduce((sum, g) => sum + g.score, 0)
    const maxPoints = grades.reduce((sum, g) => sum + g.max_score, 0)
    averageGrade = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0
  }

  return { courseCount: courseIds.length, averageGrade }
}

// ── Search ────────────────────────────────────────────────────────
export async function searchUsers(institutionId: string, query: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, avatar')
    .eq('institution_id', institutionId)
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10)
  if (error) throw error
  return data
}

// ── Institution Requests ──────────────────────────────────────────
export async function submitInstitutionRequest(request: {
  institution_name: string
  institution_type: string
  contact_name: string
  contact_email: string
  contact_phone?: string
  city: string
  country: string
  website?: string
  estimated_students?: number
  message?: string
}) {
  const { data, error } = await supabase
    .from('institution_requests')
    .insert(request)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Discussions ───────────────────────────────────────────────────
export async function getDiscussions(courseId: string) {
  const { data, error } = await supabase
    .from('discussions')
    .select(`
      *,
      users!discussions_author_id_fkey(name, avatar),
      discussion_replies(id)
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ── Verification ──────────────────────────────────────────────────
export async function getVerificationRequest(userId: string) {
  const { data, error } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createVerificationRequest(request: {
  user_id: string
  role: string
  institution_id: string
  documents?: any[]
}) {
  const { data, error } = await supabase
    .from('verification_requests')
    .insert({ ...request, status: 'pending' })
    .select()
    .single()
  if (error) throw error
  return data
}
