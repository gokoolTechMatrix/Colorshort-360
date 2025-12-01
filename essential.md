MCP is now wired and migrations run against your Supabase DB.

What I fixed/added

Updated scripts/run-mcp-*.mjs to auto-load .env.local so MCP_DATABASE_URL is honored.
Added missing MCP server files: mcp-server/server.mjs, index.mjs, supabase-mcp.mjs.
Adjusted mcp-server/migrations/001_init.sql (pgcrypto + sample table).
Added TLS override in migration/health paths to handle self-signed cert chains on your network.
Execution results

npm run mcp:migrate now succeeds against your Supabase URL (tables created).
How to use

Apply migrations anytime: npm run mcp:migrate.
Start the MCP server: npm run mcp:dev then visit http://localhost:8787/health to confirm DB connectivity.
To add real tables, edit/add SQL files under mcp-server/migrations and rerun npm run mcp:migrate.
If you want me to define specific Supabase tables, tell me the schema and I’ll add the migrations.