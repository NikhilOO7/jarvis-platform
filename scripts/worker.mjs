#!/usr/bin/env node
/**
 * Jarvis run worker — scalability rung 1, zero dependencies.
 *
 * Polls the app's claim-next endpoint; the executor's atomic compare-and-swap
 * (QUEUED → RUNNING) makes any number of concurrent workers safe. All
 * cognition stays in the app; this loop is deliberately a dumb pipe, like the
 * Telegram bridge.
 *
 * Run:   npm run worker            (long-lived; pairs with JARVIS_EXECUTION_MODE=worker)
 * Test:  npm run worker -- --once  (single poll, then exit)
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadDotEnv() {
  const envPath = join(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const value = match[2].replace(/^["']|["']$/g, "");
    if (!(match[1] in process.env)) process.env[match[1]] = value;
  }
}
loadDotEnv();

const APP_URL = (process.env.JARVIS_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const APP_TOKEN = process.env.JARVIS_EXTENSION_TOKEN || "";
const IDLE_POLL_MS = 3000;
const ERROR_BACKOFF_MS = 10000;

async function claimNext() {
  const response = await fetch(`${APP_URL}/api/runs/claim-next`, {
    method: "POST",
    headers: { Authorization: `Bearer ${APP_TOKEN}` }
  });
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
}

function stamp() {
  return new Date().toISOString().slice(11, 19);
}

async function main() {
  if (!APP_TOKEN) {
    console.error("✗ JARVIS_EXTENSION_TOKEN is not set — the worker authenticates with the pairing token from /settings.");
    process.exit(1);
  }

  const once = process.argv.includes("--once");
  console.log(`◉ Jarvis worker online → ${APP_URL} (${once ? "single poll" : `poll every ${IDLE_POLL_MS / 1000}s when idle`})`);

  for (;;) {
    let result;
    try {
      result = await claimNext();
    } catch (error) {
      console.error(`[${stamp()}] app unreachable: ${error.message}`);
      if (once) process.exit(1);
      await new Promise((resolve) => setTimeout(resolve, ERROR_BACKOFF_MS));
      continue;
    }

    if (!result.ok) {
      console.error(`[${stamp()}] claim failed (${result.status}): ${result.body.error || "unknown"}`);
      if (once) process.exit(1);
      await new Promise((resolve) => setTimeout(resolve, ERROR_BACKOFF_MS));
      continue;
    }

    if (result.body.claimed) {
      const run = result.body.run;
      console.log(`[${stamp()}] ✓ run ${run.id.slice(0, 8)} ${run.status} (${run.engine || "n/a"}) — ${run.command?.slice(0, 60) ?? ""}`);
      if (once) process.exit(0);
      continue; // drain the queue before idling
    }

    if (result.body.message) console.log(`[${stamp()}] idle: ${result.body.message}`);
    if (once) {
      console.log(`[${stamp()}] nothing to claim.`);
      process.exit(0);
    }
    await new Promise((resolve) => setTimeout(resolve, IDLE_POLL_MS));
  }
}

main();
