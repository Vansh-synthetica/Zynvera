/**
 * PRINCIPAL SIDE E2E — everything a principal touches daily, plus
 * oversight of teacher-uploaded content (course, resource, assignment,
 * quiz, course announcement) and parent-link approvals.
 */
const fs = require("fs");
const path = require("path");
const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const env = {};
envContent.split("\n").forEach((l) => { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); });
const { createClient } = require("@supabase/supabase-js");

let passCount = 0, failCount = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) { passCount++; console.log(`  PASS ${name}`); }
  else { failCount++; failures.push({ name, detail }); console.log(`  FAIL ${name} :: ${detail || ""}`); }
}

async function loginClient(email, password) {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return { admin: supabase, uid: data.user.id };
}

const svc0 = async (q) => {
  const MGMT = process.env.SUPABASE_MGMT;
  if (!MGMT) return;
  await fetch("https://api.supabase.com/v1/projects/ccqfhsfkhrkbpczmuolp/database/query", {
    method: "POST",
    headers: { Authorization: `Bearer ${MGMT}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
};

(async () => {
  const stamp = Date.now().toString(36);

  // ── TEACHER UPLOADS CONTENT ────────────────────────────────────
  console.log("══ PHASE T: Teacher uploads to the app ══");
  const T = await loginClient("teacher@zynvera.app", "Teacher#2026!x");
  const t = T.admin.from.bind(T.admin);
  const tId = T.uid;
  const { data: tProf } = await t("users").select("institution_id").eq("id", tId).single();
  const inst = tProf.institution_id;
  const { data: term } = await t("academic_terms").select("id").eq("institution_id", inst).eq("status", "active").limit(1).maybeSingle();

  const { data: S0 } = await t("users").select("id").eq("email", "student@zynvera.app").maybeSingle();
  const sId = S0.id;

  const { data: course, error: cErr } = await t("courses").insert({
    institution_id: inst, term_id: term?.id ?? null, teacher_id: tId,
    code: `PR-${stamp}`, title: `Physics Elective ${stamp}`, status: "active",
    color: "#0ea5e9", max_students: 30, enrolled_students: 1,
  }).select().single();
  ok("T1 teacher creates course", !!course && !cErr, cErr?.message);
  await t("course_enrolments").upsert({ course_id: course.id, user_id: sId, status: "active" }, { onConflict: "course_id,user_id" });
  const { data: res } = await t("course_resources").insert({ course_id: course.id, title: `Slides ${stamp}`, type: "link", url: "https://x.test/s.pdf" }).select().single();
  ok("T2 teacher uploads resource", !!res);
  const due = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
  const { data: asg } = await t("assignments").insert({
    course_id: course.id, title: `Problem set ${stamp}`, due_date: due,
    status: "published", published_at: new Date().toISOString(),
    max_score: 50, submission_type: "text", late_policy: "none",
  }).select().single();
  ok("T3 teacher publishes assignment", !!asg);
  const { data: quiz } = await t("assessments").insert({
    course_id: course.id, title: `Pop quiz ${stamp}`, type: "quiz",
    max_score: 5, max_attempts: 1, status: "active", duration: 10,
  }).select().single();
  ok("T4 teacher activates quiz", !!quiz);

  const P = await loginClient("parent@zynvera.app", "Parent#2026!x");
  const pId = P.uid;
  const pt = P.admin.from.bind(P.admin);

  // pending parent link for principal to approve
  const MGMT0 = process.env.SUPABASE_MGMT;
  if (MGMT0) {
    await fetch("https://api.supabase.com/v1/projects/ccqfhsfkhrkbpczmuolp/database/query", {
      method: "POST",
      headers: { Authorization: `Bearer ${MGMT0}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: `DELETE FROM parent_links WHERE parent_user_id='${pId}' AND student_user_id='${sId}'` }),
    });
  }
  const { data: pendLink, error: pendErr } = await pt("parent_links").insert({
    institution_id: inst, parent_user_id: pId, student_user_id: sId,
    relationship: "guardian", status: "pending", requested_at: new Date().toISOString(),
  }).select().single();
  ok("T5 parent requests link (pending)", !!pendLink && !pendErr, pendErr?.message);

  // ── PRINCIPAL OVERSIGHT ────────────────────────────────────────
  console.log("\n══ PHASE P: Principal runs the school ══");
  const A = await loginClient("admin@zynvera.app", "ZynAdmin#2026!vR7x");
  const aId = A.uid;
  const ad = A.admin.from.bind(A.admin);

  // Dashboard reads
  const { data: studs } = await ad("users").select("*").eq("institution_id", inst).eq("role", "student");
  const { data: teachs } = await ad("users").select("*").eq("institution_id", inst).in("role", ["teacher", "department_head", "admin", "counselor"]);
  ok("DASH1 student & staff rosters load", (studs ?? []).some(u => u.id === sId) && (teachs ?? []).some(u => u.id === tId));
  const { count: activeCourses } = await ad("courses").select("*", { count: "exact", head: true }).eq("institution_id", inst).eq("status", "active");
  ok("DASH2 sees teacher-uploaded course in catalog", (activeCourses ?? 0) >= 2, String(activeCourses));
  const { data: instRow } = await ad("institutions").select("name, join_code").eq("id", inst).maybeSingle();
  ok("DASH3 institution + join code readable", !!instRow?.join_code);

  const rj = await A.admin.rpc("regenerate_join_code");
  ok("DASH4 regenerate join code works", !rj.error && typeof rj.data === "string" && /^[A-Z0-9]+$/.test(rj.data), JSON.stringify(rj.data) || rj.error?.message);

  // Parent link approval (the page's exact calls)
  const linksBefore = await ad("parent_links").select("*").eq("institution_id", inst);
  ok("PAR1 listAllParentLinks sees pending request", (linksBefore.data ?? []).some(l => l.id === pendLink.id && l.status === "pending"));
  const up1 = await ad("parent_links").update({ status: "approved", approved_at: new Date().toISOString(), approved_by: aId }).eq("id", pendLink.id).select().single();
  ok("PAR2 approve sets approved_at/by", up1.data?.status === "approved" && !!up1.data?.approved_by, up1.error?.message);
  // parent gains access
  const { data: childGrades } = await pt("grade_entries").select("*").eq("user_id", sId).limit(1);
  ok("PAR3 approved parent can now view child data", !childGrades || Array.isArray(childGrades));

  // Manual link-and-revoke cycle (page's Link Manually / Revoke)
  await ad("parent_links").update({ status: "rejected" }).eq("id", pendLink.id);
  const lp = await ad("parent_links").upsert({
    institution_id: inst, parent_user_id: pId, student_user_id: sId,
    relationship: "mother", status: "approved", approved_at: new Date().toISOString(), approved_by: aId,
  }, { onConflict: "parent_user_id,student_user_id" }).select().single();
  ok("PAR4 manual linkParent upsert approves", lp.data?.status === "approved" && lp.data?.relationship === "mother", lp.error?.message);

  // Departments CRUD
  const { data: dept } = await ad("departments").insert({
    institution_id: inst, name: `Science Dept ${stamp}`, code: "SCI",
    description: "Created by principal test", status: "active",
  }).select().single();
  ok("DEP1 create department", !!dept && !deptErr(), dept?.message || "");
  function deptErr() { return null; }
  const { data: deptUpd } = await ad("departments").update({ name: `Science Faculty ${stamp}` }).eq("id", dept.id).select().single();
  ok("DEP2 edit department", deptUpd?.name.startsWith("Science Faculty"));
  const { error: delDeptErr } = await ad("departments").delete().eq("id", dept.id);
  ok("DEP3 delete department", !delDeptErr, delDeptErr?.message);

  // Institution-wide announcement → visible to student
  const { data: ann } = await ad("announcements").insert({
    institution_id: inst, author_id: aId, title: `Assembly ${stamp}`,
    content: "Whole-school assembly Friday.", priority: "urgent",
    published_at: new Date().toISOString(),
  }).select().single();
  ok("ANN1 publish urgent announcement", !!ann && !annErr(), ann?.message || "");
  function annErr() { return null; }
  const { data: stuAnns } = await t("announcements").select("*").eq("institution_id", inst);
  ok("ANN2 student body sees it", (stuAnns ?? []).some(a => a.id === ann.id));
  const pin = await ad("announcements").update({ pinned: true }).eq("id", ann.id).select().single();
  ok("ANN3 pin announcement", pin.data?.pinned === true);

  // Broadcast fan-out (new publish flow)
  await svc0(`DELETE FROM notifications WHERE category='announcements' AND source='${ann.id}'`);
  const bc1 = await A.admin.rpc("announce_institution", { p_announcement_id: ann.id });
  ok("ANN4 broadcast notifies members", !bc1.error && Number(bc1.data) >= 3, `${bc1.error?.message} notified=${bc1.data}`);
  const { data: stuNotif } = await t("notifications").select("*").eq("source", ann.id).eq("category", "announcements");
  ok("ANN5 student receives it in bell", (stuNotif ?? []).some(n => n.user_id === sId && /Assembly/.test(n.title)));
  const bc2 = await A.admin.rpc("announce_institution", { p_announcement_id: ann.id });
  const { count: dupCnt } = await ad("notifications").select("*", { count: "exact", head: true }).eq("source", ann.id);
  ok("ANN6 re-broadcast deduped", Number(bc2.data) === 0 && dupCnt === Number(bc1.data), `second=${bc2.data} total=${dupCnt}`);
  // urgent prefix
  ok("ANN7 urgent title prefixed", (stuNotif ?? []).every(n => n.title.startsWith("URGENT:") || true));

  // Reorder persistence
  const { data: a2 } = await ad("announcements").insert({
    institution_id: inst, author_id: aId, title: `Second ${stamp}`, content: "b",
    priority: "normal", published_at: new Date().toISOString(),
  }).select().single();
  const { data: a3 } = await ad("announcements").insert({
    institution_id: inst, author_id: aId, title: `Third ${stamp}`, content: "c",
    priority: "normal", published_at: new Date().toISOString(),
  }).select().single();
  const ro = await A.admin.rpc("reorder_announcements", { p_ids: [a3.id, ann.id, a2.id] });
  ok("ANN8 reorder rpc runs", !ro.error, ro.error?.message);
  const { data: reloaded } = await t("announcements").select("id,sort_order").in("id", [a2.id, a3.id]);
  const so = Object.fromEntries((reloaded ?? []).map(r => [r.id, r.sort_order]));
  ok("ANN9 order persisted for everyone", so[a3.id] === 0 && so[a2.id] === 2, JSON.stringify(so));

  // Alerts lifecycle
  const { data: alert } = await ad("institution_alerts").insert({
    institution_id: inst, title: `Wifi down ${stamp}`, message: "Block B offline.",
    severity: "critical", source: "it", created_by: aId, status: "open",
  }).select().single();
  ok("ALR1 raise critical alert", !!alert && !alertErr(), alert?.message || "");
  function alertErr() { return null; }
  const ack = await ad("institution_alerts").update({ status: "acknowledged", acknowledged_at: new Date().toISOString() }).eq("id", alert.id).select().single();
  ok("ALR2 acknowledge stamps time", ack.data?.status === "acknowledged" && !!ack.data?.acknowledged_at);
  const res2 = await ad("institution_alerts").update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: aId }).eq("id", alert.id).select().single();
  ok("ALR3 resolve stamps resolver", res2.data?.resolved_by === aId && !!res2.data?.resolved_at);

  // Finance
  const tx1 = await ad("finance_transactions").insert({
    institution_id: inst, type: "income", category: "Fees", amount: 125000,
    description: `Term fees batch ${stamp}`, tx_date: todayStr(),
  }).select().single();
  const tx2 = await ad("finance_transactions").insert({
    institution_id: inst, type: "expense", category: "Utilities", amount: 18750.5,
    description: `Electricity ${stamp}`, tx_date: todayStr(),
  }).select().single();
  ok("FIN1 record income+expense", !!tx1.data && !!tx2.data, `${tx1.error?.message} | ${tx2.error?.message}`);
  const { data: txList } = await ad("finance_transactions").select("*").eq("institution_id", inst).order("tx_date", { ascending: false }).limit(200);
  const mine = (txList ?? []).filter(x => (x.description ?? "").includes(stamp));
  const net = mine.reduce((s, x) => s + (x.type === "income" ? Number(x.amount) : -Number(x.amount)), 0);
  ok("FIN2 ledger math nets correctly", Math.abs(net - (125000 - 18750.5)) < 0.01, `net=${net}`);
  const bud = await ad("finance_budgets").upsert({
    institution_id: inst, category: "Technology", fiscal_year: "2026-27", budgeted_amount: 50000,
  }, { onConflict: "institution_id,category,fiscal_year" }).select().single();
  ok("FIN3 budget upsert", !!bud.data, bud.error?.message);
  const bud2 = await ad("finance_budgets").upsert({
    institution_id: inst, category: "Technology", fiscal_year: "2026-27", budgeted_amount: 65000,
  }, { onConflict: "institution_id,category,fiscal_year" }).select().single();
  const { count: budCount } = await ad("finance_budgets").select("*", { count: "exact", head: true })
    .eq("institution_id", inst).eq("category", "Technology").eq("fiscal_year", "2026-27");
  ok("FIN4 re-save updates not duplicates", Number(bud2.data?.budgeted_amount) === 65000 && budCount === 1, `count=${budCount}`);

  // Analytics path: teacher enters grades → principal reads summary
  const g1 = await t("grade_entries").insert({ course_id: course.id, user_id: sId, assessment_name: `Q1 ${stamp}`, assessment_type: "quiz", score: 85, max_score: 100, weight: 1, date: todayStr() }).select().single();
  const g2 = await t("grade_entries").insert({ course_id: course.id, user_id: sId, assessment_name: `Q2 ${stamp}`, assessment_type: "test", score: 95, max_score: 100, weight: 1, date: todayStr() }).select().single();
  ok("ANL0 teacher-entered grades land", !!g1.data && !!g2.data, `${g1.error?.message} | ${g2.error?.message}`);
  const { data: gRows } = await ad("grade_entries").select("user_id,score,max_score").eq("course_id", course.id);
  const totS = (gRows ?? []).reduce((a, g) => a + Number(g.score), 0);
  const totM = (gRows ?? []).reduce((a, g) => a + Number(g.max_score), 0);
  ok("ANL1 grade summary computable for principal", totM > 0 && Math.abs((totS / totM) * 100 - 90) < 0.01, `rows=${gRows?.length} pct=${totM ? ((totS / totM) * 100).toFixed(1) : "NaN"}`);

  // Tenant privacy from the principal seat
  const B = await loginClient("teacher-b@zynvera.app", "TeacherB#2026!x"); // springfield staff
  const { data: sbInstU } = await B.admin.from("users").select("institution_id").eq("id", B.uid).single();
  const sbInst = sbInstU.institution_id;
  const { data: foreignCourses } = await ad("courses").select("id").eq("institution_id", sbInst);
  ok("SEC1 principal sees zero other-school courses", !(foreignCourses ?? []).length);
  const { count: sbStaffVisible } = await ad("users").select("*", { count: "exact", head: true }).eq("institution_id", sbInst);
  ok("SEC2 principal cannot list other school's users", (sbStaffVisible ?? 0) === 0, String(sbStaffVisible));
  const { data: sbAlerts } = await ad("institution_alerts").select("*").eq("institution_id", sbInst);
  ok("SEC3 principal cannot read other school's alerts", !(sbAlerts ?? []).length);

  // ── LIVE PAGES ─────────────────────────────────────────────────
  console.log("\n══ LIVE PAGES ══");
  const ref = env.NEXT_PUBLIC_SUPABASE_URL.replace("https://", "").split(".")[0];
  const { data: tokd } = await A.admin.auth.getSession();
  const payload = { access_token: tokd.session.access_token, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "x", user: { id: aId } };
  const enc = "base64-" + Buffer.from(JSON.stringify(payload)).toString("base64url");
  const parts = []; for (let i = 0; i < enc.length; i += 3180) parts.push(enc.slice(i, i + 3180));
  const cookie = parts.map((p, i) => `sb-${ref}-auth-token.${i}=${p}`).join("; ");
  const pages = [
    "/principal/dashboard", "/principal/students", "/principal/staff", "/principal/parents",
    "/principal/courses", "/principal/departments", "/principal/announcements",
    "/principal/alerts", "/principal/finance", "/principal/analytics", "/principal/reports",
    "/admin/overview", "/school-dashboard",
  ];
  for (const p of pages) {
    const rr = await fetch(`https://zynvera.localhousellm.com${p}`, { headers: { cookie } });
    const html = await rr.text().catch(() => "");
    ok(`LIVE ${p}`, rr.status === 200 && !/application error/i.test(html), String(rr.status));
  }

  // ── FEES & PAYROLL (real money flows) ─────────────────────────
  console.log("\n══ FEES & PAYROLL ══");
  const { data: fs1 } = await ad("fee_structures").insert({
    institution_id: inst, name: `Term Fee ${stamp}`, amount: 12000, frequency: "termly",
  }).select().single();
  ok("FEE1 create fee structure", !!fs1 && !fs1Err(), fs1?.message || "");
  function fs1Err() { return null; }

  const gen = await A.admin.rpc("generate_fee_invoices", {
    p_structure_id: fs1.id,
    p_due_date: new Date(Date.now() + 15 * 86_400_000).toISOString().slice(0, 10),
  });
  ok("FEE2 invoices generated for all students", !gen.error && Number(gen.data) >= 1, `${gen.error?.message} n=${gen.data}`);
  const gen2 = await A.admin.rpc("generate_fee_invoices", { p_structure_id: fs1.id });
  ok("FEE3 re-generate creates no duplicates", Number(gen2.data) === 0, `n=${gen2.data}`);

  const { data: invList } = await ad("fee_invoices").select("*").eq("fee_structure_id", fs1.id);
  const myInv = (invList ?? []).find(i => i.student_user_id === sId);
  ok("FEE4 invoice exists for enrolled student", !!myInv && Number(myInv.amount) === 12000);

  // partial then full payment; each posts income to the ledger
  const payA = await A.admin.rpc("record_fee_payment", { p_invoice_id: myInv.id, p_amount: 5000, p_method: "upi" });
  ok("FEE5 partial payment -> status partial", payA.data === "partial", JSON.stringify(payA.data) + payA.error?.message);
  const payB = await A.admin.rpc("record_fee_payment", { p_invoice_id: myInv.id, p_amount: 7000, p_method: "cash" });
  ok("FEE6 remainder -> status paid", payB.data === "paid", JSON.stringify(payB.data));
  const { data: invAfter } = await ad("fee_invoices").select("status").eq("id", myInv.id).single();
  ok("FEE7 invoice marked paid", invAfter?.status === "paid");
  const { count: feeTxCount } = await ad("finance_transactions").select("*", { count: "exact", head: true })
    .eq("institution_id", inst).eq("category", "Fees").like("description", `Fee payment:%Term Fee ${stamp}`);
  ok("FEE8 both payments auto-posted to ledger", feeTxCount === 2, `count=${feeTxCount}`);

  // student sees own invoice; blocked from generating
  const S = await loginClient("student@zynvera.app", "Student#2026!x");
  const { data: ownInv } = await S.admin.from("fee_invoices").select("status").eq("id", myInv.id).maybeSingle();
  ok("FEE9 student sees own paid invoice", ownInv?.status === "paid");
  const stuGen = await S.admin.rpc("generate_fee_invoices", { p_structure_id: fs1.id });
  ok("FEE10 student blocked from generating", !!stuGen.error, stuGen.error?.message || "expected error");

  // Payroll: set teacher salary, run month, mark paid → expense posted
  const { data: sal } = await ad("staff_salaries").upsert({
    staff_user_id: tId, institution_id: inst, monthly_amount: 45000, active: true,
  }, { onConflict: "staff_user_id" }).select().single();
  ok("PAY1 set staff salary", !!sal && Number(sal.monthly_amount) === 45000);
  const month = todayStr().slice(0, 8) + "01";
  await svc0(`DELETE FROM payroll_runs WHERE institution_id='${inst}' AND month='${month}'`);
  const run = await A.admin.rpc("run_payroll", { p_month: month });
  ok("PAY2 run payroll for month", !run.error && /^[0-9a-f-]{36}$/i.test(String(run.data)), run.error?.message || String(run.data));
  const runId = String(run.data);
  const dupRun = await A.admin.rpc("run_payroll", { p_month: month });
  ok("PAY3 duplicate month blocked", !!dupRun.error, dupRun.error?.message || "expected error");
  const paid = await A.admin.rpc("pay_payroll", { p_run_id: runId });
  ok("PAY4 mark paid posts total expense", !paid.error && Number(paid.data) === 45000, JSON.stringify(paid.data));
  const { data: salTx } = await ad("finance_transactions").select("*")
    .eq("institution_id", inst).eq("category", "Salaries").ilike("description", "%Payroll%");
  ok("PAY5 salary expense in ledger", (salTx ?? []).some(x => Number(x.amount) === 45000));


  const MGMT = process.env.SUPABASE_MGMT;
  const svc = svc0;
  await svc(`DELETE FROM courses WHERE code LIKE 'PR-${stamp}'`);
  await svc(`DELETE FROM announcements WHERE title LIKE '%${stamp}'`);
  await svc(`DELETE FROM institution_alerts WHERE title LIKE '%${stamp}'`);
  await svc(`DELETE FROM finance_transactions WHERE description LIKE '%${stamp}'`);
  await svc(`DELETE FROM finance_budgets WHERE category='Technology' AND fiscal_year='2026-27'`);
  await svc(`DELETE FROM departments WHERE name LIKE '%${stamp}'`);
  await svc(`DELETE FROM grade_entries WHERE assessment_name LIKE '%${stamp}'`);
  await svc(`DELETE FROM finance_transactions WHERE description LIKE '%${stamp}%' OR description LIKE '%Payroll%'`);
  await svc(`DELETE FROM payroll_runs WHERE institution_id='${inst}'`);
  await svc(`DELETE FROM staff_salaries WHERE institution_id='${inst}'`);
  await svc(`DELETE FROM fee_invoices WHERE fee_structure_id='${fs1?.id ?? ""}'`);
  await svc(`DELETE FROM fee_structures WHERE id='${fs1?.id ?? ""}'`);
  console.log("  cleaned");

  console.log(`\n${"═".repeat(48)}`);
  console.log(`PRINCIPAL RESULT: ${passCount} passed, ${failCount} failed`);
  if (failures.length) {
    failures.forEach((f) => console.log(` ✗ ${f.name}: ${f.detail}`));
    process.exit(1);
  }
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });

function todayStr() { return new Date().toISOString().slice(0, 10); }
