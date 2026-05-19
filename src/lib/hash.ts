import { createHash } from "node:crypto";

export function stableHash(input: string) {
  return createHash("sha256").update(input.trim().toLowerCase()).digest("hex");
}

export function normalizeUrl(url?: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    parsed.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((key) => {
      parsed.searchParams.delete(key);
    });
    return parsed.toString();
  } catch {
    return url.trim();
  }
}
