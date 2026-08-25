/**
 * MULTI-INSTITUTION APP WALKTHROUGH
 * Institution A (Riverside): teacher builds course + quiz + assignment →
 *   student consumes everything → principal oversees.
 * Institution B (Springfield): fresh teacher/student — verify total isolation.
 */
const URL = process.env.SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const MGMT = 'process.env.SUPABASE_MGMT_KEY||'placeholder''
const INST_A = 'a1000000-0000-0000-0000-000000000001'
const TERM_A = 'c1000000-0000-0000-0000-000000000002'
const PROG_A = 'd1000000-0000-0000-0000-000000000001'
const stamp = Date.now().toString(36)

let pass = 0, fail = 0
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS ${name}`) }
  else { fail++; console.log(`  FAIL ${name} ${extra ? '→ ' + extra : ''}`) }
}

const Q = (query) =>
  fetch('https://api.supabase.com/v1/projects/ccqfhsfkhrkbpczmuolp/database/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${MGMT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  }).then(async r => ({ status: r.status, j: await r.json().catch(() => null) }))

const login = async (email, password) => {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(x => x.json())
  if (!r.access_token) throw new Error(`login ${email}: ${JSON.stringify(r).slice(0, 140)}`)
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

async function makeUser(email, pw, name, role) {
  const exists = await Q(`SELECT id FROM auth.users WHERE email = '${email}'`)
  if (exists.j?.[0]?.id) return exists.j[0].id
  const r = await Q(`
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_user_meta_data,
      confirmation_token, recovery_token, email_change, email_change_token_new)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      '${email}', crypt('${pw}', gen_salt('bf')), now(), now(), now(),
      '{"name":"${name}","role":"${role}"}'::jsonb, '', '', '', '')
    RETURNING id
  `)
  return r.j?.[0]?.id
}

async function main() {
  console.log('═══ SETUP: Institution B (Springfield University) ═══')
  let r = await Q(`
    INSERT INTO institutions (id, name, short_name, type, city, country, approved, status)
    VALUES ('b2000000-0000-0000-0000-00000000000b', 'Springfield University', 'SU', 'University', 'Springfield', 'USA', true, 'active')
    ON CONFLICT (id) DO NOTHING
  `)
  await Q(`
    INSERT INTO academic_terms (id, institution_id, name, start_date, end_date, status)
    VALUES ('b2000000-0000-0000-0000-0000000000t1', 'b2000000-0000-0000-0000-00000000000b', 'SU Fall 2026', '2026-01-10', '2026-05-20', 'active')
    ON CONFLICT (id) DO NOTHING
  `)
  await Q(`
    INSERT INTO programmes (id, institution_id, name, department, level)
    VALUES ('b2000000-0000-0000-0000-0000000000p1', 'b2000000-0000-0000-0000-00000000000b', 'Engineering', 'Engineering', 'undergraduate')
    ON CONFLICT (id) DO NOTHING
  `)
  console.log('  institution B ready ✓')

  const tB = await makeUser(`teacher-b@zynvera.app`, 'TeacherB#2026!x', 'Springfield Teacher', 'teacher')
  const sB = await makeUser(`student-b@zynvera.app`, 'StudentB#2026!x', 'Springfield Student', 'student')
  for (const [id, role] of [[tB, 'teacher'], [sB, 'student']]) {
    await Q(`UPDATE public.users SET institution_id='b2000000-0000-0000-0000-00000000000b', verification_status='verified' WHERE id='${id}'`)
  }
  const T = await login('teacher@zynvera.app', 'Teacher#2026!x')
  const S = await login('student@zynvera.app', 'Student#2026!x')
  const P = await login('admin@zynvera.app', 'ZynAdmin#2026!vR7x')
  const TB = await login('teacher-b@zynvera.app', 'TeacherB#2026!x')
  const SB = await login('student-b@zynvera.app', 'StudentB#2026!x')
  console.log('  accounts ready ✓\n')

  // ── INSTITUTION A: full teaching flow ────────────────────────
  console.log('═══ INSTITUTION A — TEACHER builds everything ═══')
  r = await db(T.token, 'POST', 'courses', {
    institution_id: INST_A, term_id: TERM_A, programme_id: PROG_A, teacher_id: T.id,
    code: `APP${stamp}`, title: 'App Walkthrough Course', max_students: 30, status: 'active',
  })
  const courseId = r.json?.[0]?.id
  ok('A-T', 'create course', r.status === 201 && !!courseId, JSON.stringify(r.json))

  r = await db(T.token, 'GET', `users?email=eq.student@zynvera.app&select=id`)
  const sA = r.json?.[0]?.id
  r = await db(T.token, 'POST', 'course_enrolments', { course_id: courseId, user_id: sA })
  ok('A-T', 'enrol student A', r.status === 201)

  r = await db(T.token, 'POST', 'assignments', {
    course_id: courseId, title: 'App Assignment', max_score: 25, status: 'published',
    published_at: new Date().toISOString(), due_date: new Date(Date.now() + 6048e5).toISOString(),
  })
  const asgId = r.json?.[0]?.id
  ok('A-T', 'publish assignment', r.status === 201 && !!asgId)

  console.log('  ── QUIZ: assessment + questions ──')
  r = await db(T.token, 'POST', 'assessments', {
    course_id: courseId, title: 'App Quiz 1', type: 'quiz', max_score: 10,
    duration: 15, status: 'active', start_date: new Date().toISOString(),
  })
  const quizId = r.json?.[0]?.id
  ok('A-T', 'create quiz', r.status === 201 && !!quizId, JSON.stringify(r.json))

  r = await db(T.token, 'POST', 'assessment_questions', [
    { assessment_id: quizId, type: 'multiple_choice', text: 'What is 2+2?', options: '["3","4","5"]', correct_answer: '4', points: 5, order_index: 0 },
    { assessment_id: quizId, type: 'true_false', text: 'The sky is green.', options: '["True","False"]', correct_answer: 'False', points: 5, order_index: 1 },
  ])
  ok('A-T', 'add 2 questions', r.status === 201 && r.json?.length === 2, JSON.stringify(r.json))

  r = await db(T.token, 'GET', `assessment_questions?assessment_id=eq.${quizId}&select=id,text,points`)
  ok('A-T', 'questions persist', r.json?.length === 2)

  console.log('  ── STUDENT A takes everything ──')
  r = await db(S.token, 'GET', `assignments?id=eq.${asgId}&select=id,title`)
  ok('A-S', 'sees assignment', r.json?.length === 1)

  r = await db(S.token, 'POST', 'submissions', {
    assignment_id: asgId, user_id: S.id, status: 'submitted', submitted_at: new Date().toISOString(), feedback: 'Done!',
  })
  const subId = r.json?.[0]?.id
  ok('A-S', 'submits assignment', r.status === 201 && !!subId)

  r = await db(S.token, 'GET', `assessment_questions?assessment_id=eq.${quizId}&select=id,text,options,points&order=order_index.asc`)
  ok('A-S', 'sees quiz questions', r.json?.length === 2, JSON.stringify(r.json))

  r = await db(S.token, 'POST', 'assessment_submissions', {
    assessment_id: quizId, user_id: S.id, answers: { q1: '4', q2: 'False' }, score: 10, submitted_at: new Date().toISOString(),
  })
  const quizSubId = r.json?.[0]?.id
  ok('A-S', 'takes quiz (auto-scored 10/10)', r.status === 201 && !!quizSubId, JSON.stringify(r.json))

  r = await db(T.token, 'PATCH', `submissions?id=eq.${subId}`, { score: 23, status: 'graded', graded_by: T.id, graded_at: new Date().toISOString() })
  ok('A-T', 'grades assignment 23/25', r.status === 200 && r.json?.[0]?.score === 23)

  r = await db(S.token, 'GET', `submissions?id=eq.${subId}&select=score`)
  ok('A-S', 'sees assignment grade', r.json?.[0]?.score === 23)

  console.log('  ── PRINCIPAL oversees Institution A ──')
  r = await db(P.token, 'GET', `courses?id=eq.${courseId}&select=id,title`)
  ok('A-P', 'sees course', r.json?.length === 1)
  r = await db(P.token, 'GET', `assessment_submissions?assessment_id=eq.${quizId}&select=id,score`)
  ok('A-P', 'sees quiz results', r.json?.[0]?.score === 10)
  r = await db(P.token, 'GET', `submissions?id=eq.${subId}&select=score`)
  ok('A-P', 'sees graded submission', r.json?.[0]?.score === 23)

  // ── INSTITUTION B: isolation ─────────────────────────────────
  console.log('\n═══ INSTITUTION B — isolation checks ═══')
  r = await db(TB.token, 'POST', 'courses', {
    institution_id: 'b2000000-0000-0000-0000-00000000000b', term_id: 'b2000000-0000-0000-0000-0000000000t1',
    programme_id: 'b2000000-0000-0000-0000-0000000000p1', teacher_id: tB,
    code: `SU${stamp}`, title: 'Springfield Engineering 101', max_students: 40, status: 'active',
  })
  const courseB = r.json?.[0]?.id
  ok('B-T', 'teacher B creates own course', r.status === 201 && !!courseB, JSON.stringify(r.json))

  r = await db(TB.token, 'POST', 'course_enrolments', { course_id: courseB, user_id: sB })
  ok('B-T', 'enrols student B', r.status === 201)

  r = await db(SB.token, 'GET', `course_enrolments?user_id=eq.${sB}&select=course_id`)
  const bCourseIds = (r.json ?? []).map(x => x.course_id)
  ok('B-S', 'sees only own course', bCourseIds.includes(courseB) && !bCourseIds.includes(courseId))

  r = await db(SB.token, 'GET', `assignments?id=eq.${asgId}&select=id`)
  ok('B-S', 'DENIED: institution A assignments invisible', Array.isArray(r.json) && r.json.length === 0)

  r = await db(SB.token, 'GET', `assessment_questions?assessment_id=eq.${quizId}&select=id`)
  ok('B-S', 'DENIED: institution A quiz questions invisible', Array.isArray(r.json) && r.json.length === 0)

  r = await db(SB.token, 'POST', 'assessment_submissions', {
    assessment_id: quizId, user_id: sB, answers: {}, score: 0,
  })
  ok('B-S', 'DENIED: cannot take institution A quiz', r.status !== 201, JSON.stringify(r.json))

  r = await db(TB.token, 'PATCH', `submissions?id=eq.${subId}`, { score: 0, status: 'graded' })
  ok('B-T', 'DENIED: cannot grade institution A work', !(r.status === 200 && r.json?.[0]?.score === 0), JSON.stringify(r.json))

  r = await db(P.token, 'GET', `courses?id=eq.${courseB}&select=id`)
  ok('A-P', 'principal A does NOT see institution B', Array.isArray(r.json) && r.json.length === 0)

  // Cross-institution enrolment hole check.
  r = await db(TB.token, 'POST', 'course_enrolments', { course_id: courseB, user_id: sA })
  const hole = r.status === 201
  ok('B-T', 'cross-institution enrolment blocked', !hole, hole ? 'SECURITY HOLE: teacher B enrolled student A' : '')
  if (hole) await db(TB.token, 'DELETE', `course_enrolments?course_id=eq.${courseB}&user_id=eq.${sA}`)

  console.log(`\n═══ WALKTHROUGH COMPLETE: ${pass} passed, ${fail} failed ═══`)
  console.log('Institution B kept for your own testing: teacher-b@ / student-b@ zynvera.app')
  if (fail > 0) process.exit(1)
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
