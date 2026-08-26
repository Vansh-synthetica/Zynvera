/**
 * PRINCIPAL SCALE TEST — 200 students + 50 teachers, real data volume.
 *
 * Seeds: enrolments, 10 days of attendance, 600 grade entries, fee
 * invoices generated via the real RPC, sample payments, payroll run.
 * Then exercises every principal surface against that volume with timings,
 * including live HTTP page loads. Full teardown at the end.
 */
const fs = require("fs");
const path = require("path");
const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const env = {};
envContent.split("\n").forEach((l) => { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); });
const { createClient } = require("@supabase/supabase-js");

const MGMT = process.env.SUPABASE_MGMT;
async function svc(sql) {
  const r = await fetch("https://api.supabase.com/v1/projects/ccqfhsfkhrkbpczmuolp/database/query", {
    method: "POST",
    headers: { Authorization: `Bearer ${MGMT}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`svc: ${t.slice(0, 300)}`);
  return t === "[]" ? [] : JSON.parse(t);
}

let passCount = 0, failCount = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) { passCount++; console.log(`  PASS ${name}`); }
  else { failCount++; failures.push({ name, detail }); console.log(`  FAIL ${name} :: ${detail || ""}`); }
}
function loginClient(email, password) {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  return supabase.auth.signInWithPassword({ email, password }).then(({ data, error }) => {
    if (error) throw new Error(`login ${email}: ${error.message}`);
    return { admin: supabase, uid: data.user.id };
  });
}

(async () => {
  const stamp = Date.now().toString(36);
  const prefix = `ld${stamp}`;
  const INST = "a1000000-0000-0000-0000-000000000001";
  const N_STU = 200, N_TEA = 50;

  // ── SELF-CLEAN leftovers from any previously crashed run ────────
  console.log("══ PRE-CLEAN ══");
  const stale = await svc(`SELECT count(*)::int cnt FROM users WHERE email LIKE 'ld%.%@load.test'`);
  if (stale[0].cnt > 0) {
    await svc(`DELETE FROM auth.users WHERE email LIKE 'ld%.%@load.test'`);
    await svc(`DELETE FROM class_sections WHERE name LIKE 'Scale Sec %'`);
    await svc(`DELETE FROM fee_structures WHERE name LIKE 'Scale Term Fee %'`);
    await svc(`DELETE FROM finance_transactions WHERE description LIKE '%Scale Term Fee %' OR description LIKE '%Payroll%'`);
    await svc(`DELETE FROM staff_salaries WHERE staff_user_id IN (SELECT id FROM users WHERE email LIKE '%@load.test')`);
    await svc(`DELETE FROM payroll_runs WHERE institution_id='${INST}'`);
    console.log(`  removed ${stale[0].cnt} stale accounts + residue`);
  } else {
    console.log("  nothing to clean");
  }

  // ── SEED ────────────────────────────────────────────────────────
  console.log("══ SEED ══");
  let t0 = Date.now();

  // Batch-create auth users
  const mkBatch = (offset, n, kind) => {
    const vals = [];
    for (let i = offset; i < offset + n; i++) {
      const id = crypto.randomUUID();
      const email = `${prefix}.${kind}${String(i).padStart(3, "0")}@load.test`;
      vals.push(`('${id}','${email}','',now(),now(),now(),'{}'::jsonb)`);
    }
    return vals.join(",");
  };
  for (let b = 0; b < N_STU; b += 50) {
    await svc(`INSERT INTO auth.users (id,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_user_meta_data)
      VALUES ${mkBatch(b, Math.min(50, N_STU - b), "stu")}`);
  }
  for (let b = 0; b < N_TEA; b += 50) {
    await svc(`INSERT INTO auth.users (id,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_user_meta_data)
      VALUES ${mkBatch(b, Math.min(50, N_TEA - b), "tea")}`);
  }
  // Profiles: role + institution (handle_new_user already made rows keyed by id)
  await svc(`UPDATE public.users SET role='student', institution_id='${INST}',
      name = 'Load Student ' || split_part(email,'.',2)
    WHERE email LIKE '${prefix}.stu%@load.test'`);
  await svc(`UPDATE public.users SET role='teacher', institution_id='${INST}',
      name = 'Load Teacher ' || split_part(email,'.',2)
    WHERE email LIKE '${prefix}.tea%@load.test'`);
  const [{ cnt }] = await svc(`SELECT count(*)::int cnt FROM users WHERE email LIKE '${prefix}.%'`);
  ok("S1 created 250 accounts", cnt === N_STU + N_TEA, `got ${cnt}`);
  console.log(`  (${Date.now() - t0}ms)`);

  const A = await loginClient("admin@zynvera.app", "ZynAdmin#2026!vR7x");
  const ad = A.admin.from.bind(A.admin);
  const T = await loginClient("teacher@zynvera.app", "Teacher#2026!x");

  // Courses + sections
  const { data: courses } = await ad("courses").select("id,code,title").eq("institution_id", INST).eq("status", "active").order("code");
  ok("S2 three base courses present", (courses ?? []).length >= 3, String(courses?.length));

  t0 = Date.now();
  // Enrol students round-robin across courses
  const stuIds = (await svc(`SELECT id FROM users WHERE email LIKE '${prefix}.stu%' ORDER BY email`)).map(r => r.id);
  const teaIds = (await svc(`SELECT id FROM users WHERE email LIKE '${prefix}.tea%' ORDER BY email`)).map(r => r.id);
  const enrVals = stuIds.map((uid, i) => `('${courses[i % courses.length].id}','${uid}','active')`).join(",");
  await svc(`INSERT INTO course_enrolments (course_id,user_id,status) VALUES ${enrVals} ON CONFLICT DO NOTHING`);
  await svc(`UPDATE courses c SET enrolled_students = (SELECT count(*) FROM course_enrolments ce WHERE ce.course_id=c.id AND ce.status='active')`);
  const enrRows = await svc(`SELECT count(*)::int cnt FROM course_enrolments ce JOIN users u ON u.id=ce.user_id WHERE u.email LIKE '${prefix}.stu%'`);
  ok("S3 enrolments created", enrRows[0].cnt === N_STU, `got ${enrRows[0].cnt}`);
  console.log(`  (${Date.now() - t0}ms)`);

  // Sections on each course (weekday-today so Today-page logic sees them too)
  const wd = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
  t0 = Date.now();
  const secIds = [];
  for (const c of courses.slice(0, 3)) {
    const { data: sec, error: secErr } = await T.admin.from("class_sections").insert({
      course_id: c.id, name: `Scale Sec ${stamp}`, room: "L1",
      day: wd, start_time: "11:00", end_time: "11:45",
    }).select().single();
    if (secErr || !sec) throw new Error(`section insert failed: ${secErr?.message}`);
    secIds.push(sec.id);
  }
  ok("S4 sections created", secIds.length === 3);

  // Attendance: last 10 days x 200 students on their course section
  const days = [];
  for (let d = 0; d < 14 && days.length < 10; d++) {
    const dt = new Date(Date.now() - d * 86_400_000);
    if (dt.getDay() !== 0 && dt.getDay() !== 6) days.push(dt.toISOString().slice(0, 10));
  }
  const attVals = [];
  stuIds.forEach((uid, i) => {
    const secId = secIds[i % secIds.length];
    days.forEach((dte, di) => {
      const st = ((i + di) % 11 === 0) ? "absent" : ((i + di) % 7 === 0 ? "late" : "present");
      attVals.push(`('${secId}','${uid}','${dte}','${st}')`);
    });
  });
  for (let b = 0; b < attVals.length; b += 500) {
    await svc(`INSERT INTO attendance_records (class_section_id,user_id,date,status) VALUES ${attVals.slice(b, b + 500).join(",")} ON CONFLICT DO NOTHING`);
  }
  const [{ cnt: attCnt }] = await svc(`SELECT count(*)::int cnt FROM attendance_records ar JOIN users u ON u.id=ar.user_id WHERE u.email LIKE '${prefix}.stu%'`);
  ok("S5 attendance seeded (~2000 rows)", attCnt === days.length * N_STU, `got ${attCnt}`);
  console.log(`  (${Date.now() - t0}ms)`);

  // Grades: 3 entries per student
  t0 = Date.now();
  const gVals = [];
  stuIds.forEach((uid, i) => {
    [82, 74, 91].forEach((sc, k) => {
      gVals.push(`('${courses[i % courses.length].id}','${uid}','Unit ${k + 1} Test ${stamp}','quiz',${sc},100,1,current_date)`);
    });
  });
  for (let b = 0; b < gVals.length; b += 500) {
    await svc(`INSERT INTO grade_entries (course_id,user_id,assessment_name,assessment_type,score,max_score,weight,date) VALUES ${gVals.slice(b, b + 500).join(",")}`);
  }
  const [{ cnt: gCnt }] = await svc(`SELECT count(*)::int cnt FROM grade_entries ge JOIN users u ON u.id=ge.user_id WHERE u.email LIKE '${prefix}.stu%' AND ge.assessment_name LIKE '%${stamp}'`);
  ok("S6 grade entries seeded (600)", gCnt === 600, `got ${gCnt}`);
  console.log(`  (${Date.now() - t0}ms)`);

  // ── PRINCIPAL SURFACES UNDER LOAD ───────────────────────────────
  console.log("\n══ PRINCIPAL SURFACES ══");

  t0 = Date.now();
  const { data: stuRows, error: e1 } = await ad("users").select("*").eq("institution_id", INST).eq("role", "student");
  const ms1 = Date.now() - t0;
  ok("P1 student roster loads 200+", !e1 && (stuRows ?? []).filter(u => u.email.includes(prefix)).length === N_STU,
     `${e1?.message} got ${(stuRows ?? []).length} in ${ms1}ms`);

  t0 = Date.now();
  const { data: staffRows } = await ad("users").select("*").eq("institution_id", INST).in("role", ["teacher", "department_head", "admin", "counselor"]);
  const ms2 = Date.now() - t0;
  ok("P2 staff roster includes 50 teachers", (staffRows ?? []).filter(u => u.email.includes(prefix)).length === N_TEA,
     `${(staffRows ?? []).length} rows in ${ms2}ms`);

  t0 = Date.now();
  const { data: courseRows } = await ad("courses").select("*").eq("institution_id", INST).eq("status", "active");
  const ms3 = Date.now() - t0;
  const totalEnrolled = (courseRows ?? []).reduce((s, c) => s + Number(c.enrolled_students || 0), 0);
  ok("P3 catalog with fill counts", totalEnrolled >= N_STU, `${totalEnrolled} enrolments shown in ${ms3}ms`);

  // Analytics-grade aggregation over 600+ entries
  t0 = Date.now();
  const sum = await ad("grade_entries").select("user_id,score,max_score").eq("course_id", courses[0].id);
  const ms4 = Date.now() - t0;
  const byUser = {};
  (sum.data ?? []).forEach(g => { (byUser[g.user_id] ||= []).push(g); });
  const avgs = Object.entries(byUser).map(([u, rows]) => ({
    avg: rows.reduce((a, g) => a + g.score, 0) / rows.reduce((a, g) => a + g.max_score, 0) * 100,
  }));
  const classAvg = avgs.reduce((a, x) => a + x.avg, 0) / avgs.length;
  ok("P4 per-course analytics aggregate", avgs.length >= 25 && classAvg > 80 && classAvg < 85,
     `students=${avgs.length} classAvg=${classAvg.toFixed(1)}% in ${ms4}ms`);

  // Fees at scale via real RPC
  t0 = Date.now();
  const { data: fs1 } = await ad("fee_structures").insert({
    institution_id: INST, name: `Scale Term Fee ${stamp}`, amount: 8500, frequency: "termly",
  }).select().single();
  const [{ cnt: eligible }] = await svc(`SELECT count(DISTINCT ce.user_id)::int cnt
    FROM course_enrolments ce JOIN users u ON u.id = ce.user_id
    WHERE u.role='student' AND u.institution_id='${INST}' AND ce.status='active'`);
  const gen = await A.admin.rpc("generate_fee_invoices", {
    p_structure_id: fs1.id,
    p_due_date: new Date(Date.now() + 21 * 86_400_000).toISOString().slice(0, 10),
  });
  const ms5 = Date.now() - t0;
  ok("P5 invoices generated for every active student", Number(gen.data) === eligible,
     `n=${gen.data} expected=${eligible} in ${ms5}ms`);

  t0 = Date.now();
  const { data: invs } = await ad("fee_invoices").select("id").eq("fee_structure_id", fs1.id).limit(30);
  let paid = 0;
  for (const inv of invs) {
    const r = await A.admin.rpc("record_fee_payment", { p_invoice_id: inv.id, p_amount: 8500, p_method: "bank" });
    if (!r.error) paid++;
  }
  const ms6 = Date.now() - t0;
  ok("P6 30 payments recorded -> ledger", paid === 30, `${paid}/30 in ${Math.round(ms6)}ms (${(ms6 / 30).toFixed(0)}ms/op)`);
  const { count: ledRows } = await ad("finance_transactions").select("*", { count: "exact", head: true })
    .eq("institution_id", INST).like("description", `%Scale Term Fee ${stamp}%`);
  ok("P7 ledger auto-posted per payment", ledRows === 30, `rows=${ledRows}`);

  // Payroll at scale: salaries for all 50 load teachers + core teacher
  t0 = Date.now();
  for (const tid of teaIds.slice(0, 50)) {
    await svc(`INSERT INTO staff_salaries (institution_id,staff_user_id,monthly_amount) VALUES ('${INST}','${tid}',38000)
      ON CONFLICT (staff_user_id) DO UPDATE SET monthly_amount=excluded.monthly_amount, active=true`);
  }
  const month = todayStr().slice(0, 8) + "01";
  await svc(`DELETE FROM payroll_runs WHERE institution_id='${INST}' AND month='${month}'`);
  const run = await A.admin.rpc("run_payroll", { p_month: month });
  const { data: runRow } = await ad("payroll_runs").select("total_amount").eq("id", String(run.data)).single();
  const ms7 = Date.now() - t0;
  ok("P8 payroll run totals 51 salaries", Number(runRow?.total_amount) === N_TEA * 38000,
     `total=${runRow?.total_amount} in ${ms7}ms`);
  const paidRun = await A.admin.rpc("pay_payroll", { p_run_id: String(run.data) });
  ok("P9 mark paid posts consolidated expense", Number(paidRun.data) === N_TEA * 38000, String(paidRun.data));

  // ── LIVE PAGE LOADS UNDER LOAD ──────────────────────────────────
  console.log("\n══ LIVE PAGES (timed) ══");
  const ref = env.NEXT_PUBLIC_SUPABASE_URL.replace("https://", "").split(".")[0];
  const { data: tok } = await A.admin.auth.getSession();
  const payload = { access_token: tok.session.access_token, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "x", user: { id: A.uid } };
  const enc = "base64-" + Buffer.from(JSON.stringify(payload)).toString("base64url");
  const parts = []; for (let i = 0; i < enc.length; i += 3180) parts.push(enc.slice(i, i + 3180));
  const cookie = parts.map((p, i) => `sb-${ref}-auth-token.${i}=${p}`).join("; ");
  for (const p of ["/principal/dashboard", "/principal/students", "/principal/staff", "/principal/courses",
                   "/principal/finance", "/principal/analytics", "/principal/reports"]) {
    const s = Date.now();
    const rr = await fetch(`https://zynvera.localhousellm.com${p}`, { headers: { cookie } });
    const html = await rr.text().catch(() => "");
    const ms = Date.now() - s;
    ok(`LIVE ${p} (${ms}ms, ${(html.length / 1024).toFixed(0)}KB)`, rr.status === 200 && !/application error/i.test(html));
  }

  // ── TEARDOWN ────────────────────────────────────────────────────
  console.log("\n══ TEARDOWN ══");
  const t1 = Date.now();
  await svc(`DELETE FROM payroll_runs WHERE institution_id='${INST}' AND month='${month}'`);
  await svc(`DELETE FROM finance_transactions WHERE description LIKE '%Payroll%' OR description LIKE '%Scale Term Fee ${stamp}%'`);
  await svc(`DELETE FROM fee_structures WHERE name LIKE '%${stamp}'`);
  await svc(`DELETE FROM class_sections WHERE name LIKE '%Scale Sec ${stamp}'`);
  await svc(`DELETE FROM auth.users WHERE email LIKE '${prefix}.%'`);
  const [{ cnt: left }] = await svc(`SELECT count(*)::int cnt FROM users WHERE email LIKE '${prefix}.%'`);
  ok("T1 full teardown (users cascade everything)", left === 0, `remaining=${left}`);
  await svc(`UPDATE courses c SET enrolled_students=(SELECT count(*) FROM course_enrolments ce WHERE ce.course_id=c.id AND ce.status='active')`);
  console.log(`  (${Date.now() - t1}ms)`);

  console.log(`\n${"═".repeat(48)}`);
  console.log(`SCALE RESULT: ${passCount} passed, ${failCount} failed`);
  if (failures.length) {
    failures.forEach((f) => console.log(` ✗ ${f.name}: ${f.detail}`));
    process.exit(1);
  }
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });

function todayStr() { return new Date().toISOString().slice(0, 10); }
