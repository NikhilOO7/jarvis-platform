# Phase 0 — Truth and Safety

Started: August 25, 2026

Phase 0 is the release gate between the current localhost alpha and a private beta. New
connectors and autonomous capabilities stay paused until this gate is complete.

## Completed in the first hardening tranche

- Split the shared pairing credential into scoped extension, Telegram, worker, and cron tokens.
- Reject service credentials shorter than 32 characters or reused by multiple service identities.
- Removed extension-token access to operator-only APIs.
- Made approval decisions one-way and rejected decisions against non-waiting runs.
- Added explicit per-step tool allowlists enforced both before model exposure and at execution.
- Added required-tool outcome contracts so data-dependent steps fail when their tool is skipped
  or every attempted call fails.
- Made execution fail closed for missing model configuration, invalid/empty workflows,
  inconsistent approvals, unknown tools, and exhausted tool-call limits.
- Disabled Gmail draft writes and Calendar event writes; both now produce local artifacts only.
- Reduced Google OAuth to Gmail-readonly and Calendar-readonly scopes. Existing connections
  must be disconnected and reconnected to shed previously granted write scopes.
- Removed fictional run, approval, agent, weather, latency, and volume telemetry from live views.
- Added login attempt throttling and production-only secure cookies.
- Enforced a 16+ character operator passphrase and 32+ character explicit session secret at startup.
- Added same-origin enforcement for session-authenticated mutation requests.
- Blocked external-account connection and reads in OPEN MODE; browser pairing tokens are not
  minted or displayed until operator authentication is configured.
- Restricted service-originated commands and scheduled briefings to local data; Telegram run
  polling must name the exact run id returned when that command was created.
- Replaced the live character-branded dashboard figure, legacy theme identifiers, and visual
  terminology with an original CSS signal-core identity; a full asset-license inventory remains required.
- Added GitHub CI for install, Prisma generation, typecheck, lint, tests, and production build.
- Restored lint enforcement during Next.js builds.

## Required configuration change

Do not reuse `JARVIS_EXTENSION_TOKEN` for background services. Configure independent random
values of at least 32 characters:

```dotenv
JARVIS_EXTENSION_TOKEN="..." # capture, page ask, media, health
JARVIS_TELEGRAM_TOKEN="..."  # local commands, capture/ask, known run/approval updates
JARVIS_WORKER_TOKEN="..."    # claim queued runs only
JARVIS_CRON_TOKEN="..."      # scheduled briefing trigger only
```

The database-minted token shown on `/settings` remains extension-only.

## Remaining Phase 0 exit work

- Define immutable `ActionProposal` records with connector, tool, payload, payload hash, expiry,
  approval identity, execution identity, and provider idempotency key.
- Execute only a payload whose exact hash was approved; then re-enable selected Google writes.
- Encrypt Google and extension credentials at rest and add key-rotation guidance.
- Add structured security/audit events with redaction and correlation IDs.
- Move the single-process login throttle to shared storage before horizontal deployment.
- Add database-backed tests for approval concurrency/replay and run claiming, plus route-level
  authorization, login-limit, and all high-risk API state-transition tests.
- Add browser-extension privacy controls: no-AI capture, redaction, kill switch, and receipts.
- Document backup, restore, credential revocation, and incident-response procedures.
- Inventory and either license or remove every remaining third-party visual asset before beta;
  legacy files under `public/images/` are no longer referenced by live surfaces but still remain in the repository.

## Exit criteria

Phase 0 is complete only when:

1. No external mutation can occur without approval of its exact immutable payload.
2. No service credential can access a route outside its documented scopes.
3. Secrets are encrypted at rest and never written to model context or logs.
4. Live surfaces display observed data or explicit offline/degraded/empty states.
5. CI protects every merge and high-risk state transitions have automated tests.
