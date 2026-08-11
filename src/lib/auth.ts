import { isAuthEnabled, readSessionCookie, verifySessionToken } from "@/lib/session";
import { verifyExtensionAuth } from "@/lib/extension-auth";

/**
 * Guard for sensitive API routes (node runtime — may touch the database):
 * a valid operator session cookie OR the companion/bridge pairing token.
 * With auth disabled, everything stays open — pre-auth behavior, unchanged.
 */
export async function requireOperator(request: Request): Promise<boolean> {
  if (!isAuthEnabled()) return true;
  if (await verifySessionToken(readSessionCookie(request))) return true;
  return verifyExtensionAuth(request);
}
