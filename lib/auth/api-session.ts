import { headers } from "next/headers";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { isExtensionToken, verifyExtensionToken } from "./extension-tokens";

/*
 * The signed-in user for an API route: the Chrome extension's bearer token if the request
 * carries one, otherwise the web app's session cookie. Use this instead of auth() in any
 * route the extension calls. Bearer sessions only carry the user (no Google tokens); routes
 * that need those read them from the user row, as /api/calendar does.
 */
export async function getApiSession(): Promise<Session | null> {
  const token = bearerToken(await headers());
  if (token && isExtensionToken(token)) {
    const verified = await verifyExtensionToken(token);
    return verified ? { user: verified.user, expires: verified.expiresAt.toISOString() } : null;
  }
  return auth();
}

export function bearerToken(requestHeaders: Headers) {
  return requestHeaders.get("authorization")?.match(/^Bearer\s+(\S+)\s*$/i)?.[1] ?? null;
}
