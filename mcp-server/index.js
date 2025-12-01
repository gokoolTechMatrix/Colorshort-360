import http from "node:http";

const port = process.env.PORT ? Number(process.env.PORT) : 8787;

const server = http.createServer((req, res) => {
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
