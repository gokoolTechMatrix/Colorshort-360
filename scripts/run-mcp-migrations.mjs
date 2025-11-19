#!/usr/bin/env node
/**
 * Normalises how we run database migrations for the MCP server.
 * Delegates to the command defined in MCP_MIGRATION_COMMAND.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const serverPath =
  process.env.MCP_SERVER_PATH ?? path.resolve(repoRoot, "../mcp-server");
const migrationCommand =
  process.env.MCP_MIGRATION_COMMAND ??
  (process.platform === "win32" ? "pnpm.cmd db:migrate" : "pnpm db:migrate");

if (!existsSync(serverPath)) {
  console.error(
    `[mcp] Unable to find the MCP server directory at "${serverPath}". ` +
      "Set MCP_SERVER_PATH so migrations know where to run.",
  );
  process.exit(1);
}

const [cmd, ...args] = migrationCommand.split(" ");
console.log(
  `[mcp] Running migrations using "${cmd} ${args.join(" ")}" inside ${serverPath}`,
);

const child = spawn(cmd, args, {
  cwd: serverPath,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    MCP_DATABASE_URL:
      process.env.MCP_DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/mcp_local",
  },
});

child.on("exit", (code) => {
  if (code === 0) {
    console.log("[mcp] Migrations completed.");
  } else {
    console.error(`[mcp] Migration command failed with code ${code}.`);
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error("[mcp] Unable to execute migration command:", error);
  process.exit(1);
});
