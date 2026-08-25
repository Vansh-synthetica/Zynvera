const { createClient } = require('@supabase/supabase-js')

const URL = process.env.SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function main() {
  // Create a Supabase client as student01
  const { data: auth } = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student01@i01.test.zynvera.app', password: 'Phase1#2026!' }),
  }).then(x => x.json())

  const supa = createClient(URL, KEY, {
    global: { headers: { Authorization: `Bearer ${auth.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  console.log('user:', auth.user.id)

  // Find quiz
  const { data: quizzes } = await supa.from('assessments')
    .select('id, title, course_id, max_attempts')
    .ilike('title', '%Unit Quiz%')
    .order('created_at', { ascending: false })
    .limit(1)
  const quiz = quizzes?.[0]
  console.log('quiz:', quiz?.id, quiz?.title)

  // Check enrolment
  const { data: enr } = await supa.from('course_enrolments')
    .select('id, status')
    .eq('course_id', quiz.course_id)
  console.log('enrolment:', JSON.stringify(enr))

  // Check existing submissions
  const { data: subs } = await supa.from('assessment_submissions')
    .select('id, attempt_number')
    .eq('assessment_id', quiz.id)
  console.log('existing subs:', JSON.stringify(subs))

  // Try INSERT
  const { data, error } = await supa.from('assessment_submissions').insert({
    assessment_id: quiz.id,
    user_id: auth.user.id,
    answers: { q1: '4' },
    score: 5,
    submitted_at: new Date().toISOString(),
    attempt_number: 1,
  }).select()
  console.log('INSERT result:', error ? `ERROR ${error.code}: ${error.message}` : `OK ${JSON.stringify(data)}`)

  // Try minimal INSERT (no answers/score)
  if (error) {
    const { data: d2, error: e2 } = await supa.from('assessment_submissions').insert({
      assessment_id: quiz.id,
      user_id: auth.user.id,
    }).select()
    console.log('MINIMAL INSERT:', e2 ? `ERROR ${e2.code}: ${e2.message}` : `OK ${JSON.stringify(d2)}`)
  }
}
main().catch(e => { console.error(e.message); process.exit(1) })
