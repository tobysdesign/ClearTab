import { describe, it, expect, beforeEach, vi } from 'vitest'
import { migrateStoredConfig, isValidGeminiKey } from './transcription-config'

describe('transcription config migration', () => {
  it('maps legacy byok + key to gemini engine', () => {
    expect(migrateStoredConfig({ mode: 'byok', geminiKey: 'AIza1234567890abcdefg' }))
      .toEqual({ engine: 'gemini', geminiKey: 'AIza1234567890abcdefg' })
  })
  it('maps legacy builtin to an unset engine (forces first-run prompt)', () => {
    expect(migrateStoredConfig({ mode: 'builtin' })).toEqual({})
  })
  it('drops legacy proxy settings to an unset engine', () => {
    expect(migrateStoredConfig({ mode: 'proxy', proxyUrl: 'https://x.example' })).toEqual({})
  })
  it('passes through a new-shape engine config untouched', () => {
    expect(migrateStoredConfig({ engine: 'local-multi' })).toEqual({ engine: 'local-multi' })
  })
})

describe('key validation', () => {
  it('accepts a plausible key and rejects junk', () => {
    expect(isValidGeminiKey('AIzaSyA_1234567890abcdefg')).toBe(true)
    expect(isValidGeminiKey('short')).toBe(false)
  })
})
