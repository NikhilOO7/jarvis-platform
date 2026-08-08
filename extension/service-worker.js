/* Jarvis Companion — service worker.
 * Routes summon/capture actions and talks to the local Jarvis app.
 * No background collection: everything starts from a user gesture. */

const DEFAULT_APP_URL = "http://localhost:3000";

async function getSettings() {
  const stored = await chrome.storage.local.get({ appUrl: DEFAULT_APP_URL, token: "" });
  return { appUrl: stored.appUrl.replace(/\/$/, ""), token: stored.token };
}

async function appFetch(path, options = {}) {
  const { appUrl, token } = await getSettings();
  const response = await fetch(`${appUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
}

async function ensureContentScript(tabId) {
  try {
    const [ping] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => Boolean(window.__jarvisCompanion)
    });
    if (!ping?.result) {
      await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
    }
    return true;
  } catch {
    return false; // chrome:// pages, web store, etc.
  }
}

async function summon(tab, mode) {
  if (!tab?.id) return;
  const injected = await ensureContentScript(tab.id);
  if (!injected) return;
  chrome.tabs.sendMessage(tab.id, { type: "jarvis:summon", mode: mode || "auto" }).catch(() => {});
}

chrome.action.onClicked.addListener((tab) => summon(tab, "auto"));

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "jarvis-save-selection",
    title: "Jarvis: capture selection",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "jarvis-save-page",
    title: "Jarvis: capture this page",
    contexts: ["page"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "jarvis-save-selection") summon(tab, "selection");
  if (info.menuItemId === "jarvis-save-page") summon(tab, "page");
});

async function ensureOffscreenDocument() {
  const hasDocument = await chrome.offscreen.hasDocument();
  if (!hasDocument) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["USER_MEDIA"],
      justification: "Record this tab's audio, at the user's explicit request, for transcription into their local Jarvis knowledge base."
    });
  }
}

function getTabStreamId(targetTabId) {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId }, (streamId) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(streamId);
    });
  });
}

async function startListening(sender, metadata) {
  const tabId = sender.tab?.id;
  if (!tabId) throw new Error("No tab context");
  await ensureOffscreenDocument();
  const streamId = await getTabStreamId(tabId);
  const { appUrl, token } = await getSettings();
  const response = await chrome.runtime.sendMessage({
    target: "offscreen",
    type: "start-recording",
    streamId,
    appUrl,
    token,
    metadata: { ...metadata, tabId, startedAt: Date.now() }
  });
  if (!response?.ok) throw new Error(response?.error || "Recorder failed to start");
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.target === "offscreen") return false; // let the offscreen document handle its own mail

  if (message?.type === "jarvis:listen-start") {
    startListening(_sender, message.metadata || {})
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
    return true;
  }
  if (message?.type === "jarvis:listen-stop") {
    chrome.runtime
      .sendMessage({ target: "offscreen", type: "stop-recording", frames: message.frames || [] })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
    return true;
  }
  if (message?.type === "jarvis:frame-request") {
    // Fallback when the page's canvas capture is tainted: screenshot the visible tab.
    chrome.tabs
      .captureVisibleTab(_sender.tab?.windowId, { format: "jpeg", quality: 60 })
      .then((dataUrl) => sendResponse({ dataUrl }))
      .catch(() => sendResponse({ dataUrl: null }));
    return true;
  }
  if (message?.type === "jarvis:keepalive") {
    sendResponse({ ok: true }); // resets the SW idle timer while a recording is running
    return false;
  }
  if (message?.type === "jarvis:listen-result") {
    // Offscreen finished uploading — forward the verdict to the originating tab's HUD.
    if (message.tabId) {
      chrome.tabs.sendMessage(message.tabId, { type: "jarvis:listen-result", result: message.result }).catch(() => {});
    }
    chrome.offscreen.closeDocument().catch(() => {});
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === "jarvis:ask") {
    appFetch("/api/extension/ask", {
      method: "POST",
      body: JSON.stringify(message.payload)
    })
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, status: 0, body: { error: String(error?.message || error) } }));
    return true;
  }

  if (message?.type === "jarvis:capture") {
    appFetch("/api/extension/capture", {
      method: "POST",
      body: JSON.stringify(message.payload)
    })
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, status: 0, body: { error: String(error?.message || error) } }));
    return true; // async response
  }
  if (message?.type === "jarvis:health") {
    appFetch("/api/extension/health", { method: "GET" })
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, status: 0, body: { error: String(error?.message || error) } }));
    return true;
  }
  return false;
});
