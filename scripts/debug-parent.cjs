const fs = require("fs");
const path = require("path");
const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const env = {};
envContent.split("\n").forEach((l) => { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); });
const { createClient } = require("@supabase/supabase-js");

(async () => {
  const A = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data } = await A.auth.signInWithPassword({ email: "admin@zynvera.app", password: "ZynAdmin#2026!vR7x" });
  console.log("admin uid:", data.user.id);

  const { data: prof } = await A.from("users").select("institution_id,role").eq("id", data.user.id).single();
  console.log("admin profile:", prof);

  const q = A.from("parent_links").delete().eq("parent_user_id", "c45698b6-9945-4e9e-9141-06734d72e4da").eq("student_user_id", "61d72803-a801-46f3-804d-4dc5bd5f8044");
  const { data: del, error } = await q;
  console.log("delete:", error ? `ERR ${error.message}` : `deleted ${JSON.stringify(del)}`);

  const { data: left } = await A.from("parent_links").select("*");
  console.log("remaining links:", left);
})();
