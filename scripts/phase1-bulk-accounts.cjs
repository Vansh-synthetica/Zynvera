/** PHASE 1 BULK ACCOUNTS - 10 orgs x (50 students + 20 teachers + 10 principals) = 800 */
const fs = require('fs')

const MGMT = 'process.env.SUPABASE_MGMT_KEY||'placeholder''
const Q = (query) =>
  fetch('https://api.supabase.com/v1/projects/ccqfhsfkhrkbpczmuolp/database/query', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + MGMT, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  }).then(async r => ({ status: r.status, j: await r.json().catch(() => null) }))

const PASSWORD = 'Phase1#2026!'
let seq = 0
const uid = () => {
  seq++
  return 'd0000000-0000-0000-0000-' + String(seq).padStart(12, '0')
}

const ORGS = []
for (let i = 1; i <= 5; i++) ORGS.push({ code: 'i' + String(i).padStart(2, '0'), name: 'Test Institute ' + String(i).padStart(2, '0'), type: 'University', hex: 'a' + String(i).padStart(11, '0') })
for (let i = 1; i <= 5; i++) ORGS.push({ code: 's' + String(i).padStart(2, '0'), name: 'Test School ' + String(i).padStart(2, '0'), type: 'School', hex: 'b' + String(i).padStart(11, '0') })

async function main() {
  console.log('1) Institutions + terms + programmes')
  for (const org of ORGS) {
    org.id = 'c9000000-0000-0000-0000-' + org.hex
    org.termId = 'e9000000-0000-0000-0000-' + org.hex
    await Q("INSERT INTO institutions (id,name,short_name,type,city,country,approved,status) VALUES ('" + org.id + "','" + org.name + "','" + org.code.toUpperCase() + "','" + org.type + "','Test City','Testland',true,'active') ON CONFLICT (id) DO NOTHING")
    await Q("INSERT INTO academic_terms (id,institution_id,name,start_date,end_date,status) VALUES ('" + org.termId + "','" + org.id + "','Phase 1 Term','2026-01-01','2026-12-31','active') ON CONFLICT (id) DO NOTHING")
    await Q("INSERT INTO programmes (id,institution_id,name,department,level) VALUES ('f9000000-0000-0000-0000-" + org.hex + "','" + org.id + "','General Studies','General','secondary') ON CONFLICT (id) DO NOTHING")
  }
  console.log('   10 orgs ready')

  console.log('2) Building 800 accounts…')
  const csv = ['role,email,password,institution_code,institution_name']
  const all = []
  const pad2 = (n) => String(n).padStart(2, '0')

  for (const org of ORGS) {
    const plan = []
    for (let n = 1; n <= 50; n++) plan.push({ role: 'student', num: n })
    for (let n = 1; n <= 20; n++) plan.push({ role: 'teacher', num: n })
    for (let n = 1; n <= 10; n++) plan.push({ role: 'principal', num: n })

    for (const p of plan) {
      const email = p.role + pad2(p.num) + '@' + org.code + '.test.zynvera.app'
      const name = p.role.charAt(0).toUpperCase() + p.role.slice(1) + ' ' + pad2(p.num) + ' ' + org.code.toUpperCase()
      const id = uid()
      all.push({ id, email, name, role: p.role, org })
      csv.push(p.role + ',' + email + ',' + PASSWORD + ',' + org.code + ',' + org.name)
    }
  }

  // Insert in chunks of 20.
  let done = 0
  for (let i = 0; i < all.length; i += 20) {
    const chunk = all.slice(i, i + 20)
    const rows = chunk.map(m => {
      const meta = JSON.stringify(JSON.stringify({ name: m.name, role: m.role }))
      return "('00000000-0000-0000-0000-000000000000','" + m.id + "','authenticated','authenticated','" + m.email + "',crypt('" + PASSWORD + "',gen_salt('bf')),now(),now(),now(),'" + meta + "'::jsonb,'','','','')"
    })
    const sql = 'INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_user_meta_data,confirmation_token,recovery_token,email_change,email_change_token_new) VALUES ' + rows.join(',') + ' ON CONFLICT DO NOTHING'
    const r = await Q(sql)
    if (r.status !== 200 && r.status !== 201) {
      console.log('   chunk error at', i, JSON.stringify(r.j).slice(0, 160))
    } else {
      done += chunk.length
      if (done % 100 === 0) console.log('   ' + done + ' created')
    }
  }
  console.log('   ' + done + ' auth accounts created')

  console.log('3) Assigning institutions…')
  for (const org of ORGS) {
    const emails = all.filter(m => m.org.code === org.code).map(m => "'" + m.email + "'").join(',')
    await Q("UPDATE public.users SET institution_id='" + org.id + "', verification_status='verified' WHERE email IN (" + emails + ')')
  }
  console.log('   assigned')

  console.log('4) Verification…')
  const chk = await Q(`
    SELECT
      (SELECT count(*) FROM auth.users) AS total_users,
      (SELECT count(*) FROM public.users WHERE role='student') AS students,
      (SELECT count(*) FROM public.users WHERE role='teacher') AS teachers,
      (SELECT count(*) FROM public.users WHERE role='principal') AS principals,
      (SELECT count(*) FROM institutions) AS institutions,
      (SELECT count(DISTINCT family_code) FROM public.users WHERE family_code IS NOT NULL) AS family_codes,
      (SELECT count(*) - count(DISTINCT family_code) FROM public.users WHERE family_code IS NOT NULL) AS dup_codes
  `)
  console.log(JSON.stringify(chk.j[0], null, 2))

  const out = 'D:/LOCAXLHOUSELLM MAIN APPS/test-accounts-phase1.csv'
  fs.writeFileSync(out, csv.join('\n'))
  console.log('\nCSV written:', out)
  console.log('Shared password for ALL accounts:', PASSWORD)
  console.log('Sample login: student01@i01.test.zynvera.app /', PASSWORD)
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
