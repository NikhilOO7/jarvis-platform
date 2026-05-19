# Jarvis Platform Product Vision

## Purpose

Jarvis is a personal AI operating system for capturing, organizing, deduplicating, understanding, and using the information scattered across saved posts, bookmarks, reels, videos, images, articles, jobs, products, workouts, food ideas, health content, and personal notes.

The product should not become another inbox. Its purpose is to reduce decisions, surface what matters, and turn saved content into useful actions.

Jarvis should feel like a calm, sharp, proactive personal assistant: composed, useful, context-aware, quietly brilliant, and a little witty. It should be Jarvis-inspired in tone and behavior, but not imitate a movie character, actor, or copyrighted voice.

## Core Product Principle

Most people save content because it might matter later, but saved content usually becomes a graveyard. Jarvis exists to close that loop.

Every captured item should eventually answer at least one of these questions:

- Why did this matter to me?
- What category of my life does this belong to?
- Is it new, duplicate, outdated, or related to something I already saved?
- What should I do with it?
- Can it help me make a plan, decision, post, purchase, application, workout, meal, or learning path?

## Target User

The initial user is a single personal power user who saves lots of content across platforms and wants an AI layer that can remember, connect, and act on it.

The system should optimize for personal usefulness before general SaaS polish. It should feel like a command center for one person's life, not a generic productivity dashboard.

## Problem Statement

Useful information is fragmented across:

- Social media saves, bookmarks, posts, reels, videos, and images
- Browser bookmarks and explicitly saved pages
- Exported data from Meta, TikTok, Google, LinkedIn, and other platforms
- Job posts, company pages, role descriptions, and application notes
- Product pages, reviews, alternatives, prices, and wishlists
- Tech articles, AI posts, tutorials, docs, code ideas, and learning content
- Food, recipe, diet, supplement, and health content
- Workout posts, exercises, mobility drills, training splits, equipment ideas, and recovery advice
- Later: email, calendar, notes, files, reminders, and voice commands

The major pain is not capture alone. The pain is that captured information is not structured, connected, deduplicated, prioritized, or turned into decisions.

## Safety And Capture Philosophy

Jarvis should use safe, explicit capture methods first.

Preferred capture methods:

- Manual save or link input
- Pasted text, visible page text, or user notes
- File uploads and platform data exports
- Official APIs where available and useful
- Browser extension capture of visible page/post metadata when the user is logged in
- Mobile share sheet capture
- Clipboard capture initiated by the user
- iOS Shortcuts
- Android share intent
- Email/calendar/files only through user-approved integrations later

Avoid:

- Risky stealth scraping
- Private API reverse engineering
- Circumventing platform protections
- Hidden collection of private activity
- Capturing content without explicit user intent

For platforms with weak or unavailable APIs, the preferred approach is user-controlled capture through browser extension, share sheet, clipboard, or data export import.

## High-Level Architecture

```text
Connectors
  Browser extension, share sheet, official APIs, exports, email, files, manual input

Ingestion API
  Normalize payloads, parse links, extract text, store raw source records

Raw Content Store
  Keep original saved content, metadata, source information, timestamps, and hashes

Extraction Layer
  OCR images, transcribe video/audio, parse documents, extract metadata, fetch safe page metadata

AI Processing Layer
  Classify, summarize, embed, deduplicate, extract entities, identify actions

Knowledge Base
  Derived records, entities, relationships, user goals, memories, decisions, plans

Chat/Search/Planning Layer
  Retrieval, question answering, plan generation, research, briefings, tool execution

Jarvis Interface
  Dashboard, chat, voice mode, command center, daily/weekly briefings, automations
```

## The Five Big Brains

### 1. Personal Capture

Jarvis collects information that the user explicitly saves or imports.

Initial capture sources:

- Manual link input
- Manual text or note input
- Uploaded or pasted export files
- Browser activity explicitly saved by the user
- Future Chrome extension with "Save to Jarvis"
- Future mobile share sheet
- Future voice/text commands

Later capture sources:

- Meta, TikTok, Google, LinkedIn exports
- YouTube links and transcripts where available
- Email integrations
- Calendar integrations
- Notes integrations
- File imports
- Product pages
- Job boards and job posts

