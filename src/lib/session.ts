import { env } from "@/lib/env";

/**
 * Operator session tokens: passphrase → signed cookie. Web Crypto only and no
 * database imports, so this module is safe in edge middleware AND node routes.
 * No password configured = open mode (single-operator localhost default),
 * surfaced honestly in the UI — never silently.
 */

export const SESSION_COOKIE = "jarvis_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function isAuthEnabled(): boolean {
  return Boolean(env.JARVIS_OPERATOR_PASSWORD);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

/** Session secret: explicit env wins; else derived from the password. */
function sessionSecret(): string | null {
  if (env.JARVIS_SESSION_SECRET) return env.JARVIS_SESSION_SECRET;
  if (env.JARVIS_OPERATOR_PASSWORD) return `jarvis-session::${env.JARVIS_OPERATOR_PASSWORD}`;
  return null;
}

async function sign(payload: string, secret: string): Promise<string> {
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), new TextEncoder().encode(payload));
  return toHex(signature);
}

export async function createSessionToken(): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const expiresAt = String(Date.now() + SESSION_TTL_MS);
  return `${expiresAt}.${await sign(expiresAt, secret)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const secret = sessionSecret();
  if (!secret || !token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;
  if (!/^\d+$/.test(expiresAt) || Number(expiresAt) < Date.now()) return false;
  return constantTimeEqual(await sign(expiresAt, secret), signature);
}

export function verifyPassword(candidate: string): boolean {
  const password = env.JARVIS_OPERATOR_PASSWORD;
  if (!password) return false;
  return constantTimeEqual(candidate, password);
}

export function readSessionCookie(request: Request): string | null {
  const header = request.headers.get("cookie") ?? "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}
