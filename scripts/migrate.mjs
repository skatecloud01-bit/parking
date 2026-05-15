import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const sql = readFileSync(
  resolve(__dirname, "../drizzle/0002_ambiguous_phantom_reporter.sql"),
  "utf8"
);

const statements = sql
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter(Boolean);

const conn = await createConnection(process.env.DATABASE_URL);

for (const stmt of statements) {
  try {
    console.log("Executing:", stmt.slice(0, 60) + "...");
    await conn.execute(stmt);
    console.log("  ✓ OK");
  } catch (err) {
    if (err.code === "ER_TABLE_EXISTS_ERROR") {
      console.log("  ⚠ Table already exists, skipping");
    } else {
      console.error("  ✗ Error:", err.message);
    }
  }
}

await conn.end();
console.log("Migration complete.");