Capture should preserve:

- Original URL
- Canonical URL
- Title
- Author or creator if available
- Platform
- Visible text or user-provided text
- Source type
- Raw metadata
- Media references where legally and technically appropriate
- Created/saved timestamp
- User notes
- Processing status

### 2. Personal Knowledge Graph

Jarvis should not only store posts. It should understand the meaning and relationships behind them.

Everything useful should become connected knowledge:

- Foods connect to ingredients, macros, recipes, groceries, diet goals, supplements, and health notes
- Workouts connect to muscles, equipment, injuries, schedule, recovery, exercises, sets, reps, and progression
- Jobs connect to companies, skills, role requirements, resume gaps, application status, recruiters, and networking reminders
- Products connect to price, alternatives, reviews, use cases, tradeoffs, wishlists, and purchase timing
- Tech content connects to concepts, frameworks, projects, code ideas, learning paths, and current research
- People connect to conversations, reminders, context, opportunities, and relationships
- Saved posts connect to themes, goals, repeated interests, and future actions

The knowledge graph should support:

- Entity extraction
- Relationship creation
- Semantic search
- Deduplication
- Clustering by theme
- Memory retrieval
- Planning
- Personal context over time

### 3. AI Agent Layer

This is the Jarvis layer. It should answer, plan, compare, summarize, and eventually take approved actions.

Example questions:

- What should I eat this week based on recipes I saved?
- Create a workout plan from the exercises I keep saving.
- Which jobs did I save that actually match me?
- What skills am I missing for these roles?
- Find newer articles that update this tech concept.
- Draft a LinkedIn post based on what I have been learning.
- Remind me which products I wanted to buy and whether they are worth it.
- Compare these saved products and recommend one.
- What themes keep showing up in my saved content?
- What should I focus on this week?

Agent capabilities:

- Classify content
- Summarize content
- Extract key claims
- Extract action items
- Generate plans
- Search saved knowledge
- Search the internet when local knowledge is insufficient
- Compare saved content with current evidence
- Attach new findings back to the knowledge graph
- Draft posts, messages, application material, and research notes
- Ask clarifying questions only when needed

### 4. Internet Research Layer

When saved knowledge is insufficient or possibly outdated, Jarvis should research the internet, compare sources, and attach findings back to the graph.

Example:

The user saved many posts about creatine. Jarvis should be able to say:

"You have saved a lot about creatine. Here is what your saved posts claim, here is what current evidence says, and here is a simple plan that fits your workout goals."

Research behavior:

- Prefer credible and current sources
- Distinguish saved claims from researched evidence
- Cite sources where possible
- Summarize disagreements
- Identify outdated or questionable claims
- Store research summaries as knowledge records
- Connect research findings to existing entities and saved content

High-stakes areas like medical, legal, or financial topics should be handled carefully, with clear uncertainty and encouragement to consult qualified professionals when appropriate.

### 5. Voice And Personality

Jarvis should eventually speak and listen through:

- Web app voice chat
- Mobile app voice mode
- Desktop command palette
- Daily briefings
- Proactive reminders

Personality:

- Calm
- Sharp
- Practical
- Proactive
- Clear
- Slightly witty
- Never noisy
- Never fake-authoritative when uncertain

Jarvis should act like a trusted operator. It should be concise by default, but detailed when the user is planning, researching, or making an important decision.

## Visual Design Direction

The app should feel like an actual futuristic assistant interface, not a basic SaaS dashboard.

Reference-inspired UI principles:

- Dark cockpit-like background with subtle starfield, scanline, grid, and hex textures
- Cyan/teal primary glow with amber and red accents for warnings, activation states, and priority signals
- Central assistant core motif: glowing orb, reactor-style circular control, orbital rings, and pulse animations
- Side command modules that feel like physical HUD controls rather than generic cards
- Dense diagnostic panels for data, memory, agents, briefings, workflows, and system status
- Waveform strips to represent voice, listening state, speech output, and command processing
- Top and bottom telemetry rails for mode, status, startup state, active channel, and system version
- Angular panel edges, thin glowing borders, micro-labels, and terminal-like readouts
- Command buttons should feel like HUD controls: bright cyan, glowing, tactile, and icon-led
- Important states should be visually distinct: standby, listening, processing, approval required, completed, warning

