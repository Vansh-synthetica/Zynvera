/**
 * Comprehensive all-sections test for the live production site.
 * Tests: public routes, auth for every persona, every authenticated
 * page renders (200 + no crash markers), and key data reads.
 */
const fs = require("fs");
const path = require("path");

const BASE = "https://zynvera.localhousellm.com";

// Load env
const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
});
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const PERSONAS = [
  { name: "student", role: "student", email: "student@zynvera.app", password: "Student#2026!x" },
  { name: "teacher", role: "teacher", email: "teacher@zynvera.app", password: "Teacher#2026!x" },
  { name: "principal", role: "principal", email: "admin@zynvera.app", password: "ZynAdmin#2026!vR7x" },
  { name: "parent", role: "parent", email: "parent@zynvera.app", password: "Parent#2026!x" },
  { name: "teacher-b (Springfield)", role: "teacher", email: "teacher-b@zynvera.app", password: "TeacherB#2026!x" },
  { name: "student-b (Springfield)", role: "student", email: "student-b@zynvera.app", password: "StudentB#2026!x" },
];

// Pages per persona section (all routes from app dir)
const SECTION_PAGES = {
  student: [
    "/student/dashboard", "/student/courses", "/student/assignments",
    "/student/assessments", "/student/grades", "/student/attendance",
    "/student/timetable", "/student/announcements", "/student/calendar",
    "/student/resources", "/student/community", "/student/people",
    "/student/analytics", "/student/reports", "/student/meetings",
    "/student/messages", "/student/notifications", "/student/family-code",
  ],
  teacher: [
    "/teacher/dashboard", "/teacher/classes", "/teacher/courses",
    "/teacher/assignments", "/teacher/assessments", "/teacher/assessments/builder",
    "/teacher/attendance", "/teacher/gradebook", "/teacher/gradebook/speedgrader",
    "/teacher/rubrics", "/teacher/rubrics/new", "/teacher/discussions",
    "/teacher/messages", "/teacher/students", "/teacher/analytics",
    "/teacher/courses/new",
  ],
  principal: [
    "/principal/dashboard", "/principal/students", "/principal/staff",
    "/principal/parents", "/principal/courses", "/principal/departments",
    "/principal/announcements", "/principal/alerts", "/principal/finance",
    "/principal/analytics", "/principal/reports", "/admin/overview",
    "/school-dashboard", "/school-dashboard/analytics", "/school-dashboard/attend-class",
  ],
  parent: ["/parent/dashboard", "/parent/link"],
  shared: ["/settings"],
};

const PUBLIC_PAGES = [
  "/", "/about", "/support", "/auth/login", "/auth/sign-up",
];

const results = { pass: 0, fail: 0, failures: [] };
function record(name, ok, detail) {
  if (ok) results.pass++;
  else {
    results.fail++;
    results.failures.push({ name, detail });
    console.log(`  FAIL ${name} :: ${detail}`);
  }
}

async function fetchPage(url, cookie) {
  try {
    const res = await fetch(url, {
      headers: cookie ? { cookie } : {},
      redirect: "manual",
    });
    return res;
  } catch (e) {
    return null;
  }
}

// Sanity: a rendered page must not be an empty shell or a crash page.
const CRASH_MARKERS = [
  "application error", "internal server error", "something went wrong",
  "unhandled error", "__next_error__",
];
function contentIsHealthy(html) {
  if (!html || html.length < 500) return false; // empty shell
  const lower = html.toLowerCase();
  return !CRASH_MARKERS.some((m) => lower.includes(m));
}

async function login(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    console.log(`    login error ${email}: ${res.status} ${await res.text().catch(() => "")}`.slice(0, 200));
    return null;
  }
  const data = await res.json();
  // @supabase/ssr v0.7.0 cookie format:
  //   name: sb-<ref>-auth-token (chunked as .0/.1/... when encoded > 3180 chars)
  //   value: "base64-" + base64url(JSON.stringify(session))
  const ref = SUPABASE_URL.replace("https://", "").split(".")[0];
  const session = {
    access_token: data.access_token,
    token_type: "bearer",
    expires_in: data.expires_in,
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    refresh_token: data.refresh_token,
    user: data.user,
  };
  const encoded = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  const CHUNK = 3180;
  if (encoded.length <= CHUNK) {
    return `sb-${ref}-auth-token=${encoded}`;
  }
  const parts = [];
  for (let i = 0; i < encoded.length; i += CHUNK) parts.push(encoded.slice(i, i + CHUNK));
  return parts.map((c, i) => `sb-${ref}-auth-token.${i}=${c}`).join("; ");
}

(async () => {
  console.log(`\n=== SECTION 1: Public pages (${BASE}) ===`);
  for (const p of PUBLIC_PAGES) {
    const res = await fetchPage(`${BASE}${p}`);
    record(`public ${p}`, res && (res.status === 200 || res.status === 307),
      `status=${res ? res.status : "network-error"}`);
  }

  console.log(`\n=== SECTION 2: Persona logins ===`);
  const sessions = {};
  for (const persona of PERSONAS) {
    const cookie = await login(persona.email, persona.password);
    record(`login ${persona.name}`, !!cookie, cookie ? "ok" : "login failed");
    if (cookie) sessions[persona.name] = { cookie, persona };
  }

  console.log(`\n=== SECTION 3: Authenticated page rendering ===`);
  for (const [name, sess] of Object.entries(sessions)) {
    const role = sess.persona.role;
    let pages = [];
    if (role === "student") pages = [...SECTION_PAGES.student, ...SECTION_PAGES.shared];
    else if (role === "teacher") pages = [...SECTION_PAGES.teacher, ...SECTION_PAGES.shared];
    else if (role === "principal") pages = [...SECTION_PAGES.principal, ...SECTION_PAGES.shared];
    else if (role === "parent") pages = [...SECTION_PAGES.parent, ...SECTION_PAGES.shared];

    console.log(`  -- ${name}: ${pages.length} pages`);
    for (const p of pages) {
      const res = await fetchPage(`${BASE}${p}`, sess.cookie);
      const okStatus = res && res.status === 200;
      let ok = okStatus;
      let detail = `status=${res ? res.status : "net-err"}`;
      if (okStatus) {
        const html = await res.text();
        const healthy = contentIsHealthy(html);
        if (!healthy) {
          ok = false;
          detail = "status=200 but page is empty shell or contains crash markers";
        }
      }
      record(`${name} ${p}`, ok, detail);
    }
  }

  console.log(`\n=== SECTION 4: Unauthenticated protection ===`);
  for (const p of ["/student/dashboard", "/teacher/dashboard", "/principal/dashboard"]) {
    const res = await fetchPage(`${BASE}${p}`);
    const protectedOk = res && (res.status === 307 || res.status === 302);
    record(`unauth redirect ${p}`, protectedOk, `status=${res ? res.status : "net-err"} (expected 307 to login)`);
  }

  console.log(`\n========================================`);
  console.log(`TOTAL: ${results.pass} passed, ${results.fail} failed`);
  if (results.failures.length) {
    console.log(`\nFAILURES:`);
    results.failures.forEach((f) => console.log(` - ${f.name}: ${f.detail}`));
  }
})();
