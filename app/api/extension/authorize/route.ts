import { NextRequest, NextResponse } from "next/server";
import { auth, signIn, signOut } from "@/auth";
import { createExtensionToken, parseExtensionRedirect } from "@/lib/auth/extension-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * Chrome extension sign-in, opened by chrome.identity.launchWebAuthFlow:
 *
 *   GET /api/extension/authorize?redirect_uri=https://<id>.chromiumapp.org/&state=<random>[&prompt=login]
 *
 * Signs in on the web as usual (Google via NextAuth), then redirects to redirect_uri with
 * #token=…&expires_at=…&state=… which Chrome hands back to the extension. Failures come
 * back as #error=…&state=…. prompt=login forces a fresh Google sign-in, for switching
 * account or reauthorising the calendar.
 */

const STATE = /^[A-Za-z0-9_-]{16,128}$/;
const NO_STORE = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const target = parseExtensionRedirect(params.get("redirect_uri"));
  const state = params.get("state") ?? "";

  // Never redirect to anything that hasn't been validated
  if (!target || !STATE.test(state)) {
    return new NextResponse("Invalid extension sign-in request", { status: 400, headers: NO_STORE });
  }

  const backToExtension = (values: Record<string, string>) => {
    const url = new URL(target.url);
    url.hash = new URLSearchParams({ ...values, state }).toString();
    return NextResponse.redirect(url, { status: 303, headers: NO_STORE });
  };

  // This route again with some params changed. Relative, so NextAuth's redirect check accepts it.
  const self = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    return `/api/extension/authorize?${next}`;
  };

  const session = await auth();

  if (params.get("prompt") === "login" && session) {
    // Sign the web session out first. Otherwise NextAuth would link whichever Google account
    // is picked next to the current user instead of signing in as it.
    await signOut({ redirect: false });
    return NextResponse.redirect(new URL(self({ prompt: null }), request.url), { status: 303, headers: NO_STORE });
  }

  if (!session?.user?.id) {
    // Been to Google already and still no session: stop rather than loop
    if (params.has("attempt")) return backToExtension({ error: "login_failed" });
    // Throws Next's redirect to Google; must not be caught
    await signIn("google", { redirectTo: self({ prompt: null, attempt: "1" }) });
    return backToExtension({ error: "login_failed" });
  }

  try {
    const { token, expiresAt } = await createExtensionToken(session.user.id, target.extensionId);
    return backToExtension({ token, expires_at: expiresAt.toISOString() });
  } catch (error) {
    console.error("Extension sign-in failed:", error);
    return backToExtension({ error: "server_error" });
  }
}
