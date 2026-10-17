import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers'

export type LocalModel = 'local-en' | 'local-multi'

export const MODEL_IDS: Record<LocalModel, string> = {
  'local-en': 'Xenova/whisper-tiny.en',
  'local-multi': 'Xenova/whisper-base',
}

export type LocalProgress =
  | { stage: 'download'; ratio: number }
  | { stage: 'transcribe' }

// In the extension (MV3) the ORT wasm files can't be fetched from a CDN; serve them from /wasm/.
// public/ is carried into the static export, so this path works in web and extension builds.
env.backends.onnx.wasm.wasmPaths = '/wasm/'
env.allowLocalModels = false // model weights come from the HF hub, cached by the browser

const pipelineCache = new Map<LocalModel, Promise<AutomaticSpeechRecognitionPipeline>>()

async function getPipeline(model: LocalModel, onProgress?: (p: LocalProgress) => void) {
  let cached = pipelineCache.get(model)
  if (!cached) {
    // CPU (wasm) EP: Whisper on the WebGPU EP with q8 weights currently produces
    // garbage / looping output in onnxruntime-web, so run on CPU for correct
    // transcripts. The bundled jsep wasm includes the CPU kernels, so no extra
    // file is needed. (Revisit WebGPU later with per-module fp16/q4 dtypes.)
    cached = pipeline('automatic-speech-recognition', MODEL_IDS[model], {
      device: 'wasm',
      dtype: 'q8',
      progress_callback: (e: { status?: string; progress?: number }) => {
        if (e.status === 'progress' && typeof e.progress === 'number') {
          onProgress?.({ stage: 'download', ratio: e.progress / 100 })
        }
      },
    }) as unknown as Promise<AutomaticSpeechRecognitionPipeline>
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
