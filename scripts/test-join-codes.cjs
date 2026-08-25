const URL = process.env.SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const MGMT = 'process.env.SUPABASE_MGMT_KEY||'placeholder''

const Q = (query) =>
  fetch('https://api.supabase.com/v1/projects/ccqfhsfkhrkbpczmuolp/database/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${MGMT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  }).then(r => r.json())

let pass = 0, fail = 0
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  PASS ' + n) } else { fail++; console.log('  FAIL ' + n + (x ? ' -> ' + x : '')) } }

const login = async (email, pw) => {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pw }),
  }).then(x => x.json())
  return { t: r.access_token, id: r.user.id }
}

async function main() {
  // 1. Every institution has a unique join code.
  const codes = await Q(`SELECT name, join_code FROM institutions ORDER BY name`)
  ok('all 12 institutions have join codes', codes.every(c => /^\d{8}$/.test(c.join_code || '')), JSON.stringify(codes.slice(0, 3)))
  const uniq = new Set(codes.map(c => c.join_code))
  ok('all codes unique', uniq.size === codes.length)
  console.log('  sample:', codes[0].name, '→', codes[0].join_code)

  // 2. Create a fresh user with NO institution (simulates new signup).
  const email = `newbie${Date.now().toString(36)}@test.zynvera.app`
  const id = await Q(`
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_user_meta_data,
      confirmation_token, recovery_token, email_change, email_change_token_new)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      '${email}', crypt('Newbie#2026!x', gen_salt('bf')), now(), now(), now(),
      '{"name":"New Joiner","role":"teacher"}'::jsonb, '', '', '', '')
    RETURNING id
  `)
  const uid = id[0].id
  const T = await login(email, 'Newbie#2026!x')
  ok('fresh signup can log in', !!T.t)

  // 3. Profile has no institution.
  let prof = await Q(`SELECT institution_id FROM users WHERE id = '${uid}'`)
  ok('fresh profile has NO institution', prof[0].institution_id === null)

  // 4. Wrong code rejected.
  const wrong = await fetch(`${URL}/rest/v1/rpc/verify_join_code`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${T.t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: '00000000' }),
  }).then(x => x.json())
  ok('wrong code returns null (rejected)', wrong === null, JSON.stringify(wrong))

  // 5. Correct code returns Riverside's id.
  const riverside = await Q(`SELECT join_code, id FROM institutions WHERE name = 'Riverside Academy'`)
  const code = riverside[0].join_code
  const instId = await fetch(`${URL}/rest/v1/rpc/verify_join_code`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${T.t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  }).then(x => x.json())
  ok('correct code resolves to Riverside', instId === 'a1000000-0000-0000-0000-000000000001', String(instId))

  // 6. Join: set own institution.
  await fetch(`${URL}/rest/v1/users?id=eq.${uid}`, {
    method: 'PATCH',
    headers: { apikey: KEY, Authorization: `Bearer ${T.t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ institution_id: instId, verification_status: 'verified' }),
  })
  prof = await Q(`SELECT institution_id, role FROM users WHERE id = '${uid}'`)
  ok('joined Riverside (profile updated)', prof[0].institution_id === 'a1000000-0000-0000-0000-000000000001')
  ok('role preserved as teacher', prof[0].role === 'teacher')

  // 7. Leadership can see their institution's join code.
  const P = await login('admin@zynvera.app', 'ZynAdmin#2026!vR7x')
  const instRow = await fetch(`${URL}/rest/v1/institutions?select=name,join_code&id=eq.a1000000-0000-0000-0000-000000000001`, {
    headers: { apikey: KEY, Authorization: `Bearer ${P.t}` },
  }).then(x => x.json())
  ok('principal can see own join code', /^\d{8}$/.test(instRow?.[0]?.join_code || ''))

  // Cleanup probe user.
  await Q(`DELETE FROM auth.users WHERE id = '${uid}'`)

  console.log(`\n═══ JOIN-CODE FLOW: ${pass} passed, ${fail} failed ═══`)
  if (fail > 0) process.exit(1)
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
