export type TranscriptionEngine = 'gemini' | 'local-en' | 'local-multi'

export interface TranscriptionConfig {
  engine?: TranscriptionEngine // undefined = never chosen → show first-run prompt
  geminiKey?: string           // device-only
}

const STORAGE_KEY = 'cleartab-transcription-config'
const ENGINES: TranscriptionEngine[] = ['gemini', 'local-en', 'local-multi']
const KEY_PATTERN = /^[A-Za-z0-9_-]{20,}$/

export function isValidGeminiKey(key: string | undefined | null): key is string {
  return typeof key === 'string' && KEY_PATTERN.test(key.trim())
}

// Accepts either the new shape or any legacy shape and returns the new shape.
export function migrateStoredConfig(value: unknown): TranscriptionConfig {
  if (typeof value !== 'object' || value === null) return {}
  const v = value as Record<string, unknown>
  if (typeof v.engine === 'string' && ENGINES.includes(v.engine as TranscriptionEngine)) {
    const out: TranscriptionConfig = { engine: v.engine as TranscriptionEngine }
    if (typeof v.geminiKey === 'string') out.geminiKey = v.geminiKey
    return out
  }
  // Legacy modes: byok+key → gemini; builtin/proxy/anything else → unset (first-run prompt).
  if (v.mode === 'byok' && typeof v.geminiKey === 'string') {
    return { engine: 'gemini', geminiKey: v.geminiKey }
  }
  return {}
}

type ChromeLocal = {
  get(keys: string | string[]): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
}
function chromeLocal(): ChromeLocal | null {
  const chrome = (globalThis as unknown as { chrome?: { storage?: { local?: ChromeLocal } } }).chrome
  return chrome?.storage?.local ?? null
}

export async function getTranscriptionConfig(): Promise<TranscriptionConfig> {
  const local = chromeLocal()
  if (local) {
    try {
      const stored = (await local.get(STORAGE_KEY))?.[STORAGE_KEY]
      if (stored) return migrateStoredConfig(stored)
    } catch { /* fall through */ }
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) return migrateStoredConfig(JSON.parse(raw))
    } catch { /* ignore */ }
  }
  return {}
}

export async function setTranscriptionConfig(config: TranscriptionConfig): Promise<void> {
  const clean: TranscriptionConfig = {}
  if (config.engine) clean.engine = config.engine
  if (config.geminiKey && isValidGeminiKey(config.geminiKey)) clean.geminiKey = config.geminiKey.trim()

  const local = chromeLocal()
  if (local) {
    try { await local.set({ [STORAGE_KEY]: clean }) } catch { /* ignore */ }
  }
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean)) } catch { /* ignore */ }
  }
}
