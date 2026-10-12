import { headers } from "next/headers";
import { bearerToken } from "@/lib/auth/api-session";
import { revokeExtensionToken } from "@/lib/auth/extension-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Extension sign-out: deletes the token the request carries. Idempotent.
export async function POST() {
  const token = bearerToken(await headers());
  if (token) await revokeExtensionToken(token);
  return new Response(null, { status: 204 });
}
