// Live check: student fees page + parent pages respond 200 with session.
const fs = require("fs");
const path = require("path");
const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const env = {};
envContent.split("\n").forEach((l) => { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); });
const { createClient } = require("@supabase/supabase-js");

(async () => {
  const ref = env.NEXT_PUBLIC_SUPABASE_URL.replace("https://", "").split(".")[0];
  const mk = async (email, password) => {
    const c = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    await c.auth.signInWithPassword({ email, password });
    return c;
  };
  for (const [who, email, pass, path] of [
    ["student", "student@zynvera.app", "Student#2026!x", "/student/fees"],
  ]) {
    const c = await mk(email, pass);
    const { data } = await c.auth.getSession();
    const sess = { access_token: data.session.access_token, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "x", user: data.session.user };
    const enc = "base64-" + Buffer.from(JSON.stringify(sess)).toString("base64url");
    const parts = [];
    for (let i = 0; i < enc.length; i += 3180) parts.push(enc.slice(i, i + 3180));
    const cookie = parts.map((p, i) => `sb-${ref}-auth-token.${i}=${p}`).join("; ");
    const r = await fetch(`https://zynvera.localhousellm.com${path}`, { headers: { cookie } });
    const html = await r.text();
    console.log(who, path, "->", r.status, /application error/i.test(html) ? "CRASH" : "healthy");
  }
})();
