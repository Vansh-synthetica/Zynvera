/** ATTENDANCE STRESS TEST — duplicates, concurrency, notifications, audit, denials. */
const URL = process.env.SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const INST = 'a1000000-0000-0000-0000-000000000001'

let pass = 0, fail = 0
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  PASS ' + n) } else { fail++; console.log('  FAIL ' + n + (x ? ' -> ' + x : '')) } }

const login = async (email, pw) => {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pw }),
  }).then(x => x.json())
  if (!r.access_token) throw new Error('login ' + email)
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
  const S2 = await login('student02@i01.test.zynvera.app', 'Phase1#2026!')
  const P = await login('principal01@i01.test.zynvera.app', 'Phase1#2026!')
  const TB = await login('teacher-b@zynvera.app', 'TeacherB#2026!x')
  console.log('logged in: teacher/student/student2/principal (i01) + teacher-b (Springfield)\n')

  const today = new Date().toISOString().slice(0, 10)

  console.log('── Setup: course + section + 5 enrolled students ──')
  let r = await db(T.t, 'POST', 'courses', {
    institution_id: INST, term_id: 'e9000000-0000-0000-0000-a00000000001', teacher_id: T.id, code: 'ATT' + today.replace(/-/g, ''),
    title: 'Attendance Test Course', status: 'active',
  })
  const cid = r.json?.[0]?.id
  ok('course created', !!cid, JSON.stringify(r.json))

  r = await db(T.t, 'POST', 'class_sections', { course_id: cid, name: 'ATT Section', day: 'Monday' })
  const secId = r.json?.[0]?.id
  ok('section created', !!secId)

  const studs = [S.id, S2.id]
  for (let n = 3; n <= 5; n++) {
    const u = await login(`student0${n}@i01.test.zynvera.app`, 'Phase1#2026!')
    studs.push(u.id)
  }
  for (const sid of studs) {
    r = await db(T.t, 'POST', 'course_enrolments', { course_id: cid, user_id: sid })
    if (r.status !== 201) ok('enrol ' + sid, false, JSON.stringify(r.json))
  }
  ok('5 students enrolled', true)

  console.log('\n── TEST 1: bulk mark 5 students ──')
  const recs = studs.map((sid, i) => ({
    class_section_id: secId, user_id: sid, date: today,
    status: i === 0 ? 'present' : i === 1 ? 'absent' : 'present', recorded_by: T.id,
  }))
  r = await db(T.t, 'POST', 'attendance_records', recs)
  ok('bulk mark 5/5', r.status === 201 && (Array.isArray(r.json) ? r.json : []).length === 5, JSON.stringify(r.json)?.slice(0, 140))

  r = await db(T.t, 'GET', `attendance_records?class_section_id=eq.${secId}&date=eq.${today}&select=id`)
  ok('exactly 5 rows (no duplicates)', (Array.isArray(r.json) ? r.json : []).length === 5, 'got ' + r.json?.length)

  console.log('\n── TEST 2: duplicate upsert (same students, changed status) ──')
  const up = await fetch(URL + '/rest/v1/attendance_records?on_conflict=class_section_id,user_id,date', {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${T.t}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify([
      { class_section_id: secId, user_id: studs[2], date: today, status: 'late', recorded_by: T.id },
      { class_section_id: secId, user_id: studs[3], date: today, status: 'excused', recorded_by: T.id },
    ]),
  })
  r = { status: up.status, json: await up.json().catch(() => null) }
  ok('upsert accepted', r.status === 201 || r.status === 200, JSON.stringify(r.json)?.slice(0, 120))
  r = await db(T.t, 'GET', `attendance_records?class_section_id=eq.${secId}&date=eq.${today}&select=id,status`)
  ok('STILL exactly 5 rows', (Array.isArray(r.json) ? r.json : []).length === 5, 'got ' + r.json?.length)
  ok('status updated in place', (Array.isArray(r.json) ? r.json : []).some(x => x.status === 'late') && (Array.isArray(r.json) ? r.json : []).some(x => x.status === 'excused'))

  console.log('\n── TEST 3: concurrent double-submit (race) ──')
  const same = { class_section_id: secId, user_id: studs[4], date: today, status: 'present', recorded_by: T.id }
  const [a, b] = await Promise.all([
    db(T.t, 'POST', 'attendance_records', [same]),
    db(T.t, 'POST', 'attendance_records', [same]),
  ])
  r = await db(T.t, 'GET', `attendance_records?class_section_id=eq.${secId}&date=eq.${today}&user_id=eq.${studs[4]}&select=id`)
  ok('race: still 1 row for student', (Array.isArray(r.json) ? r.json : []).length === 1, 'got ' + r.json?.length)

  console.log('\n── TEST 4: absence auto-notification (DB trigger) ──')
  r = await db(T.t, 'PATCH', `attendance_records?class_section_id=eq.${secId}&user_id=eq.${S.id}&date=eq.${today}`, { status: 'absent' })
  ok('marked absent (present->absent transition)', r.status === 200)
  await new Promise(res => setTimeout(res, 1500))
  r = await db(S.t, 'GET', `notifications?user_id=eq.${S.id}&title=eq.Absence%20recorded&select=id,message`)
  ok('absence notification auto-created', (r.json?.length ?? 0) >= 1, JSON.stringify(r.json)?.slice(0, 100))
  const before = r.json?.length
  // Re-save same absence — must NOT double-notify.
  r = await db(T.t, 'PATCH', `attendance_records?class_section_id=eq.${secId}&user_id=eq.${S.id}&date=eq.${today}`, { status: 'absent' })
  await new Promise(res => setTimeout(res, 1000))
  r = await db(S.t, 'GET', `notifications?user_id=eq.${S.id}&title=eq.Absence%20recorded&select=id`)
  ok('re-save does NOT duplicate notification', r.json?.length === before, `before ${before} after ${r.json?.length}`)

  console.log('\n── TEST 5: audit trail ──')
  r = await db(T.t, 'GET', `attendance_audit?class_section_id=eq.${secId}&select=old_status,new_status`)
  ok('audit rows logged', (r.json?.length ?? 0) >= 6, 'got ' + r.json?.length)
  ok('status transition captured', (Array.isArray(r.json) ? r.json : []).some(x => x.old_status === 'present' && x.new_status === 'absent'))

  console.log('\n── TEST 6: validation ──')
  r = await db(T.t, 'POST', 'attendance_records', [{ class_section_id: secId, user_id: studs[0], date: today, status: 'sleeping' }])
  ok('invalid status rejected', r.status !== 201)
  const future = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10)
  r = await db(T.t, 'POST', 'attendance_records', [{ class_section_id: secId, user_id: studs[0], date: future, status: 'present' }])
  ok('future date rejected', r.status !== 201, JSON.stringify(r.json)?.slice(0, 100))

  console.log('\n── TEST 7: persona visibility ──')
  r = await db(S.t, 'GET', `attendance_records?user_id=eq.${S.id}&select=id,status`)
  ok('student sees own record', (Array.isArray(r.json) ? r.json : []).length >= 1)
  r = await db(S2.t, 'GET', `attendance_records?user_id=eq.${S.id}&select=id`)
  ok('student2 CANNOT see student1 rows', r.json?.length === 0)
  r = await db(P.t, 'GET', `attendance_records?class_section_id=eq.${secId}&select=id`)
  ok('principal sees all 5 (oversight)', (Array.isArray(r.json) ? r.json : []).length === 5, 'got ' + r.json?.length)

  console.log('\n── TEST 8: cross-institution denial ──')
  r = await db(TB.t, 'GET', `attendance_records?class_section_id=eq.${secId}&select=id`)
  ok('Springfield teacher CANNOT see i01 attendance', r.json?.length === 0, 'got ' + r.json?.length)
  r = await db(TB.t, 'PATCH', `attendance_records?class_section_id=eq.${secId}&date=eq.${today}`, { status: 'present' })
  console.log('   DEBUG cross-inst PATCH:', r.status, JSON.stringify(r.json)?.slice(0, 120))
  ok('Springfield teacher CANNOT modify i01 attendance', Array.isArray(r.json) && r.json.length === 0, JSON.stringify(r.json)?.slice(0, 80))

  console.log(`\n═══ ATTENDANCE RESULTS: ${pass} passed, ${fail} failed ═══`)
  if (fail > 0) process.exit(1)
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
