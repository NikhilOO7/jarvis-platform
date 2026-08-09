# Jarvis Platform

A personal AI operating system for turning saved links, social exports, posts, videos, jobs, product research, workouts, and health content into structured knowledge and useful plans.

## Product Truth Source

The detailed product vision, feature map, architecture, roadmap, and guiding principles live in [PRODUCT_VISION.md](./PRODUCT_VISION.md). The founder/CTO execution program — capability pillars, target architecture, and the seven-phase plan to the full JARVIS vision — lives in [docs/MASTER_PLAN.md](./docs/MASTER_PLAN.md). The consent-first browser extension (read-on-approval capture from open Instagram/Facebook/LinkedIn tabs, video transcription and multimodal understanding) is specified in [docs/BROWSER_COMPANION_PLAN.md](./docs/BROWSER_COMPANION_PLAN.md). Treat those documents as the reference for what we are building and in what order.

## MVP v0.1

- Next.js dashboard and command-center style UI
- Manual save/link capture
- Text/export import endpoint
- Raw source item storage model
- Category classification: Food, Workout, Tech, Products, Jobs, Misc
- Semantic dedupe data model using Postgres + pgvector
- Knowledge base records derived from saved content
- Chat API scaffold for saved knowledge
- Briefing API scaffold
- Env placeholders for OpenAI and Postgres

## Current App Surfaces

- `/` - Jarvis HUD dashboard and command-center overview
- `/capture` - manual link/text capture and export import
- `/knowledge` - derived memory records
- `/agents` - business automation agent console
- `/workflows` - Jarvis native workflow template matrix
- `/runs` - native workflow run monitor
- `/command` - natural-language command router prototype
- `/approvals` - approval queue and safety gate control room
- `/chat` - chat with saved knowledge
- `/briefing` - daily briefing surface
- `/settings` - connector readiness and environment map

## Automation Core

The platform includes a working agent execution engine (Phase 1 of the master plan):

- LLM intent router (`routeCommandSmart`) with a deterministic keyword fallback when no API key is set
- Workflow run executor (`src/lib/agents/executor.ts`) that claims `QUEUED` runs, walks template steps through an OpenAI tool-calling loop, streams step logs into the run, and writes structured output
- Agent tool registry (`src/lib/agents/tools.ts`): semantic knowledge search, note capture, briefing snapshot, run history, safe calculator, clock — plus draft-artifact tools (email draft, calendar proposal, expense record) that never touch external systems until connectors plus approvals exist
- Semantic memory: embeddings are written on ingest and queried via pgvector similarity for chat and agent retrieval, with keyword/recency fallback
- Approval gates: approving the final gate auto-fires the executor; rejecting cancels the run
- Chat persistence into `ChatSession`/`ChatMessage` with retrieval sources returned per answer
- Workflow templates, runs, approvals, agent definitions, and connector configs in Prisma

## API Endpoints

- `POST /api/ingest` - ingest one saved item
- `POST /api/import` - import pasted export text
- `POST /api/extension/capture` - future browser extension capture endpoint
- `POST /api/chat` - answer from saved knowledge
- `GET /api/briefing` - generate briefing payload
- `POST /api/command` - route a natural-language command and execute it immediately when no approval gate applies
- `GET /api/workflows` - list workflow templates
- `GET /api/runs` - list workflow runs with logs and output
- `POST /api/runs/execute` - execute a specific `QUEUED` workflow run
- `GET /api/approvals` - list approval queue
- `PATCH /api/approvals` - approve or reject an approval request (clearing the last gate triggers execution)

## Telegram Bridge

Jarvis in your pocket: `npm run telegram` starts a zero-dependency long-polling bridge
(`scripts/telegram-bridge.mjs`) that relays Telegram messages to your local app — free text
becomes grounded answers from your knowledge base, `/run <command>` routes into agent
workflows with **inline approve/reject buttons** for approval gates (execution results are
reported back to the chat), `/save` captures links/notes, `/brief` runs the executive
briefing. Setup: create a bot with @BotFather, set `TELEGRAM_BOT_TOKEN` and
`JARVIS_EXTENSION_TOKEN` in `.env`, run `npm run telegram -- --check`, then message the bot
once and pin the printed `TELEGRAM_ALLOWED_CHAT_ID` in `.env`. The bridge answers only that
chat id and talks only to your local app.

**Proactive briefing:** set `JARVIS_BRIEFING_TIME` (e.g. `07:00`) and the bridge fires the
briefing workflow every morning via `POST /api/cron/briefing` (token-authed) and pushes the
result to your chat — Jarvis speaks first. Any external cron can hit the same endpoint.

## Safe Capture Principle

Use explicit capture first: manual save, browser extension, share sheet, clipboard, iOS Shortcuts, Android share intent, exports, and official APIs where useful. Avoid stealth scraping and private API reverse engineering.

## Getting Started

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

When Postgres is ready, enable `pgvector`, set `DATABASE_URL`, then run:

```bash
npm run prisma:migrate
```

## Architecture

```text
Connectors
  Browser extension, share sheet, APIs, exports, email, files

Ingestion API
  Extract text, parse links, normalize metadata

Storage
  Postgres records, pgvector embeddings, graph-style relationship tables

AI Layer
  Classification, summarization, deduplication, memory, planning, web research

Jarvis Interface
  Dashboard, chat, voice, briefings, automations
```
