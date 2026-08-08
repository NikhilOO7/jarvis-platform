import { randomBytes, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const CONNECTOR_NAME = "browser-extension";

async function readStoredToken(): Promise<string | null> {
  if (!env.DATABASE_URL) return null;
  try {
    const config = await prisma.connectorConfig.findUnique({
      where: { type_name: { type: "STORAGE", name: CONNECTOR_NAME } }
    });
    const metadata = config?.metadata as { token?: string } | null;
    return metadata?.token ?? null;
  } catch {
    return null;
  }
}

/** Current pairing token, without creating one. Env var wins for keyless setups. */
export async function getExtensionToken(): Promise<string | null> {
  if (env.JARVIS_EXTENSION_TOKEN) return env.JARVIS_EXTENSION_TOKEN;
  return readStoredToken();
}

/** Pairing token, minted on first request (settings page calls this). */
export async function ensureExtensionToken(): Promise<string | null> {
  const existing = await getExtensionToken();
  if (existing) return existing;
  if (!env.DATABASE_URL) return null;

  try {
    const token = `jrv_${randomBytes(24).toString("hex")}`;
    await prisma.connectorConfig.upsert({
      where: { type_name: { type: "STORAGE", name: CONNECTOR_NAME } },
      update: { metadata: { token }, enabled: true, status: "PAIRED", connectedAt: new Date() },
      create: {
        type: "STORAGE",
        name: CONNECTOR_NAME,
        enabled: true,
        status: "PAIRED",
        scopes: ["capture"],
        metadata: { token },
        connectedAt: new Date()
      }
    });
    return token;
  } catch {
    return null;
  }
}

/** Constant-time check of the Authorization: Bearer header against the paired token. */
export async function verifyExtensionAuth(request: Request): Promise<boolean> {
  const expected = await getExtensionToken();
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!provided) return false;

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}
