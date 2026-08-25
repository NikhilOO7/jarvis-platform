import { afterEach, describe, expect, it, vi } from "vitest";

const tokenKeys = [
  "JARVIS_EXTENSION_TOKEN",
  "JARVIS_TELEGRAM_TOKEN",
  "JARVIS_WORKER_TOKEN",
  "JARVIS_CRON_TOKEN"
] as const;

const testTokens = {
  extension: "extension-secret-32-characters-long",
  telegram: "telegram-secret--32-characters-long",
  worker: "worker-secret----32-characters-long",
  cron: "cron-secret------32-characters-long"
} as const;

async function loadAuth(overrides: Record<string, string> = {}) {
  vi.resetModules();
  Object.assign(process.env, {
    JARVIS_EXTENSION_TOKEN: testTokens.extension,
    JARVIS_TELEGRAM_TOKEN: testTokens.telegram,
    JARVIS_WORKER_TOKEN: testTokens.worker,
    JARVIS_CRON_TOKEN: testTokens.cron,
    ...overrides
  });
  return import("@/lib/service-auth");
}

function request(token: string) {
  return new Request("http://localhost/api", { headers: { Authorization: `Bearer ${token}` } });
}

afterEach(() => {
  for (const key of tokenKeys) delete process.env[key];
  vi.resetModules();
});

describe("scoped service credentials", () => {
  it("keeps extension credentials out of operator and worker scopes", async () => {
    const auth = await loadAuth();
    expect(await auth.requireServiceScope(request(testTokens.extension), "capture:write")).toBe(true);
    expect(await auth.requireServiceScope(request(testTokens.extension), "approvals:write")).toBe(false);
    expect(await auth.requireServiceScope(request(testTokens.extension), "runs:claim")).toBe(false);
  });

  it("limits worker credentials to health and queue claiming", async () => {
    const auth = await loadAuth();
    expect(await auth.requireServiceScope(request(testTokens.worker), "runs:claim")).toBe(true);
    expect(await auth.requireServiceScope(request(testTokens.worker), "runs:read")).toBe(false);
    expect(await auth.requireServiceScope(request(testTokens.worker), "command:write")).toBe(false);
  });

  it("grants Telegram command scopes but not worker execution", async () => {
    const auth = await loadAuth();
    expect(await auth.requireServiceScope(request(testTokens.telegram), "command:write")).toBe(true);
    expect(await auth.requireServiceScope(request(testTokens.telegram), "approvals:write")).toBe(true);
    expect(await auth.requireServiceScope(request(testTokens.telegram), "approvals:read")).toBe(false);
    expect(await auth.requireServiceScope(request(testTokens.telegram), "runs:claim")).toBe(false);
  });

  it("rejects weak service tokens even when they are configured", async () => {
    const auth = await loadAuth({ JARVIS_WORKER_TOKEN: "short-token" });
    expect(await auth.requireServiceScope(request("short-token"), "health:read")).toBe(false);
  });

  it("rejects a secret reused by more than one service identity", async () => {
    const auth = await loadAuth({ JARVIS_WORKER_TOKEN: testTokens.telegram });
    expect(await auth.getServiceIdentity(request(testTokens.telegram))).toBeNull();
  });
});
