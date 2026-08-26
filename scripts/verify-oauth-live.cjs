/**
 * End-to-end OAuth reachability test against Google's real servers.
 * A) Consent URL accepted?  (registered client + redirect_uri -> 200 sign-in
 *    page; unregistered -> error page containing redirect_uri_mismatch)
 * B) Callback route handles a bogus code gracefully -> ?error=exchange_failed
 *    (proves routing + state parsing + live token-exchange attempt)
 */
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

  // A) consent reachability
  const connect = await fetch("https://zynvera.localhousellm.com/api/google/connect", {
    headers: { cookie }, redirect: "manual",
  });
  const consentUrl = connect.headers.get("location");
  console.log("consent url:", consentUrl.slice(0, 120) + "...");

  const consent = await fetch(consentUrl, { redirect: "manual" });
  const body = await consent.text();
  const mismatch = body.includes("redirect_uri_mismatch") || body.includes("Error 400: redirect_uri_mismatch");
  const invalidClient = body.includes("invalid_client") || body.includes("Error 401");
  console.log("\n[A] Google response:", consent.status);
  console.log("    redirect_uri registered :", !mismatch && consent.status === 200);
  console.log("    client id valid          :", !invalidClient);
  if (mismatch) console.log("    >>> Google says redirect_uri_mismatch — URI not saved on this client");
  if (!mismatch && !invalidClient && consent.status === 200) {
    const hasSignIn = /sign in|choose an account|accounts\.google\.com\/signin/i.test(body);
    console.log("    sign-in screen rendered  :", hasSignIn || body.length > 5000);
  }

  // B) callback negative-path (bogus code, valid state shape)
  const state = Buffer.from(JSON.stringify({ uid: "00000000-0000-0000-0000-000000000000" })).toString("base64url");
  const cb = await fetch(
    `https://zynvera.localhousellm.com/api/google/callback?code=BOGUS_CODE&state=${state}`,
    { headers: { cookie }, redirect: "manual" },
  );
  const cbLoc = cb.headers.get("location") ?? "";
  console.log("\n[B] callback with bogus code ->", cb.status, cbLoc.replace("https://zynvera.localhousellm.com", ""));
  console.log("    reached token exchange   :", cbLoc.includes("error=exchange_failed"));
})();
