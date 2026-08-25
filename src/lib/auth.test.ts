import { describe, expect, it } from "vitest";
import { hasValidBrowserOrigin } from "@/lib/auth";

describe("browser request origin policy", () => {
  it("accepts read-only requests without an Origin header", () => {
    expect(hasValidBrowserOrigin(new Request("http://localhost:3000/api/runs"))).toBe(true);
  });

  it("accepts same-origin mutations", () => {
    const request = new Request("http://localhost:3000/api/command", {
      method: "POST",
      headers: { Origin: "http://localhost:3000" }
    });
    expect(hasValidBrowserOrigin(request)).toBe(true);
  });

  it("rejects cross-origin and origin-less mutations", () => {
    const crossOrigin = new Request("http://localhost:3000/api/command", {
      method: "POST",
      headers: { Origin: "https://attacker.example" }
    });
    const noOrigin = new Request("http://localhost:3000/api/command", { method: "POST" });
    expect(hasValidBrowserOrigin(crossOrigin)).toBe(false);
    expect(hasValidBrowserOrigin(noOrigin)).toBe(false);
  });
});
