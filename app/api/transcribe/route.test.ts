import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/auth/api-session', () => ({
  getApiSession: vi.fn().mockResolvedValue({ user: { id: 'u1' } }),
}))

import { POST } from './route'

const VALID_KEY = 'abcdefghijklmnopqrstuvwxyz'

function req(headers: Record<string, string>, withAudio = true) {
  const form = new FormData()
  if (withAudio) form.append('audio', new Blob([new Uint8Array([1])], { type: 'audio/webm' }), 'r.webm')
  return new Request('http://localhost/api/transcribe', { method: 'POST', headers, body: form }) as never
}

describe('POST /api/transcribe', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.restoreAllMocks()
    // Never let a test reach generativelanguage.googleapis.com.
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('400s when no user key is supplied (no server fallback)', async () => {
    const res = await POST(req({}))
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('400s on a malformed key', async () => {
    const res = await POST(req({ 'x-user-gemini-key': 'nope' }))
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('401s when Google rejects a well-formed user key (400 from Google)', async () => {
    fetchMock.mockResolvedValue(new Response('{"error":"bad key"}', { status: 400 }))
    const res = await POST(req({ 'x-user-gemini-key': VALID_KEY }))
    expect(res.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns the transcribed text on success', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: ' hello there ' }] } }] }),
        { status: 200 },
      ),
    )
    const res = await POST(req({ 'x-user-gemini-key': VALID_KEY }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, data: { text: 'hello there' } })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
