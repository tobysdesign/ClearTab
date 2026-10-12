/*
 * Demo mode: the /demo page (shown in iframes on the landing page) runs the real dashboard
 * with sample data. While it's on, apiFetch answers from an in-memory backend and the voice
 * recorder records a synthetic signal instead of the microphone. It's only ever switched on
 * inside the /demo page's own document, so the real app never sees it.
 */

export type DemoApi = (path: string, init?: RequestInit) => Promise<Response>

export interface DemoAudio {
  /** Stands in for getUserMedia's microphone stream */
  createStream: () => MediaStream
  /** Waveform levels (0-255) for the recorder's visualiser */
  levels: (time: number, bars: number) => Uint8Array
}

let demoApi: DemoApi | null = null
let demoAudio: DemoAudio | null = null

export function enableDemoMode(options: { api: DemoApi; audio: DemoAudio }) {
  if (typeof window === 'undefined') return
  demoApi = options.api
  demoAudio = options.audio
}

export const getDemoApi = () => demoApi
export const getDemoAudio = () => demoAudio
