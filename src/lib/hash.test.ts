import { describe, expect, it } from "vitest";
import { normalizeUrl, stableHash } from "@/lib/hash";

describe("normalizeUrl", () => {
  it("strips tracking params and fragments", () => {
    expect(
      normalizeUrl("https://example.com/a?utm_source=ig&utm_medium=social&keep=1#section")
    ).toBe("https://example.com/a?keep=1");
  });

  it("makes the same share from different apps one identity", () => {
    const fromInstagram = normalizeUrl("https://example.com/post?utm_source=instagram");
    const fromTelegram = normalizeUrl("https://example.com/post?utm_source=telegram#reply");
    expect(fromInstagram).toBe(fromTelegram);
  });

  it("passes through non-URLs untouched (trimmed)", () => {
    expect(normalizeUrl("  not a url  ")).toBe("not a url");
    expect(normalizeUrl(null)).toBeNull();
    expect(normalizeUrl(undefined)).toBeNull();
  });
});

describe("stableHash", () => {
  it("is deterministic and case/whitespace insensitive", () => {
    expect(stableHash("Hello World")).toBe(stableHash("  hello world "));
  });

  it("differs for different content", () => {
    expect(stableHash("a")).not.toBe(stableHash("b"));
  });

  it("produces a sha256 hex digest", () => {
    expect(stableHash("x")).toMatch(/^[a-f0-9]{64}$/);
  });
});
