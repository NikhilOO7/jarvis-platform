# Jarvis Browser Companion — Detailed Plan

> Companion to [MASTER_PLAN.md](./MASTER_PLAN.md) (pillars 3 "Real agency", 6 "Presence") and the
> capture philosophy in [PRODUCT_VISION.md](../PRODUCT_VISION.md). This document specifies the
> browser extension that lets Jarvis work *alongside* open Instagram/Facebook/LinkedIn tabs:
> propose reading specific on-screen content, obtain explicit approval, capture it, and
> transcribe/understand any playing video (audio + visuals).

> **Implementation status (Aug 25, 2026):** the MV3 extension, consent HUD, visible-page
> capture, media upload/transcription path, and page-aware saved-memory ask path exist as an
> alpha. Capture receipts, redaction, no-AI capture, token rotation/revocation, and the global
> kill switch below are target requirements, not shipped controls. Phase 0 blocks beta until
> those privacy controls and encrypted credential storage are implemented.

## 1. What it is

A Chrome (MV3) extension — "Jarvis Companion" — that injects a small, HUD-styled consent panel
into pages the user opens. Jarvis never reads anything silently. The interaction contract:

```
User browses IG/FB/LinkedIn  →  user summons Jarvis (toolbar click / hotkey / context menu)
  →  Jarvis PROPOSES what it can capture ("3 visible posts", "this video", "this thread")
  →  user APPROVES or DENIES each proposal in the on-page panel
  →  approved content is captured and POSTed to the local Jarvis app
  →  pipeline: dedupe → classify → summarize → embed → knowledge base
  →  a capture receipt (what/when/from where) is stored and visible in the app
```

**Hard boundaries (non-negotiable):**
- No background collection. Every capture requires a fresh, explicit user action.
- No automated crawling: no auto-scroll, no pagination walking, no bulk harvesting of the live
  site. Bulk history comes from the official data-export importer (already shipped).
- No credential access, no private-API calls, no request interception. DOM of the visible page
  and the tab's own audio/video output only.
- Recording state is always visibly indicated in the panel.
- Everything lands in the user's local Postgres. Model API calls (STT/vision/summarize) are the
  only data that leaves the machine, and the panel says so.

**ToS posture:** user-directed capture of content the logged-in user is currently viewing, for
personal knowledge management, at human speed. This is materially different from scraping, but
platforms' automated-collection clauses are broad — so the extension enforces human-triggered,
rate-limited-by-clicking behavior by design and never ships an "auto" mode for third-party sites.

## 2. Capabilities (user-visible)

| # | Capability | Trigger | What happens |
|---|-----------|---------|--------------|
| C1 | **Read visible posts** | "Capture screen" action | Content script extracts visible post text, author, permalink, media alt-text → proposal list → approved items ingested |
| C2 | **Read this thread/article** | Context-menu on selection or post | Extracts the selected post/thread/article body (LinkedIn article, FB post + top comments) |
| C3 | **Transcribe this video** | "Listen" action while a video plays | `tabCapture` records tab audio while the user plays the video → Whisper STT → transcript saved + summarized |
| C4 | **Understand this video** | "Watch" action | C3 audio + sampled frames (`captureVisibleTab`, ~1 frame / 3s, ≤20 frames) → vision model → "what is this video saying/selling/claiming" brief with transcript attached |
| C5 | **Ask about this page** | Panel chat box | Question + page context → scoped `/api/extension/ask` → runtime-selected saved-memory retrieval → grounded answer in the panel |
| C6 | **Save to Jarvis** | One-click on any page | Classic bookmark capture (title/URL/selection) — generalizes beyond social sites |

"Understand" output format (C4): 1-line gist → key claims/arguments → what they want you to do
(sell/follow/agree) → notable visual context (charts, products, exercise form, on-screen text)
→ suggested category + actions. Stored as a knowledge item with `exportKind: "video_capture"`.

## 3. Architecture