Dashboard visual composition:

- The first viewport should include a central Jarvis core/orb experience.
- Primary commands should sit around the center, similar to a command console.
- Secondary data should appear as surrounding HUD panels.
- The interface should communicate that Jarvis is alive, listening-capable, and operational.

Agent pages visual composition:

- Multi-agent systems should feel like a control room.
- Each agent should be represented as a module with capabilities, status, and routing context.
- Workflow steps should appear like execution pipelines or telemetry timelines.
- Approval gates should look like important safety controls, not ordinary text.

The design can be inspired by cinematic Jarvis-style UIs, holographic dashboards, and futuristic assistant panels, but it should remain an original product identity and should not copy copyrighted layouts, imagery, actor likenesses, or exact screen designs.

## MVP v0.1 Scope

The first version should be focused and personal.

Required MVP surfaces:

- Web app dashboard
- Manual save/link input
- Upload or import text/export files
- Raw source item storage
- Category classification
- Semantic deduplication foundation
- Knowledge base records derived from saved content
- Chat with saved knowledge
- Basic Jarvis briefing page
- Environment placeholders for API keys

Initial categories:

- Food
- Workout
- Tech
- Products
- Jobs
- Misc

MVP ingestion:

- Manual link save
- Manual text save
- Pasted export text
- Future extension endpoint

MVP processing:

- Normalize URLs
- Hash content for exact dedupe
- Classify content
- Summarize content
- Create derived knowledge records
- Store source metadata

MVP AI:

- Use OpenAI API for classification when configured
- Use OpenAI API for summarization when configured
- Use embeddings for semantic retrieval and deduplication once Postgres + pgvector is active
- Use keyword fallback for local development without keys

MVP interface:

- Dashboard showing capture and knowledge stats
- Capture page for manual saves and imports
- Knowledge page for derived records
- Chat page for asking questions about saved knowledge
- Briefing page for recent patterns and next actions

## Feature Areas

### Dashboard

The dashboard is the command center.

It should show:

- Total raw items captured
- Knowledge records created
- Duplicate items detected
- Category breakdown
- Recent saves
- Recent knowledge records
- Suggested next actions
- Briefing preview
- Capture health
- Processing queue status

Eventually it should also show:

- Themes that are increasing
- Decisions waiting on the user
- Products to revisit
- Jobs that need action
- Saved recipes to turn into a meal plan
- Workout ideas to turn into a program
- Tech topics to learn

### Workflow Automation And Multi-Agent Ecosystem

Jarvis should evolve from a knowledge assistant into a delegated workflow assistant. The system should be able to understand a user command, retrieve context, choose the correct tool or agent, execute approved actions, and report back through text or voice.

The long-term workflow model:

1. The user sends a text or voice command through the web app, Telegram, desktop command palette, browser extension, or mobile share flow.
2. Voice is transcribed into text when needed.
3. Jarvis identifies intent, urgency, required context, and risk level.
4. Jarvis retrieves relevant memory from the knowledge graph and working memory buffer.
5. Jarvis selects the correct agent, tool, automation, or workflow.
6. The selected agent executes the task, asking for approval before risky external actions.
7. Jarvis replies with a concise result, optional voice response, and any memory updates.

Initial automation modules to support later:

- Email automation agent
- Calendar management agent
- Contact management agent
- Research and internet agent
- Expense tracking agent
- Calculator and utility agent
- Custom workflow agents
- Multi-agent delegation router

This should be implemented carefully. The user should stay in control of any action that sends messages, changes calendar events, edits contacts, spends money, exposes private data, or triggers external side effects.

### Jarvis 2.0 Business Automation Feature Set

Jarvis should eventually be able to run business tasks, not merely chat about them. The intended product direction is a fully automated AI agent system that can send approved emails, manage meetings, research the internet, track expenses, respond to voice commands, and delegate work across specialized agents from one intelligent interface.

This layer is especially useful for:

- Agency owners
- Startup founders
- Entrepreneurs
- Content creators
- Remote teams
- Business operators
- Productivity-focused personal power users

