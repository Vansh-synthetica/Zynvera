/** Showcase part 2: principal-owned data. Idempotent by marker. */
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
  if (!r.access_token) throw new Error('login failed')
  return { t: r.access_token, id: r.user.id }
}

const days = (n) => new Date(Date.now() + n * 864e5).toISOString()
const day = (n) => days(n).slice(0, 10)

async function main() {
  const P = await login('admin@zynvera.app', 'ZynAdmin#2026!vR7x')

  const chk = await db(P.t, 'GET', `announcements?title=eq.Midterm week schedule&select=id`)
  if (chk.json?.length > 0) { console.log('Part 2 already done'); return }

  await db(P.t, 'POST', 'announcements', [
    { institution_id: INST, author_id: P.id, title: 'Midterm week schedule', content: 'Midterms run the week after next. Check your course pages for exact times.', priority: 'high', pinned: true },
    { institution_id: INST, author_id: P.id, title: 'Library extended hours', content: 'Library open until 7 PM during exam season.', priority: 'normal' },
  ])
  await db(P.t, 'POST', 'finance_transactions', [
    { institution_id: INST, type: 'income', category: 'Tuition', amount: 125000, description: 'Term 2 tuition batch', tx_date: day(-30) },
    { institution_id: INST, type: 'expense', category: 'Salaries', amount: 68000, description: 'Monthly payroll', tx_date: day(-15) },
    { institution_id: INST, type: 'expense', category: 'Technology', amount: 9500, description: 'New lab laptops', tx_date: day(-8) },
  ])
  await db(P.t, 'POST', 'finance_budgets', [
    { institution_id: INST, category: 'Technology', fiscal_year: '2026', budgeted_amount: 60000 },
    { institution_id: INST, category: 'Events', fiscal_year: '2026', budgeted_amount: 25000 },
  ])
  const dept = await db(P.t, 'GET', `departments?name=eq.Physical%20Sciences&select=id`)
  if (!dept.json?.length) {
    await db(P.t, 'POST', 'departments', { institution_id: INST, name: 'Physical Sciences', code: 'PHY', budget: 120000, description: 'Physics and chemistry programmes.' })
  }
  await db(P.t, 'POST', 'institution_alerts', { institution_id: INST, title: 'Midterm logistics', message: 'Reserve exam halls and print papers by Friday.', severity: 'warning', source: 'administration', created_by: P.id })

  console.log('Part 2 complete: announcements, finance, budgets, department, alert.')
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
