# JARVIS Platform — Founder / CTO Master Plan

> Companion to [PRODUCT_VISION.md](../PRODUCT_VISION.md). That document defines *what Jarvis is for*.
> This document defines *how we build the full vision* — the target architecture, the phased
> program from today's codebase to a true always-on personal AI operating system, and the
> engineering principles that keep it safe and shippable.

---

## 1. North Star

Jarvis is a **personal AI operating system**: an always-available assistant that remembers
everything you choose to give it, reasons over that memory, and takes real actions on your
behalf — gated by your approval where the stakes are high.

The fictional JARVIS is the design target for *feel*: instant, calm, omnipresent, proactive,
slightly witty, and trusted with real authority. We decompose that feel into seven concrete
capability pillars:

| # | Pillar | "Movie moment" | Engineering reality |
|---|--------|----------------|---------------------|
| 1 | **Total recall** | "Pull up everything on the Mark II" | Ingestion + semantic memory (pgvector) + knowledge graph |
| 2 | **Natural command** | "Jarvis, run a diagnostic" | LLM intent routing → workflow runs, chat + voice I/O |
| 3 | **Real agency** | "Deploy the House Party Protocol" | Tool-calling agent executor with connectors (email, calendar, web, files) |
| 4 | **Judgment & safety** | "Sir, I must advise against this" | Risk scoring, approval gates, audit log, permission scopes |
| 5 | **Proactivity** | Morning briefing before Tony asks | Schedulers, triggers, daily briefings, watchers/alerts |
| 6 | **Presence** | JARVIS is in the suit, house, and phone | Web HUD, browser extension, share sheet, Telegram, voice channel |
| 7 | **Personality** | The dry British wit | A consistent persona layer over every response surface |

Every roadmap item below maps to one of these pillars.

---

## 2. Where we are today (honest audit, Aug 2026)

Shipped and real:
- Next.js 15 + React 19 + Prisma 6 + Postgres/pgvector foundation; 13-model schema.
- Capture → dedupe (hash) → classify → summarize → knowledge pipeline (v0.1 of the vision).
- RAG-lite chat over recent knowledge; command console with keyword routing; approval queue
  wired end-to-end to run status; cinematic HUD UI with 12 themes.

Gaps (in priority order):
1. **No execution engine** — approved runs sit in `QUEUED` forever. Agents are display data.
2. **Semantic memory dormant** — embedding columns exist but are never written or queried.
3. **Routing is keyword matching**, not intelligence.
4. **No proactivity** — nothing scheduled, nothing triggered.
5. **No connectors** — email/calendar/Telegram/voice are enum values, not integrations.
6. **No auth** — acceptable for single-operator localhost, blocking for anything else.
7. Fabricated telemetry in the UI (fake CPU gauges, hardcoded weather/token counts).

## 3. Target architecture

```text
┌────────────────────────── PRESENCE LAYER ──────────────────────────┐
│  Web HUD (Next.js)   Browser ext.   Telegram bot   Voice (STT/TTS) │
└──────────────┬─────────────────────────────────────────────────────┘
               │
┌──────────────▼───────────── COGNITION LAYER ───────────────────────┐
│  Intent Router (LLM)  →  Orchestrator  →  Agent Executor           │
│      persona layer         plan/decompose    tool-calling loop     │
└──────┬────────────────────────┬──────────────────────┬─────────────┘
       │                        │                      │
┌──────▼──────┐        ┌────────▼────────┐    ┌────────▼───────────┐
│  MEMORY     │        │  SAFETY         │    │  ACTION            │
│  ingestion  │        │  risk scoring   │    │  tool registry     │
│  embeddings │        │  approval gates │    │  connectors:       │
│  knowledge  │        │  audit log      │    │  email · calendar  │
│  graph      │        │  scopes         │    │  web · files · …   │
│  chat hist. │        └─────────────────┘    └────────────────────┘
└─────────────┘
       ▲
┌──────┴──────────────────── PROACTIVITY LAYER ──────────────────────┐
│  Scheduler (cron)   Watchers/triggers   Daily briefing   Alerts    │
└────────────────────────────────────────────────────────────────────┘
```

Design rules:
- **One Postgres, one app** until it hurts. No microservices, no queues before we need them.
  The executor runs in-process (route-handler triggered now, worker process later).
- **Every action flows through the tool registry.** Tools declare scopes + risk; the executor
  enforces approval gates; every call is written to the run log. No side channels.
- **Graceful degradation is a feature.** No API key → deterministic fallbacks. No DB → design
  mode. This is already in the codebase's DNA; keep it.
- **Provider-agnostic cognition.** OpenAI today via one thin client; the model layer stays
  behind `src/lib/ai/*` so we can swap or mix providers later.

## 4. The program: seven phases

### Phase 1 — The Spark: a real engine (NOW — being built in this commit)
*Pillars: 3, 4, 2, 1.* The single transformation that matters: commands must actually execute.
- **Agent executor**: picks up `QUEUED` runs, walks template steps, runs an OpenAI
  tool-calling loop per step, streams logs into `WorkflowRun.logs`, writes `output`,
  transitions `QUEUED → RUNNING → COMPLETED/FAILED`.
