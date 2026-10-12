import type { DemoAudio } from './mode'

/*
 * The voice recorder's microphone, for the /demo page: a quiet tone from Web Audio stands in
 * for the stream (it only needs to be recordable), and the visualiser gets speech-like levels
 * computed from the clock, since an audio context started without a click stays silent.
 */
export const demoAudio: DemoAudio = {
  createStream() {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const context = new AudioContextClass()
    const destination = context.createMediaStreamDestination()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = 160
    gain.gain.value = 0.02
    oscillator.connect(gain).connect(destination)
    oscillator.start()

    // The recorder stops the track when it's done; take the audio graph down with it
    const [track] = destination.stream.getAudioTracks()
    const stopTrack = track.stop.bind(track)
    track.stop = () => {
      stopTrack()
      oscillator.stop()
      void context.close()
    }
    return destination.stream
  },

  levels(time, bars) {
    const t = time / 1000
    // Syllables: a fast envelope inside a slower phrase envelope
    const phrase = 0.55 + 0.45 * Math.sin(t * 1.3 + 0.6)
    const syllable = Math.abs(Math.sin(t * 6.1)) * 0.75 + 0.25
    const out = new Uint8Array(bars)
    for (let i = 0; i < bars; i++) {
      // Voices carry most energy in the lower part of the range
      const shape = Math.exp(-((i - bars * 0.3) ** 2) / (2 * (bars * 0.25) ** 2))
      const flicker = 0.7 + 0.3 * Math.sin(t * 17 + i * 1.9)
      out[i] = Math.min(255, Math.round(255 * phrase * syllable * shape * flicker))
    }
    return out
  },
}
