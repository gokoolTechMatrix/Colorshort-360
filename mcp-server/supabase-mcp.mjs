import { Client } from "pg";

// Allow self-signed certs (common on corporate/VPN networks hitting Supabase)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const defaultDbUrl =
  process.env.MCP_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/mcp_local";

const createPgClient = () =>
  new Client({
    connectionString: defaultDbUrl,
    ssl: { rejectUnauthorized: false },
  });

export const createHealthHandler = () => {
  return async (_req, res) => {
    const client = createPgClient();
    try {
      await client.connect();
      await client.query("select 1");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", database: "connected" }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "error",
          message: error?.message ?? "database unavailable",
        }),
      );
    } finally {
      try {
        await client.end();
      } catch {}
    }
  };
};
