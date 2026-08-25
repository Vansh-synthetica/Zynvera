export type UserRole = 'student' | 'teacher' | 'principal' | 'admin' | 'counselor' | 'department_head' | 'parent' | 'super_admin'

export type InstitutionType = 'School' | 'College' | 'University'

export type InstitutionStatus = 'active' | 'pending' | 'suspended' | 'rejected'

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'

export type VerificationDocument = {
  id: string
  type: 'institution_email' | 'employee_id' | 'student_id' | 'degree_certificate' | 'employment_letter' | 'enrolment_proof' | 'government_id'
  fileName: string
  uploadedAt: string
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
}

export type VerificationRequest = {
  id: string
  userId: string
  role: UserRole
  institutionId: string
  status: VerificationStatus
  documents: VerificationDocument[]
  submittedAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  rejectionReason: string | null
}

export type InstitutionRequest = {
  id: string
  institutionName: string
  institutionType: InstitutionType
  contactName: string
  contactEmail: string
  contactPhone: string
  city: string
  country: string
  website: string
  estimatedStudents: number
  message: string
  status: 'pending' | 'reviewed' | 'approved' | 'rejected'
  submittedAt: string
}

export type TermStatus = 'active' | 'upcoming' | 'completed'

export type CourseStatus = 'active' | 'upcoming' | 'completed' | 'archived'

export type AssignmentStatus = 'draft' | 'published' | 'upcoming' | 'active' | 'submitted' | 'graded' | 'overdue' | 'returned'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'unexplained'

export type MeetingPlatform = 'google_meet' | 'zoom' | 'in_person' | 'other'

export type MeetingStatus = 'scheduled' | 'live' | 'ended' | 'cancelled'

export type AssessmentType = 'quiz' | 'test' | 'exam' | 'practical' | 'project' | 'oral' | 'homework'

export type SubmissionStatus = 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'returned' | 'resubmitted'

export type NotificationCategory = 'academic' | 'attendance' | 'assignments' | 'grades' | 'messages' | 'announcements' | 'meetings' | 'institution' | 'system'

export type IntegrationStatus = 'not_connected' | 'connecting' | 'awaiting_authorization' | 'connected' | 'expired' | 'revoked' | 'error' | 'reconnect_required'

export type CalendarEventType = 'class' | 'exam' | 'assignment' | 'meeting' | 'office_hours' | 'study_group' | 'institution' | 'personal'

export type GradeWeight = {
  category: string
  weight: number
}

export type Institution = {
  id: string
  name: string
  shortName: string
  type: InstitutionType
  city: string
  country: string
  students: number
  teachers: number
  campuses: number
  programmes: number
  approved: boolean
  status: InstitutionStatus
  focus: string
  logo: string
  invitationStatus?: 'none' | 'pending' | 'accepted'
}

export type Campus = {
  id: string
  institutionId: string
  name: string
  address: string
  city: string
}

export type AcademicTerm = {
  id: string
  institutionId: string
  name: string
  startDate: string
  endDate: string
  status: TermStatus
}

export type Programme = {
  id: string
  institutionId: string
  name: string
  department: string
  level: 'primary' | 'secondary' | 'undergraduate' | 'postgraduate'
}

export type Course = {
  id: string
  institutionId: string
  termId: string
  programmeId: string
  code: string
  title: string
  description: string
  teacher: User
  teacherId: string
  progress: number
  currentModule: number
  totalModules: number
  grade: number | null
  attendance: number
  status: CourseStatus
  color: string
  nextLesson: string
  nextAssignment: string | null
  syllabus: SyllabusItem[]
  modules: CourseModule[]
  resources: CourseResource[]
  gradeWeights: GradeWeight[]
  enrolledStudents: number
  maxStudents: number
}

export type SyllabusItem = {
  week: number
  topic: string
  activities: string[]
}

export type CourseModule = {
  id: string
  title: string
  lessons: CourseLesson[]
  completed: boolean
  locked: boolean
}

export type CourseLesson = {
  id: string
  title: string
  type: 'video' | 'reading' | 'quiz' | 'lab' | 'activity' | 'discussion'
  duration: string
  completed: boolean
  locked: boolean
}

export type CourseResource = {
  id: string
  title: string
  type: 'document' | 'link' | 'video' | 'presentation' | 'download'
  url: string
  size?: string
  uploadedAt: string
}

export type User = {
  id: string
  name: string
  email: string
  avatar: string
  role: UserRole
  institutionId: string
  department?: string
  phone?: string
  joinDate: string
  bio?: string
}

