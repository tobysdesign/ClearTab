import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/api-session', () => ({
  getApiSession: vi.fn().mockResolvedValue({ user: { id: 'u1' } }),
}))

import { POST } from './route'

function req(headers: Record<string, string>, withAudio = true) {
  const form = new FormData()
  if (withAudio) form.append('audio', new Blob([new Uint8Array([1])], { type: 'audio/webm' }), 'r.webm')
  return new Request('http://localhost/api/transcribe', { method: 'POST', headers, body: form }) as never
}

describe('POST /api/transcribe', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('400s when no user key is supplied (no server fallback)', async () => {
    const res = await POST(req({}))
    expect(res.status).toBe(400)
  })

  it('400s on a malformed key', async () => {
    const res = await POST(req({ 'x-user-gemini-key': 'nope' }))
    expect(res.status).toBe(400)
  })
})
