/**
 * PERSONA REVIEW — walks the app exactly as each UI page would.
 * Teacher builds → Student consumes → Principal oversees → Parent verifies scope.
 * Uses the real test accounts. Reports PASS/FAIL per persona.
 */
const URL = process.env.SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const INST = 'a1000000-0000-0000-0000-000000000001'
const TERM = 'c1000000-0000-0000-0000-000000000002'
const PROG = 'd1000000-0000-0000-0000-000000000001'

let pass = 0, fail = 0
const ok = (who, name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS ${name}`) }
  else { fail++; console.log(`  FAIL ${name} ${extra ? '→ ' + extra : ''}`) }
}

const login = async (email, password) => {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(x => x.json())
  if (!r.access_token) throw new Error(`login ${email}: ${JSON.stringify(r)}`)
  return { token: r.access_token, id: r.user.id }
}

const db = (t, method, path, body) =>
  fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json',
      Prefer: method === 'POST' || method === 'PATCH' ? 'return=representation' : undefined,
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async r => ({ status: r.status, json: await r.json().catch(() => null) }))

const stamp = Date.now().toString(36)

async function main() {
  console.log('═══ Logging in all personas ═══')
  const T = await login('teacher@zynvera.app', 'Teacher#2026!x')
  const S = await login('student@zynvera.app', 'Student#2026!x')
  const P = await login('admin@zynvera.app', 'ZynAdmin#2026!vR7x')
  const PAR = await login('parent@zynvera.app', 'Parent#2026!x')
  console.log('  all 4 logged in ✓\n')

  // ═══════════════════════ TEACHER ═══════════════════════
  console.log('═══ TEACHER: building a real class ═══')
  let r = await db(T.token, 'GET', `courses?teacher_id=eq.${T.id}&select=id,code,title`)
  ok('T', 'My Courses loads (dashboard/courses page)', Array.isArray(r.json))

  r = await db(T.token, 'POST', 'courses', {
    institution_id: INST, term_id: TERM, programme_id: PROG, teacher_id: T.id,
    code: `REV${stamp}`, title: 'Review Course', max_students: 30, status: 'active',
    description: 'Created during persona review',
  })
  const courseId = r.json?.[0]?.id
  ok('T', 'Course Builder → create course', r.status === 201 && !!courseId, JSON.stringify(r.json))

  r = await db(T.token, 'POST', 'class_sections', { course_id: courseId, name: 'Review Section', room: 'R1', day: 'Monday', start_time: '09:00', end_time: '10:30' })
  const sectionId = r.json?.[0]?.id
  ok('T', 'Classes → create section', r.status === 201 && !!sectionId)

  // Enrol the test student (roster page → Add Student).
  r = await db(T.token, 'GET', `users?email=eq.student@zynvera.app&select=id`)
  const sid = r.json?.[0]?.id
  r = await db(T.token, 'POST', 'course_enrolments', { course_id: courseId, user_id: sid })
  ok('T', 'Roster → add student', r.status === 201, JSON.stringify(r.json))

  r = await db(T.token, 'GET', `course_enrolments?course_id=eq.${courseId}&select=user_id,users(name,email)`)
  ok('T', 'Roster lists the student', r.json?.length === 1 && r.json[0].users?.name === 'Test Student')

  r = await db(T.token, 'POST', 'assignments', {
    course_id: courseId, title: 'Review Task 1', max_score: 20, status: 'published',
    published_at: new Date().toISOString(), due_date: new Date(Date.now() + 5 * 864e5).toISOString(),
    instructions: 'Answer the review question.',
  })
  const asgId = r.json?.[0]?.id
  ok('T', 'Assignment Manager → publish assignment', r.status === 201 && !!asgId)

  r = await db(T.token, 'GET', `submissions?assignment_id=eq.${asgId}&select=*`)
  ok('T', 'Grading dialog loads submissions (empty)', Array.isArray(r.json) && r.json.length === 0)

  r = await db(T.token, 'POST', 'discussions', { course_id: courseId, author_id: T.id, title: 'Welcome — ask anything', content: 'Use this thread for questions.' })
  ok('T', 'Discussions → new topic', r.status === 201)

  r = await db(T.token, 'POST', 'rubrics', {
    course_id: courseId, title: 'Review Rubric', points_possible: 10, created_by: T.id,
  })
  const rubricId = r.json?.[0]?.id
  r = await db(T.token, 'POST', 'rubric_criteria', { rubric_id: rubricId, description: 'Accuracy', points: 10, order_index: 0 })
  const critId = r.json?.[0]?.id
  r = await db(T.token, 'POST', 'rubric_ratings', [
    { criterion_id: critId, label: 'Perfect', points: 10, order_index: 0 },
    { criterion_id: critId, label: 'Partial', points: 5, order_index: 1 },
  ])
  ok('T', 'Rubric builder saves structure', r.status === 201)

  console.log('')

  // ═══════════════════════ STUDENT ═══════════════════════
  console.log('═══ STUDENT: consuming the course ═══')
  r = await db(S.token, 'GET', `course_enrolments?user_id=eq.${S.id}&select=course_id`)
  const myCourseIds = (r.json ?? []).map(x => x.course_id)
  ok('S', 'Dashboard → my courses', myCourseIds.includes(courseId))

  r = await db(S.token, 'GET', `courses?id=in.(${myCourseIds.join(',')})&select=id,code,title`)
  ok('S', 'Courses page shows Review Course', r.json?.some(c => c.id === courseId))

  r = await db(S.token, 'GET', `assignments?course_id=in.(${myCourseIds.join(',')})&status=in.(published,active,returned)&select=id,title,due_date,max_score`)
  const myAsg = r.json ?? []
  ok('S', 'Assignments page shows published task', myAsg.some(a => a.id === asgId))

  r = await db(S.token, 'POST', 'submissions', {
    assignment_id: asgId, user_id: S.id, status: 'submitted',
    submitted_at: new Date().toISOString(), feedback: 'Here is my review answer.',
  })
  const subId = r.json?.[0]?.id
  ok('S', 'Submit work', r.status === 201 && !!subId, JSON.stringify(r.json))

  // Teacher grades (SpeedGrader action).
  r = await db(T.token, 'PATCH', `submissions?id=eq.${subId}`, { score: 18, status: 'graded', graded_by: T.id, graded_at: new Date().toISOString(), feedback: 'Nice work.' })
  ok('T', 'SpeedGrader → grade submission', r.status === 200 && r.json?.[0]?.score === 18)

  r = await db(S.token, 'GET', `submissions?id=eq.${subId}&select=score,status,feedback`)
  ok('S', 'Sees grade + feedback', r.json?.[0]?.score === 18 && r.json?.[0]?.status === 'graded')

  // Gradebook entry (teacher records quiz score too).
  r = await db(T.token, 'POST', 'grade_entries', {
    course_id: courseId, user_id: S.id, assessment_name: 'Review Quiz', assessment_type: 'quiz', score: 9, max_score: 10,
  })
  const geId = r.json?.[0]?.id
  ok('T', 'Gradebook inline entry saved', r.status === 201 && !!geId)

  r = await db(S.token, 'GET', `grade_entries?user_id=eq.${S.id}&select=score,max_score,assessment_name`)
  ok('S', 'Grades page shows the quiz', r.json?.some(g => g.assessment_name === 'Review Quiz'))

  // Attendance (teacher takes register).
  const today = new Date().toISOString().slice(0, 10)
  r = await db(T.token, 'POST', 'attendance_records', [
    { class_section_id: sectionId, user_id: S.id, date: today, status: 'present' },
  ])
  ok('T', 'Attendance register saved', r.status === 201)

  r = await db(S.token, 'GET', `attendance_records?user_id=eq.${S.id}&select=status,date`)
  ok('S', 'Attendance page shows today present', r.json?.some(a => a.date === today && a.status === 'present'))

  r = await db(S.token, 'GET', `discussions?course_id=eq.${courseId}&select=id,title`)
  ok('S', 'Community → sees teacher topic', r.json?.some(d => d.title.startsWith('Welcome')))

  r = await db(S.token, 'GET', `users?id=eq.${S.id}&select=family_code`)
  const fam = r.json?.[0]?.family_code
  ok('S', 'Family code page loads (8 digits)', /^\d{8}$/.test(fam ?? ''), `got: ${fam}`)

  r = await db(S.token, 'GET', `notifications?user_id=eq.${S.id}&select=id`)
  ok('S', 'Notifications page loads', Array.isArray(r.json))

  console.log('')

  // ═══════════════════════ PRINCIPAL ═══════════════════════
  console.log('═══ PRINCIPAL: oversight of everything ═══')
  r = await db(P.token, 'GET', `courses?id=eq.${courseId}&select=id,code,title`)
  ok('P', 'Course Management sees teacher course', r.json?.length === 1)

  r = await db(P.token, 'GET', `submissions?assignment_id=eq.${asgId}&select=id,score`)
  ok('P', 'Sees graded submission (oversight)', r.json?.[0]?.score === 18)

  r = await db(P.token, 'GET', `attendance_records?class_section_id=eq.${sectionId}&select=id,status`)
  ok('P', 'Sees attendance records', r.json?.length >= 1)

  r = await db(P.token, 'GET', `users?role=eq.student&select=id,name`)
  ok('P', 'Student Management lists students', r.json?.some(u => u.name === 'Test Student'))

  r = await db(P.token, 'GET', `users?role=eq.teacher&select=id,name`)
  ok('P', 'Staff Management lists teachers', r.json?.some(u => u.name === 'Test Teacher'))

  r = await db(P.token, 'POST', 'announcements', { institution_id: INST, author_id: P.id, title: `Review Notice ${stamp}`, content: 'School-wide update.', priority: 'normal' })
  ok('P', 'Announcements → publish', r.status === 201)

  r = await db(S.token, 'GET', `announcements?title=eq.${encodeURIComponent('Review Notice ' + stamp)}&select=id`)
  ok('S', 'Student receives announcement', r.json?.length >= 1)

  r = await db(P.token, 'POST', 'institution_alerts', { institution_id: INST, title: 'Review Alert', message: 'Testing alerts.', severity: 'info', created_by: P.id })
  const alertId = r.json?.[0]?.id
  ok('P', 'Alerts → raise', r.status === 201 && !!alertId)
  r = await db(P.token, 'PATCH', `institution_alerts?id=eq.${alertId}`, { status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: P.id })
  ok('P', 'Alerts → resolve', r.status === 200 && r.json?.[0]?.status === 'resolved')

  r = await db(P.token, 'POST', 'departments', { institution_id: INST, name: `Review Dept ${stamp}`, budget: 50000 })
  const deptId = r.json?.[0]?.id
  ok('P', 'Departments → create', r.status === 201 && !!deptId)

  r = await db(P.token, 'POST', 'finance_transactions', { institution_id: INST, type: 'income', category: 'Fees', amount: 1500, tx_date: today })
  ok('P', 'Finance → record income', r.status === 201)

  r = await db(P.token, 'GET', `parent_links?select=id,status,users!parent_links_parent_user_id_fkey(name),student:users!parent_links_student_user_id_fkey(name)`)
  ok('P', 'Parent Management lists approved link', r.json?.some(l => l.status === 'approved' && l.student?.name === 'Test Student'))

  r = await db(P.token, 'GET', `grade_entries?course_id=eq.${courseId}&select=score,max_score`)
  ok('P', 'Analytics source data (grade summary)', r.json?.length >= 1)

  console.log('')

  // ═══════════════════════ PARENT ═══════════════════════
  console.log('═══ PARENT: scoped to own child only ═══')
  r = await db(PAR.token, 'GET', `parent_links?parent_user_id=eq.${PAR.id}&select=student_user_id,status`)
  ok('PAR', 'Link shows approved', r.json?.[0]?.status === 'approved')
  const childId = r.json?.[0]?.student_user_id

  r = await db(PAR.token, 'GET', `grade_entries?user_id=eq.${childId}&select=score,max_score,assessment_name`)
  ok('PAR', 'Child grades visible', r.json?.some(g => g.assessment_name === 'Review Quiz'))

  r = await db(PAR.token, 'GET', `attendance_records?user_id=eq.${childId}&select=status`)
  ok('PAR', 'Child attendance visible', r.json?.some(a => a.status === 'present'))

  // Denials: principal is NOT their child.
  const P_id = P.id
  r = await db(PAR.token, 'GET', `grade_entries?user_id=eq.${P_id}&select=id`)
  ok('PAR', 'DENIED: non-child grades invisible', Array.isArray(r.json) && r.json.length === 0)

  r = await db(PAR.token, 'GET', `attendance_records?user_id=eq.${P_id}&select=id`)
  ok('PAR', 'DENIED: non-child attendance invisible', Array.isArray(r.json) && r.json.length === 0)

  // Parent cannot write anywhere they shouldn't.
  r = await db(PAR.token, 'POST', 'courses', { institution_id: INST, term_id: TERM, teacher_id: PAR.id, code: 'HACK', title: 'Nope' })
  ok('PAR', 'DENIED: cannot create courses', r.status !== 201)

  console.log(`\n═══ REVIEW COMPLETE: ${pass} passed, ${fail} failed ═══`)
  if (fail > 0) process.exit(1)
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
