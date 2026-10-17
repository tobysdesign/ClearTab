import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers'

export type LocalModel = 'local-en' | 'local-multi'

export const MODEL_IDS: Record<LocalModel, string> = {
  'local-en': 'onnx-community/whisper-tiny.en',
  'local-multi': 'onnx-community/whisper-base',
}

export type LocalProgress =
  | { stage: 'download'; ratio: number }
  | { stage: 'transcribe' }

// In the extension (MV3) the ORT wasm files can't be fetched from a CDN; serve them from /wasm/.
// public/ is carried into the static export, so this path works in web and extension builds.
env.backends.onnx.wasm.wasmPaths = '/wasm/'
env.allowLocalModels = false // model weights come from the HF hub, cached by the browser
// Silence ORT's informational/warning spam (e.g. "node not assigned to preferred
// EP"), which is harmless but Next surfaces as errors. Real errors still log.
;(env.backends.onnx as unknown as { logLevel?: string }).logLevel = 'error'

const pipelineCache = new Map<LocalModel, Promise<AutomaticSpeechRecognitionPipeline>>()

async function hasWebGPU(): Promise<boolean> {
  const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
  if (!gpu) return false
  try {
    return !!(await gpu.requestAdapter())
  } catch {
    return false
  }
}

function loadPipeline(
  model: LocalModel,
  device: 'webgpu' | 'wasm',
  onProgress?: (p: LocalProgress) => void,
) {
  // WebGPU: fp32 encoder + q4 decoder is the safe combo. (q8 on WebGPU garbles,
  // and fp16 is unreliable on Apple Silicon's Metal backend — fp32 works across
  // GPUs.) CPU (wasm): q8.
  const dtype =
    device === 'webgpu'
      ? { encoder_model: 'fp32' as const, decoder_model_merged: 'q4' as const }
      : ('q8' as const)
  return pipeline('automatic-speech-recognition', MODEL_IDS[model], {
    device,
    // transformers.js accepts a per-module dtype map; the typings are narrower.
    dtype: dtype as unknown as 'q8',
    progress_callback: (e: { status?: string; progress?: number }) => {
      if (e.status === 'progress' && typeof e.progress === 'number') {
        onProgress?.({ stage: 'download', ratio: e.progress / 100 })
      }
    },
  }) as unknown as Promise<AutomaticSpeechRecognitionPipeline>
}

async function getPipeline(model: LocalModel, onProgress?: (p: LocalProgress) => void) {
  let cached = pipelineCache.get(model)
  if (!cached) {
    cached = (async () => {
      const device = (await hasWebGPU()) ? 'webgpu' : 'wasm'
      try {
        return await loadPipeline(model, device, onProgress)
      } catch (err) {
        if (device === 'webgpu') {
          // WebGPU unavailable, or the fp16/q4 variant is missing for this model:
          // fall back to the CPU (wasm) EP with q8, which always works.
          console.warn('WebGPU Whisper load failed; falling back to CPU (wasm):', err)
          return await loadPipeline(model, 'wasm', onProgress)
        }
        throw err
      }
    })()
    pipelineCache.set(model, cached)
    // Don't cache a failed load; allow retry.
    cached.catch(() => pipelineCache.delete(model))
  }
  return cached
}

async function blobToFloat32(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer()
  const AudioCtx =
    (globalThis as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
    (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  const ctx = new AudioCtx!({ sampleRate: 16000 })
  const decoded = await ctx.decodeAudioData(arrayBuffer)
  const channel = decoded.getChannelData(0)
  await ctx.close()
  return channel
}

export async function transcribeLocal(
  blob: Blob,
  opts: { model: LocalModel; onProgress?: (p: LocalProgress) => void },
): Promise<{ text: string }> {
  // e2e hook: skip the model download entirely and return a canned transcript
  if ((globalThis as unknown as { __CLEARTAB_FAKE_LOCAL_ASR__?: boolean }).__CLEARTAB_FAKE_LOCAL_ASR__) {
    opts.onProgress?.({ stage: 'transcribe' })
    return { text: 'fake local transcript' }
  }
  const asr = await getPipeline(opts.model, opts.onProgress)
  const audio = await blobToFloat32(blob)
  opts.onProgress?.({ stage: 'transcribe' })
  const result = (await asr(audio, { chunk_length_s: 30, stride_length_s: 5 })) as
    | { text?: string }
    | { text?: string }[]
  const text = Array.isArray(result) ? result.map((r) => r.text).join(' ') : result.text
  return { text: (text ?? '').trim() }
}

export async function isModelCached(model: LocalModel): Promise<boolean> {
  try {
    const cache = await caches.open('transformers-cache')
    const keys = await cache.keys()
    return keys.some((req) => req.url.includes(MODEL_IDS[model]))
  } catch {
    return false
  }
}

export async function clearModelCache(): Promise<void> {
  try {
    await caches.delete('transformers-cache')
  } catch {
    // ignore
  }
  pipelineCache.clear()
}
