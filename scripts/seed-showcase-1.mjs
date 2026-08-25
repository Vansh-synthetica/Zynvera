/**
 * Showcase data part 1: courses, enrolments, assignments, quizzes,
 * grades, attendance. Idempotent.
 */
const URL = process.env.SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const INST = 'a1000000-0000-0000-0000-000000000001'
const TERM = 'c1000000-0000-0000-0000-000000000002'
const PROG = 'd1000000-0000-0000-0000-000000000001'

const db = (t, method, path, body) =>
  fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async r => ({ status: r.status, json: await r.json().catch(() => null) }))

const login = async (email, pw) => {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pw }),
  }).then(x => x.json())
  if (!r.access_token) throw new Error(`login ${email} failed`)
  return { t: r.access_token, id: r.user.id }
}

const days = (n) => new Date(Date.now() + n * 864e5).toISOString()
const day = (n) => days(n).slice(0, 10)

async function main() {
  const T = await login('teacher@zynvera.app', 'Teacher#2026!x')
  const S = await login('student@zynvera.app', 'Student#2026!x')

  const chk = await db(T.t, 'GET', `assignments?title=eq.Kinematics Problem Set&select=id`)
  if (chk.json?.length > 0) { console.log('Already seeded - skipping part 1'); return }

  console.log('1) Courses')
  const mk = (code, title, desc, color) =>
    db(T.t, 'POST', 'courses', {
      institution_id: INST, term_id: TERM, programme_id: PROG, teacher_id: T.id,
      code, title, description: desc, color, max_students: 30, status: 'active',
    }).then(r => r.json[0].id)

  const physics = await mk('PHY101', 'Physics 101 - Mechanics', 'Motion, forces, energy and momentum. Weekly labs.', 'blue')
  const math = await mk('MTH101', 'Mathematics - Calculus I', 'Limits, derivatives and integrals.', 'purple')
  const eng = await mk('ENG101', 'English Literature', 'From Shakespeare to modern voices.', 'pink')
  console.log('  3 courses created')

  console.log('2) Sections + enrolment')
  const sec = await db(T.t, 'POST', 'class_sections', [
    { course_id: physics, name: 'PHY101 - Section A', room: 'Lab 3', day: 'Monday', start_time: '09:00', end_time: '10:30' },
    { course_id: physics, name: 'PHY101 - Lab', room: 'Lab 3', day: 'Thursday', start_time: '14:00', end_time: '16:00' },
    { course_id: math, name: 'MTH101 - Section A', room: 'Room 204', day: 'Tuesday', start_time: '11:00', end_time: '12:30' },
    { course_id: eng, name: 'ENG101 - Seminar', room: 'Room 108', day: 'Wednesday', start_time: '13:00', end_time: '14:30' },
  ])
  const phySectionA = sec.json.find(s => s.name === 'PHY101 - Section A').id
  const mathSection = sec.json.find(s => s.name === 'MTH101 - Section A').id
  const engSection = sec.json.find(s => s.name === 'ENG101 - Seminar').id
  const phyLab = sec.json.find(s => s.name === 'PHY101 - Lab').id

  for (const cid of [physics, math, eng]) {
    await db(T.t, 'POST', 'course_enrolments', { course_id: cid, user_id: S.id })
    await db(T.t, 'PATCH', `courses?id=eq.${cid}`, { enrolled_students: 1 })
  }
  console.log('  4 sections, student enrolled in all')

  console.log('3) Assignments')
  const asgs = await db(T.t, 'POST', 'assignments', [
    { course_id: physics, title: 'Kinematics Problem Set', description: 'Chapter 2 problems 1-20.', instructions: 'Show all working. Upload a PDF or share a Drive link.', due_date: days(2), max_score: 50, status: 'published', published_at: days(-7), submission_type: 'file', late_policy: '10' },
    { course_id: physics, title: 'Momentum Lab Report', description: 'Write up the collision lab.', instructions: 'Include data tables, graphs and error analysis.', due_date: days(9), max_score: 40, status: 'published', published_at: days(-3), submission_type: 'file' },
    { course_id: math, title: 'Derivatives Worksheet', description: 'Chain rule and product rule practice.', due_date: days(-2), max_score: 30, status: 'published', published_at: days(-10), late_policy: '25' },
    { course_id: math, title: 'Integration Basics', description: 'Antiderivatives intro.', due_date: days(12), max_score: 30, status: 'published', published_at: days(-1) },
    { course_id: eng, title: 'Hamlet Act II Essay', description: '500 words on Hamlet and inaction.', due_date: days(5), max_score: 100, status: 'published', published_at: days(-5), submission_type: 'text' },
  ])
  console.log('  5 assignments')

  console.log('4) Quizzes with questions')
  const quiz1 = await db(T.t, 'POST', 'assessments', {
    course_id: physics, title: 'Kinematics Quiz', type: 'quiz', max_score: 20, duration: 15,
    status: 'active', start_date: days(0), instructions: 'Answer all questions. One attempt.',
  })
  const q1id = quiz1.json[0].id
  await db(T.t, 'POST', 'assessment_questions', [
    { assessment_id: q1id, type: 'multiple_choice', text: 'A ball is dropped from rest. After 2 s its speed is (g = 10 m/s2):', options: '["10 m/s","20 m/s","40 m/s","5 m/s"]', correct_answer: '20 m/s', points: 10, order_index: 0 },
    { assessment_id: q1id, type: 'true_false', text: 'Displacement can be negative.', options: '["True","False"]', correct_answer: 'True', points: 5, order_index: 1 },
    { assessment_id: q1id, type: 'short_answer', text: 'State Newtons first law.', points: 5, order_index: 2 },
  ])
  const quiz2 = await db(T.t, 'POST', 'assessments', {
    course_id: math, title: 'Derivatives Check', type: 'quiz', max_score: 15, duration: 10,
    status: 'completed', start_date: days(-3),
  })
  const q2id = quiz2.json[0].id
  await db(T.t, 'POST', 'assessment_questions', [
    { assessment_id: q2id, type: 'multiple_choice', text: 'd/dx of x^2 is:', options: '["x","2x","x^3/3","2"]', correct_answer: '2x', points: 15, order_index: 0 },
  ])
  const midterm = await db(T.t, 'POST', 'assessments', {
    course_id: physics, title: 'Midterm Exam', type: 'exam', max_score: 100, duration: 90,
    status: 'active', start_date: days(14), instructions: 'Covers chapters 1-4.',
  })
  console.log('  2 quizzes + upcoming midterm')

  // Student already took the completed math quiz.
  await db(S.t, 'POST', 'assessment_submissions', {
    assessment_id: q2id, user_id: S.id, answers: { q1: '2x' }, score: 15,
    submitted_at: days(-3), attempt_number: 1,
  })

  console.log('5) Grades (gradebook)')
  await db(T.t, 'POST', 'grade_entries', [
    { course_id: physics, user_id: S.id, assessment_name: 'Kinematics Quiz', assessment_type: 'quiz', score: 18, max_score: 20, date: day(-1), feedback: 'Strong grasp of vectors.' },
    { course_id: physics, user_id: S.id, assessment_name: 'Lab: Collision Data', assessment_type: 'practical', score: 22, max_score: 25, date: day(-4), feedback: 'Great error analysis.' },
    { course_id: math, user_id: S.id, assessment_name: 'Derivatives Check', assessment_type: 'quiz', score: 15, max_score: 15, date: day(-3), feedback: 'Perfect.' },
    { course_id: math, user_id: S.id, assessment_name: 'Homework 1', assessment_type: 'homework', score: 24, max_score: 30, date: day(-8), feedback: 'Watch signs on chain rule.' },
    { course_id: eng, user_id: S.id, assessment_name: 'Act I Reading Response', assessment_type: 'homework', score: 88, max_score: 100, date: day(-6), feedback: 'Insightful close reading.' },
    { course_id: eng, user_id: S.id, assessment_name: 'Vocabulary Quiz', assessment_type: 'quiz', score: 17, max_score: 20, date: day(-2) },
  ])

  console.log('6) Attendance (3 weeks)')
  const records = []
  const statuses = ['present', 'present', 'present', 'late', 'present', 'absent', 'present']
  let idx = 0
  for (let d = 21; d >= 1; d -= 2) {
    for (const [name, secid] of [['PHY101 - Section A', phySectionA], ['MTH101 - Section A', mathSection], ['ENG101 - Seminar', engSection]]) {
      const st = statuses[idx % statuses.length]
      records.push({
        class_section_id: secid, user_id: S.id, date: day(-d),
        status: st, note: st === 'absent' ? 'Not feeling well' : null, recorded_by: T.id,
      })
      idx++
    }
  }
  await db(T.t, 'POST', 'attendance_records', records)
  const phyLabToday = { class_section_id: phyLab, user_id: S.id, date: day(3), status: 'present' }
  void phyLabToday
  console.log(`  ${records.length} records`)

  console.log('7) Discussion topics + replies')
  const d1 = await db(T.t, 'POST', 'discussions', {
    course_id: physics, author_id: T.id, title: 'Week 3: Ask anything about momentum',
    content: 'Post your questions before Friday and I will answer them all here.', pinned: true,
  })
  const d1id = d1.json[0].id
  await db(S.t, 'POST', 'discussion_replies', { discussion_id: d1id, author_id: S.id, content: 'Is momentum conserved when friction acts?' })
  await db(T.t, 'POST', 'discussion_replies', { discussion_id: d1id, author_id: T.id, content: 'Great question - in an isolated system yes. Friction means external force, so some momentum transfers to the floor.' })
  await db(T.t, 'POST', 'discussions', {
    course_id: eng, author_id: T.id, title: 'Is Hamlet actually mad?', content: 'Argue yes or no with textual evidence.',
  })
  const d3 = await db(T.t, 'POST', 'discussions', {
    course_id: math, author_id: T.id, title: 'Study group for the integration test', content: 'Thursdays 4pm, library room 2.',
  })
  await db(S.t, 'POST', 'discussion_replies', { discussion_id: d3.json[0].id, author_id: S.id, content: 'Im in! Can we cover integration by parts?' })

  console.log('8) Resources')
  await db(T.t, 'POST', 'course_resources', [
    { course_id: physics, title: 'Kinematics Formula Sheet', type: 'document', url: 'https://openstax.org/apps/archive/20250826.165338/resources', size: '1 MB' },
    { course_id: physics, title: 'Collision Lab Video Walkthrough', type: 'video', url: 'https://www.youtube.com/results?search_query=collision+lab+physics' },
    { course_id: math, title: 'Derivative Rules Cheat Sheet', type: 'document', url: 'https://tutorial.math.lamar.edu/pdf/Calc_Cheat_Sheet.pdf', size: '420 KB' },
    { course_id: eng, title: 'Hamlet - Full Text (MIT)', type: 'link', url: 'https://shakespeare.mit.edu/hamlet/' },
  ])

  console.log('9) Timetable for the student')
  await db(T.t, 'POST', 'timetable_slots', [
    { course_id: physics, user_id: S.id, day: 'Monday', start_time: '09:00', end_time: '10:30', room: 'Lab 3', type: 'lecture', color: 'blue' },
    { course_id: math, user_id: S.id, day: 'Tuesday', start_time: '11:00', end_time: '12:30', room: 'Room 204', type: 'lecture', color: 'purple' },
    { course_id: eng, user_id: S.id, day: 'Wednesday', start_time: '13:00', end_time: '14:30', room: 'Room 108', type: 'seminar', color: 'pink' },
    { course_id: physics, user_id: S.id, day: 'Thursday', start_time: '14:00', end_time: '16:00', room: 'Lab 3', type: 'lab', color: 'orange' },
    { course_id: math, user_id: S.id, day: 'Friday', start_time: '09:00', end_time: '10:00', room: 'Room 204', type: 'tutorial', color: 'green' },
  ])

  console.log('10) Calendar events')
  await db(T.t, 'POST', 'calendar_events', [
    { institution_id: INST, course_id: physics, title: 'Midterm Exam - Physics', type: 'exam', date: day(14), start_time: '09:00', end_time: '10:30', location: 'Exam Hall' },
    { institution_id: INST, course_id: physics, title: 'Momentum Lab Session', type: 'class', date: day(1), start_time: '14:00', end_time: '16:00', location: 'Lab 3' },
    { institution_id: INST, course_id: math, title: 'Integration Basics due', type: 'assignment', date: day(12) },
    { institution_id: INST, title: 'Sports Day', type: 'institution', date: day(7), start_time: '10:00', location: 'Main Field' },
    { institution_id: INST, title: 'Parent-Teacher Conferences', type: 'institution', date: day(10), start_time: '15:00', end_time: '18:00', location: 'Main Hall' },
  ])

  console.log('11) Meetings (video classes)')
  const mtgs = await db(T.t, 'POST', 'meetings', [
    { course_id: physics, host_id: T.id, title: 'Live Review: Momentum Problems', platform: 'google_meet', meeting_url: 'https://meet.google.com/zyv-review-01', scheduled_at: days(1), duration: 60, status: 'scheduled' },
    { course_id: math, host_id: T.id, title: 'Office Hours - Integrals', platform: 'zoom', meeting_url: 'https://zoom.us/j/zyv-office', scheduled_at: days(3), duration: 30, status: 'scheduled' },
    { course_id: physics, host_id: T.id, title: 'Lab Prep Briefing', platform: 'google_meet', meeting_url: 'https://meet.google.com/zyv-lab-prep', scheduled_at: days(-2), duration: 45, status: 'ended' },
  ])
  for (const m of mtgs.json) {
    await db(T.t, 'POST', 'meeting_attendees', { meeting_id: m.id, user_id: S.id, status: 'invited' })
  }

  console.log('12) Messages thread')
  await db(T.t, 'POST', 'messages', [
    { sender_id: T.id, recipient_id: S.id, content: 'Hi! Saw your quiz score - great work. Any questions before the midterm?' },
    { sender_id: S.id, recipient_id: T.id, content: 'Thank you! Could we go over projectile motion once more?' },
    { sender_id: T.id, recipient_id: S.id, content: 'Of course. Join office hours Thursday or message me anytime.' },
    { sender_id: S.id, recipient_id: T.id, content: 'Will do, thanks!' },
  ])

  console.log('13) Notifications for the student')
  await db(T.t, 'POST', 'notifications', [
    { user_id: S.id, title: 'New grade posted', message: 'Kinematics Quiz: 18/20 in Physics 101.', category: 'grades', action_url: '/student/grades' },
    { user_id: S.id, title: 'Assignment due tomorrow', message: 'Kinematics Problem Set is due soon.', category: 'assignments', action_url: '/student/assignments' },
    { user_id: S.id, title: 'New announcement', message: 'Sports Day is coming - check the calendar.', category: 'announcements', action_url: '/student/announcements' },
    { user_id: S.id, title: 'Live class scheduled', message: 'Live Review: Momentum Problems - tomorrow.', category: 'meetings', action_url: '/student/meetings' },
  ])

  console.log('14) Course announcements by teacher')
  await db(T.t, 'POST', 'announcements', [
    { institution_id: INST, course_id: physics, author_id: T.id, title: 'Lab safety briefing moved to Thursday', content: 'The safety briefing will happen at the start of the lab session. Bring your goggles.', priority: 'high' },
    { institution_id: INST, course_id: eng, author_id: T.id, title: 'Reading schedule updated', content: 'We will cover Act III this week instead of Act II.', priority: 'normal' },
  ])

  console.log('15) Principal extras')
  await db(P.t, 'POST', 'announcements', [
    { institution_id: INST, author_id: P.id, title: 'Midterm week schedule', content: 'Midterms run the week after next. Check your course pages for exact times.', priority: 'high', pinned: true },
    { institution_id: INST, author_id: P.id, title: 'Library extended hours', content: 'Library open until 7 PM during exam season.', priority: 'normal' },
  ])
  await db(P.t, 'POST', 'finance_transactions', [
    { institution_id: INST, type: 'income', category: 'Tuition', amount: 125000, description: 'Term 2 tuition batch', tx_date: day(-30) },
    { institution_id: INST, type: 'expense', category: 'Salaries', amount: 68000, description: 'Monthly payroll', tx_date: day(-15) },
    { institution_id: INST, type: 'expense', category: 'Technology', amount: 9500, description: 'New lab laptops', tx_date: day(-8) },
  ])
  await db(P.t, 'POST', 'finance_budgets', [
    { institution_id: INST, category: 'Technology', fiscal_year: '2026', budgeted_amount: 60000 },
    { institution_id: INST, category: 'Events', fiscal_year: '2026', budgeted_amount: 25000 },
  ])
  await db(P.t, 'POST', 'departments', { institution_id: INST, name: 'Physical Sciences', code: 'PHY', budget: 120000, description: 'Physics and chemistry programmes.' })

  console.log('\nPart 1 complete: courses, work, grades, attendance, schedule.')
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
