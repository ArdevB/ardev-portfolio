// Pre-flight for db:* scripts: drizzle-kit exits silently when it can't
// connect, so check DATABASE_URL first and print a readable error.
import nextEnv from "@next/env";
import postgres from "postgres";

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.DATABASE_URL;

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

if (!url) fail("DATABASE_URL is empty. Add it to .env.local (see README → Database).");
if (url.includes("[YOUR-PASSWORD]") || url.includes("YOUR-PASSWORD"))
  fail("DATABASE_URL still contains [YOUR-PASSWORD]. Replace it (brackets included) with your database password.");

let parsed;
try {
  parsed = new URL(url);
} catch {
  fail("DATABASE_URL isn't a valid URL. If the password has special characters (@ # / ? : %), percent-encode them, e.g. @ → %40.");
}

const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 10 });
try {
  const [{ version }] = await sql`select version()`;
  console.log(`✔ Connected to ${parsed.hostname} — ${version.split(",")[0]}`);
} catch (e) {
  const hint =
    e.code === "28P01" || /password authentication/i.test(e.message)
      ? "Wrong password. Reset it in Supabase → Connect → Reset database password, then update .env.local."
      : e.code === "ENOTFOUND" || e.code === "EAI_AGAIN"
        ? "Host not found — check the connection string and your internet connection."
        : "";
  fail(`Could not connect: ${e.message}${hint ? `\n  ${hint}` : ""}`);
} finally {
  await sql.end({ timeout: 2 });
}
