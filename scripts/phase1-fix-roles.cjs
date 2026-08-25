/** Fix roles for the 800 phase-1 accounts (trigger metadata was string-encoded). */
const Q = (query) =>
  fetch('https://api.supabase.com/v1/projects/ccqfhsfkhrkbpczmuolp/database/query', {
    method: 'POST',
    headers: { Authorization: 'Bearer process.env.SUPABASE_MGMT_KEY||'placeholder'', 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  }).then(async r => ({ status: r.status, j: await r.json().catch(() => null) }))

const pad2 = (n) => String(n).padStart(2, '0')
const ORGS = []
for (let i = 1; i <= 5; i++) ORGS.push('i' + pad2(i))
for (let i = 1; i <= 5; i++) ORGS.push('s' + pad2(i))

async function main() {
  for (const org of ORGS) {
    for (const role of ['student', 'teacher', 'principal']) {
      const count = Math.floor((role === 'student' ? 50 : role === 'teacher' ? 20 : 10))
      const emails = []
      for (let n = 1; n <= count; n++) emails.push("'" + role + pad2(n) + '@' + org + '.test.zynvera.app' + "'")
      const r = await Q("UPDATE public.users SET role = '" + role + "' WHERE email IN (" + emails.join(',') + ") AND role <> '" + role + "'")
      if (r.status !== 200) console.log('ERR', org, role, JSON.stringify(r.j).slice(0, 120))
    }
  }

  const chk = await Q(`
    SELECT
      (SELECT count(*) FROM public.users WHERE role='student') AS students,
      (SELECT count(*) FROM public.users WHERE role='teacher') AS teachers,
      (SELECT count(*) FROM public.users WHERE role='principal') AS principals,
      (SELECT count(*) FROM public.users) AS total
  `)
  console.log(JSON.stringify(chk.j[0], null, 2))
}
main().catch(e => { console.error(e.message); process.exit(1) })
