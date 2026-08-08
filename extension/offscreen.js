/* Jarvis Companion — offscreen recorder.
 * MV3 requires an offscreen document to hold getUserMedia/MediaRecorder.
 * Records tab audio (keeping it audible), uploads to the local Jarvis app. */

let recorder = null;
let stream = null;
let audioCtx = null;
let chunks = [];
let meta = null;
let cfg = null;
let capTimer = null;

const MAX_RECORD_MS = 5 * 60 * 1000;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.target !== "offscreen") return false;

  if (message.type === "start-recording") {
    start(message)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
    return true;
  }
  if (message.type === "stop-recording") {
    stop();
    sendResponse({ ok: true });
    return false;
  }
  return false;
});

async function start(message) {
  if (recorder) throw new Error("Already recording");
  meta = message.metadata || {};
  cfg = { appUrl: message.appUrl, token: message.token };

  stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: message.streamId
      }
    },
    video: false
  });

  // Tab capture mutes the tab by default — route audio back so the user keeps hearing it.
  audioCtx = new AudioContext();
  audioCtx.createMediaStreamSource(stream).connect(audioCtx.destination);

  chunks = [];
  recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) chunks.push(event.data);
  };
  recorder.onstop = upload;
  recorder.start(1000);
  capTimer = setTimeout(stop, MAX_RECORD_MS);
}

function stop() {
  clearTimeout(capTimer);
  if (recorder && recorder.state === "recording") recorder.stop();
}

async function upload() {
  const blob = new Blob(chunks, { type: "audio/webm" });
  const tabId = meta?.tabId;
  const durationSec = Math.round((meta?.startedAt ? Date.now() - meta.startedAt : 0) / 1000);
  cleanup();

  const form = new FormData();
  form.append("audio", blob, "capture.webm");
  form.append("metadata", JSON.stringify({ ...meta, durationSec }));

  let result;
  try {
    const response = await fetch(`${cfg.appUrl}/api/extension/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}` },
      body: form
    });
    result = { ok: response.ok, status: response.status, body: await response.json().catch(() => ({})) };
  } catch (error) {
    result = { ok: false, status: 0, body: { error: String(error?.message || error) } };
  }

  chrome.runtime.sendMessage({ type: "jarvis:listen-result", target: "sw", tabId, result });
}

function cleanup() {
  recorder = null;
  chunks = [];
  if (stream) stream.getTracks().forEach((track) => track.stop());
  stream = null;
  if (audioCtx) audioCtx.close().catch(() => {});
  audioCtx = null;
}
