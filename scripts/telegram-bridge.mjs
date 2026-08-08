#!/usr/bin/env node
/**
 * Jarvis Telegram bridge — presence layer, zero dependencies.
 *
 * Long-polls the Telegram Bot API and relays everything to the LOCAL Jarvis app:
 *   free text            → /api/extension/ask        (grounded answer from your memory)
 *   /run <command>       → /api/command              (route + execute workflows)
 *   /save <text or url>  → /api/extension/capture    (into the knowledge base)
 *   /brief               → /api/command "daily executive briefing"
 *   approval buttons     → /api/approvals            (clear gates from your phone)
 *
 * All cognition stays in the app; this script is deliberately a dumb pipe.
 * Security: replies only to TELEGRAM_ALLOWED_CHAT_ID; other chats get pairing
 * instructions and are otherwise ignored.
 *
 * Run: npm run telegram   (reads .env from the repo root; needs TELEGRAM_BOT_TOKEN,
 * JARVIS_EXTENSION_TOKEN, and — after first contact — TELEGRAM_ALLOWED_CHAT_ID)
 * Check config without polling: npm run telegram -- --check
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

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = (process.env.JARVIS_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const APP_TOKEN = process.env.JARVIS_EXTENSION_TOKEN || "";
const ALLOWED_CHAT_ID = process.env.TELEGRAM_ALLOWED_CHAT_ID || "";

const runApprovals = new Map(); // runId -> approval ids (session memory)

/* ------------------------------ transports ------------------------------ */

async function tg(method, payload = {}) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await response.json().catch(() => ({}));
  if (!body.ok) throw new Error(`Telegram ${method}: ${body.description || response.status}`);
  return body.result;
}

async function app(path, options = {}) {
  const response = await fetch(`${APP_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${APP_TOKEN}`,
      ...(options.headers || {})
    }
  });
  return { ok: response.ok, status: response.status, body: await response.json().catch(() => ({})) };
}

const send = (chatId, text, extra = {}) =>
  tg("sendMessage", { chat_id: chatId, text: text.slice(0, 4000), ...extra }).catch((error) =>
    console.error("send failed:", error.message)
  );

/* ------------------------------- handlers ------------------------------- */

async function handleAsk(chatId, question) {
  const result = await app("/api/extension/ask", { method: "POST", body: JSON.stringify({ question }) });
  if (!result.ok) return send(chatId, `✕ ${result.body.error || "Jarvis is unreachable."}`);
  const sources = (result.body.sources || []).map((source) => source.title).filter(Boolean);
  await send(chatId, result.body.answer + (sources.length ? `\n\n— grounded in: ${sources.slice(0, 3).join(" · ")}` : ""));
}

async function handleSave(chatId, text) {
  const isUrl = /^https?:\/\/\S+$/.test(text.trim());
  const result = await app("/api/extension/capture", {
    method: "POST",
    body: JSON.stringify({
      title: isUrl ? null : text.slice(0, 80),
      url: isUrl ? text.trim() : null,
      visibleText: isUrl ? null : text,
      platform: "telegram",
      kind: "telegram_save"
    })
  });
  if (!result.ok) return send(chatId, `✕ ${result.body.error || "Could not save."}`);
  await send(
    chatId,
    result.body.duplicate
      ? "Already in the archive, sir. I filed the duplicate reference."
      : `Saved and indexed (${result.body.item?.category || "MISC"}).`
  );
}

async function pollRunCompletion(chatId, runId) {
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const result = await app("/api/runs", { method: "GET" });
    if (!result.ok) return;
    const run = (result.body.runs || []).find((entry) => entry.id === runId);
    if (!run) return;
    if (run.status === "COMPLETED") {
      return send(chatId, `✓ Run complete.\n\n${run.output?.summary || "Done."}`);
    }
    if (run.status === "FAILED" || run.status === "CANCELLED") {
      return send(chatId, `✕ Run ${run.status.toLowerCase()}.${run.output?.summary ? `\n${run.output.summary}` : ""}`);
    }
  }
}

async function handleRun(chatId, command) {
  await send(chatId, "◉ Routing…");
  const result = await app("/api/command", { method: "POST", body: JSON.stringify({ command }) });
  if (!result.ok) return send(chatId, `✕ ${result.body.error || "Routing failed."}`);

  const { route, workflowRun, executed } = result.body;
  const header = `› ${route.agentKind} agent · ${route.workflow.name} · risk ${route.risk} · confidence ${Math.round(route.confidence * 100)}%`;

  if (executed && workflowRun?.output?.summary) {
    return send(chatId, `${header}\n\n${workflowRun.output.summary}`);
  }
  if (workflowRun?.status === "WAITING_FOR_APPROVAL") {
    const approvalIds = (workflowRun.approvals || []).filter((a) => a.status === "PENDING").map((a) => a.id);
    runApprovals.set(workflowRun.id, approvalIds);
    return send(chatId, `${header}\n\n${route.suggestedResponse}\nGates pending: ${approvalIds.length}`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "◉ APPROVE", callback_data: `apr:${workflowRun.id}` },
            { text: "✕ REJECT", callback_data: `rej:${workflowRun.id}` }
          ]
        ]
      }
    });
  }
  return send(chatId, `${header}\n\n${result.body.message || "Queued."}`);
}

