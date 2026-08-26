const fs = require("fs");
const path = require("path");
const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const env = {};
envContent.split("\n").forEach((l) => { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); });
const { createClient } = require("@supabase/supabase-js");
const mgmt = process.env.SUPABASE_MGMT;
const svc = async (q) => {
  const r = await fetch("https://api.supabase.com/v1/projects/ccqfhsfkhrkbpczmuolp/database/query", {
    method: "POST",
    headers: { Authorization: `Bearer ${mgmt}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
  return r.json();
};
(async () => {
  const T = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  await T.auth.signInWithPassword({ email: "teacher@zynvera.app", password: "Teacher#2026!x" });
  const P = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  await P.auth.signInWithPassword({ email: "parent@zynvera.app", password: "Parent#2026!x" });

  await svc("DELETE FROM notifications WHERE category='attendance'");
  const [{ id: sid }] = await svc(`INSERT INTO class_sections (course_id,name,day,start_time,end_time,room)
    SELECT id,'DedupProbe',to_char(now(),'FMDay'),'10:00','10:30','X'
    FROM courses WHERE code IN ('ENG101','MTH101','PHY101') LIMIT 1 RETURNING id`);
  const [{ id: stu }] = await svc(`SELECT id FROM users WHERE email='student@zynvera.app'`);
  const args = { p_section_id: sid, p_date: new Date().toISOString().slice(0, 10), p_records: [{ user_id: stu, status: "absent" }] };

  const r1 = await T.rpc("teacher_save_attendance", args);
  console.log("save1:", JSON.stringify(r1.data), r1.error?.message);
  const n1 = await P.from("notifications").select("title", { count: "exact", head: true }).eq("category", "attendance").eq("title", "Your child is not in school");
  console.log("after save1 parent count:", n1.count);

  const r2 = await T.rpc("teacher_save_attendance", args);
  console.log("save2:", JSON.stringify(r2.data), r2.error?.message);
  const n2 = await P.from("notifications").select("title", { count: "exact", head: true }).eq("category", "attendance").eq("title", "Your child is not in school");
  console.log("after save2 parent count:", n2.count);

  // cleanup
  await svc(`DELETE FROM class_sections WHERE id='${sid}'`);
  await svc("DELETE FROM notifications WHERE category='attendance'");
})();