What makes the system different:

- It understands natural-language requests.
- It remembers conversation context and relevant personal knowledge.
- It decides which tool, workflow, or internal agent should execute the task.
- It performs real actions across connected systems when approved.
- It responds through text and optional voice.
- It uses a personality layer so responses feel like a composed assistant, not a generic chatbot.

Core business automation promise:

Jarvis should let the user message the assistant like they would message a real executive assistant. The system should then infer the task, gather needed context, choose the correct agent, execute safely, and report back.

#### Telegram And Voice Control Center

The Telegram or chat-command interface should allow the user to control Jarvis through text or voice commands.

Capabilities:

- Accept Telegram-style text messages
- Accept Telegram-style voice notes
- Convert voice to text through speech-to-text
- Preserve short-term conversational context in a memory buffer
- Route commands into the correct agent or workflow
- Return text responses
- Return optional synthesized voice responses

Example commands:

- "Draft a reply to the latest client email."
- "Schedule a meeting with the team next Tuesday afternoon."
- "Research competitors for this product idea."
- "Log this expense as software."
- "Calculate the margin if I sell this at 49 dollars."
- "Summarize my day and tell me what needs attention."

#### Jarvis Native Workflow Package

Jarvis should support importable, inspectable workflow definitions for automation.

The long-term workflow package should include:

- Complete workflow definitions
- Plug-and-play automation templates
- Multi-agent delegation flows
- Voice automation modules
- Telegram control-center flow
- Setup instructions
- Environment variable placeholders
- Approval-gate configuration
- Error handling and retry branches
- Execution logs

This does not replace the app. The app remains the command center, memory layer, product interface, and automation engine. Native Jarvis workflows handle external systems and repeatable task execution through explicit connectors, approval gates, logs, and retries.

#### Email Automation Agent

Business automation requirements:

- Draft professional emails
- Reply to messages after approval
- Categorize incoming emails
- Process email workflows
- Summarize threads
- Extract action items
- Create follow-up reminders
- Route email context into memory

The email agent should reduce manual writing while preserving user control. Sending should require approval unless the user later defines a very specific trusted automation rule.

#### Smart Calendar Management

Business automation requirements:

- Check availability
- Schedule meetings after approval
- Update events
- Handle scheduling requests
- Manage appointments
- Detect conflicts
- Prepare agenda notes
- Connect meetings to people, projects, and follow-ups

The calendar should not "run itself" without visibility. Jarvis can do the heavy lifting, but the user should see proposed changes before impactful edits.

#### Contact Management System

Business automation requirements:

- Search contacts
- Add new contacts after approval
- Edit contact information after approval
- Retrieve contact details for communication
- Track relationship notes
- Connect contacts to emails, meetings, jobs, companies, and reminders

Contact memory should become searchable through AI while remaining private and reviewable.

#### AI Research Agent

Business automation requirements:

- Competitor research
- Market insights
- Topic summaries
- Data gathering
- Deep internet research
- Source comparison
- Evidence summaries
- Saved-knowledge versus external-research distinction

Research output should clearly separate what Jarvis found online from what already exists in the user's saved knowledge graph.

#### Personal Expense Tracking

Business automation requirements:

- Track expenses
- Log spending
- Categorize costs
- Organize financial records
- Manage personal or business cost records
- Parse receipts from text, files, or email later
- Summarize recurring subscriptions and spending patterns

Expense tracking should be treated as sensitive data. Jarvis can organize and analyze but should not move money or transmit financial data without explicit approval.

#### Calculator And Logic Agent

Business automation requirements:

- Pricing calculations
- Unit conversions
- Profit estimates
- Business math
- Logical problem solving
- Quick estimates
- Deterministic utility functions

For exact calculations, this agent should use deterministic tools rather than relying on natural-language model output.

#### Dynamic Personality System

The personality layer should make Jarvis feel engaging and executive-assistant-like without becoming distracting.

Personality behavior:

- Subtle wit for routine tasks
- Concise, direct execution updates
- Professional tone for business communications
- Conversational tone for casual queries
- Strategic tone for research, planning, and decisions
- Careful tone for sensitive topics
- Tone adaptation based on user intent