```
┌─────────────────────────── BROWSER (MV3 extension) ───────────────────────────┐
│  content script (per tab)          service worker              offscreen doc  │
│  · site adapters (IG/FB/LI/generic)· action routing            · MediaRecorder│
│  · proposal builder                · tabCapture / frame grab   · audio encode │
│  · consent HUD (shadow DOM,        · talks to localhost API    (MV3 requires  │
│    Jarvis theme, approve/deny)     · auth token header          offscreen for │
│  · DOM extraction after approval   · capture receipts           recording)    │
└────────────────────────────────────────┬──────────────────────────────────────┘
                                         │ http://localhost:3000 (token-authed)
┌────────────────────────────────────────▼──────────────────────────────────────┐
│  Jarvis app (Next.js)                                                         │
│  POST /api/extension/capture   (exists — posts/pages/selections)              │
│  POST /api/extension/media     (exists — audio blob + frames → STT + vision)  │
│  GET  /api/extension/health    (exists — authenticated pairing/config check)  │
│  → ingestion pipeline → knowledge + embeddings → chat/agents can use it       │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Site adapters.** Small per-site selector modules (`instagram.ts`, `facebook.ts`,
`linkedin.ts`, `generic.ts`) that find visible posts/videos and their metadata. Selectors on
these sites churn constantly → adapters are versioned, fail soft (fall back to
selection/generic capture), and are the main maintenance cost of this feature. The generic
adapter (og: tags, article text, `<video>` elements) works everywhere.

**Consent panel.** Shadow-DOM overlay so site CSS can't interfere; original signal-core styling
consistent with the app; lists each proposal with source, preview snippet, and per-item
APPROVE / DENY; shows a red "● REC" chip during any recording; ESC dismisses everything.

**Pairing/auth.** With operator authentication enabled, the app generates a 32+ character
extension-only token (currently stored in `ConnectorConfig` and displayed on `/settings`);
the extension stores it and sends `Authorization: Bearer` on every call. Localhost is the
default app URL. Encryption at rest, rotation/revocation, and a strict host policy remain
Phase 0 requirements.

## 4. Video understanding pipeline (C3/C4)

1. User presses **Watch/Listen** while the video is playing (or Jarvis offers it when a
   `<video>` element is detected in the viewport — offer only, never auto-start).
2. Service worker + offscreen document start `tabCapture` (audio) → `MediaRecorder`
   (webm/opus, ≤5 min hard cap). For C4, `captureVisibleTab` grabs a JPEG every ~3s while
   recording (≤20 frames, downscaled to ~768px, cropped to the video element's bounding box
   when the adapter can locate it).
3. On stop (user click, video end, or cap), blob + frames POST to `/api/extension/media`
   with page metadata (URL, author, caption from the adapter).
4. Server: audio → OpenAI STT (`whisper-1`); transcript + frames + caption → vision-capable
   chat model → structured brief (gist/claims/intent/visuals); result ingested via
   `ingestItem` (SOURCE: `BROWSER_EXTENSION`) → summarized, categorized, embedded.
5. Panel shows the brief inline; item is immediately searchable in `/chat`.

Cheap paths first: if the platform renders caption tracks/subtitles in the DOM, the adapter
grabs them and skips STT. Audio-only (C3) skips frames entirely.

**Cost control:** audio duration and frame caps bound individual requests, but provider/model
pricing and actual token/image usage must be measured before publishing a cost envelope.

## 5. Privacy & consent model

- **Proposal-before-read:** the extension may *detect* that content exists (element presence
  only) to build proposals; it extracts nothing until approval.
- **Receipts:** every capture writes an audit row (source URL, kind, timestamp, item id) —
  browsable on a new `/receipts` section of the app.
- **DM rule:** chat/DM pages are never auto-proposed. Capturing a DM requires the user to
  explicitly select text or invoke capture *on that page*, and the panel labels it "PRIVATE
  CONVERSATION" before approval.
- **Redaction toggle:** per-capture "strip names/handles" option before ingestion.
- **No-AI mode:** per-capture toggle to store raw text/transcript locally without any model
  calls (no classify/summarize/embed until the user opts in later).
- **Kill switch:** panel button pauses the extension globally (disables all triggers).

## 6. Build phases

| Phase | Scope | Exit demo |
|-------|-------|-----------|
| **A. Skeleton + consent capture** | MV3 scaffold, pairing token, consent HUD, generic + IG/FB/LI adapters for C1/C2/C6, receipts | Open IG saved post → summon Jarvis → approve → item appears in /knowledge with summary |
| **B. Listen (audio)** | Offscreen recorder, tabCapture, `/api/extension/media` (STT only), transcript ingestion | Play a reel → "Listen" → transcript + summary in knowledge, searchable in /chat |
| **C. Watch (multimodal)** | Frame sampling, vision brief, structured "what are they saying" output | Play any video → "Watch" → gist/claims/intent brief with visual notes |
| **D. Ask-anywhere** | Panel chat (C5) wired to /api/chat with page context, deep links into the app | On a job post: "how does this compare to jobs I saved?" answered in the panel |
| **E. Ambient polish** | Hotkeys, Firefox port, screenshot-region capture, capture queue UI, auto-offer tuning | Daily-driver quality |

The alpha spans portions of A–D, but none of those phases is considered complete until its
privacy controls, receipts, failure states, and browser-level tests meet the exit demo.

## 7. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Site DOM churn breaks adapters | Versioned adapters, generic fallback, selection-capture always works |
| Platform ToS sensitivity | Human-triggered only, no bulk/auto mode, personal-use posture, exports remain the bulk path |
| MV3 recording quirks (offscreen doc lifetime, tabCapture focus rules) | Known patterns; record only while tab is active; hard caps |
| Whisper/vision cost creep | Per-clip caps, caption-track fast path, no-AI mode, cost line shown in panel |
| Token leakage from extension storage | Current gap: add encrypted server storage, rotation/revocation UI, strict host validation, and short-lived pairing exchange |
| DRM/hidden players (some FB videos) | tabCapture records *output* audio so DRM rarely matters; frames capture what's on screen |

## 8. Decisions locked

1. Chrome MV3 first (Brave-compatible — the user's daily browser); Firefox later.
2. Extension lives in this repo under `extension/` (plain JavaScript/CSS MV3, no framework).
3. Clip-based understanding first; realtime streaming is Phase E+.
4. OpenAI for STT + vision via existing env keys; provider stays swappable behind `src/lib/ai/*`.
5. The export importer remains the only bulk path; the extension is single-item, consent-first.
