# Jarvis Companion (Phase A)

Consent-first browser capture for the Jarvis platform. Full spec:
[docs/BROWSER_COMPANION_PLAN.md](../docs/BROWSER_COMPANION_PLAN.md).

## What it does
- On Instagram / Facebook / LinkedIn (and any page via right-click), summoning Jarvis builds a
  list of **proposals** — visible posts, the page, or your text selection.
- Nothing is read until you press APPROVE on an item. Approved content is sent to **your own
  local Jarvis app**, which classifies, summarizes, and embeds it into your knowledge base.
  When AI features are configured, that app may send the approved content to the configured
  model provider; a no-AI capture switch is not implemented yet.
- Chat/DM pages never get bulk proposals; only explicit text selections, labeled
  "PRIVATE CONVERSATION".

## What it never does
No background collection, no auto-scrolling or crawling, and no page-credential access. The
extension sends requests only to the app URL you configure (the current manifest permits
`http://localhost:3000`); the local app's configured AI provider is a separate downstream data
processor for transcription, summarization, embeddings, and answers.

## Install (Chrome / Brave)
1. Run the Jarvis app: `npm run dev` (from the repo root).
2. Open `chrome://extensions` (or `brave://extensions`), enable **Developer mode**.
3. **Load unpacked** → select this `extension/` folder.
4. Open the extension's **Options**, paste the pairing token from the app's `/settings` page,
   and hit **Test connection**.
5. Browse to Instagram/Facebook/LinkedIn, click the Jarvis toolbar icon, approve what it may read.

## Listen mode (Phase B — shipped)
When a video is visible, the panel offers **"Transcribe playing video"**: press START, play the
video, press STOP. The tab's audio (max 5 min, audio only, this tab only — you keep hearing it)
is recorded via an offscreen document, sent to your local app, transcribed with Whisper, briefed
by the chat model ("what is this video saying"), and saved to your knowledge base. A red
`● REC mm:ss` chip shows the whole time; results appear in the panel and as a toast.
Requires `OPENAI_API_KEY` in the app's `.env`.

## Watch mode (Phase C — shipped)
**"Understand video (audio + visuals)"** records the audio AND samples still frames of the
playing video (every 3s, ≤20 frames, downscaled): frames come straight off the `<video>`
element via canvas, with a visible-tab screenshot fallback when the media is cross-origin
protected. Audio is transcribed, then a vision model produces the full brief — gist, claims,
what the creator wants you to do, and what the visuals show that the audio doesn't. The REC
chip counts frames live (`● REC 01:12 — audio + 14 frames`).

## Ask anywhere (Phase D — shipped)
The bottom of the panel has **ASK JARVIS**: type a question on any page and get an answer
grounded in your saved knowledge, related to the page you're viewing.
Only your question, the page title/URL, and any text you selected are sent — never the full
page. Retrieval is semantic when embeddings are available, with keyword/recent fallback, and
source records are listed under each answer.

## Coming next (per the plan)
Phase E: hotkeys, Firefox port, region capture, capture queue, polish.
