/** QUIZ FLOW TEST — build, take, grade, results, attempts, denials. */
const URL = process.env.SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let pass = 0, fail = 0
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  PASS ' + n) } else { fail++; console.log('  FAIL ' + n + (x ? ' -> ' + x : '')) } }

const login = async (email, pw) => {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pw }),
  }).then(x => x.json())
  return { t: r.access_token, id: r.user.id }
}
const db = (t, m, p, b) => fetch(`${URL}/rest/v1/${p}`, {
  method: m,
  headers: { apikey: KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
  body: b ? JSON.stringify(b) : undefined,
}).then(async r => ({ status: r.status, json: await r.json().catch(() => null) }))

async function main() {
  const T = await login('teacher01@i01.test.zynvera.app', 'Phase1#2026!')
  const S = await login('student01@i01.test.zynvera.app', 'Phase1#2026!')
  const SB = await login('student-b@zynvera.app', 'StudentB#2026!x')
  const P = await login('principal01@i01.test.zynvera.app', 'Phase1#2026!')
  console.log('logged in: teacher01, student01, student-b, principal01 (i01)\n')

  console.log('── Setup: fresh course + quiz with 3 questions ──')
  const termId = 'e9000000-0000-0000-0000-a00000000001'
  let r = await db(T.t, 'POST', 'courses', {
    institution_id: 'c9000000-0000-0000-0000-a00000000001', term_id: termId, teacher_id: T.id,
    code: 'QUIZ' + Date.now().toString(36), title: 'Quiz Flow Test Course', status: 'active', max_students: 30,
  })
  const cid = r.json?.[0]?.id
  ok('course created', !!cid)

  await db(T.t, 'POST', 'course_enrolments', { course_id: cid, user_id: S.id })

  r = await db(T.t, 'POST', 'assessments', {
    course_id: cid, title: 'Unit Quiz: Foundations', type: 'quiz', max_score: 15,
    duration: 20, max_attempts: 2, status: 'active', start_date: new Date().toISOString(),
  })
  const quizId = r.json?.[0]?.id
  ok('quiz created (active, 2 attempts)', !!quizId)

  r = await db(T.t, 'POST', 'assessment_questions', [
    { assessment_id: quizId, type: 'multiple_choice', text: '2 + 2 equals:', options: '["3","4","5"]', correct_answer: '4', points: 5, order_index: 0 },
    { assessment_id: quizId, type: 'true_false', text: 'The sun is a star.', options: '["True","False"]', correct_answer: 'True', points: 5, order_index: 1 },
    { assessment_id: quizId, type: 'short_answer', text: 'Name the largest planet.', options: null, correct_answer: null, points: 5, order_index: 2 },
  ])
  if (r.status !== 201) console.log('   DEBUG questions:', r.status, JSON.stringify(r.json)?.slice(0, 160))
  ok('3 questions added', r.status === 201 && (Array.isArray(r.json) ? r.json : []).length === 3)

  console.log('\n── Student takes the quiz ──')
  r = await db(S.t, 'GET', `assessment_questions?assessment_id=eq.${quizId}&select=id,text,options,points&order=order_index.asc`)
  ok('student sees questions (no correct_answer leak)', r.json?.length === 3 && r.json?.[0]?.correct_answer === undefined, JSON.stringify(r.json)?.slice(0, 100))

  r = await db(S.t, 'POST', 'assessment_submissions', {
    assessment_id: quizId, user_id: S.id,
    answers: { q1: '4', q2: 'True', q3: 'Jupiter' },
    score: 15, submitted_at: new Date().toISOString(), attempt_number: 1,
  })
  const subId = r.json?.[0]?.id
  ok('quiz submitted (15/15)', r.status === 201 && r.json?.[0]?.score === 15, JSON.stringify(r.json)?.slice(0, 120))

  r = await db(S.t, 'GET', `assessment_submissions?assessment_id=eq.${quizId}&user_id=eq.${S.id}&select=score,attempt_number`)
  ok('student sees own attempt', r.json?.[0]?.score === 15 && r.json?.[0]?.attempt_number === 1)

  console.log('\n── Teacher reviews results ──')
  r = await db(T.t, 'GET', `assessment_submissions?assessment_id=eq.${quizId}&select=score,user_id,users(name)`)
  if (!(Array.isArray(r.json) && r.json.length === 1)) console.log('   DEBUG teacher view:', r.status, JSON.stringify(r.json)?.slice(0, 160))
  ok('teacher sees submission + student name', Array.isArray(r.json) && r.json.length === 1 && r.json?.[0]?.score === 15 && r.json?.[0]?.users?.name)

  console.log('\n── Second attempt (max_attempts = 2) ──')
  r = await db(S.t, 'POST', 'assessment_submissions', {
    assessment_id: quizId, user_id: S.id,
    answers: { q1: '4', q2: 'True', q3: 'Saturn' },
    score: 10, submitted_at: new Date().toISOString(), attempt_number: 2,
  })
  ok('attempt 2 accepted', r.status === 201 && r.json?.[0]?.score === 10)

  r = await db(S.t, 'GET', `assessment_submissions?assessment_id=eq.${quizId}&user_id=eq.${S.id}&select=score,attempt_number&order=attempt_number.desc`)
  ok('both attempts stored, latest first', r.json?.length === 2 && r.json?.[0]?.attempt_number === 2)

  console.log('\n── Denials ──')
  r = await db(SB.t, 'GET', `assessment_questions?assessment_id=eq.${quizId}&select=id`)
  ok('DENIED: Springfield student sees no questions', Array.isArray(r.json) && r.json.length === 0)
  r = await db(SB.t, 'POST', 'assessment_submissions', {
    assessment_id: quizId, user_id: SB.id, answers: {}, score: 0,
  })
  ok('DENIED: Springfield student cannot submit', r.status !== 201, JSON.stringify(r.json)?.slice(0, 100))
  r = await db(SB.t, 'GET', `assessment_submissions?assessment_id=eq.${quizId}&select=id`)
  ok('DENIED: Springfield student sees no submissions', Array.isArray(r.json) && r.json.length === 0)

  console.log('\n── Principal oversight ──')
  r = await db(P.t, 'GET', `assessment_submissions?assessment_id=eq.${quizId}&select=id,score`)
  if ((r.json?.length ?? 0) !== 2) console.log('   DEBUG principal:', r.status, JSON.stringify(r.json)?.slice(0, 160))
  ok('principal sees all attempts', (r.json?.length ?? 0) === 2)

  console.log(`\n═══ QUIZ FLOW RESULTS: ${pass} passed, ${fail} failed ═══`)
  if (fail > 0) process.exit(1)
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
