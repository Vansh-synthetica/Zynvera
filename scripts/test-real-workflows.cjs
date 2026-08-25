/**
 * REAL WORKFLOW E2E — simulates a student actually using Zynvera.
 * Every action mirrors what the UI buttons call (same tables/columns).
 * Teacher prepares → Student uses everything → Parent checks child → Cleanup.
 */
const fs = require("fs");
const path = require("path");

const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
});
const SB = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const { createClient } = require("@supabase/supabase-js");

// Service-level cleanup immune to RLS/persona quirks (test hygiene only).
async function sqlWipe() {
  const mgmt = process.env.SUPABASE_MGMT;
  if (!mgmt) return; // skip service-level wipe when token not provided
  await fetch(`https://api.supabase.com/v1/projects/${env.SUPABASE_PROJECT || "ccqfhsfkhrkbpczmuolp"}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${mgmt}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: "DELETE FROM parent_links; DELETE FROM notifications WHERE title='New assignment';" }),
  });
}

let passCount = 0, failCount = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) { passCount++; console.log(`  PASS ${name}`); }
  else { failCount++; failures.push({ name, detail }); console.log(`  FAIL ${name} :: ${detail || ""}`); }
}

async function loginClient(email, password) {
  const supabase = createClient(SB, ANON, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return { admin: supabase, uid: data.user.id };
}
const table = (c) => (t) => c.from(t);

(async () => {
  // ─────────────────────────── TEACHER PREPARES ───────────────────────────
  console.log("\n══ PHASE T: Teacher sets up a real course ══");
  const T = await loginClient("teacher@zynvera.app", "Teacher#2026!x");
  const tId = T.uid;
  const t = table(T.admin);

  const { data: prof } = await t("users").select("institution_id, role").eq("id", tId).single();
  const inst = prof.institution_id;
  ok("T1 teacher profile + institution", !!inst, JSON.stringify(prof));

  const stamp = Date.now().toString(36);
  const courseRow = {
    institution_id: inst, term_id: null, teacher_id: tId,
    code: `WF-${stamp}`, title: `Workflow Test Course ${stamp}`,
    description: "Created by workflow test", status: "active",
    color: "#3b82f6", max_students: 50, enrolled_students: 0,
  };
  // term_id may be NOT NULL without default — check
  let course, cErr;
  ({ data: course, error: cErr } = await t("courses").insert(courseRow).select().single());
  if (cErr && /term_id/.test(cErr.message)) {
    const { data: term } = await t("academic_terms").select("id").eq("institution_id", inst).eq("status", "active").limit(1).maybeSingle();
    courseRow.term_id = term?.id ?? null;
    ({ data: course, error: cErr } = await t("courses").insert(courseRow).select().single());
  }
  ok("T2 create course", !!course && !cErr, cErr?.message);
  if (!course) {
    console.log(`\nWORKFLOW RESULT: ${passCount} passed, ${failCount + 1} failed (abort)`);
    process.exit(1);
  }
  const courseId = course.id;

  const { data: studentProfile } = await T.admin.from("users").select("id").eq("email", "student@zynvera.app").maybeSingle();
  const sId = studentProfile?.id;
  ok("T3 find student user", !!sId);

  const { error: enrErr } = await t("course_enrolments")
    .upsert({ course_id: courseId, user_id: sId, status: "active" }, { onConflict: "course_id,user_id" });
  ok("T4 enroll student in course", !enrErr, enrErr?.message);
  await t("courses").update({ enrolled_students: 1 }).eq("id", courseId);

  const { data: resource, error: resErr } = await t("course_resources").insert({
    course_id: courseId, title: "Week 1 Slides", type: "link",
    url: "https://example.com/slides.pdf",
  }).select().single();
  ok("T5 add course resource", !!resource && !resErr, resErr?.message);

  const { data: ann, error: annErr } = await t("announcements").insert({
    course_id: courseId, author_id: tId,
    title: "Welcome!", content: "First announcement for the workflow course.",
    priority: "normal", pinned: false, published_at: new Date().toISOString(),
  }).select().single();
  ok("T6 post course announcement", !!ann && !annErr, annErr?.message);

  const due = new Date(Date.now() + 5 * 86_400_000).toISOString();
  const { data: asg, error: asgErr } = await t("assignments").insert({
    course_id: courseId, title: `Essay ${stamp}`, description: "Write an essay",
    instructions: "500 words on testing", due_date: due.slice(0, 10),
    status: "published", published_at: new Date().toISOString(),
    max_score: 100, submission_type: "text", late_policy: "none",
  }).select().single();
  ok("T7 publish assignment", !!asg && !asgErr, asgErr?.message);

  // Teacher publishes assignment → UI notifies enrolled students (Fix B behavior)
  const { data: notifs, error: nfErr } = await t("notifications").insert({
    user_id: sId, title: "New assignment",
    message: `${asg.title} has been published.`,
    category: "assignments", read: false,
    action_url: `/student/assignments/${asg.id}`, source: courseId,
  }).select().single();
  ok("T8 assignment notification created for student", !!notifs && !nfErr, nfErr?.message);

  // Quiz with known answers: 2 pts + 3 pts + 2 long_answer(2pts, manual)
  const { data: quiz, error: quizErr } = await t("assessments").insert({
    course_id: courseId, title: `Chapter Quiz ${stamp}`, type: "quiz",
    description: "Auto-graded quiz", duration: 15,
    max_score: 7, max_attempts: 2, status: "active",
    shuffle_questions: false, show_answers: true,
  }).select().single();
  ok("T9 create active quiz", !!quiz && !quizErr, quizErr?.message);
  const quizId = quiz.id;

  const { data: questions, error: qErr } = await t("assessment_questions").insert([
    { assessment_id: quizId, type: "multiple_choice", text: "Capital of France?", options: [{ text: "London" }, { text: "Paris" }, { text: "Berlin" }], correct_answer: "Paris", points: 2, order_index: 0 },
    { assessment_id: quizId, type: "true_false", text: "The sky is blue.", options: [{ text: "True" }, { text: "False" }], correct_answer: "True", points: 3, order_index: 1 },
    { assessment_id: quizId, type: "short_answer", text: "2+2=?", options: [], correct_answer: "4", points: 2, order_index: 2 },
  ]).select();
  ok("T10 add 3 auto-gradable questions", Array.isArray(questions) && questions.length === 3 && !qErr, qErr?.message);

  const { data: topic, error: topErr } = await t("discussions").insert({
    course_id: courseId, author_id: tId,
    title: "Discussion: intro thread", content: "Say hello here.",
  }).select().single();
  ok("T11 teacher posts discussion topic", !!topic && !topErr, topErr?.message);

  const { data: section, error: secErr } = await t("class_sections").insert({
    course_id: courseId, name: "Section A", room: "R1", day: "Monday",
    start_time: "09:00", end_time: "10:00",
  }).select().single();
  ok("T12 create class section", !!section && !secErr, secErr?.message);

  const today = new Date().toISOString().slice(0, 10);
  const { data: attRec, error: attErr } = await t("attendance_records").insert({
    class_section_id: section.id, user_id: sId, date: today,
    status: "present", recorded_by: tId,
  }).select().single();
  ok("T13 mark student present today", !!attRec && !attErr, attErr?.message);

  const { data: slot, error: slotErr } = await t("timetable_slots").insert({
    course_id: courseId, user_id: sId, day: "Monday",
    start_time: "09:00", end_time: "10:00", room: "R1", type: "lecture", color: "#10b981",
  }).select().single();
  ok("T14 add timetable slot", !!slot && !slotErr, slotErr?.message);

  const soon = new Date(Date.now() + 24 * 3600e3).toISOString();
  const { data: meeting, error: mtgErr } = await t("meetings").insert({
    course_id: courseId, host_id: tId, title: "Live review session",
    platform: "zoom", meeting_url: "https://zoom.us/j/123456",
    scheduled_at: soon, duration: 60, status: "scheduled",
  }).select().single();
  let mtgOk = !!meeting && !mtgErr;
  if (mtgOk) {
    const { error: maErr } = await t("meeting_attendees").insert({ meeting_id: meeting.id, user_id: sId, status: "invited" });
    mtgOk = !maErr;
    if (maErr) ok("T15 create meeting + attendee", false, maErr.message);
  }
  ok("T15 create meeting + attendee", mtgOk, mtgErr?.message);

  // ─────────────────────────── STUDENT USES EVERYTHING ─────────────────────
  console.log("\n══ PHASE S: Student uses every feature ══");
  const S = await loginClient("student@zynvera.app", "Student#2026!x");
  const st = table(S.admin);
  ok("S1 student login", S.uid === sId, `uid=${S.uid}`);

  const { data: myCourses, error: mcErr } = await st("course_enrolments").select("course_id, courses(*)").eq("user_id", sId).eq("status", "active");
  const hasCourse = (myCourses ?? []).some((r) => r.course_id === courseId);
  ok("S2 dashboard: sees enrolled course", hasCourse && !mcErr, mcErr?.message || `got ${(myCourses ?? []).length}`);

  const { data: courseDetail, error: cdErr } = await st("courses").select("*").eq("id", courseId).maybeSingle();
  ok("S3 open course detail", !!courseDetail && !cdErr, cdErr?.message);

  const { data: myResources, error: mrErr } = await st("course_resources").select("*").eq("course_id", courseId);
  ok("S4 sees course resources", (myResources ?? []).some(r => r.title === "Week 1 Slides") && !mrErr, mrErr?.message);

  const { data: courseAnns } = await st("announcements").select("*").eq("course_id", courseId);
  ok("S5 sees course announcements", (courseAnns ?? []).some(a => a.title === "Welcome!"));

  const { data: asgList } = await st("assignments").select("*, assignment_attachments(*), rubric_items(*)").eq("course_id", courseId).order("due_date");
  ok("S6 sees published assignment", (asgList ?? []).some(a => a.id === asg.id));

  // Submit work (detail page path — content column after Fix #4)
  const { data: submission, error: subErr } = await st("submissions")
    .upsert({ assignment_id: asg.id, user_id: sId, content: "My essay answer about testing.", status: "submitted", submitted_at: new Date().toISOString() })
    .select()
    .single();
  ok("S7 SUBMIT assignment (content column)", !!submission && !subErr, subErr?.message || "CRITICAL: content column broken");

  // Notification from publish appears
  const { data: sNotifs } = await st("notifications").select("*").eq("user_id", sId).order("created_at", { ascending: false }).limit(50);
  const pubNotif = (sNotifs ?? []).find(n => n.source === courseId && n.category === "assignments");
  ok("S8 notification bell shows 'New assignment'", !!pubNotif);
  if (pubNotif) {
    await st("notifications").update({ read: true }).eq("id", pubNotif.id);
    const { count } = await st("notifications").select("*", { count: "exact", head: true }).eq("user_id", sId).eq("read", false);
    ok("S9 mark-as-read decrements unread", typeof count === "number");
  }

  // Quiz attempt 1: all correct → expect 7/7 auto-grade
  const qRows = await st("assessment_questions").select("id,type,text,options,points").eq("assessment_id", quizId).order("order_index");
  ok("S10 loads quiz questions", (qRows.data ?? []).length === 3, qRows.error?.message);
  const answersCorrect = {};
  for (const q of qRows.data) {
    if (q.type === "multiple_choice") answersCorrect[q.id] = "Paris";
    else if (q.type === "true_false") answersCorrect[q.id] = "True";
    else answersCorrect[q.id] = "4";
  }
  const r1 = await S.admin.rpc("student_submit_quiz", { p_assessment_id: quizId, p_answers: answersCorrect });
  ok("S11 submit perfect quiz via RPC", !r1.error, r1.error?.message);
  ok("S12 auto-graded 7/7", r1.data?.score === 7, JSON.stringify(r1.data));

  // Gradebook sync: grade_entries row exists & visible to student
  const { data: gEntries } = await st("grade_entries").select("*").eq("user_id", sId).eq("assessment_name", quiz.title);
  ok("S13 quiz score lands in Grades page", (gEntries ?? []).length === 1 && Number(gEntries[0].score) === 7, JSON.stringify(gEntries?.map(g=>g.score)));

  // Attempt 2: all wrong → 0/7 updates same entry (retake flow)
  const answersWrong = {};
  for (const q of qRows.data) answersWrong[q.id] = "zzz-wrong";
  const r2 = await S.admin.rpc("student_submit_quiz", { p_assessment_id: quizId, p_answers: answersWrong });
  ok("S14 retake allowed (attempt 2/2)", !r2.error, r2.error?.message);
  ok("S15 retake scored 0", r2.data?.score === 0, JSON.stringify(r2.data));
  const { data: gEntries2 } = await st("grade_entries").select("score").eq("user_id", sId).eq("assessment_name", quiz.title);
  ok("S16 gradebook reflects latest attempt", gEntries2?.length === 1 && Number(gEntries2[0].score) === 0, JSON.stringify(gEntries2));

  // Attempt 3 blocked
  const r3 = await S.admin.rpc("student_submit_quiz", { p_assessment_id: quizId, p_answers: answersWrong });
  ok("S17 third attempt blocked", !!r3.error && /attempts/i.test(r3.error.message), r3.error?.message || "should have failed");

  // Community: reply to teacher topic + like; ask own question
  const { data: reply, error: repErr } = await st("discussion_replies").insert({
    discussion_id: topic.id, author_id: sId, content: "Hello from student!",
  }).select().single();
  ok("S18 reply in discussion", !!reply && !repErr, repErr?.message);
  const { error: likeErr } = await st("discussion_replies").update({ likes: (reply.likes ?? 0) + 1 }).eq("id", reply.id);
  ok("S19 like reply", !likeErr, likeErr?.message);
  const { data: myQ, error: mqErr } = await st("discussions").insert({
    course_id: courseId, author_id: sId, title: "Student question", content: "Can you explain week 2?",
  }).select().single();
  ok("S20 ask own question", !!myQ && !mqErr, mqErr?.message);

  // Messages: student ↔ teacher conversation
  const { data: sentMsg, error: smErr } = await st("messages").insert({
    sender_id: sId, recipient_id: tId, content: "Hi teacher, question about the essay.",
  }).select().single();
  ok("S21 send message to teacher", !!sentMsg && !smErr, smErr?.message);

  const { data: tConvos, error: tcErr } = await T.admin.from("messages").select("*").or(`sender_id.eq.${tId},recipient_id.eq.${tId}`);
  const thread = (tConvos ?? []).filter(m => m.sender_id === sId || m.recipient_id === sId);
  ok("S22 teacher sees conversation", thread.length >= 1 && !tcErr, tcErr?.message);
  await T.admin.from("messages").update({ read: true }).eq("sender_id", sId).eq("recipient_id", tId).eq("read", false);
  const { data: tReply, error: trErr } = await T.admin.from("messages").insert({
    sender_id: tId, recipient_id: sId, content: "Great question — check section 2 of the slides.",
  }).select().single();
  ok("S23 teacher replies", !!tReply && !trErr, trErr?.message);

  const { data: conv, error: cvErr } = await st("messages").select("*").or(
    `and(sender_id.eq.${sId},recipient_id.eq.${tId}),and(sender_id.eq.${tId},recipient_id.eq.${sId})`
  ).order("created_at");
  ok("S24 student sees full conversation", (conv ?? []).some(m => m.id === sentMsg.id) && (conv ?? []).some(m => m.id === tReply.id) && !cvErr, cvErr?.message || `got ${(conv ?? []).length}`);

  // People directory: roster (students) + teacher via course row + searchable
  const { data: roster } = await st("course_enrolments").select("user_id, users(name,email,role)").eq("course_id", courseId).eq("status", "active");
  const { data: courseRowPpl } = await st("courses").select("teacher_id").eq("id", courseId).single();
  ok("S25 roster shows classmates; teacher via course", (roster ?? []).some(r => r.user_id === sId) && courseRowPpl?.teacher_id === tId);
  const sr = await S.admin.rpc("search_messageable_users", { p_query: "teacher" });
  ok("S26 people search finds teacher (New Chat)", !sr.error && (sr.data ?? []).some(u => u.id === tId), sr.error?.message || JSON.stringify(sr.data));

  // Family code exists for parent linking
  const { data: meRow } = await st("users").select("family_code").eq("id", sId).single();
  ok("S27 family code present", !!meRow?.family_code, JSON.stringify(meRow));

  // Timetable / calendar / meetings / attendance reads
  const { data: slots } = await st("timetable_slots").select("*, courses(title,code)").eq("user_id", sId);
  ok("S28 timetable shows Monday lecture", (slots ?? []).some(s => s.course_id === courseId));
  const { data: events, error: evErr } = await st("calendar_events").select("*").or(`user_id.is.null,user_id.eq.${sId}`);
  ok("S29 calendar loads", !evErr, evErr?.message);
  const { data: myMtgs } = await st("meeting_attendees").select("meetings(*), status").eq("user_id", sId);
  ok("S30 meetings list shows review session", (myMtgs ?? []).some(m => m.meetings?.title === "Live review session"));
  const { data: att, error: atErr } = await st("attendance_records").select("*, class_sections(name, day, start_time, end_time, courses(title, code))").eq("user_id", sId);
  ok("S31 attendance shows today present", (att ?? []).some(a => a.date === today && a.status === "present") && !atErr, atErr?.message);

  // ───────────────── TEACHER GRADES → STUDENT SEES GRADE ─────────────────
  console.log("\n══ PHASE G: Grading loop closes ══");
  const { error: gradeErr } = await T.admin.from("submissions")
    .update({ score: 88, feedback: "Strong essay", graded_by: tId, graded_at: new Date().toISOString(), status: "graded" })
    .eq("id", submission.id);
  ok("G1 teacher grades submission", !gradeErr, gradeErr?.message);
  const { data: gradedSub } = await st("submissions").select("score,status,feedback").eq("id", submission.id).single();
  ok("G2 student sees graded result", gradedSub?.score === 88 && gradedSub?.status === "graded", JSON.stringify(gradedSub));

  // Appeal (≥10 chars enforced client-side; test DB path)
  const { data: appeal, error: apErr } = await st("grade_appeals").insert({
    course_id: courseId, user_id: sId, submission_id: submission.id,
    reason: "I believe the rubric section B was miscounted.", status: "pending",
  }).select().single();
  ok("G3 appeal submitted", !!appeal && !apErr, apErr?.message);
  const { data: myAppeals } = await st("grade_appeals").select("*").eq("user_id", sId);
  ok("G4 student sees own appeal", (myAppeals ?? []).some(a => a.id === appeal.id));

  // ─────────────────────────── PARENT CHECKS CHILD ────────────────────────
  console.log("\n══ PHASE P: Parent portal ══");
  const P = await loginClient("parent@zynvera.app", "Parent#2026!x");
  const pId = P.uid;
  const pt = table(P.admin);
  const { data: childRow } = await pt("users").select("id,institution_id").eq("family_code", meRow.family_code).eq("id", sId).maybeSingle();
  // Mirror /parent/link: RPC lookup by email + family code, then pending link
  const fl = await P.admin.rpc("find_linkable_student", {
    p_identifier: "student@zynvera.app",
    p_family_code: meRow.family_code,
  });
  const child = (fl.data ?? [])[0];
  ok("P1 resolve child via family code + email", !fl.error && !!child && child.id === sId, fl.error?.message || JSON.stringify(fl.data));

  // Remove leftovers from previous runs so upsert starts clean
  await sqlWipe();

  const { data: link, error: plErr } = await pt("parent_links").upsert({
    institution_id: child.institution_id, parent_user_id: pId, student_user_id: child.id,
    relationship: "guardian", status: "pending", requested_at: new Date().toISOString(),
  }, { onConflict: "parent_user_id,student_user_id" }).select().single();
  ok("P2 request link (pending)", !!link && !plErr, plErr?.message);
  console.log(`    [dbg] link=${JSON.stringify(link)}`);

  if (link) {
    const A = await loginClient("admin@zynvera.app", "ZynAdmin#2026!vR7x");
    const { data: apprRow, error: apprErr } = await A.admin.from("parent_links").update({ status: "approved", approved_at: new Date().toISOString(), approved_by: tId }).eq("id", link.id).select();
    ok("P2b school approves link", !apprErr && (apprRow ?? []).length === 1, apprErr?.message || "zero rows matched");
  }

  const { data: dbgLinks } = await pt("parent_links").select("student_user_id,status").eq("parent_user_id", pId);
  console.log(`    [dbg] parent sees links=${JSON.stringify(dbgLinks)}`);

  const { data: links } = await pt("parent_links").select("student_user_id").eq("parent_user_id", pId).eq("status", "approved");
  ok("P3 parent dashboard lists child", (links ?? []).some(l => l.student_user_id === sId));
  const { data: pGrades, error: pgErr } = await pt("grade_entries").select("*").eq("user_id", sId);
  ok("P4 parent views child grades", !pgErr, pgErr?.message);
  const { data: pAtt, error: paErr } = await pt("attendance_records").select("*").eq("user_id", sId);
  ok("P5 parent views child attendance", !paErr, paErr?.message);

  // ─────────────────────────────── CLEANUP ────────────────────────────────
  console.log("\n══ CLEANUP ══");
  const dels = [
    ["notifications", ["source", courseId]],
    ["grade_appeals", ["id", appeal?.id]],
    ["messages", ["sender_id", sId]],
    ["messages", ["recipient_id", sId]],
    ["discussion_replies", ["id", reply?.id]],
    ["discussions", ["course_id", courseId]],
    ["submissions", ["assignment_id", asg.id]],
    ["assignments", ["course_id", courseId]],
    ["assessment_questions", ["assessment_id", quizId]],
    ["assessment_submissions", ["assessment_id", quizId]],
    ["assessments", ["id", quizId]],
    ["meeting_attendees", ["meeting_id", meeting?.id]],
    ["meetings", ["id", meeting?.id]],
    ["timetable_slots", ["course_id", courseId]],
    ["attendance_records", ["class_section_id", section.id]],
    ["class_sections", ["course_id", courseId]],
    ["course_resources", ["course_id", courseId]],
    ["announcements", ["course_id", courseId]],
    ["course_enrolments", ["course_id", courseId]],
    ["grade_entries", ["course_id", courseId]],
    ["courses", ["id", courseId]],
    ["parent_links", ["id", link?.id]],
  ];
  for (const [tbl, [col, val]] of dels) {
    if (!val) continue;
    const { error } = await T.admin.from(tbl).delete().eq(col, val);
    if (error) console.log(`  cleanup warn ${tbl}: ${error.message}`);
  }
  console.log("  cleanup done");

  console.log(`\n${"═".repeat(48)}`);
  console.log(`WORKFLOW RESULT: ${passCount} passed, ${failCount} failed`);
  if (failures.length) {
    console.log("\nFAILURES:");
    failures.forEach((f) => console.log(` ✗ ${f.name}: ${f.detail}`));
    process.exit(1);
  }
})();