The assistant should never imitate a real actor, celebrity, or copyrighted voice. Voice output should use an original assistant voice.

#### Why This Layer Matters

This turns Jarvis from a passive knowledge system into an active operating system.

The goal is to reduce:

- App switching
- Repetitive admin work
- Manual inbox processing
- Manual scheduling
- Repeated research tasks
- Small calculations and operational decisions
- Lost context across tools

The user should be able to operate from one interface and have Jarvis delegate the work to the correct agent.

### Capture

Capture should be fast and low-friction.

Capture inputs:

- Link
- Title
- Platform
- Notes
- Pasted content
- Export text
- File upload later
- Browser extension later
- Mobile share sheet later

Capture should support the reality that many platforms hide useful data behind logged-in pages. The user can capture visible metadata through controlled tools instead of scraping.

### Imports

Imports should support platform exports and messy text.

Import targets:

- Meta exports
- TikTok exports
- Google Takeout
- LinkedIn saved jobs or data exports
- Browser bookmarks
- Notes files
- CSV/JSON files
- Plain text dumps

Import behavior:

- Preserve original file/source metadata
- Split into source items
- Track import batch
- Detect duplicates
- Create derived knowledge
- Report successes and failures

### Classification

Every item should be assigned one primary category and eventually optional secondary tags.

Primary categories:

- Food
- Workout
- Tech
- Products
- Jobs
- Misc

Future tags:

- Recipe
- Supplement
- Grocery
- Mobility
- Strength
- Cardio
- AI
- Frontend
- Backend
- Career
- Resume
- Wishlist
- Purchase candidate
- Learning path
- Content idea

### Deduplication

Jarvis should deduplicate both exact and semantic duplicates.

Exact dedupe:

- Canonical URL match
- Content hash match
- Import batch duplicate detection

Semantic dedupe:

- Embedding similarity
- Similar title and summary
- Same product/job/recipe/exercise detected from different platforms

Deduplication should not lose information. Duplicates should be linked to a canonical item so repeated interest can still be measured.

Repeated saves are meaningful. If the user saves five posts about the same topic, Jarvis should infer interest, not merely discard four items.

### Knowledge Records

Raw items are source material. Knowledge records are the useful extracted layer.

Knowledge records should include:

- Title
- Category
- Summary
- Insights
- Actions
- Entities
- Relationships
- Confidence
- Source link
- Created timestamp
- Embedding

Examples:

- A recipe post becomes ingredients, meal type, macros if available, and meal-plan suitability.
- A workout video becomes exercise, muscles, equipment, difficulty, and programming notes.
- A job post becomes company, role, skills, gaps, application priority, and resume adjustments.
- A product page becomes product, price, alternatives, review criteria, and purchase recommendation status.
- A tech article becomes concepts, tools, project ideas, and learning-path steps.

### Chat With Saved Knowledge

Chat should be grounded in the user's saved content and knowledge graph.

Chat should:

- Retrieve relevant saved knowledge
- Answer with citations or source references when possible
- State when context is insufficient
- Offer useful next actions
- Generate plans from saved material
- Compare saved items
- Summarize themes
- Help make decisions

Chat should not hallucinate that content exists in the knowledge base. It can research the internet later, but should clearly separate saved knowledge from external research.

### Voice, Telegram, And Command Channels

Jarvis should eventually be controllable from multiple command surfaces.

Command surfaces:

- Web app chat
- Web app voice mode
- Telegram bot or Telegram-style chat control
- Desktop command palette
- Browser extension
- Mobile share sheet
- Mobile voice command
- Clipboard and shortcut actions

Voice pipeline:

- User speaks a request
- Speech-to-text transcribes it
- Intent classifier determines task type
- Memory retrieval adds relevant context
- Agent router selects the right action path
- Response is returned as text and optionally synthesized voice

Telegram or chat-control use cases:

- "Summarize my unread important emails."
- "Schedule a meeting with Alex next week."
- "Save this link to Jarvis."
- "Research this product before I buy it."
- "Add this receipt to expenses."
- "Remind me to apply to this job tomorrow."
- "Create a workout from my saved exercises."

This channel should be opt-in and secure. It should not expose sensitive memory without authentication and explicit user control.