- **Tool registry v1** (internal, safe): semantic knowledge search, note capture, briefing
  stats, run history, deterministic calculator, clock. External-effect tools (email draft,
  calendar event, expense record) produce **artifacts** — drafts stored in run output —
  never real sends, until connectors + approvals exist.
- **LLM intent router** with the keyword router as offline fallback.
- **Semantic memory online**: embed on ingest, pgvector similarity search behind chat + tools.
- **Approval → execution**: approving the last gate auto-fires the executor.
- **Chat persistence** into `ChatSession`/`ChatMessage`.
- Fix known bugs (Prisma `logs.push` misuse, risk-casing display bug).

### Phase 2 — Total Recall: memory that deserves the name
*Pillar 1.* Entity extraction into the (already-modeled) knowledge graph; semantic dedupe
(near-duplicate via cosine distance, not just hash); hybrid retrieval (vector + keyword +
recency + category); memory of *the user* (preferences, goals, decisions) as first-class
records; retrieval quality eval set.

### Phase 3 — The Voice: presence beyond the browser
*Pillars: 2, 6, 7.* Telegram bot (text first, then voice notes → Whisper STT); TTS responses
(ElevenLabs); the **Jarvis Browser Companion** — a consent-first MV3 extension that proposes
reading on-screen IG/FB/LinkedIn content, captures on approval, and transcribes/understands
playing videos (audio + frames → vision model). Detailed spec:
[BROWSER_COMPANION_PLAN.md](./BROWSER_COMPANION_PLAN.md). Plus mobile share-sheet via PWA and a
consistent persona layer (system-prompt library + response post-processor) so Jarvis sounds
like Jarvis everywhere.

### Phase 4 — Real Hands: connectors with teeth
*Pillars: 3, 4.* OAuth-based email (read/summarize/draft/send-behind-approval), calendar
(read/propose/write-behind-approval), contacts; web research tool (search API + fetch +
citations); file ingestion (PDF, images via OCR). Every connector ships with: scopes in
`ConnectorConfig`, per-action risk level, approval policy, and audit logging. **This phase is
gated on auth** (single-user passkey/session is enough) because connectors hold real tokens.

### Phase 5 — The Butler: proactivity
*Pillar 5.* Scheduler (Vercel cron or node-cron in the worker) → scheduled workflow runs;
the Daily Executive Briefing actually runs at 7am; watchers ("tell me when X changes");
suggestion engine (surface stale saves, expiring decisions, follow-ups) — Jarvis speaks first.

### Phase 6 — The Suit: multi-agent orchestration
*Pillars: 3, 5.* The Orchestrator agent decomposes big commands into multi-agent plans
(research → summarize → draft → schedule), runs steps in parallel where safe, composes
results; user-defined custom workflows (the `CUSTOM` agent kind); long-running runs with
checkpoints and resume.

### Phase 7 — The House: ambient JARVIS
*Pillars: 6, 5, 7.* Always-listening voice mode (wake word, local VAD); realtime voice
conversations; home-screen widgets; multi-device sync; optionally local models for private
inference. This is where the HUD stops being a website and becomes an environment.

Each phase is shippable alone, ordered by dependency: **engine → memory → presence → hands →
proactivity → orchestration → ambience.** We do not start N+1 before N's core loop is demoed.

## 5. Safety posture (non-negotiable, all phases)

1. Explicit capture only — no stealth scraping, ever (see PRODUCT_VISION.md).
2. Irreversible/external actions **always** pass an approval gate; approvals name the exact
   recipient/payload/mutation.
3. Risk levels (`low/medium/high`) are computed per-run, shown before execution, logged after.
4. Full audit trail: every tool call with args + result summary lands in `WorkflowRun.logs`.
5. Secrets stay in env/`ConnectorConfig`; never in logs, never echoed to the model.
6. Kill switch: a run can be cancelled at any step boundary.

## 6. Engineering standards

- TypeScript strict; zod at every API boundary; Prisma as the only DB access path
  (raw SQL only for pgvector operators, isolated in one module).
- Deterministic fallbacks for every AI feature (already the house style — preserve it).
- `npm run typecheck` + `lint` must pass on every commit; tests arrive with Phase 2
  (retrieval eval) and Phase 4 (connector contract tests) where they earn their keep.
- Repo hygiene: build artifacts and `.DS_Store` out of git; images deduplicated.

## 7. Immediate milestones

| Milestone | Definition of done |
|---|---|
| **M1: First real run** *(this commit)* | Type a command → routed by LLM → run created → (approve if gated) → executor completes it → output + step logs visible on /runs |
| **M2: Memory online** *(this commit)* | New saves get embeddings; chat retrieves by similarity, not recency; answers cite matched items |
| **M3: Movie-grade HUD** *(this commit)* | Default theme + components read as a cinematic hologram HUD: arc-reactor core, rotating rings, scanlines, glass panels |
| M4: Telegram channel | Text a bot → same router/executor → reply with persona |
| M5: First real connector | Email read + draft + approved send, fully audited |
| M6: Jarvis speaks first | Scheduled 7am briefing delivered without being asked |
