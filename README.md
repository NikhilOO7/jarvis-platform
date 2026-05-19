# Jarvis Platform

A personal AI operating system for turning saved links, social exports, posts, videos, jobs, product research, workouts, and health content into structured knowledge and useful plans.

## Product Truth Source

The detailed product vision, feature map, architecture, roadmap, and guiding principles live in [PRODUCT_VISION.md](./PRODUCT_VISION.md). Treat that document as the reference for what we are trying to build.

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

The platform now includes a first-pass automation layer:

- Agent definitions in Prisma
- Workflow templates in Prisma
- Workflow runs in Prisma
- Approval requests in Prisma
- Connector configuration records in Prisma
- Static workflow template registry
- Command router that selects agent, workflow, risk, confidence, and approval gates
- API endpoint that can persist workflow runs when `DATABASE_URL` is configured

## API Endpoints

- `POST /api/ingest` - ingest one saved item
- `POST /api/import` - import pasted export text
- `POST /api/extension/capture` - future browser extension capture endpoint
- `POST /api/chat` - answer from saved knowledge
- `GET /api/briefing` - generate briefing payload
- `POST /api/command` - route natural-language command into an agent workflow
- `GET /api/workflows` - list workflow templates
- `GET /api/approvals` - list approval queue
- `PATCH /api/approvals` - approve or reject an approval request

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