### Email Automation Agent

The email agent should help process email without becoming reckless.

Capabilities:

- Summarize unread or selected emails
- Categorize email by priority and topic
- Draft replies
- Find action items
- Extract people, companies, deadlines, invoices, and links
- Create follow-up reminders
- Route emails into knowledge records
- Prepare daily email briefings

Future approved-action capabilities:

- Send replies after user approval
- Archive or label messages
- Create tasks from email
- Attach email context to people and projects

Safety requirements:

- Never send email without explicit approval
- Show the draft and recipient before sending
- Identify uncertain or high-stakes replies
- Preserve source email references

### Calendar Management Agent

The calendar agent should help manage time and scheduling.

Capabilities:

- Check availability
- Suggest meeting times
- Create agendas
- Prepare meeting briefs
- Update events after approval
- Detect conflicts
- Connect events to people, projects, and notes
- Generate daily schedule briefings

Future approved-action capabilities:

- Schedule meetings
- Reschedule meetings
- Cancel meetings
- Add reminders
- Attach prep notes

Safety requirements:

- Confirm before creating, moving, or deleting events
- Show attendees, time, title, and description before changes
- Respect working hours and personal preferences

### Contact Management Agent

The contact agent should help remember people and relationship context.

Capabilities:

- Search contacts
- Add contact notes
- Connect people to conversations, jobs, companies, events, and reminders
- Track follow-ups
- Prepare context before meetings or outreach
- Recall where a person appeared in saved content

Future approved-action capabilities:

- Create or edit contacts
- Draft outreach
- Set follow-up reminders

Safety requirements:

- Avoid overwriting contact data without review
- Keep personal relationship notes private
- Ask before sending outreach

### Expense Tracking Agent

The expense agent should help track money signals from purchases, receipts, subscriptions, and saved products.

Capabilities:

- Parse receipts or pasted transactions
- Categorize expenses
- Track subscriptions
- Connect products to purchases
- Track spending by category
- Flag recurring costs
- Summarize monthly spending

Future approved-action capabilities:

- Create expense records from email receipts
- Export expense summaries
- Track reimbursement items

Safety requirements:

- Treat financial data as sensitive
- Avoid financial advice beyond organization and analysis unless clearly framed
- Ask before transmitting financial data anywhere

### Calculator And Utility Agent

The calculator agent should handle exact or structured utility tasks.

Capabilities:

- Math
- Unit conversions
- Currency conversions with current rates when needed
- Pricing comparisons
- Macro calculations
- Workout volume calculations
- Time zone conversions
- Logic checks
- Small structured computations

This agent should prefer deterministic tools over language-model guesses whenever exactness matters.

### Workflow Orchestrator

Jarvis should include its own workflow orchestration layer for repeatable multi-step automation.

The orchestrator should:

- Connect triggers to actions
- Route tasks to agents
- Maintain workflow state
- Log every step
- Support retries
- Support approval gates
- Support scheduled jobs
- Support manual runs
- Support webhooks where safe

Example workflows:

- New saved job -> parse role -> compare to profile -> create application task -> suggest resume changes
- New recipe save -> extract ingredients -> add to meal-plan candidates -> suggest grocery items
- New product save -> research alternatives -> track price -> add to purchase review queue
- Incoming email receipt -> parse expense -> categorize -> connect to product or vendor
- Daily morning -> summarize calendar, reminders, saved priorities, workouts, meals, and job actions

### Personality Engine

Jarvis should have a configurable personality layer.

Personality goals:

- Calm and sharp by default
- Concise for operational tasks
- More detailed for research and planning
- Light wit when appropriate
- Professional for email, jobs, and external messages
- Encouraging for workouts and personal routines
- Careful and measured for health, finance, legal, or high-stakes topics

Tone should adapt to intent:

- Casual query: conversational and light
- Operational command: direct and efficient
- Research request: structured and evidence-aware
- Creative drafting: expressive but still in the user's voice
- Sensitive topic: careful, qualified, and grounded

The personality layer must not imitate a real actor, celebrity, or copyrighted character voice. It should be inspired by the feeling of a composed AI operator while remaining original.

### Briefings

Briefings are proactive summaries of what matters.

