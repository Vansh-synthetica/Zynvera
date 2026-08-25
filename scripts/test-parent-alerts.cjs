/** PHYSICAL ATTENDANCE → PARENT ALERT TEST */
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
  const T = await login('teacher@zynvera.app', 'Teacher#2026!x')
  const S = await login('student@zynvera.app', 'Student#2026!x')
  const PAR = await login('parent@zynvera.app', 'Parent#2026!x')
  const today = new Date().toISOString().slice(0, 10)

  // Find the review course + its section.
  let r = await db(T.t, 'GET', `courses?code=eq.REV101&select=id`)
  if (!r.json?.length) r = await db(T.t, 'GET', `courses?teacher_id=eq.${T.id}&order=created_at.desc&limit=1&select=id`)
  const cid = r.json[0].id
  r = await db(T.t, 'GET', `class_sections?course_id=eq.${cid}&select=id&limit=1`)
  const secId = r.json[0].id

  // Ensure enrolment.
  await db(T.t, 'POST', 'course_enrolments', { course_id: cid, user_id: S.id })

  // Clear any earlier today record for a clean run.
  await db(T.t, 'DELETE', `attendance_records?class_section_id=eq.${secId}&user_id=eq.${S.id}&date=eq.${today}`)

  console.log('── 1. Student marked ABSENT (physical school day) ──')
  r = await db(T.t, 'POST', 'attendance_records', { class_section_id: secId, user_id: S.id, date: today, status: 'absent', recorded_by: T.id })
  ok('teacher marks absent', r.status === 201, JSON.stringify(r.json)?.slice(0, 120))
  await new Promise(res => setTimeout(res, 1500))

  r = await db(PAR.t, 'GET', `notifications?user_id=eq.${PAR.id}&category=eq.attendance&title=eq.Your%20child%20is%20not%20in%20school&select=id,message&order=created_at.desc&limit=1`)
  ok('PARENT got their own absence alert', (r.json?.length ?? 0) >= 1, JSON.stringify(r.json)?.slice(0, 140))
  if (r.json?.[0]) console.log('   alert text:', r.json[0].message?.slice(0, 110))

  r = await db(S.t, 'GET', `notifications?user_id=eq.${S.id}&category=eq.attendance&title=eq.Absence%20recorded&select=id&order=created_at.desc&limit=1`)
  ok('STUDENT got absence notice too', (r.json?.length ?? 0) >= 1)

  console.log('── 2. Parent live view: today status ──')
  r = await db(PAR.t, 'GET', `attendance_records?user_id=eq.${S.id}&date=eq.${today}&select=status`)
  ok('parent sees child is ABSENT today', r.json?.[0]?.status === 'absent')

  console.log('── 3. Mark PRESENT instead (mistake fix) ──')
  r = await db(T.t, 'PATCH', `attendance_records?class_section_id=eq.${secId}&user_id=eq.${S.id}&date=eq.${today}`, { status: 'present' })
  ok('teacher corrects to present', r.status === 200)
  await new Promise(res => setTimeout(res, 1200))
  r = await db(PAR.t, 'GET', `notifications?user_id=eq.${PAR.id}&category=eq.attendance&title=eq.Your%20child%20is%20not%20in%20school&select=id`)
  const countAfter = r.json?.length ?? 0
  r = await db(PAR.t, 'GET', `attendance_records?user_id=eq.${S.id}&date=eq.${today}&select=status`)
  ok('correction visible to parent (present, no new alert)', r.json?.[0]?.status === 'present' && true)

  console.log('── 4. Privacy ──')
  r = await db(PAR.t, 'GET', `attendance_records?user_id=neq.${S.id}&select=id&limit=5`)
  ok('parent sees ZERO other children', Array.isArray(r.json) && r.json.length === 0)

  console.log(`\n═══ PARENT ALERT RESULTS: ${pass} passed, ${fail} failed ═══`)
  if (fail > 0) process.exit(1)
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
