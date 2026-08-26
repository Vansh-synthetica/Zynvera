/** Follow the consent redirect chain to its final destination. */
const fs = require("fs");
const path = require("path");
const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const env = {};
envContent.split("\n").forEach((l) => { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); });
const { createClient } = require("@supabase/supabase-js");

(async () => {
  const ref = env.NEXT_PUBLIC_SUPABASE_URL.replace("https://", "").split(".")[0];
  const c = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email: "student@zynvera.app", password: "Student#2026!x" });
  const { data } = await c.auth.getSession();
  const sess = { access_token: data.session.access_token, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "x", user: data.session.user };
  const enc = "base64-" + Buffer.from(JSON.stringify(sess)).toString("base64url");
  const parts = [];
  for (let i = 0; i < enc.length; i += 3180) parts.push(enc.slice(i, i + 3180));
  const cookie = parts.map((p, i) => `sb-${ref}-auth-token.${i}=${p}`).join("; ");

  const connect = await fetch("https://zynvera.localhousellm.com/api/google/connect", {
    headers: { cookie }, redirect: "manual",
  });
  let url = connect.headers.get("location");

  for (let hop = 1; hop <= 5 && url; hop++) {
    const res = await fetch(url, { redirect: "manual" });
    const next = res.headers.get("location");
    console.log(`hop ${hop}: ${res.status} ${url.slice(0, 110)}`);
    if (!next) {
      const body = await res.text();
      const mismatch = body.includes("redirect_uri_mismatch");
      console.log("\nfinal page:", res.status, `len=${body.length}`);
      console.log("redirect_uri_mismatch error:", mismatch);
      console.log("sign-in form present:", /<form|Sign in|signin\//i.test(body));
      break;
    }
    url = new URL(next, url).toString();
  }
})();
