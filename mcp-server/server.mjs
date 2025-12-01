import http from "node:http";
import { createHealthHandler } from "./supabase-mcp.mjs";

const port = process.env.PORT ? Number(process.env.PORT) : 8787;

const healthHandler = createHealthHandler();

const server = http.createServer(async (req, res) => {
  if (req.url === "/health") {
    await healthHandler(req, res);
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: "ok",
      message: "MCP server placeholder running",
      uptime: process.uptime(),
    }),
  );
});

server.listen(port, () => {
  console.log(`[mcp] server listening on http://localhost:${port}`);
});
