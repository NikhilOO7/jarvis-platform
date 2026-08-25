import { isAuthEnabled, readSessionCookie, verifySessionToken } from "@/lib/session";
import { requireServiceScope, type ServiceScope } from "@/lib/service-auth";

export function hasValidBrowserOrigin(request: Request): boolean {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

/**
 * Browser/operator guard. Service credentials are deliberately not accepted
 * here: callers such as the extension, Telegram, cron, and worker must pass a
 * narrowly-scoped check through authorizeRequest or requireServiceScope.
 */
export async function requireOperator(request: Request): Promise<boolean> {
  if (!hasValidBrowserOrigin(request)) return false;
  if (!isAuthEnabled()) return true;
  return verifySessionToken(readSessionCookie(request));
}

/** Operator session/open-local mode OR a service credential with this scope. */
export async function authorizeRequest(request: Request, scope: ServiceScope): Promise<boolean> {
  if (await requireOperator(request)) return true;
  return requireServiceScope(request, scope);
}
