import { randomBytes } from "crypto";

/*
 * CSRF protection for the Google "add account" OAuth flow.
 *
 * When we send the user to Google we plant a random one-time value (a nonce) in an
 * httpOnly cookie AND echo it inside the OAuth `state`. When Google redirects back to
 * our callback we require the two to match. A forged callback (an attacker trying to
 * link their Google account into a logged-in victim's session) can't produce a request
 * that carries the victim's browser cookie matching the state, so it's rejected.
 *
 * sameSite:'lax' is required: the return trip from Google is a top-level GET navigation,
 * and 'lax' lets the cookie ride along with it (a 'strict' cookie would be withheld).
 */

export const OAUTH_STATE_COOKIE = "ct_oauth_state";
const MAX_AGE_SECONDS = 600; // 10 minutes to complete the consent screen

export function newOAuthNonce(): string {
  return randomBytes(32).toString("hex");
}

export const oauthStateCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

/** True when the nonce returned in `state` matches the one stored in the cookie. */
export function oauthNonceMatches(
  stateNonce: unknown,
  cookieNonce: string | undefined,
): boolean {
  return (
    typeof stateNonce === "string" &&
    stateNonce.length > 0 &&
    typeof cookieNonce === "string" &&
    cookieNonce.length > 0 &&
    stateNonce === cookieNonce
  );
}
