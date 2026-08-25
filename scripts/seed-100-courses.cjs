/** 100 COURSES - 10 per test institution, full content. ASCII-safe. */
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
let lastCall = 0
const Q = async (query) => {
  const wait = Math.max(0, 600 - (Date.now() - lastCall))
  if (wait) await sleep(wait)
  for (let attempt = 0; attempt < 8; attempt++) {
    lastCall = Date.now()
    const r = await fetch('https://api.supabase.com/v1/projects/ccqfhsfkhrkbpczmuolp/database/query', {
      method: 'POST',
      headers: { Authorization: 'Bearer process.env.SUPABASE_MGMT_KEY||'placeholder'', 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    if (r.status === 429 || r.status === 502) { await sleep(5000); continue }
    const j = await r.json().catch(() => null)
    return { status: r.status, j }
  }
  return { status: 429, j: null }
}

let seq = 200000
const uid = () => 'e1000000-0000-0000-0000-' + String(seq++).padStart(12, '0')
const days = (n) => new Date(Date.now() + n * 864e5).toISOString()
const day = (n) => days(n).slice(0, 10)

const SUBJECTS = [
  { name: 'Mathematics', code: 'MTH', lessons: ['Sets and Functions', 'Linear Equations', 'Quadratics', 'Sequences', 'Trigonometry Intro', 'Circle Geometry', 'Statistics Basics', 'Probability', 'Polynomials'] },
  { name: 'Physics', code: 'PHY', lessons: ['Motion Basics', 'Newton Laws', 'Forces', 'Energy', 'Momentum', 'Waves', 'Electricity', 'Magnetism', 'Thermal Physics'] },
  { name: 'Chemistry', code: 'CHM', lessons: ['Atomic Structure', 'Bonding', 'Periodic Table', 'Reactions', 'Acids and Bases', 'Moles', 'Organic Intro', 'Electrochemistry'] },
  { name: 'Biology', code: 'BIO', lessons: ['Cells', 'Genetics', 'Evolution', 'Ecology', 'Human Body', 'Plants', 'Microorganisms', 'Enzymes'] },
  { name: 'History', code: 'HIS', lessons: ['Ancient World', 'Medieval Era', 'Revolutions', 'World War I', 'World War II', 'Cold War', 'Modern Era'] },
  { name: 'English', code: 'ENG', lessons: ['Grammar Foundations', 'Essay Writing', 'Poetry Analysis', 'Short Fiction', 'Shakespeare', 'Modern Novels', 'Debate Skills'] },
  { name: 'Computer Science', code: 'CSC', lessons: ['Programming Basics', 'Variables and Types', 'Loops', 'Functions', 'Data Structures', 'Algorithms', 'Web Intro', 'Databases'] },
  { name: 'Geography', code: 'GEO', lessons: ['Maps and Skills', 'Climate', 'Rivers', 'Population', 'Urbanisation', 'Resources'] },
  { name: 'Economics', code: 'ECO', lessons: ['Supply and Demand', 'Markets', 'Inflation', 'Trade', 'Banking', 'Government Policy'] },
  { name: 'Art and Design', code: 'ART', lessons: ['Drawing Basics', 'Color Theory', 'Perspective', 'Digital Tools', 'Portfolio Building'] },
]

const esc = (s) => String(s).replace(/'/g, "''")

async function main() {
  const orgs = (await Q("SELECT id, name FROM institutions WHERE name LIKE 'Test %' ORDER BY name")).j
  if (!Array.isArray(orgs) || orgs.length === 0) { console.error('no orgs', JSON.stringify(orgs).slice(0, 150)); process.exit(1) }
  console.log('orgs:', orgs.length)
  orgs.forEach(o => { o.hex = o.id.split('-')[4]; o.term_id = 'e9000000-0000-0000-0000-' + o.hex })

  const courseIdsByOrg = {}
  const teacherCache = {}
  const studentCache = {}

  let courseCount = 0

  for (const org of orgs) {
    if (!teacherCache[org.id]) {
      teacherCache[org.id] = (await Q("SELECT id FROM users WHERE institution_id='" + org.id + "' AND role='teacher' ORDER BY email")).j || []
      studentCache[org.id] = (await Q("SELECT id FROM users WHERE institution_id='" + org.id + "' AND role='student' ORDER BY email")).j || []
    }
    const teachers = teacherCache[org.id]
    const S = studentCache[org.id].map(s => s.id)
    if (teachers.length === 0 || S.length === 0) { console.log('skip', org.name); continue }
    const T = teachers[0].id

    courseIdsByOrg[org.id] = []

    for (let si = 0; si < SUBJECTS.length; si++) {
      const subj = SUBJECTS[si]
      const code = subj.code + (100 + si)
      const existing = await Q("SELECT id FROM courses WHERE institution_id='" + org.id + "' AND code='" + code + "' ORDER BY created_at LIMIT 1")
      let courseId
      if (existing.j && existing.j.length > 0) {
        courseId = existing.j[0].id
      } else {
        courseId = uid()
      }

      let ins = { status: 200, j: null }
      if (!existing.j || existing.j.length === 0) ins = await Q(
        "INSERT INTO courses (id,institution_id,term_id,programme_id,teacher_id,code,title,description,status,color,max_students,enrolled_students) VALUES ('" +
        courseId + "','" + org.id + "','" + org.term_id + "','f9000000-0000-0000-0000-" + org.hex + "','" + T + "','" + code + "','" +
        esc(subj.name) + ' ' + (100 + si) + "','" + esc(subj.name) + " course at " + esc(org.name) + ".','active','" +
        ['blue', 'green', 'purple', 'orange', 'pink'][si % 5] + "',30,10) ON CONFLICT DO NOTHING",
      )
      if (ins.status !== 200 && ins.status !== 201 && ins.status !== 204) { console.log('course fail', code, ins.status, JSON.stringify(ins.j).slice(0, 130)); continue }
      courseCount++
      courseIdsByOrg[org.id].push({ courseId, subj, teacherId: T })

      await Q("INSERT INTO class_sections (course_id,name,room,day,start_time,end_time) VALUES ('" + courseId + "','" + code + " - Section A','Room " + (si + 10) + "','Monday','09:00','10:30'),('"+courseId+"','"+code+" - Section B','Room " + (si + 10) + "','Wednesday','11:00','12:30')")

      // Enrol 10 students (deterministic spread across the 50).
      const ten = []
      for (let k = 0; k < 10; k++) ten.push(S[(si * 7 + k * 5) % S.length])
      const uniqueTen = [...new Set(ten)]
      await Q("INSERT INTO course_enrolments (course_id,user_id) VALUES " + uniqueTen.map(sid => "('" + courseId + "','" + sid + "')").join(',') + " ON CONFLICT DO NOTHING")

      // Modules + lessons.
      const lessonSet = subj.lessons
      for (let m = 0; m < 3; m++) {
        const modId = uid()
        await Q("INSERT INTO course_modules (id,course_id,title,order_index,completed,locked) VALUES ('" + modId + "','" + courseId + "','Module " + (m + 1) + "'," + m + ",false," + (m > 0) + ")")
        const lessons = []
        for (let li = 0; li < 3; li++) {
          const l = lessonSet[m * 3 + li]
          if (!l) continue
          lessons.push("('" + uid() + "','" + modId + "','" + esc(l) + "','" + ['video', 'reading', 'quiz'][li] + "','" + (15 + li * 5) + " min'," + li + ",false," + (m > 0) + ")")
        }
        if (lessons.length) await Q("INSERT INTO course_lessons (id,module_id,title,type,duration,order_index,completed,locked) VALUES " + lessons.join(','))
      }

      // Assignments.
      const asgRows = []
      for (let ai = 0; ai < 3; ai++) {
        const t = ['Chapter Problems', 'Group Project', 'Reading Response'][ai]
        asgRows.push("('" + uid() + "','" + courseId + "','" + code + ' ' + esc(t) + "','Complete the assigned work.','Full instructions in class.','" + days(3 + ai * 5) + "','" + days(-10 + ai * 3) + "','published'," + (30 + ai * 10) + ",'file','none')")
      }
      await Q("INSERT INTO assignments (id,course_id,title,description,instructions,due_date,published_at,status,max_score,submission_type,late_policy) VALUES " + asgRows.join(','))

      // Quiz + 3 questions.
      const quizId = uid()
      await Q("INSERT INTO assessments (id,course_id,title,type,max_score,duration,status,start_date) VALUES ('" + quizId + "','" + courseId + "','" + code + ' Unit Quiz' + "','quiz',15,20,'active','" + days(-1) + "')")
      const qRows = []
      const bank = [
        ['multiple_choice', 'Which option best completes the statement for ' + esc(subj.name) + '?', '["Option A","Option B","Option C","Option D"]', 'Option B'],
        ['true_false', 'The core concept applies universally.', '["True","False"]', 'True'],
        ['short_answer', 'Explain the main idea in one sentence.', null, null],
      ]
      bank.forEach((q, qi) => {
        const opts = q[2] ? "'" + esc(q[2]) + "'" : 'null'
        const ans = q[3] ? "'" + q[3] + "'" : 'null'
        qRows.push("('" + uid() + "','" + quizId + "','" + q[0] + "','" + esc(q[1]) + "'," + opts + ',' + ans + ',5,' + qi + ')')
      })
      await Q("INSERT INTO assessment_questions (id,assessment_id,type,text,options,correct_answer,points,order_index) VALUES " + qRows.join(','))

      // Grades: 5 students x 2 entries.
      const gradeRows = []
      for (let gi = 0; gi < 5; gi++) {
        const sid = uniqueTen[gi]
        if (!sid) continue
        gradeRows.push("('" + uid() + "','" + courseId + "','" + sid + "','" + code + ' Quiz 1' + "','quiz'," + (12 + ((gi * 3) % 8)) + ',15,\'' + day(-3 - gi) + '\')')
        gradeRows.push("('" + uid() + "','" + courseId + "','" + sid + "','" + code + ' Homework 1' + "','homework'," + (40 + ((gi * 5) % 10)) + ',50,\'' + day(-6 - gi) + '\')')
      }
      if (gradeRows.length) await Q("INSERT INTO grade_entries (id,course_id,user_id,assessment_name,assessment_type,score,max_score,date) VALUES " + gradeRows.join(','))

      // Resources.
      await Q("INSERT INTO course_resources (course_id,title,type,url) VALUES ('" + courseId + "','" + esc(subj.name) + " Study Guide','document','https://openstax.org/'),('"+courseId+"','"+esc(subj.name)+" Practice Hub','link','https://www.khanacademy.org/')")
    }
    console.log('  ' + org.name + ': done')
  }

  // Course announcements (every 3rd course).
  let annCount = 0
  for (const orgId of Object.keys(courseIdsByOrg)) {
    const rows = []
    courseIdsByOrg[orgId].forEach((c, i) => {
      if (i % 3 !== 0) return
      annCount++
      rows.push("('" + uid() + "','" + orgId + "','" + c.courseId + "','" + c.teacherId + "','" + esc('Welcome to ' + c.subj.name) + "','Check the syllabus and say hello in the discussion thread.','normal',true,now())")
    })
    if (rows.length) {
      const fixed = rows.map(r => r)
      await Q("INSERT INTO announcements (id,institution_id,course_id,author_id,title,content,priority,pinned,published_at) VALUES " + fixed.join(','))
    }
  }
  console.log('announcements:', annCount)

  await Q("UPDATE courses c SET enrolled_students = (SELECT count(*) FROM course_enrolments ce WHERE ce.course_id = c.id AND ce.status='active') WHERE c.code ~ '^(MTH|PHY|CHM|BIO|HIS|ENG|CSC|GEO|ECO|ART)'")

  const chk = await Q(`
    SELECT
      (SELECT count(*) FROM courses WHERE code ~ '^(MTH|PHY|CHM|BIO|HIS|ENG|CSC|GEO|ECO|ART)') courses,
      (SELECT count(*) FROM course_modules m JOIN courses c ON c.id=m.course_id WHERE c.code ~ '^(MTH|PHY|CHM|BIO|HIS|ENG|CSC|GEO|ECO|ART)') modules,
      (SELECT count(*) FROM course_lessons l JOIN course_modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id WHERE c.code ~ '^(MTH|PHY|CHM|BIO|HIS|ENG|CSC|GEO|ECO|ART)') lessons,
      (SELECT count(*) FROM course_enrolments ce JOIN courses c ON c.id=ce.course_id WHERE c.code ~ '^(MTH|PHY|CHM|BIO|HIS|ENG|CSC|GEO|ECO|ART)') enrolments,
      (SELECT count(*) FROM assignments a JOIN courses c ON c.id=a.course_id WHERE c.code ~ '^(MTH|PHY|CHM|BIO|HIS|ENG|CSC|GEO|ECO|ART)') assignments,
      (SELECT count(*) FROM assessments a2 JOIN courses c ON c.id=a2.course_id WHERE c.code ~ '^(MTH|PHY|CHM|BIO|HIS|ENG|CSC|GEO|ECO|ART)') quizzes,
      (SELECT count(*) FROM assessment_questions q JOIN assessments a2 ON a2.id=q.assessment_id JOIN courses c ON c.id=a2.course_id WHERE c.code ~ '^(MTH|PHY|CHM|BIO|HIS|ENG|CSC|GEO|ECO|ART)') questions,
      (SELECT count(*) FROM grade_entries g JOIN courses c ON c.id=g.course_id WHERE c.code ~ '^(MTH|PHY|CHM|BIO|HIS|ENG|CSC|GEO|ECO|ART)') grades,
      (SELECT count(*) FROM course_resources r JOIN courses c ON c.id=r.course_id WHERE c.code ~ '^(MTH|PHY|CHM|BIO|HIS|ENG|CSC|GEO|ECO|ART)') resources
  `)
  console.log(JSON.stringify(chk.j[0], null, 2))
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
