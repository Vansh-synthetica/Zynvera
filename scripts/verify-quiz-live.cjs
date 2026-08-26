// Verifies the quiz-taking UI is live in production (authenticated fetch).
const fs = require("fs");
const path = require("path");
const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const env = {};
envContent.split("\n").forEach((l) => { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); });
const { createClient } = require("@supabase/supabase-js");

(async () => {
  const c = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data } = await c.auth.signInWithPassword({ email: "student@zynvera.app", password: "Student#2026!x" });
  const ref = env.NEXT_PUBLIC_SUPABASE_URL.replace("https://", "").split(".")[0];
  const sess = { access_token: data.access_token, token_type: "bearer", expires_in: data.expires_in, expires_at: Math.floor(Date.now() / 1000) + data.expires_in, refresh_token: data.refresh_token, user: data.user };
  const enc = "base64-" + Buffer.from(JSON.stringify(sess)).toString("base64url");
  const parts = [];
  for (let i = 0; i < enc.length; i += 3180) parts.push(enc.slice(i, i + 3180));
  const cookie = parts.map((p, i) => `sb-${ref}-auth-token.${i}=${p}`).join("; ");

  const res = await fetch("https://zynvera.localhousellm.com/student/assessments", { headers: { cookie } });
  const html = await res.text();
  const chunks = [...new Set([...html.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g)].map((m) => m[0]))];
  let hit = false;
  for (const ch of chunks) {
    const b = await fetch("https://zynvera.localhousellm.com" + ch).then((r) => r.text());
    if (b.includes("student_submit_quiz")) { hit = true; break; }
  }
  console.log(`status: ${res.status} | chunks scanned: ${chunks.length} | quiz UI live in prod: ${hit}`);
})();