Initial briefing:

- Recent saves
- Recent knowledge records
- Suggested next actions
- Category trends
- Items needing review

Future daily briefing:

- Today's focus
- Calendar/email context
- Saved content patterns
- Product decisions
- Job application reminders
- Workout suggestion
- Meal suggestion
- Learning recommendation

Future weekly digest:

- What the user saved most
- Repeated themes
- Decisions to make
- Best saved items
- Generated plans
- Stale or outdated content

### Food And Health

Food features should help turn saved recipes and health content into practical choices.

Capabilities:

- Extract recipes
- Identify ingredients
- Estimate macros when possible
- Connect meals to goals
- Build meal plans
- Create grocery lists
- Compare saved nutrition advice with current evidence
- Track supplements and recurring claims

Example outputs:

- Weekly meal plan based on saved recipes
- High-protein dinner ideas from saved content
- Grocery list from saved meals
- Evidence review of saved supplement claims

### Workout

Workout features should turn saved exercises into structured training.

Capabilities:

- Extract exercises
- Identify muscles
- Identify equipment
- Identify sets/reps/rest when available
- Track mobility and recovery content
- Build workout plans
- Avoid conflicts with injuries or preferences once known
- Detect repeated interest in a training style

Example outputs:

- 4-day strength plan from saved exercises
- Mobility routine from saved drills
- Gym plan using available equipment
- Progression plan based on saved content

### Jobs And Career

Jobs features should turn saved roles and career content into applications and strategy.

Capabilities:

- Parse job descriptions
- Extract company, role, level, location, compensation if available
- Extract required skills
- Compare against user's profile
- Identify resume gaps
- Draft resume bullets
- Draft cover letters
- Track application status
- Prioritize best-fit roles
- Generate interview prep

Example outputs:

- Saved jobs ranked by fit
- Skills to learn for target roles
- Resume changes for a specific job
- LinkedIn outreach drafts

### Products

Product features should help research and purchase decisions.

Capabilities:

- Track saved products
- Extract price and specs when available
- Compare alternatives
- Summarize reviews
- Track "buy later" candidates
- Detect duplicate product saves
- Research current pricing and alternatives

Example outputs:

- Products worth buying now
- Alternatives to a saved product
- Pros/cons across saved options
- Purchase recommendation with reasoning

### Tech And Learning

Tech features should turn saved engineering and AI content into learning and building.

Capabilities:

- Extract concepts
- Cluster related posts
- Build learning paths
- Generate project ideas
- Summarize technical topics
- Compare old saved claims with current docs/research
- Draft posts based on learning

Example outputs:

- Learning plan for a saved AI topic
- Project plan from saved tech ideas
- Summary of all saved posts about a framework
- LinkedIn post draft based on recent learning

### Posting Assistant

Jarvis should help the user create content from what they are learning and saving.

Capabilities:

- Draft LinkedIn posts
- Draft Twitter/X threads
- Summarize learning themes
- Turn saved research into content ideas
- Maintain personal voice preferences
- Suggest posting cadence

### Automations And Reminders

Jarvis should eventually become proactive.

Examples:

- Remind me to apply to this job tomorrow.
- Tell me if this product price drops.
- Build a weekly digest every Sunday.
- Surface saved recipes before grocery planning.
- Remind me to revisit this learning topic next week.
- Notify me when I have saved enough related material to generate a plan.

Automations should be explicit and user-approved.

## Data Model Concepts

### Raw Source Item

The immutable-ish source record of what was saved.

Fields:

- ID
- Source type
- Original URL
- Canonical URL
- Title
- Author
- Platform
- Raw text
- Raw metadata
- Content hash
- Category
- Processing status
- Summary
- Embedding
- Duplicate reference
- Created timestamp
- Updated timestamp

### Knowledge Item

The useful derived understanding.

Fields:

- ID
- Source reference
- Category
- Title
- Summary
- Insights
- Actions
- Confidence
- Embedding
- Entities
- Created timestamp
- Updated timestamp

### Entity

A thing Jarvis understands.

Entity types:

- Food
- Ingredient
- Workout
- Muscle
- Equipment
- Company
- Job
- Skill
- Product
- Concept
- Person
- Goal
- Note

