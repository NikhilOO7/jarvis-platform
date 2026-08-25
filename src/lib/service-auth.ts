import { timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import { getExtensionToken } from "@/lib/extension-auth";
import { hasSecureServiceToken } from "@/lib/credential-policy";

export type ServiceScope =
  | "capture:write"
  | "memory:ask"
  | "media:write"
  | "health:read"
  | "command:write"
  | "approvals:read"
  | "approvals:write"
  | "runs:read"
  | "runs:execute"
  | "runs:claim"
  | "briefing:read"
  | "briefing:run";

type ServiceCredential = {
  name: "extension" | "telegram" | "worker" | "cron";
  token: string | null | undefined;
  scopes: readonly ServiceScope[];
};

const SERVICE_SCOPES = {
  extension: ["capture:write", "memory:ask", "media:write", "health:read"],
  telegram: [
    "capture:write",
    "memory:ask",
    "health:read",
    "command:write",
    "approvals:write",
    "runs:read",
    "briefing:run"
  ],
  worker: ["health:read", "runs:claim"],
  cron: ["health:read", "briefing:run"]
} as const satisfies Record<ServiceCredential["name"], readonly ServiceScope[]>;

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() || null : null;
}

function tokensEqual(expected: string | null | undefined, provided: string): boolean {
  if (!hasSecureServiceToken(expected)) return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

async function credentials(): Promise<ServiceCredential[]> {
  return [
    { name: "extension", token: await getExtensionToken(), scopes: SERVICE_SCOPES.extension },
    { name: "telegram", token: env.JARVIS_TELEGRAM_TOKEN, scopes: SERVICE_SCOPES.telegram },
    { name: "worker", token: env.JARVIS_WORKER_TOKEN, scopes: SERVICE_SCOPES.worker },
    { name: "cron", token: env.JARVIS_CRON_TOKEN, scopes: SERVICE_SCOPES.cron }
  ];
}

export async function getServiceIdentity(request: Request): Promise<{
  name: ServiceCredential["name"];
  scopes: readonly ServiceScope[];
} | null> {
  const provided = bearerToken(request);
  if (!provided) return null;

  const matches = (await credentials()).filter((credential) => tokensEqual(credential.token, provided));
  if (matches.length !== 1) return null;
  return { name: matches[0].name, scopes: matches[0].scopes };
}

export async function requireServiceScope(request: Request, scope: ServiceScope): Promise<boolean> {
  const identity = await getServiceIdentity(request);
  return Boolean(identity?.scopes.includes(scope));
}
