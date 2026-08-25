import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadSession(password?: string) {
  vi.resetModules();
  if (password) process.env.JARVIS_OPERATOR_PASSWORD = password;
  else delete process.env.JARVIS_OPERATOR_PASSWORD;
  delete process.env.JARVIS_SESSION_SECRET;
  return import("@/lib/session");
}

describe("session tokens", () => {
  beforeEach(() => vi.useRealTimers());
  afterEach(() => {
    delete process.env.JARVIS_OPERATOR_PASSWORD;
    vi.useRealTimers();
  });

  it("round-trips a valid token", async () => {
    const session = await loadSession("operator-test-secret");
    const token = await session.createSessionToken();
    expect(token).toBeTruthy();
    expect(await session.verifySessionToken(token)).toBe(true);
  });

  it("rejects tampered and malformed tokens", async () => {
    const session = await loadSession("operator-test-secret");
    const token = (await session.createSessionToken())!;
    const [expiry, signature] = token.split(".");
    expect(await session.verifySessionToken(`${Number(expiry) + 1}.${signature}`)).toBe(false);
    expect(await session.verifySessionToken(`${expiry}.deadbeef`)).toBe(false);
    expect(await session.verifySessionToken("garbage")).toBe(false);
    expect(await session.verifySessionToken(null)).toBe(false);
  });

  it("rejects expired tokens", async () => {
    const session = await loadSession("operator-test-secret");
    const token = (await session.createSessionToken())!;
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 31 * 24 * 60 * 60 * 1000);
    expect(await session.verifySessionToken(token)).toBe(false);
  });

  it("is disabled (open mode) without a password", async () => {
    const session = await loadSession(undefined);
    expect(session.isAuthEnabled()).toBe(false);
    expect(await session.createSessionToken()).toBeNull();
    expect(await session.verifySessionToken("123.abc")).toBe(false);
  });

  it("verifies the passphrase in constant-time style", async () => {
    const session = await loadSession("operator-test-secret");
    expect(session.verifyPassword("operator-test-secret")).toBe(true);
    expect(session.verifyPassword("operator-test-secreT")).toBe(false);
    expect(session.verifyPassword("")).toBe(false);
  });

  it("parses the session cookie out of a header", async () => {
    const session = await loadSession("operator-test-secret");
    const request = new Request("http://x", {
      headers: { cookie: `other=1; ${session.SESSION_COOKIE}=abc.def; more=2` }
    });
    expect(session.readSessionCookie(request)).toBe("abc.def");
  });
});
