/**
 * Showcase part 3: re-insert rows that failed in part 1, one by one,
 * with full error visibility. Skips rows that already exist.
 */
const URL = process.env.SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const INST = 'a1000000-0000-0000-0000-000000000001'

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
  return { t: r.access_token, id: r.user.id }
}

const days = (n) => new Date(Date.now() + n * 864e5).toISOString()
const day = (n) => days(n).slice(0, 10)

async function put(t, table, row, match) {
  const existing = await db(t, 'GET', `${table}?${match}&select=id`)
  if (existing.json?.length > 0) return 'skip'
  const r = await db(t, 'POST', table, row)
  if (r.status !== 201) {
    console.log(`  ERR ${table}/${row.title || row.name || row.content?.slice(0, 20)}:`, r.status, JSON.stringify(r.json)?.slice(0, 140))
    return 'err'
  }
  return 'ok'
}

async function main() {
  const T = await login('teacher@zynvera.app', 'Teacher#2026!x')
  const S = await login('student@zynvera.app', 'Student#2026!x')

  const courses = await db(T.t, 'GET', `courses?code=in.(PHY101,MTH101,ENG101)&select=id,code`)
  const C = {}
  for (const c of courses.json) C[c.code] = c.id
  const secs = await db(T.t, 'GET', `class_sections?select=id,name,course_id`)
  const secByName = {}
  for (const s of secs.json) secByName[s.name] = s.id
  const mtgs = await db(T.t, 'GET', `meetings?select=id,title`)
  const mtgByTitle = {}
  for (const m of mtgs.json) mtgByTitle[m.title] = m.id

  let okc = 0, errc = 0, skipc = 0
  const stat = (res) => { if (res === 'ok') okc++; else if (res === 'err') errc++; else skipc++ }

  console.log('Assignments')
  const asgs = [
    [C.PHY101, 'Kinematics Problem Set', 'Chapter 2 problems 1-20.', days(2), 50, 'file', '10', -7],
    [C.PHY101, 'Momentum Lab Report', 'Write up the collision lab.', days(9), 40, 'file', 'none', -3],
    [C.MTH101, 'Derivatives Worksheet', 'Chain rule and product rule practice.', days(-2), 30, 'file', '25', -10],
    [C.MTH101, 'Integration Basics', 'Antiderivatives intro.', days(12), 30, 'file', 'none', -1],
    [C.ENG101, 'Hamlet Act II Essay', '500 words on Hamlet and inaction.', days(5), 100, 'text', 'none', -5],
  ]
  for (const [cid, title, desc, due, max, stype, late, pub] of asgs) {
    stat(await put(T.t, 'assignments', {
      course_id: cid, title, description: desc, instructions: desc,
      due_date: due, max_score: max, status: 'published', published_at: days(pub),
      submission_type: stype, late_policy: late,
    }, `course_id=eq.${cid}&title=eq.${encodeURIComponent(title)}`))
  }

  console.log('Grades')
  const grades = [
    [C.PHY101, 'Kinematics Quiz', 'quiz', 18, 20, -1, 'Strong grasp of vectors.'],
    [C.PHY101, 'Lab: Collision Data', 'practical', 22, 25, -4, 'Great error analysis.'],
    [C.MTH101, 'Derivatives Check', 'quiz', 15, 15, -3, 'Perfect.'],
    [C.MTH101, 'Homework 1', 'homework', 24, 30, -8, 'Watch signs on chain rule.'],
    [C.ENG101, 'Act I Reading Response', 'homework', 88, 100, -6, 'Insightful close reading.'],
    [C.ENG101, 'Vocabulary Quiz', 'quiz', 17, 20, -2, null],
  ]
  for (const [cid, name, type, sc, max, d, fb] of grades) {
    stat(await put(T.t, 'grade_entries', {
      course_id: cid, user_id: S.id, assessment_name: name, assessment_type: type,
      score: sc, max_score: max, date: day(d), feedback: fb,
    }, `course_id=eq.${cid}&assessment_name=eq.${encodeURIComponent(name)}&user_id=eq.${S.id}`))
  }

  console.log('Resources')
  const res = [
    [C.PHY101, 'Kinematics Formula Sheet', 'document', 'https://openstax.org/physics', '1 MB'],
    [C.PHY101, 'Collision Lab Video Walkthrough', 'video', 'https://www.youtube.com/results?search_query=collision+lab+physics', null],
    [C.MTH101, 'Derivative Rules Cheat Sheet', 'document', 'https://tutorial.math.lamar.edu/pdf/Calc_Cheat_Sheet.pdf', '420 KB'],
    [C.ENG101, 'Hamlet - Full Text (MIT)', 'link', 'https://shakespeare.mit.edu/hamlet/', null],
  ]
  for (const [cid, title, type, url, size] of res) {
    stat(await put(T.t, 'course_resources', { course_id: cid, title, type, url, size }, `course_id=eq.${cid}&title=eq.${encodeURIComponent(title)}`))
  }

  console.log('Calendar events')
  const events = [
    [C.PHY101, 'Midterm Exam - Physics', 'exam', day(14), '09:00', '10:30', 'Exam Hall'],
    [C.PHY101, 'Momentum Lab Session', 'class', day(1), '14:00', '16:00', 'Lab 3'],
    [C.MTH101, 'Integration Basics due', 'assignment', day(12), null, null, null],
    [null, 'Sports Day', 'institution', day(7), '10:00', null, 'Main Field'],
    [null, 'Parent-Teacher Conferences', 'institution', day(10), '15:00', '18:00', 'Main Hall'],
  ]
  for (const [cid, title, type, date, st, et, loc] of events) {
    stat(await put(T.t, 'calendar_events', {
      institution_id: INST, course_id: cid, title, type, date,
      start_time: st, end_time: et, location: loc,
    }, `title=eq.${encodeURIComponent(title)}&date=eq.${date}`))
  }

  console.log('Timetable')
  const slots = [
    [C.PHY101, 'Monday', '09:00', '10:30', 'Lab 3', 'lecture', 'blue'],
    [C.MTH101, 'Tuesday', '11:00', '12:30', 'Room 204', 'lecture', 'purple'],
    [C.ENG101, 'Wednesday', '13:00', '14:30', 'Room 108', 'seminar', 'pink'],
    [C.PHY101, 'Thursday', '14:00', '16:00', 'Lab 3', 'lab', 'orange'],
    [C.MTH101, 'Friday', '09:00', '10:00', 'Room 204', 'tutorial', 'green'],
  ]
  for (const [cid, d, st, et, room, type, color] of slots) {
    stat(await put(T.t, 'timetable_slots', {
      course_id: cid, user_id: S.id, day: d, start_time: st, end_time: et,
      room, type, color,
    }, `course_id=eq.${cid}&user_id=eq.${S.id}&day=eq.${d}`))
  }

  console.log('Meeting attendees')
  for (const [title, uid] of [
    ['Live Review: Momentum Problems', S.id],
    ['Office Hours - Integrals', S.id],
    ['Lab Prep Briefing', S.id],
  ]) {
    const mid = mtgByTitle[title]
    if (!mid) { console.log('  missing meeting:', title); errc++; continue }
    stat(await put(T.t, 'meeting_attendees', { meeting_id: mid, user_id: uid, status: 'invited' }, `meeting_id=eq.${mid}&user_id=eq.${uid}`))
  }

  console.log('Messages')
  const msgs = [
    [T.id, S.id, 'Hi! Saw your quiz score - great work. Any questions before the midterm?'],
    [S.id, T.id, 'Thank you! Could we go over projectile motion once more?'],
    [T.id, S.id, 'Of course. Join office hours Thursday or message me anytime.'],
    [S.id, T.id, 'Will do, thanks!'],
  ]
  for (const [from, to, content] of msgs) {
    stat(await put(from === S.id ? S.t : T.t, 'messages', { sender_id: from, recipient_id: to, content }, `sender_id=eq.${from}&recipient_id=eq.${to}&content=eq.${encodeURIComponent(content)}`))
  }

  console.log('Notifications')
  const notifs = [
    ['New grade posted', 'Kinematics Quiz: 18/20 in Physics 101.', 'grades', '/student/grades'],
    ['Assignment due tomorrow', 'Kinematics Problem Set is due soon.', 'assignments', '/student/assignments'],
    ['New announcement', 'Sports Day is coming - check the calendar.', 'announcements', '/student/announcements'],
    ['Live class scheduled', 'Live Review: Momentum Problems - tomorrow.', 'meetings', '/student/meetings'],
  ]
  for (const [title, message, category, url] of notifs) {
    stat(await put(T.t, 'notifications', {
      user_id: S.id, title, message, category, action_url: url,
    }, `user_id=eq.${S.id}&title=eq.${encodeURIComponent(title)}`))
  }

  console.log(`\nDone: ${okc} inserted, ${skipc} skipped (existed), ${errc} errors`)
  if (errc > 0) process.exit(1)
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
