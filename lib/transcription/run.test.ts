import { describe, it, expect, vi } from 'vitest'

const transcribeLocal = vi.fn()
vi.mock('./local', () => ({ transcribeLocal: (...a: unknown[]) => transcribeLocal(...a) }))

import { runTranscription } from './run'

describe('runTranscription routing', () => {
  it('uses the local engine for local-multi', async () => {
    transcribeLocal.mockResolvedValue({ text: 'hi' })
    const onComplete = vi.fn()
    await runTranscription({
      blob: new Blob([new Uint8Array([0])]),
      engine: 'local-multi',
      fetchImpl: vi.fn(),
      onComplete,
      onError: vi.fn(),
    })
    expect(transcribeLocal).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ model: 'local-multi' }))
    expect(onComplete).toHaveBeenCalledWith('hi')
  })

  it('treats an empty gemini transcript as a completed result, not a failure', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { text: '' } }), { status: 200 }),
    )
    const onComplete = vi.fn()
    const onError = vi.fn()
    await runTranscription({
      blob: new Blob([new Uint8Array([0])]),
      engine: 'gemini',
      geminiKey: 'AIzaSyA_1234567890abcdefg',
      fetchImpl,
      onComplete,
      onError,
    })
    expect(onComplete).toHaveBeenCalledWith('')
    expect(onError).not.toHaveBeenCalled()
  })

  it('POSTs to /api/transcribe with the key header for gemini', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { text: 'cloud' } }), { status: 200 }),
    )
    const onComplete = vi.fn()
    await runTranscription({
      blob: new Blob([new Uint8Array([0])]),
      engine: 'gemini',
      geminiKey: 'AIzaSyA_1234567890abcdefg',
      fetchImpl,
      onComplete,
      onError: vi.fn(),
    })
    const [, init] = fetchImpl.mock.calls[0]
    expect((init.headers as Record<string, string>)['x-user-gemini-key']).toBe('AIzaSyA_1234567890abcdefg')
    expect(onComplete).toHaveBeenCalledWith('cloud')
  })

  it('errors for gemini with no key', async () => {
    const onError = vi.fn()
    await runTranscription({
      blob: new Blob([new Uint8Array([0])]),
      engine: 'gemini',
      fetchImpl: vi.fn(),
      onComplete: vi.fn(),
      onError,
    })
    expect(onError).toHaveBeenCalled()
  })
})
