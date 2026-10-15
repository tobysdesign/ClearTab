/*
 * Where voice-memo transcription sends its audio, and with whose key.
 *
 * - "builtin"  (default): POST to ClearTab's own /api/transcribe, which uses the server's
 *                         Gemini key. Zero config — this is what every user gets out of the box.
 * - "byok":                POST to /api/transcribe with the user's own Gemini key in the
 *                         `x-user-gemini-key` header; the route uses it instead of the server key.
 * - "proxy":               POST the audio straight to a user-supplied /api/transcribe-compatible
 *                         URL (their own ClearTab server), so the key lives on their machine only.
 *
 * The config is a per-device preference: chrome.storage.local in the extension, localStorage on
 * the web. The BYOK key is sensitive, so it is stored on-device only and never sent to ClearTab
 * except, in BYOK mode, as a request header over HTTPS.
 */

export type TranscriptionMode = "builtin" | "byok" | "proxy";

export interface TranscriptionConfig {
  mode: TranscriptionMode;
  geminiKey?: string;
  proxyUrl?: string;
}

const STORAGE_KEY = "cleartab-transcription-config";
const DEFAULT_CONFIG: TranscriptionConfig = { mode: "builtin" };

// Google API keys are URL-safe tokens; this is a loose shape check, not validation of the key.
const KEY_PATTERN = /^[A-Za-z0-9_-]{20,}$/;

export function isValidGeminiKey(key: string | undefined | null): key is string {
  return typeof key === "string" && KEY_PATTERN.test(key.trim());
}

export function isValidProxyUrl(url: string | undefined | null): url is string {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function isTranscriptionConfig(value: unknown): value is TranscriptionConfig {
  if (typeof value !== "object" || value === null) return false;
  const mode = (value as TranscriptionConfig).mode;
  return mode === "builtin" || mode === "byok" || mode === "proxy";
}

type ChromeLocal = {
  get(keys: string | string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
};

function chromeLocal(): ChromeLocal | null {
  const chrome = (globalThis as unknown as { chrome?: { storage?: { local?: ChromeLocal } } }).chrome;
  return chrome?.storage?.local ?? null;
}

export async function getTranscriptionConfig(): Promise<TranscriptionConfig> {
  // Prefer chrome.storage.local in the extension (device-only), else fall back to localStorage.
  const local = chromeLocal();
  if (local) {
    try {
      const stored = (await local.get(STORAGE_KEY))?.[STORAGE_KEY];
      if (isTranscriptionConfig(stored)) return { ...DEFAULT_CONFIG, ...stored };
    } catch {
      // ignore and try localStorage
    }
  }

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isTranscriptionConfig(parsed)) return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch {
      // ignore
    }
  }

  return { ...DEFAULT_CONFIG };
}

export async function setTranscriptionConfig(config: TranscriptionConfig): Promise<void> {
  // Drop credentials that don't belong to the active mode so we never keep a stale key around.
  const clean: TranscriptionConfig = { mode: config.mode };
  if (config.mode === "byok" && config.geminiKey) clean.geminiKey = config.geminiKey.trim();
  if (config.mode === "proxy" && config.proxyUrl) clean.proxyUrl = config.proxyUrl.trim();

  const local = chromeLocal();
  if (local) {
    try {
      await local.set({ [STORAGE_KEY]: clean });
    } catch {
      // ignore
    }
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch {
      // ignore
    }
  }
}
