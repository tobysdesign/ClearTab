import { createHash, randomBytes } from "crypto";
import { and, eq, lt } from "drizzle-orm";
import { dbMinimal } from "@/lib/db-minimal";
import { extensionTokens, user } from "@/shared/schema-tables";

/*
 * Bearer tokens for the Chrome extension.
 *
 * The extension runs on chrome-extension://<id>, so it never has the web session cookie.
 * After a normal Google sign-in, /api/extension/authorize gives it an opaque random token
 * instead. Only the token's SHA-256 hash is stored. Expiry slides: using a token (checked at
 * most hourly) pushes its expiry out again, so an extension in daily use stays signed in
 * and an idle one signs out after TOKEN_TTL_MS. Signing out deletes the row.
 */

const TOKEN_PREFIX = "cte_";
const TOKEN_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const TOUCH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export type ExtensionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

type ExtensionTokenRow = typeof extensionTokens.$inferInsert;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// Our tokens are recognisable, so other bearer values (like the old api-client's random
// session id) can be ignored instead of failing the request
export function isExtensionToken(value: string) {
  return value.startsWith(TOKEN_PREFIX);
}

export async function createExtensionToken(userId: string, extensionId: string) {
  const token = TOKEN_PREFIX + randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  // Expired rows are dead weight; clear this user's while we're here
  await dbMinimal
    .delete(extensionTokens)
    .where(and(eq(extensionTokens.userId, userId), lt(extensionTokens.expiresAt, new Date())));
  // Casts: with strict off, drizzle's insert/update types drop the columns that have defaults
  await dbMinimal.insert(extensionTokens).values({
    userId,
    extensionId,
    tokenHash: hashToken(token),
    lastUsedAt: new Date(),
    expiresAt,
  } as ExtensionTokenRow);

  return { token, expiresAt };
}

export async function verifyExtensionToken(
  token: string,
): Promise<{ user: ExtensionUser; expiresAt: Date } | null> {
  if (!isExtensionToken(token)) return null;

  // Joining on user also means a deleted account's tokens stop working at once
  const [row] = await dbMinimal
    .select({
      id: extensionTokens.id,
      expiresAt: extensionTokens.expiresAt,
      lastUsedAt: extensionTokens.lastUsedAt,
      user: { id: user.id, email: user.email, name: user.name, image: user.image },
    })
    .from(extensionTokens)
    .innerJoin(user, eq(user.id, extensionTokens.userId))
    .where(eq(extensionTokens.tokenHash, hashToken(token)))
    .limit(1);

  const now = Date.now();
  if (!row || row.expiresAt.getTime() <= now) return null;

  let expiresAt = row.expiresAt;
  if (now - row.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
    expiresAt = new Date(now + TOKEN_TTL_MS);
    try {
      await dbMinimal
        .update(extensionTokens)
        .set({ lastUsedAt: new Date(now), expiresAt } as Partial<ExtensionTokenRow>)
        .where(eq(extensionTokens.id, row.id));
    } catch (error) {
      // Not fatal: the token just keeps its old expiry
      console.error("Extension token touch failed:", error);
      expiresAt = row.expiresAt;
    }
  }

  return { user: row.user, expiresAt };
}

export async function revokeExtensionToken(token: string) {
  if (!isExtensionToken(token)) return;
  await dbMinimal.delete(extensionTokens).where(eq(extensionTokens.tokenHash, hashToken(token)));
}

const EXTENSION_ID = /^[a-p]{32}$/;

// EXTENSION_IDS: comma-separated Chrome extension ids allowed to sign in (the Web Store
// id, plus the unpacked dev build's id where wanted). Empty means none: fail closed.
export function allowedExtensionIds() {
  return (process.env.EXTENSION_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => EXTENSION_ID.test(id));
}

// The extension's redirect URL is chrome.identity.getRedirectURL(): https://<id>.chromiumapp.org/.
// Chrome only hands that URL back to the extension with that id, so it's a safe place to send
// a token, provided the id is one of ours.
export function parseExtensionRedirect(raw: string | null) {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const extensionId = url.hostname.match(/^([a-p]{32})\.chromiumapp\.org$/)?.[1];
  if (url.protocol !== "https:" || url.port || url.username || url.password || url.hash) return null;
  if (!extensionId || !allowedExtensionIds().includes(extensionId)) return null;
  return { url, extensionId };
}
