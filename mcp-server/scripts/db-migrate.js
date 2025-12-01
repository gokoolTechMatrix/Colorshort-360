import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

// Allow self-signed certs (common on corporate/VPN networks hitting Supabase)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.resolve(__dirname, "..", "migrations");
const databaseUrl =
  process.env.MCP_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/mcp_local";

async function run() {
  if (!fs.existsSync(migrationsDir)) {
    console.error(`[mcp] migrations directory missing: ${migrationsDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("[mcp] no migrations to apply");
    return;
  }

  console.log(`[mcp] applying ${files.length} migration(s) to ${databaseUrl}`);
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      console.log(`[mcp] running ${file}`);
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");
    }
    console.log("[mcp] migrations completed");
  } catch (error) {
    console.error("[mcp] migration failed:", error);
    try {
      await client.query("ROLLBACK");
    } catch {}
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
