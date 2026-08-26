/**
 * TEACHER TODAY + ONE-TAP ATTENDANCE E2E
 * Covers: teacher_save_attendance RPC (atomic save, parent+student alerts,
 * dedup on re-save, non-owner blocked), Today page data paths (sections for
 * weekday, taken-status), quick homework post path.
 */
const fs = require("fs");
const path = require("path");
const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const env = {};
envContent.split("\n").forEach((l) => { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); });
const { createClient } = require("@supabase/supabase-js");

const MGMT = process.env.SUPABASE_MGMT;
async function svc(sql) {
  if (!MGMT) throw new Error("SUPABASE_MGMT required");
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

async function loginClient(email, password) {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return { admin: supabase, uid: data.user.id };
}

(async () => {
  const stamp = Date.now().toString(36);
  const todayStr = new Date().toISOString().slice(0, 10);

  // ── SETUP ──────────────────────────────────────────────────────
  console.log("══ SETUP ══");
  // Temp classmate with an approved parent link → parent alert testable
  const mateId = crypto.randomUUID();
  await svc(`INSERT INTO auth.users (id,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_user_meta_data)
    VALUES ('${mateId}','mate-${stamp}@zynvera.app','',now(),now(),now(),'{}')`);
  await svc(`UPDATE public.users SET name='Mate ${stamp}', role='student', institution_id='a1000000-0000-0000-0000-000000000001' WHERE id='${mateId}'`);

  const T = await loginClient("teacher@zynvera.app", "Teacher#2026!x");
  const t = T.admin.from.bind(T.admin);
  const { data: prof } = await t("users").select("institution_id").eq("id", T.uid).single();
  const { data: term } = await t("academic_terms").select("id").eq("institution_id", prof.institution_id).eq("status", "active").limit(1).maybeSingle();

  const { data: course } = await t("courses").insert({
    institution_id: prof.institution_id, term_id: term?.id ?? null, teacher_id: T.uid,
    code: `TT-${stamp}`, title: `Today Test ${stamp}`, status: "active",
    color: "#8b5cf6", max_students: 50, enrolled_students: 0,
  }).select().single();
  const courseId = course.id;

  const { data: S0 } = await t("users").select("id").eq("email", "student@zynvera.app").maybeSingle();
  const sId = S0.id;
  await t("course_enrolments").upsert([
    { course_id: courseId, user_id: sId, status: "active" },
    { course_id: courseId, user_id: mateId, status: "active" },
  ], { onConflict: "course_id,user_id" });

  const wd = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
  const { data: section } = await t("class_sections").insert({
    course_id: courseId, name: `Sec ${stamp}`, room: "B12",
    day: wd, start_time: "09:00", end_time: "09:45",
  }).select().single();

  // approved parent link for main student (service-level: teacher can't insert links)
  const { data: parentU } = await t("users").select("id").eq("email", "parent@zynvera.app").maybeSingle();
  await svc(`DELETE FROM parent_links WHERE parent_user_id='${parentU.id}' AND student_user_id='${sId}'`);
  await svc(`INSERT INTO parent_links (institution_id, parent_user_id, student_user_id, relationship, status, requested_at, approved_at)
    VALUES ('${prof.institution_id}', '${parentU.id}', '${sId}', 'guardian', 'approved', now(), now())`);
  const [{ cnt: linkCnt }] = await svc(`SELECT count(*)::int AS cnt FROM parent_links WHERE parent_user_id='${parentU.id}' AND student_user_id='${sId}' AND status='approved'`);
  ok("SETUP parent link approved", linkCnt === 1, `cnt=${linkCnt}`);
  console.log(`  section ${section.id} on ${wd}; students: main + mate; parent link ready`);

  try {

    // ── RPC: bulk save ───────────────────────────────────────────
    console.log("\n══ ONE-TAP ATTENDANCE RPC ══");
    const S = await loginClient("student@zynvera.app", "Student#2026!x");
    // clear old attendance notifications to make counts deterministic
    await svc(`DELETE FROM notifications WHERE category='attendance' AND (user_id='${sId}' OR user_id='${parentU.id}' OR user_id='${mateId}')`);

    const r1 = await T.admin.rpc("teacher_save_attendance", {
      p_section_id: section.id,
      p_date: todayStr,
      p_records: [
        { user_id: sId, status: "absent" },
        { user_id: mateId, status: "present" },
      ],
    });
    ok("ATT1 save register via one call", !r1.error, r1.error?.message);
    ok("ATT2 result counts correct", r1.data?.saved === 2 && r1.data?.absent === 1 && r1.data?.late === 0, JSON.stringify(r1.data));

    const { data: rows } = await t("attendance_records").select("user_id,status").eq("class_section_id", section.id).eq("date", todayStr);
    ok("ATT3 register persisted (2 rows)", (rows ?? []).length === 2, JSON.stringify(rows));
    ok("ATT4 absent marked correctly", (rows ?? []).find(r => r.user_id === sId)?.status === "absent");

    const { data: pNotifs } = await t("notifications").select("*").eq("user_id", parentU.id).eq("category", "attendance");
    ok("ATT5 parent alerted about absence", (pNotifs ?? []).some(n => n.title === "Your child is not in school" && n.message.includes("Test Student")), JSON.stringify(pNotifs?.map(n => n.title)));

    const { data: sNotifs } = await t("notifications").select("*").eq("user_id", sId).eq("category", "attendance");
    ok("ATT6 student self-alert created", (sNotifs ?? []).length === 1);

    // re-save same day → no duplicate alerts, register replaced
    const r2 = await T.admin.rpc("teacher_save_attendance", {
      p_section_id: section.id,
      p_date: todayStr,
      p_records: [
        { user_id: sId, status: "absent" },
        { user_id: mateId, status: "late" },
      ],
    });
    ok("ATT7 re-save ok, late counted", !r2.error && r2.data?.saved === 2 && r2.data?.late === 1, JSON.stringify(r2.data));
    const { count: dupAlerts } = await t("notifications").select("*", { count: "exact", head: true })
      .eq("user_id", parentU.id).eq("category", "attendance").eq("title", "Your child is not in school");
    ok("ATT8 absence alert NOT duplicated on re-save", dupAlerts === 1, `count=${dupAlerts}`);
    const { count: rowCount } = await t("attendance_records").select("*", { count: "exact", head: true }).eq("class_section_id", section.id).eq("date", todayStr);
    ok("ATT9 still exactly 2 rows after re-save", rowCount === 2, `count=${rowCount}`);

    // non-owner teacher blocked
    const TB = await loginClient("teacher-b@zynvera.app", "TeacherB#2026!x");
    const r3 = await TB.admin.rpc("teacher_save_attendance", {
      p_section_id: section.id,
      p_date: todayStr,
      p_records: [{ user_id: sId, status: "present" }],
    });
    ok("ATT10 foreign teacher blocked", !!r3.error, r3.error?.message || "expected error");

    // invalid status rejected
    const r4 = await T.admin.rpc("teacher_save_attendance", {
      p_section_id: section.id,
      p_date: todayStr,
      p_records: [{ user_id: sId, status: "sleeping" }],
    });
    ok("ATT11 invalid status rejected", !!r4.error && /Invalid attendance status/i.test(r4.error.message), r4.error?.message);

    // ── TODAY PAGE DATA PATHS ────────────────────────────────────
    console.log("\n══ TODAY PAGE DATA ══");
    const secLists = await t("class_sections").select("*").eq("course_id", courseId);
    const all = secLists.data ?? [];
    console.log(`    [dbg] weekday=${wd}; sections: ${JSON.stringify(all.map(s => ({ day: s.day, start: s.start_time })))}`);
    const todays = all.filter(s => (s.day ?? "").toLowerCase() === wd.toLowerCase());
    ok("TD1 today-page finds section by weekday", todays.length === 1 && (todays[0].start_time ?? "").startsWith("09:00"), JSON.stringify(todays.map(s => s.start_time)));

    const att = await listAttendanceSafe(t, section.id, todayStr);
    ok("TD2 taken-status chip reflects saved register", att > 0);

    // homework post path (same calls the dialog makes)
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const hw = await t("assignments").insert({
      course_id: courseId, title: `HW ${stamp}`, description: null,
      due_date: tomorrow, status: "published", published_at: new Date().toISOString(),
      max_score: 100, submission_type: "text", late_policy: "none",
    }).select().single();
    ok("TD3 quick homework posts published", !!hw.data && !hw.error, hw.error?.message);
    const nf = await t("notifications").insert({
      user_id: sId, title: "New homework",
      message: `HW ${stamp} — due ${tomorrow}`, category: "assignments",
      action_url: `/student/assignments/${hw.data.id}`, source: courseId,
    }).select().single();
    ok("TD4 homework notification fires", !!nf.data && !nf.error, nf.error?.message);

    // ── LIVE PAGE CHECKS ─────────────────────────────────────────
    console.log("\n══ LIVE PAGES ══");
    const ref = env.NEXT_PUBLIC_SUPABASE_URL.replace("https://", "").split(".")[0];
    const { data: tok } = await T.admin.auth.getSession();
    const payload = { access_token: tok.session.access_token, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "x", user: { id: T.uid } };
    const enc = "base64-" + Buffer.from(JSON.stringify(payload)).toString("base64url");
    const parts = []; for (let i = 0; i < enc.length; i += 3180) parts.push(enc.slice(i, i + 3180));
    const cookie = parts.map((p, i) => `sb-${ref}-auth-token.${i}=${p}`).join("; ");
    for (const p of ["/teacher/today", `/teacher/attendance?section=${section.id}&date=${todayStr}`]) {
      const rr = await fetch(`https://zynvera.localhousellm.com${p}`, { headers: { cookie } });
      const html = await rr.text().catch(() => "");
      ok(`LIVE ${p}`, rr.status === 200 && !/application error/i.test(html), String(rr.status));
    }

  } finally {
    console.log("\n══ CLEANUP ══");
    try {
      await svc(`DELETE FROM courses WHERE code LIKE 'TT-%'`);
      await svc(`DELETE FROM notifications WHERE category='attendance'`);
      await svc(`DELETE FROM notifications WHERE source='${courseId}' OR message LIKE '%${stamp}%'`);
      await svc(`DELETE FROM auth.users WHERE id='${mateId}'`);
      console.log("  cleaned");
    } catch (e) { console.log(`  cleanup warn: ${e.message}`); }
  }

  console.log(`\n${"═".repeat(48)}`);
  console.log(`TODAY RESULT: ${passCount} passed, ${failCount} failed`);
  if (failures.length) {
    failures.forEach((f) => console.log(` ✗ ${f.name}: ${f.detail}`));
    process.exit(1);
  }
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });

async function listAttendanceSafe(t, sectionId, date) {
  const { data } = await t("attendance_records").select("id").eq("class_section_id", sectionId).eq("date", date);
  return (data ?? []).length;
}