async function handleCallback(callback) {
  const chatId = callback.message?.chat?.id;
  const [action, runId] = String(callback.data || "").split(":");
  const approvalIds = runApprovals.get(runId) || [];
  const decision = action === "apr" ? "APPROVED" : "REJECTED";

  if (String(chatId) !== ALLOWED_CHAT_ID) {
    return tg("answerCallbackQuery", { callback_query_id: callback.id, text: "Not paired." }).catch(() => {});
  }
  if (approvalIds.length === 0) {
    return tg("answerCallbackQuery", { callback_query_id: callback.id, text: "No pending gates for this run (bridge restarted?). Use /approvals in the app." }).catch(() => {});
  }

  let lastError = null;
  for (const id of approvalIds) {
    const result = await app("/api/approvals", { method: "PATCH", body: JSON.stringify({ id, status: decision }) });
    if (!result.ok) lastError = result.body.error || `HTTP ${result.status}`;
    if (decision === "REJECTED") break;
  }
  runApprovals.delete(runId);
  await tg("answerCallbackQuery", { callback_query_id: callback.id, text: lastError ? `Error: ${lastError}` : decision }).catch(() => {});

  if (lastError) return send(chatId, `✕ Approval update failed: ${lastError}`);
  if (decision === "APPROVED") {
    await send(chatId, "Gates cleared. Executor engaged — I will report back.");
    await pollRunCompletion(chatId, runId);
  } else {
    await send(chatId, "Understood. Run cancelled; nothing was executed.");
  }
}

const HELP = [
  "At your service. I am connected to your local Jarvis.",
  "",
  "Just text me a question — I answer from your saved knowledge.",
  "/run <command> — route a command into agent workflows (approvals come back as buttons)",
  "/save <link or note> — capture into the knowledge base",
  "/brief — the executive briefing",
  "/help — this"
].join("\n");

async function handleMessage(message) {
  const chatId = message.chat?.id;
  const text = (message.text || "").trim();
  if (!chatId || !text) return;

  if (!ALLOWED_CHAT_ID) {
    return send(
      chatId,
      `Pairing required. Add this to your .env and restart the bridge:\n\nTELEGRAM_ALLOWED_CHAT_ID=${chatId}`
    );
  }
  if (String(chatId) !== ALLOWED_CHAT_ID) return; // silence for strangers

  try {
    if (text === "/start" || text === "/help") return await send(chatId, HELP);
    if (text.startsWith("/save")) {
      const rest = text.slice(5).trim();
      return rest ? await handleSave(chatId, rest) : await send(chatId, "Usage: /save <link or note>");
    }
    if (text === "/brief") return await handleRun(chatId, "Give me my daily executive briefing");
    if (text.startsWith("/run")) {
      const rest = text.slice(4).trim();
      return rest ? await handleRun(chatId, rest) : await send(chatId, "Usage: /run <command>");
    }
    return await handleAsk(chatId, text);
  } catch (error) {
    return send(chatId, `✕ ${error.message}`);
  }
}

/* --------------------------------- main --------------------------------- */

async function checkConfig() {
  const problems = [];
  if (!BOT_TOKEN) problems.push("TELEGRAM_BOT_TOKEN is not set (create a bot with @BotFather).");
  if (!APP_TOKEN) problems.push("JARVIS_EXTENSION_TOKEN is not set (copy the pairing token from /settings).");
  if (!ALLOWED_CHAT_ID) problems.push("TELEGRAM_ALLOWED_CHAT_ID not set — bridge will reply with pairing instructions on first contact.");

  const health = await app("/api/extension/health", { method: "GET" }).catch(() => null);
  if (!health?.ok) problems.push(`Jarvis app unreachable at ${APP_URL} — start it with "npm run dev".`);
  else {
    console.log(`✓ Jarvis app: ${APP_URL} (database: ${health.body.database ? "on" : "off"}, ai: ${health.body.ai ? "on" : "off"}, paired: ${health.body.paired ? "yes" : "NO — token rejected"})`);
    if (!health.body.paired && APP_TOKEN) problems.push("App rejected the token — re-copy it from /settings.");
  }

  if (BOT_TOKEN) {
    try {
      const me = await tg("getMe");
      console.log(`✓ Telegram bot: @${me.username}`);
    } catch (error) {
      problems.push(`Telegram token rejected: ${error.message}`);
    }
  }

  for (const problem of problems) console.log(`✗ ${problem}`);
  return problems;
}

async function main() {
  if (process.argv.includes("--check")) {
    const problems = await checkConfig();
    process.exit(problems.filter((p) => !p.includes("ALLOWED_CHAT_ID")).length ? 1 : 0);
  }

  const problems = await checkConfig();
  if (problems.some((p) => p.includes("TELEGRAM_BOT_TOKEN") || p.includes("unreachable") || p.includes("rejected"))) {
    process.exit(1);
  }

  console.log("◉ Jarvis Telegram bridge online. Ctrl-C to stop.");
  let offset = 0;
  for (;;) {
    try {
      const updates = await tg("getUpdates", {
        timeout: 50,
        offset,
        allowed_updates: ["message", "callback_query"]
      });
      for (const update of updates) {
        offset = update.update_id + 1;
        if (update.message) await handleMessage(update.message);
        if (update.callback_query) await handleCallback(update.callback_query);
      }
    } catch (error) {
      console.error("poll error:", error.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

main();
