import { afterEach, describe, expect, it, vi } from "vitest";

const googleEnvKeys = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"] as const;

afterEach(() => {
  for (const key of googleEnvKeys) delete process.env[key];
  vi.resetModules();
});

async function loadGoogle(envVars: Record<string, string> = {}) {
  vi.resetModules();
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.GOOGLE_REDIRECT_URI;
  Object.assign(process.env, envVars);
  return import("@/lib/connectors/google");
}

describe("buildGoogleAuthUrl", () => {
  it("carries client, redirect, offline access, and all scopes", async () => {
    const google = await loadGoogle({
      GOOGLE_CLIENT_ID: "client-123",
      GOOGLE_CLIENT_SECRET: "secret",
      GOOGLE_REDIRECT_URI: "http://localhost:3000/api/connectors/google/callback"
    });
    const url = new URL(google.buildGoogleAuthUrl("state-abc"));
    expect(url.hostname).toBe("accounts.google.com");
    expect(url.searchParams.get("client_id")).toBe("client-123");
    expect(url.searchParams.get("state")).toBe("state-abc");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/connectors/google/callback");
    const scope = url.searchParams.get("scope") ?? "";
    expect(scope).toContain("gmail.readonly");
    expect(scope).not.toContain("gmail.compose");
    expect(scope).not.toContain("gmail.send");
    expect(scope).toContain("calendar.readonly");
    expect(scope).not.toContain("calendar.events");
  });

  it("reports configured only when both keys exist", async () => {
    const unconfigured = await loadGoogle();
    expect(unconfigured.isGoogleConfigured()).toBe(false);
    const configured = await loadGoogle({ GOOGLE_CLIENT_ID: "a", GOOGLE_CLIENT_SECRET: "b" });
    expect(configured.isGoogleConfigured()).toBe(true);
  });
});
