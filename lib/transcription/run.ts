import type { TranscriptionEngine } from '@/lib/transcription-config'
import type { LocalProgress } from './local'

export interface RunTranscriptionArgs {
  blob: Blob
  engine: TranscriptionEngine
  geminiKey?: string
  endpoint?: string // default '/api/transcribe'
  fetchImpl?: typeof fetch
  onProgress?: (p: LocalProgress) => void
  onComplete: (text: string) => void | Promise<void>
  onError: (message: string) => void
}

export async function runTranscription(args: RunTranscriptionArgs): Promise<void> {
  const { blob, engine, geminiKey, onComplete, onError, onProgress } = args
  const endpoint = args.endpoint ?? '/api/transcribe'
  try {
    if (engine === 'local-en' || engine === 'local-multi') {
      // Dynamic import: local.ts pulls in transformers.js / onnxruntime and has
      // import-time side effects, so only load it when a local engine is used.
      const { transcribeLocal } = await import('./local')
      const { text } = await transcribeLocal(blob, { model: engine, onProgress })
      await onComplete(text)
      return
    }
    // gemini
    if (!geminiKey) {
      onError('Add your Gemini API key to use cloud transcription.')
      return
    }
    const doFetch = args.fetchImpl ?? fetch
    const form = new FormData()
    form.append('audio', blob, `recording-${Date.now()}.webm`)
    const res = await doFetch(endpoint, {
      method: 'POST',
      headers: { 'x-user-gemini-key': geminiKey },
      body: form,
    })
    if (!res.ok) {
      onError(res.status === 401
        ? 'Your Gemini API key was rejected. Check it in Settings → Transcription.'
        : `Transcription failed: ${res.statusText}`)
      return
    }
    const result = await res.json()
    if (result?.success && typeof result.data?.text === 'string') await onComplete(result.data.text)
    else onError(result?.error || 'Failed to transcribe audio')
  } catch (e) {
    onError(e instanceof Error ? e.message : 'Failed to transcribe audio')
  }
}
