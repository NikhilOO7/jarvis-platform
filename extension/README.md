# Jarvis Companion (Phase A)

Consent-first browser capture for the Jarvis platform. Full spec:
[docs/BROWSER_COMPANION_PLAN.md](../docs/BROWSER_COMPANION_PLAN.md).

## What it does
- On Instagram / Facebook / LinkedIn (and any page via right-click), summoning Jarvis builds a
  list of **proposals** — visible posts, the page, or your text selection.
- Nothing is read until you press APPROVE on an item. Approved content is sent to **your own
  local Jarvis app**, which classifies, summarizes, and embeds it into your knowledge base.
- Chat/DM pages never get bulk proposals; only explicit text selections, labeled
  "PRIVATE CONVERSATION".

## What it never does
No background collection, no auto-scrolling or crawling, no credentials access, no third-party
servers. It talks only to the app URL you configure (localhost by default).

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

## Coming next (per the plan)
Phase C: "Watch" — multimodal video understanding (frames + audio → what they're trying to say).
Phase D: Ask-Jarvis panel chat grounded in your knowledge base.
