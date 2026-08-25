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

The target experience is instant, calm, broadly available, proactive, slightly witty, and
trusted with carefully bounded authority. We decompose that experience into seven concrete
capability pillars:

| # | Pillar | Operator outcome | Engineering reality |
|---|--------|----------------|---------------------|
| 1 | **Total recall** | "Pull up everything on Project Atlas" | Ingestion + semantic memory (pgvector) + knowledge graph |
| 2 | **Natural command** | "Run a diagnostic" | LLM intent routing → workflow runs, chat + voice I/O |
| 3 | **Real agency** | Draft and carry out approved work | Tool-calling agent executor with connectors (email, calendar, web, files) |
| 4 | **Judgment & safety** | Warn before a risky action | Risk scoring, approval gates, audit log, permission scopes |
| 5 | **Proactivity** | Morning briefing before the operator asks | Schedulers, triggers, daily briefings, watchers/alerts |
| 6 | **Presence** | Available wherever the operator works | Web HUD, browser extension, share sheet, Telegram, voice channel |
| 7 | **Personality** | Calm, concise, quietly witty | A consistent persona layer over every response surface |

Every roadmap item below maps to one of these pillars.

---

## 2. Where we are today (honest audit, updated Aug 25, 2026)

Shipped and real:
- Next.js 15 + React 19 + Prisma 6 + Postgres/pgvector foundation; 13-model schema.
- Capture → hash/semantic dedupe → classify → summarize → embed → entity graph pipeline.
- RAG-lite chat, LLM/keyword routing, workflow executor, polling worker, Telegram text bridge,
  scheduled briefings, browser capture/transcription/video understanding, operator sessions,
  and Google OAuth with read-only Gmail/Calendar tools.
- Phase 0 hardening is active: service credentials are scoped, workflow tools are allowlisted,
  approval decisions are non-replayable, and Google writes are disabled in favor of local proposals.

Gaps (in priority order):
1. **Approvals are not payload-bound yet** — no external write may be re-enabled until the
   exact immutable action is reviewed and approved.
2. **Ingestion is synchronous and non-durable** — raw-save-first jobs, retries, import batches,
   and database-enforced idempotency are still required.
3. **Retrieval quality is unmeasured** — hybrid ranking, relevance thresholds, linked citations,
   conversation recall, and an evaluation set are missing.
4. **Secrets are not encrypted at rest** in `ConnectorConfig`; production auth hardening remains.
5. **Product records are too generic** — goals, preferences, review state, decisions, and concrete
   action lifecycle are not modeled.
6. **No citation-capable internet research or voice-note pipeline.** These remain future work.
7. **Operational depth is thin** — core-path tests, observability, cost tracking, backups, and
   failure recovery drills are below beta level.

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
- **Graceful degradation must remain truthful.** Read and routing paths may use deterministic
  fallbacks. Execution fails closed when its model/runtime is unavailable. No DB means an
  explicit offline or parse-only response, never fabricated records or simulated completion.
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
consistent persona layer (system-prompt library + response post-processor) across every surface.

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

### Phase 6 — Orchestration: coordinated agents
*Pillars: 3, 5.* The Orchestrator agent decomposes big commands into multi-agent plans
(research → summarize → draft → schedule), runs steps in parallel where safe, composes
results; user-defined custom workflows (the `CUSTOM` agent kind); long-running runs with
checkpoints and resume.

### Phase 7 — Ambient presence
*Pillars: 6, 5, 7.* Always-listening voice mode (wake word, local VAD); realtime voice
conversations; home-screen widgets; multi-device sync; optionally local models for private
inference. This is where the command center stops being a website and becomes an environment.

Each phase is shippable alone, ordered by dependency: **engine → memory → presence → hands →
proactivity → orchestration → ambience.** We do not start N+1 before N's core loop is demoed.

## 5. Safety posture (non-negotiable, all phases)

1. Explicit capture only — no stealth scraping, ever (see PRODUCT_VISION.md).
2. Irreversible/external actions stay disabled until approvals bind the exact immutable
   recipient/payload/mutation. The current status-only approval rows do not meet that bar.
3. Risk levels (`low/medium/high`) are computed per-run, shown before execution, logged after.
4. Current run logs record tool names and outcomes. Phase 0 still requires structured, redacted
   audit events with correlation IDs before logs qualify as a full security audit trail.
5. Secrets stay in env or encrypted storage; never in logs or model context. Existing plaintext
   `ConnectorConfig` credentials are Phase 0 debt and block private beta.
6. A durable kill switch and cancellation at step boundaries are required before autonomous or
   long-running execution; they are not implemented yet.

## 6. Engineering standards

- TypeScript strict; zod at every API boundary; Prisma as the only DB access path
  (raw SQL only for pgvector operators, isolated in one module).
- Deterministic fallbacks for read/routing features; action execution fails closed when required
  cognition or storage is unavailable.
- CI runs Prisma generation, typecheck, lint, unit tests, and production build on every pull
  request. Database-backed approval and executor concurrency tests remain required.
- Repo hygiene: build artifacts and `.DS_Store` out of git; images deduplicated.

## 7. Immediate milestones

| Milestone | Definition of done |
|---|---|
| **P0.1: Truthful fail-closed runtime** | No simulated completions or invented telemetry; missing dependencies produce explicit offline/degraded/failed state |
| **P0.2: Scoped identities** | Browser, extension, Telegram, worker, and cron cannot cross their documented authorization boundaries |
| **P0.3: Immutable action proposals** | Exact payload hash, expiry, approver, execution identity, and provider idempotency key are persisted and tested |
| **P0.4: Secret protection** | Connector and pairing credentials encrypted at rest with documented rotation and revocation |
| **P0.5: Beta safety verification** | CI plus database integration tests cover approval replay/concurrency, run claiming, and every high-risk transition |
| M5: First external write | One narrowly scoped connector mutation re-enabled only through a payload-bound approval and complete audit trail |
