import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

/**
 * Google connector (Phase 4): OAuth + Gmail + Calendar over plain HTTP —
 * no googleapis SDK, same zero-dep discipline as the bridge and worker.
 *
 * Risk ladder, enforced in the tool layer:
 *   reads (mail list, calendar list)      → free
 *   Gmail DRAFTS                          → real, but never sends
 *   calendar events WITHOUT attendees     → real (own calendar, reversible)
 *   anything touching other people        → approval artifact, not an action
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const CONNECTOR = { type: "EMAIL" as const, name: "google-account" };

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email"
];

type GoogleTokens = {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // epoch ms
};

type GoogleMetadata = {
  tokens?: GoogleTokens;
  email?: string;
};

export function isGoogleConfigured(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(): string {
  return env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/connectors/google/callback";
}

export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state
  });
  return `${AUTH_URL}?${params}`;
}

/* ------------------------------ token store ------------------------------ */

async function readMetadata(): Promise<GoogleMetadata | null> {
  if (!env.DATABASE_URL) return null;
  try {
    const row = await prisma.connectorConfig.findUnique({
      where: { type_name: CONNECTOR }
    });
    return (row?.metadata as GoogleMetadata | null) ?? null;
  } catch {
    return null;
  }
}

async function writeMetadata(metadata: GoogleMetadata, status: string): Promise<void> {
  await prisma.connectorConfig.upsert({
    where: { type_name: CONNECTOR },
    update: {
      metadata: metadata as Prisma.InputJsonObject,
      status,
      enabled: status === "CONNECTED",
      connectedAt: status === "CONNECTED" ? new Date() : null
    },
    create: {
      ...CONNECTOR,
      metadata: metadata as Prisma.InputJsonObject,
      status,
      enabled: status === "CONNECTED",
      scopes: GOOGLE_SCOPES,
      connectedAt: status === "CONNECTED" ? new Date() : null
    }
  });
}

export async function exchangeCodeForTokens(code: string): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID ?? "",
      client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code"
    })
  });
  const body = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error_description?: string;
    error?: string;
  };
  if (!response.ok || !body.access_token) {
    return { ok: false, error: body.error_description || body.error || `token exchange failed (${response.status})` };
  }

  const tokens: GoogleTokens = {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_at: Date.now() + (body.expires_in ?? 3600) * 1000
  };

  // Identify the account for the settings card.
  let email: string | undefined;
  try {
    const info = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    email = ((await info.json()) as { email?: string }).email;
  } catch {
    // non-fatal
  }

  await writeMetadata({ tokens, email }, "CONNECTED");
  return { ok: true };
}

export async function getGoogleAccessToken(): Promise<string | null> {
  const metadata = await readMetadata();
  const tokens = metadata?.tokens;
  if (!tokens) return null;

  if (tokens.expires_at > Date.now() + 60_000) return tokens.access_token;
  if (!tokens.refresh_token) return null;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: tokens.refresh_token,
      client_id: env.GOOGLE_CLIENT_ID ?? "",
      client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token"
    })
  });
  const body = (await response.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
  if (!response.ok || !body.access_token) return null;

  const refreshed: GoogleTokens = {
    access_token: body.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + (body.expires_in ?? 3600) * 1000
  };
  await writeMetadata({ ...metadata, tokens: refreshed }, "CONNECTED");
  return refreshed.access_token;
}

export async function disconnectGoogle(): Promise<void> {
  const metadata = await readMetadata();
  const token = metadata?.tokens?.refresh_token ?? metadata?.tokens?.access_token;
  if (token) {
    await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: "POST" }).catch(() => {});
  }
  await writeMetadata({}, "DISCONNECTED");
}

export async function getGoogleStatus(): Promise<{ configured: boolean; connected: boolean; email?: string }> {
  const metadata = await readMetadata();
  return {
    configured: isGoogleConfigured(),
    connected: Boolean(metadata?.tokens),
    email: metadata?.email
  };
}

/* ------------------------------- api calls ------------------------------- */

async function googleFetch(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; body: unknown }> {
  const token = await getGoogleAccessToken();
  if (!token) return { ok: false, status: 401, body: { error: "Google is not connected." } };
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) }
  });
  return { ok: response.ok, status: response.status, body: await response.json().catch(() => ({})) };
}

/** RFC 2822 message → base64url, the Gmail API's wire format for drafts. */
export function buildRfc822(input: { to: string; subject: string; body: string }): string {
  const message = [
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "MIME-Version: 1.0",
    "",
    input.body
  ].join("\r\n");
  return Buffer.from(message, "utf8").toString("base64url");
}

export async function listRecentEmails(limit = 8, query?: string) {
  const params = new URLSearchParams({ maxResults: String(Math.min(limit, 20)) });
  if (query) params.set("q", query);
  const list = await googleFetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`);
  if (!list.ok) return { ok: false as const, error: describeError(list) };

  const ids = ((list.body as { messages?: Array<{ id: string }> }).messages ?? []).map((m) => m.id);
  const emails = [];
  for (const id of ids) {
    const message = await googleFetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`
    );
    if (!message.ok) continue;
    const payload = message.body as {
      snippet?: string;
      payload?: { headers?: Array<{ name: string; value: string }> };
    };
    const header = (name: string) =>
      payload.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;
    emails.push({
      id,
      from: header("From"),
      subject: header("Subject"),
      date: header("Date"),
      snippet: payload.snippet
    });
  }
  return { ok: true as const, emails };
}

export async function createGmailDraft(input: { to: string; subject: string; body: string }) {
  const result = await googleFetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
    method: "POST",
    body: JSON.stringify({ message: { raw: buildRfc822(input) } })
  });
  if (!result.ok) return { ok: false as const, error: describeError(result) };
  return { ok: true as const, draftId: (result.body as { id?: string }).id };
}

export async function listCalendarEvents(days = 7) {
  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    timeMax: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "15"
  });
  const result = await googleFetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`);
  if (!result.ok) return { ok: false as const, error: describeError(result) };
  const items = ((result.body as { items?: Array<Record<string, unknown>> }).items ?? []).map((event) => ({
    summary: event.summary,
    start: (event.start as { dateTime?: string; date?: string } | undefined)?.dateTime ?? (event.start as { date?: string } | undefined)?.date,
    end: (event.end as { dateTime?: string; date?: string } | undefined)?.dateTime ?? (event.end as { date?: string } | undefined)?.date,
    location: event.location
  }));
  return { ok: true as const, events: items };
}

export async function createCalendarEvent(input: {
  title: string;
  startIso: string;
  endIso: string;
  description?: string;
}) {
  const result = await googleFetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    body: JSON.stringify({
      summary: input.title,
      description: input.description,
      start: { dateTime: input.startIso },
      end: { dateTime: input.endIso }
    })
  });
  if (!result.ok) return { ok: false as const, error: describeError(result) };
  const body = result.body as { id?: string; htmlLink?: string };
  return { ok: true as const, eventId: body.id, link: body.htmlLink };
}

function describeError(result: { status: number; body: unknown }): string {
  const message = (result.body as { error?: { message?: string } }).error?.message;
  return message || `Google API error (${result.status})`;
}
