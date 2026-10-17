import { describe, it, expect, vi, beforeEach } from 'vitest'

// vitest's node env has no AudioContext; stub decoding before importing the module.
;(globalThis as unknown as { AudioContext: unknown }).AudioContext = class {
  constructor() {}
  async decodeAudioData() {
    return { getChannelData: () => new Float32Array(1) }
  }
  async close() {}
}

// Mock the heavy ML dep so tests never download a model.
const pipelineMock = vi.fn()
vi.mock('@huggingface/transformers', () => ({
  pipeline: (...args: unknown[]) => pipelineMock(...args),
  env: { backends: { onnx: { wasm: {} } }, allowLocalModels: false },
}))

import { MODEL_IDS, transcribeLocal } from './local'

describe('local transcription engine', () => {
  beforeEach(() => pipelineMock.mockReset())

  it('maps engine ids to the correct HF model ids', () => {
    expect(MODEL_IDS['local-en']).toBe('onnx-community/whisper-tiny.en')
    expect(MODEL_IDS['local-multi']).toBe('onnx-community/whisper-base')
  })

  it('loads the pipeline for the chosen model and returns its text', async () => {
    const asr = vi.fn().mockResolvedValue({ text: ' hello world ' })
    pipelineMock.mockResolvedValue(asr)
    const blob = new Blob([new Uint8Array([0])], { type: 'audio/webm' })
    const out = await transcribeLocal(blob, { model: 'local-en' })
    expect(pipelineMock).toHaveBeenCalledWith(
      'automatic-speech-recognition',
      'onnx-community/whisper-tiny.en',
      expect.objectContaining({ dtype: 'q8' }),
    )
    expect(out.text).toBe('hello world')
  })
})
