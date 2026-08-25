// Usage: SUPABASE_MGMT=<token> node scripts/db-query.mjs "SELECT 1"
const MGMT = process.env.SUPABASE_MGMT;
const PROJECT = process.env.SUPABASE_PROJECT || "ccqfhsfkhrkbpczmuolp";
if (!MGMT) {
  console.error("Set SUPABASE_MGMT env var (Supabase personal access token)");
  process.exit(1);
}

const sql = process.argv[2] || require("fs").readFileSync(0, "utf8");
const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${MGMT}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
if (!res.ok) {
  console.error("ERROR", res.status, text);
  process.exit(1);
}
console.log(text === "[]" ? "(no rows)" : text);
