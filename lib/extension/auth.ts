import { API_BASE_URL } from "@/lib/platform";

/*
 * Chrome extension sign-in.
 *
 * The extension can't share the website's session cookie, so it signs in through
 * chrome.identity.launchWebAuthFlow -> /api/extension/authorize (a normal Google sign-in on
 * the website), which hands back an opaque bearer token. The token and the signed-in user are
 * kept in chrome.storage.local: this device only (never storage.sync), and shared by every
 * open new tab, so signing in or out in one updates the others.
 */

export type ExtensionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

export type StoredAuth = {
  token: string;
  expiresAt: string;
  user: ExtensionUser;
};

type StorageChange = { newValue?: unknown };
type StorageListener = (changes: Record<string, StorageChange>, areaName: string) => void;

// The few chrome.* APIs used here (no @types/chrome in this project)
type ChromeApi = {
  identity?: {
    getRedirectURL(path?: string): string;
    launchWebAuthFlow(details: { url: string; interactive: boolean }): Promise<string | undefined>;
  };
  storage?: {
    local: {
      get(key: string): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
      remove(key: string): Promise<void>;
    };
    onChanged: {
      addListener(listener: StorageListener): void;
      removeListener(listener: StorageListener): void;
    };
  };
};

const STORAGE_KEY = "cleartab-auth";

const chromeApi = () => (globalThis as unknown as { chrome?: ChromeApi }).chrome;

export const isStoredAuth = (value: unknown): value is StoredAuth =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as StoredAuth).token === "string" &&
  typeof (value as StoredAuth).user?.id === "string";

export function readLocalStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isStoredAuth(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Seed cached from localStorage synchronously so frame-0 callers get it without waiting on async chrome.storage
let cached: StoredAuth | null | undefined = typeof window !== "undefined" ? (readLocalStoredAuth() ?? undefined) : undefined;

export async function getStoredAuth(): Promise<StoredAuth | null> {
  if (cached !== undefined) return cached;
  const stored = (await chromeApi()?.storage?.local.get(STORAGE_KEY))?.[STORAGE_KEY];
  cached = isStoredAuth(stored) ? stored : null;
  if (cached && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    } catch {}
  }
  return cached;
}

async function setStoredAuth(auth: StoredAuth | null) {
  cached = auth;
  if (typeof window !== "undefined") {
    try {
      if (auth) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
  const storage = chromeApi()?.storage?.local;
  if (!storage) return;
  if (auth) await storage.set({ [STORAGE_KEY]: auth });
  else await storage.remove(STORAGE_KEY);
}

// Forget the token, unless another sign-in has replaced it since it was checked
async function clearStoredAuth(token: string) {
  const current = await getStoredAuth();
  if (current?.token === token) await setStoredAuth(null);
}

// Fires when any extension page signs in or out (including this one)
export function onStoredAuthChange(listener: (auth: StoredAuth | null) => void) {
  const events = chromeApi()?.storage?.onChanged;
  if (!events) return () => {};
  const handle: StorageListener = (changes, areaName) => {
    if (areaName !== "local" || !(STORAGE_KEY in changes)) return;
    const next = changes[STORAGE_KEY].newValue;
    cached = isStoredAuth(next) ? next : null;
    if (typeof window !== "undefined") {
      try {
        if (cached) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
        else window.localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    listener(cached);
  };
  events.addListener(handle);
  return () => events.removeListener(handle);
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

async function fetchUser(token: string): Promise<{ user: ExtensionUser; expires: string } | null> {
  // credentials: "omit": the token is the only identity; never send or pick up website cookies
  const response = await fetch(`${API_BASE_URL}/api/extension/session`, {
    headers: bearer(token),
    credentials: "omit",
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Session check failed (${response.status})`);
  return response.json();
}

// Checks the stored token with the server and refreshes the stored user. Returns null (and
// signs out) if the token has been revoked or expired. Throws if the server can't be reached,
// so callers can keep showing the cached user while offline.
export async function verifyStoredAuth(): Promise<StoredAuth | null> {
  const auth = await getStoredAuth();
  if (!auth) return null;
  const session = await fetchUser(auth.token);
  if (!session) {
    await clearStoredAuth(auth.token);
    return null;
  }
  const next = { token: auth.token, expiresAt: session.expires, user: session.user };
  // Only write when something changed: every write wakes the other open tabs
  if (JSON.stringify(next) !== JSON.stringify(auth)) await setStoredAuth(next);
  return next;
}

let pendingCheck: Promise<unknown> | null = null;

// fetch() for our API with the extension's token. A 401 might just be one route's answer, so
// it triggers a single shared session check, which signs out only if the token is really dead.
export async function authorizedFetch(url: string, init: RequestInit = {}) {
  const auth = await getStoredAuth();
  const headers = new Headers(init.headers);
  if (auth) headers.set("Authorization", `Bearer ${auth.token}`);
  const response = await fetch(url, { ...init, headers, credentials: "omit" });
  if (response.status === 401 && auth && !pendingCheck) {
    pendingCheck = verifyStoredAuth()
      .catch(() => null)
      .finally(() => {
        pendingCheck = null;
      });
  }
  return response;
}

export class SignInCancelled extends Error {}

const SIGN_IN_ERRORS: Record<string, string> = {
  login_failed: "Google sign-in didn't complete. Please try again.",
  server_error: "ClearTab couldn't sign you in just now. Please try again.",
};

function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Opens the ClearTab sign-in window. fresh: always go through Google (switch account,
// reauthorise the calendar) instead of reusing a website session the window already has.
export async function signInWithBrowser({ fresh = false }: { fresh?: boolean } = {}) {
  const identity = chromeApi()?.identity;
  if (!identity) throw new Error("Signing in needs the ClearTab Chrome extension.");

  const state = randomState();
  const url = new URL(`${API_BASE_URL}/api/extension/authorize`);
  url.searchParams.set("redirect_uri", identity.getRedirectURL());
  url.searchParams.set("state", state);
  if (fresh) url.searchParams.set("prompt", "login");

  let responseUrl: string | undefined;
  try {
    responseUrl = await identity.launchWebAuthFlow({ url: url.toString(), interactive: true });
  } catch (error) {
    // Chrome rejects when the window is closed ("The user did not approve access.")
    throw new SignInCancelled(error instanceof Error ? error.message : String(error));
  }
  if (!responseUrl) throw new SignInCancelled("No response from the sign-in window");

  const result = new URLSearchParams(new URL(responseUrl).hash.slice(1));
  if (result.get("state") !== state) throw new Error("Sign-in failed. Please try again.");
  const error = result.get("error");
  if (error) throw new Error(SIGN_IN_ERRORS[error] ?? SIGN_IN_ERRORS.server_error);

  const token = result.get("token");
  if (!token) throw new Error(SIGN_IN_ERRORS.server_error);
  const session = await fetchUser(token);
  if (!session) throw new Error(SIGN_IN_ERRORS.server_error);

  await setStoredAuth({ token, expiresAt: session.expires, user: session.user });
  return session.user;
}

export async function signOutExtension() {
  const auth = await getStoredAuth();
  await setStoredAuth(null);
  if (!auth) return;
  // Best effort: if this fails the token still expires on its own
  await fetch(`${API_BASE_URL}/api/extension/revoke`, {
    method: "POST",
    headers: bearer(auth.token),
    credentials: "omit",
  }).catch(() => {});
}
