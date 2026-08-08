const appUrlInput = document.getElementById("appUrl");
const tokenInput = document.getElementById("token");
const statusEl = document.getElementById("status");

async function load() {
  const stored = await chrome.storage.local.get({ appUrl: "http://localhost:3000", token: "" });
  appUrlInput.value = stored.appUrl;
  tokenInput.value = stored.token;
}

async function save() {
  await chrome.storage.local.set({
    appUrl: appUrlInput.value.trim().replace(/\/$/, "") || "http://localhost:3000",
    token: tokenInput.value.trim()
  });
  statusEl.className = "ok";
  statusEl.textContent = "Saved.";
}

async function test() {
  await save();
  statusEl.className = "";
  statusEl.textContent = "Testing…";
  chrome.runtime.sendMessage({ type: "jarvis:health" }, (result) => {
    if (result?.ok) {
      const body = result.body || {};
      statusEl.className = body.paired ? "ok" : "err";
      statusEl.textContent = [
        `App: ${body.app || "unknown"} — reachable`,
        `Database: ${body.database ? "connected" : "not configured"}`,
        `AI: ${body.ai ? "configured" : "offline mode"}`,
        body.paired ? "Paired ✓" : "Token not accepted — copy it from the app's /settings page"
      ].join("\n");
    } else {
      statusEl.className = "err";
      statusEl.textContent = `Could not reach the app (${result?.body?.error || result?.status || "network error"}). Is "npm run dev" running?`;
    }
  });
}

document.getElementById("save").addEventListener("click", save);
document.getElementById("test").addEventListener("click", test);
load();
