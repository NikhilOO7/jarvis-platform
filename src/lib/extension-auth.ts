import { randomBytes } from "crypto";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { hasSecureServiceToken } from "@/lib/credential-policy";

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
  if (hasSecureServiceToken(env.JARVIS_EXTENSION_TOKEN)) return env.JARVIS_EXTENSION_TOKEN;
  const stored = await readStoredToken();
  return hasSecureServiceToken(stored) ? stored : null;
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
