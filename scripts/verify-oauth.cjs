// Verifies Google Drive OAuth wiring on production:
// 1) unauthenticated /api/google/connect -> redirects to /auth/login
// 2) authenticated -> redirects to REAL accounts.google.com consent with
//    correct client_id and redirect_uri
const fs = require("fs");
const path = require("path");
const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const env = {};
envContent.split("\n").forEach((l) => { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); });
const { createClient } = require("@supabase/supabase-js");

(async () => {
  const ref = env.NEXT_PUBLIC_SUPABASE_URL.replace("https://", "").split(".")[0];

  // 1) unauthenticated
  const anon = await fetch("https://zynvera.localhousellm.com/api/google/connect", { redirect: "manual" });
  console.log("anon connect ->", anon.status, anon.headers.get("location"));

  // 2) authenticated as student
  const c = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email: "student@zynvera.app", password: "Student#2026!x" });
  const { data } = await c.auth.getSession();
  const sess = { access_token: data.session.access_token, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "x", user: data.session.user };
  const enc = "base64-" + Buffer.from(JSON.stringify(sess)).toString("base64url");
  const parts = [];
  for (let i = 0; i < enc.length; i += 3180) parts.push(enc.slice(i, i + 3180));
  const cookie = parts.map((p, i) => `sb-${ref}-auth-token.${i}=${p}`).join("; ");

  const authed = await fetch("https://zynvera.localhousellm.com/api/google/connect", {
    headers: { cookie }, redirect: "manual",
  });
  const loc = authed.headers.get("location") ?? "";
  console.log("authed connect ->", authed.status);
  console.log("location:", loc.slice(0, 160));

  const url = new URL(loc);
  const okGoogle = url.hostname === "accounts.google.com";
  const cid = url.searchParams.get("client_id") ?? "";
  const ruri = url.searchParams.get("redirect_uri") ?? "";
  console.log("is google consent:", okGoogle);
  console.log("client id real:", cid.startsWith(env.GOOGLE_CLIENT_ID.slice(0, 12)));
  console.log("redirect uri:", ruri);
})();