export type Assignment = {
  id: string
  courseId: string
  courseName: string
  title: string
  description: string
  teacher: string
  dueDate: string
  publishedAt: string
  status: AssignmentStatus
  maxScore: number
  score: number | null
  submissionStatus: SubmissionStatus
  submissionDate: string | null
  feedback: string | null
  attachments: AssignmentAttachment[]
  rubric: RubricItem[]
  submissionHistory: SubmissionRecord[]
}

export type AssignmentAttachment = {
  id: string
  name: string
  type: string
  size: string
  url: string
}

export type RubricItem = {
  criterion: string
  description: string
  maxScore: number
  score: number | null
}

export type SubmissionRecord = {
  id: string
  submittedAt: string
  status: SubmissionStatus
  score: number | null
  feedback: string | null
}

export type Assessment = {
  id: string
  courseId: string
  courseName: string
  title: string
  type: AssessmentType
  description: string
  teacher: string
  startDate: string
  endDate: string
  duration: number | null
  maxScore: number
  score: number | null
  attempts: number
  maxAttempts: number
  status: 'upcoming' | 'active' | 'completed' | 'graded'
  instructions: string
  allowedResources: string[]
}

export type GradeEntry = {
  id: string
  courseId: string
  courseName: string
  courseCode: string
  assessmentName: string
  assessmentType: AssessmentType
  score: number
  maxScore: number
  weight: number
  category: string
  date: string
  feedback: string | null
}

export type CourseGrade = {
  courseId: string
  courseName: string
  courseCode: string
  average: number
  letterGrade: string
  entries: GradeEntry[]
  trend: 'improving' | 'stable' | 'declining'
}

export type AttendanceRecord = {
  id: string
  courseId: string
  courseName: string
  date: string
  status: AttendanceStatus
  timeIn: string | null
  timeOut: string | null
  note: string | null
}

export type AttendanceSummary = {
  courseId: string
  courseName: string
  total: number
  present: number
  absent: number
  late: number
  excused: number
  unexplained: number
  percentage: number
}

export type CalendarEvent = {
  id: string
  title: string
  description: string
  type: CalendarEventType
  date: string
  startTime: string
  endTime: string
  location: string | null
  courseId: string | null
  courseName: string | null
  meetingUrl: string | null
  meetingPlatform: MeetingPlatform | null
  attendees: CalendarAttendee[]
  isAllDay: boolean
  recurring: boolean
  recurringPattern: string | null
  reminder: boolean
  reminderMinutes: number | null
  color: string
}

export type CalendarAttendee = {
  id: string
  name: string
  email: string
  rsvp: 'accepted' | 'declined' | 'tentative' | 'pending'
}

export type Meeting = {
  id: string
  title: string
  description: string
  courseId: string | null
  courseName: string | null
  host: User
  platform: MeetingPlatform
  meetingUrl: string | null
  scheduledAt: string
  duration: number
  status: MeetingStatus
  attendees: MeetingAttendee[]
  recordingAvailable: boolean
}

export type MeetingAttendee = {
  id: string
  name: string
  avatar: string
  role: UserRole
  joinedAt: string | null
  status: 'joined' | 'waiting' | 'left' | 'invited'
}

export type Announcement = {
  id: string
  title: string
  content: string
  author: User
  courseId: string | null
  courseName: string | null
  publishedAt: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  pinned: boolean
  readBy: string[]
}

export type Message = {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  recipientId: string
  content: string
  timestamp: string
  read: boolean
  courseId: string | null
}

export type Notification = {
  id: string
  title: string
  message: string
  category: NotificationCategory
  timestamp: string
  read: boolean
  actionUrl: string | null
  source: string
  icon: string
}

export type Discussion = {
  id: string
  courseId: string
  title: string
  content: string
  author: User
  createdAt: string
  replies: DiscussionReply[]
  pinned: boolean
  locked: boolean
}

export type DiscussionReply = {
  id: string
  content: string
  author: User
  createdAt: string
  likes: number
  liked: boolean
}

export type Workspace = {
  institutionId: string
  campusId: string | null
  termId: string
  role: UserRole
  userName: string
  userId: string
  joinedAt: string
}

export type SearchResult = {
  id: string
  title: string
  subtitle: string
  type: 'person' | 'course' | 'assignment' | 'announcement' | 'document' | 'event' | 'meeting'
  url: string
  icon: string
}

export type TimetableSlot = {
  id: string
  courseId: string
  courseName: string
  courseCode: string
  teacher: string
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
  startTime: string
  endTime: string
  room: string
  type: 'lecture' | 'lab' | 'tutorial' | 'seminar'
  color: string
}

export type GoogleIntegration = {
  connected: boolean
  calendarSynced: boolean
  lastSynced: string | null
  syncedCalendars: string[]
  permissions: string[]
}

export type ZoomIntegration = {
  status: IntegrationStatus
  connectedEmail: string | null
  connectedAt: string | null
  expiresAt: string | null
}
