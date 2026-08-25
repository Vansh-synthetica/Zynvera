const fs = require("fs");
const path = require("path");
const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const env = {};
envContent.split("\n").forEach((l) => { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); });
const { createClient } = require("@supabase/supabase-js");

(async () => {
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data } = await admin.auth.signInWithPassword({ email: "teacher@zynvera.app", password: "Teacher#2026!x" });
  const t = admin.from.bind(admin);

  const { data: prof } = await t("users").select("institution_id").eq("id", data.user.id).single();
  const { data: term } = await admin.from("academic_terms").select("id").eq("institution_id", prof.institution_id).eq("status", "active").limit(1).maybeSingle();

  // find an existing course owned by teacher
  const { data: c } = await t("courses").select("id,title").eq("teacher_id", data.user.id).limit(1).maybeSingle();
  console.log("existing course:", c);

  // A: plain insert, NO returning
  const rA = await t("assignments").insert({ course_id: c.id, title: "RLS probe A", status: "draft" });
  console.log("A (no returning):", rA.error ? rA.error.message : "OK");

  // B: insert WITH returning
  const rB = await t("assignments").insert({ course_id: c.id, title: "RLS probe B", status: "draft" }).select().single();
  console.log("B (with returning):", rB.error ? rB.error.message : `OK id=${rB.data?.id}`);

  // cleanup probes
  const { data: del } = await t("assignments").delete().in("title", ["RLS probe A", "RLS probe B"]).select("id");
  console.log("cleaned:", del?.length);
})();