### Entity Relation

A connection between things.

Examples:

- creatine supports strength training
- React relates to Next.js
- job requires TypeScript
- recipe contains chicken
- workout targets shoulders
- product alternative to another product

## AI Responsibilities

AI should be used for:

- Classification
- Summarization
- Embeddings
- Semantic search
- Semantic dedupe
- Entity extraction
- Relationship extraction
- Plan generation
- Chat
- Briefings
- Research synthesis
- Drafting

AI should not be used as the only source of truth. Raw source items, derived records, and citations should remain inspectable.

## Technical Stack

Recommended stack:

- Next.js
- TypeScript
- Postgres
- pgvector
- Prisma
- OpenAI API for chat, classification, embeddings, extraction, and summarization
- Local-first development initially
- Chrome extension later

Future technical additions:

- Object storage for media
- OCR pipeline
- Transcript pipeline
- Worker queue
- Background jobs
- Mobile app or PWA
- Browser extension
- Calendar/email connectors
- Search/research tools
- Voice mode
- Telegram bot or chat-command connector
- Speech-to-text provider
- Text-to-speech provider
- Jarvis native workflow orchestration
- Approval-gated tool execution
- Contact connector
- Expense ingestion
- Deterministic calculator/tool runtime

## Roadmap

### v0.1: Personal Knowledge MVP

- Web dashboard
- Manual save/link input
- Upload/import text or exports
- Store raw source items
- Classify into Food, Workout, Tech, Products, Jobs, Misc
- Exact dedupe foundation
- Knowledge records
- Chat with saved knowledge
- Basic briefing page
- Env placeholders

### v0.2: Real Retrieval And Dedupe

- Postgres setup
- pgvector migrations
- Embedding generation
- Semantic search
- Semantic duplicate detection
- Better knowledge extraction
- Source references in chat
- Import batch tracking

### v0.3: Browser Extension

- Chrome extension "Save to Jarvis"
- Capture visible page metadata
- Capture selected text
- Capture active URL and title
- Capture platform hints
- Send to ingestion API
- Avoid stealth scraping or private APIs

### v0.4: Planning

- Meal planner
- Workout planner
- Job fit analyzer
- Product comparison
- Tech learning paths
- Weekly digest generator

### v0.5: Research Layer

- Internet research tools
- Source comparison
- Evidence summaries
- Attach findings to graph
- Outdated-content warnings

### v0.6: Voice And Proactivity

- Voice chat
- Daily briefings
- Reminder creation
- Proactive suggestions
- Desktop command palette
- Mobile share flow

### v0.7: Workflow Agents

- Email automation agent
- Calendar management agent
- Contact management agent
- Expense tracking agent
- Calculator and utility agent
- Agent router
- Approval-gated external actions
- Workflow execution logs

### v0.8: Voice And Chat Control Center

- Telegram or chat-control connector
- Speech-to-text command input
- Optional text-to-speech response output
- Memory buffer for ongoing assistant context
- Personality engine controls
- Multi-agent task delegation
- Jarvis native workflow templates

## Non-Goals For Early MVP

Early versions should not attempt to:

- Build every connector at once
- Scrape blocked platforms
- Fully automate job applications
- Send emails, modify calendars, or message contacts without approval
- Handle money-moving actions
- Make medical decisions
- Replace professional advice
- Build a complex graph UI before the data layer is useful
- Become a generic note-taking app
- Store everything without summarizing, prioritizing, or acting on it

## Success Criteria

Jarvis is succeeding when:

- Saving content feels fast
- Duplicate saves are detected and still counted as interest signals
- The user can ask questions across saved content
- The system can explain why saved items matter
- The user gets useful next actions
- Saved recipes become meal plans
- Saved exercises become workouts
- Saved jobs become application strategy
- Saved products become purchase decisions
- Saved tech posts become learning or project plans
- Briefings surface useful patterns without creating noise

## Product North Star

Jarvis should turn scattered saved content into personal leverage.

It should help the user remember better, decide faster, learn deliberately, apply strategically, buy thoughtfully, train consistently, eat intentionally, and publish from what they are actually learning.

The product is not a storage system. It is a personal intelligence layer.
