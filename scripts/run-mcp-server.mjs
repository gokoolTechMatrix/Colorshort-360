#!/usr/bin/env node
/**
 * Lightweight wrapper to start a local MCP (Model Context Protocol) server.
 * The script keeps all wiring inside this repo so we do not need to duplicate
 * run commands across editors or automation.
 */

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const loadEnvFile = (filePath) => {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
};

const repoRoot = process.cwd();
loadEnvFile(path.join(repoRoot, ".env.local"));
loadEnvFile(path.join(repoRoot, ".env"));

const cwd = process.cwd();
const serverPath =
  process.env.MCP_SERVER_PATH ?? path.resolve(cwd, "../mcp-server");
const serverCommand =
  process.env.MCP_SERVER_COMMAND ??
  (process.platform === "win32" ? "pnpm.cmd dev" : "pnpm dev");

if (!existsSync(serverPath)) {
  console.error(
    `[mcp] Unable to find the MCP server directory at "${serverPath}". ` +
      "Set MCP_SERVER_PATH to the root of your MCP server.",
  );
  process.exit(1);
}

const [cmd, ...args] = serverCommand.split(" ");
console.log(
  `[mcp] Starting MCP server using "${cmd} ${args.join(" ")}" inside ${serverPath}`,
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
    console.log("[mcp] Server exited cleanly.");
  } else {
    console.error(`[mcp] Server exited with code ${code}.`);
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error("[mcp] Unable to start MCP server:", error);
  process.exit(1);
});
