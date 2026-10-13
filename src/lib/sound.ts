import { useSyncExternalStore } from 'react'

/**
 * Synthesized sound effects plus haptics for a flight. Everything is generated
 * with Web Audio, so there are no audio files to load, and sounds start
 * instantly on phones. One toggle covers both sound and vibration.
 *
 * The kit stays in one key (C major pentatonic). A right answer fires the
 * engine for as long as the ship climbs, and a streak steps up the scale.
 */

export type Sound = 'tap' | 'submit' | 'correct' | 'wrong' | 'levelUp' | 'complete' | 'badge' | 'tick'

const KEY = 'fathom:sound'

function loadOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

let on = loadOn()
const listeners = new Set<() => void>()

export function useSoundOn(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => on,
  )
}

export function setSoundOn(next: boolean) {
  on = next
  try {
    localStorage.setItem(KEY, next ? 'on' : 'off')
  } catch {
    // Storage unavailable; the choice lasts for this visit.
  }
  listeners.forEach((l) => l())
  if (next) play('tap')
}

let ctx: AudioContext | null = null
/** Everything plays into one bus: a gentle compressor, plus a send to a short reverb that gives the space its air. */
let bus: GainNode | null = null
let verb: GainNode | null = null
let noiseBuf: AudioBuffer | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !window.AudioContext) return null
  // Created lazily from a tap so mobile browsers allow it to play.
  if (!ctx) {
    const ac = new AudioContext()
    const comp = ac.createDynamicsCompressor()
    comp.threshold.value = -20
    comp.ratio.value = 4
    comp.attack.value = 0.003
    comp.release.value = 0.2
    bus = ac.createGain()
    bus.gain.value = 0.9
    bus.connect(comp).connect(ac.destination)
    // A decaying noise burst works as a reverb impulse, so there's no file to load.
    const len = Math.floor(ac.sampleRate * 1.8)
    const ir = ac.createBuffer(2, len, ac.sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2)
    }
    const conv = ac.createConvolver()
    conv.buffer = ir
    verb = ac.createGain()
    verb.gain.value = 0.28
    verb.connect(conv).connect(bus)
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate)
    const n = noiseBuf.getChannelData(0)
    for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1
    ctx = ac
  }
  // Phones suspend the context when the tab is backgrounded.
  if (ctx.state !== 'running') void ctx.resume().catch(() => {})
  return ctx
}

function out(ac: AudioContext, amp: GainNode, wet: number) {
  amp.connect(bus!)
  if (wet > 0) {
    const send = ac.createGain()
    send.gain.value = wet
    amp.connect(send).connect(verb!)
  }
}

interface Tone {
  freq: number
  /** Seconds after the sound starts. */
  at?: number
  dur: number
  type?: OscillatorType
  gain?: number
  /** Glide to this frequency over the note. */
  to?: number
  attack?: number
  /** How much goes to the reverb. */
  wet?: number
}

function tone(ac: AudioContext, t: Tone) {
  const start = ac.currentTime + 0.01 + (t.at ?? 0)
  const end = start + t.dur
  const osc = ac.createOscillator()
  const amp = ac.createGain()
  osc.type = t.type ?? 'sine'
  osc.frequency.setValueAtTime(t.freq, start)
  if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, end)
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(t.gain ?? 0.12, start + (t.attack ?? 0.008))
  amp.gain.exponentialRampToValueAtTime(0.0001, end)
  osc.connect(amp)
  out(ac, amp, t.wet ?? 1)
  osc.start(start)
  osc.stop(end + 0.05)
}

interface Noise {
  at?: number
  dur: number
  gain: number
  filter?: BiquadFilterType
  /** Filter sweep, start and end frequency. */
  from: number
  to: number
  q?: number
  attack?: number
  wet?: number
}

function noise(ac: AudioContext, n: Noise) {
  const start = ac.currentTime + 0.01 + (n.at ?? 0)
  const end = start + n.dur
  const attack = n.attack ?? 0.08
  const src = ac.createBufferSource()
  src.buffer = noiseBuf
  const filter = ac.createBiquadFilter()
  filter.type = n.filter ?? 'bandpass'
  filter.Q.value = n.q ?? 0.8
  filter.frequency.setValueAtTime(n.from, start)
  filter.frequency.exponentialRampToValueAtTime(n.to, end)
  const amp = ac.createGain()
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(n.gain, start + attack)
  amp.gain.setValueAtTime(n.gain, Math.max(start + attack, end - n.dur * 0.45))
  amp.gain.exponentialRampToValueAtTime(0.0001, end)
  src.connect(filter).connect(amp)
  out(ac, amp, n.wet ?? 0.5)
  src.start(start)
  src.stop(end + 0.05)
}

/** C major pentatonic from C5: every sound stays in one key. */
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093]
/** Root note per zone, rising as you climb. */
const ZONE_ROOTS = [261.63, 293.66, 329.63, 392, 440]

/** How long the engine burns on a climb; the flight window animates over the same time. */
export const CLIMB_SECONDS = 1.05

export interface SoundOptions {
  /** Right answers in a row before this one; each step plays a note higher. */
  streak?: number
  /** Zone index being entered. */
  zone?: number
  /** Right answers in the finished run, which sets the length of the fanfare. */
  score?: number
  /** Which fuel tick this is, counting up as the timer runs down. */
  step?: number
}

type Synth = (ac: AudioContext, o: SoundOptions) => void

const thrust: Synth = (ac) => {
  noise(ac, { at: 0.1, dur: CLIMB_SECONDS, gain: 0.16, from: 260, to: 1700, q: 0.9, attack: 0.18, wet: 0.35 })
  tone(ac, { freq: 62, to: 118, at: 0.1, dur: CLIMB_SECONDS, gain: 0.09, attack: 0.15, wet: 0 })
}

const SOUNDS: Record<Sound, Synth> = {
  tap: (ac) => tone(ac, { freq: 1318.51, dur: 0.05, type: 'triangle', gain: 0.07, attack: 0.002, wet: 0.2 }),
  submit: (ac) => tone(ac, { freq: 783.99, to: 1046.5, dur: 0.08, type: 'triangle', gain: 0.08, wet: 0.3 }),
  // Two notes a third apart, a step higher for every answer in the streak, over the engine.
  correct: (ac, { streak = 0 }) => {
    const k = Math.min(Math.max(0, streak), 6)
    tone(ac, { freq: SCALE[k], dur: 0.32, type: 'triangle', gain: 0.13 })
    tone(ac, { freq: SCALE[k] * 2, dur: 0.25, gain: 0.03 })
    tone(ac, { freq: SCALE[k + 2], at: 0.075, dur: 0.6, type: 'triangle', gain: 0.12 })
    tone(ac, { freq: SCALE[k + 2] * 2, at: 0.075, dur: 0.5, gain: 0.035 })
    thrust(ac, {})
  },
  // A soft thud and the engine sputtering out: the ship holds rather than gets buzzed at.
  wrong: (ac) => {
    tone(ac, { freq: 233, to: 175, dur: 0.3, gain: 0.15, attack: 0.005, wet: 0.6 })
    tone(ac, { freq: 175, to: 147, at: 0.12, dur: 0.38, type: 'triangle', gain: 0.07, wet: 0.6 })
    ;[0.04, 0.16, 0.28].forEach((at, i) => noise(ac, { at, dur: 0.08, gain: 0.12 - i * 0.03, filter: 'lowpass', from: 900, to: 500, q: 0.5, attack: 0.01, wet: 0.2 }))
  },
  // A slow chord on the new zone's root, timed to land as the sky changes.
  levelUp: (ac, { zone = 1 }) => {
    const root = ZONE_ROOTS[Math.min(Math.max(0, zone), ZONE_ROOTS.length - 1)]
    ;[1, 1.25, 1.5, 2].forEach((m, i) => tone(ac, { freq: root * m, at: 0.45 + i * 0.04, dur: 1.6, gain: 0.045, attack: 0.25, wet: 1.4 }))
    tone(ac, { freq: root * 4, at: 0.75, dur: 0.9, gain: 0.04, wet: 1.5 })
  },
  // One note per right answer, then a held chord: a better run sounds bigger.
  complete: (ac, { score = 7 }) => {
    const n = Math.min(Math.max(1, score), 7)
    for (let i = 0; i < n; i++) tone(ac, { freq: SCALE[i], at: i * 0.085, dur: 0.3, type: 'triangle', gain: 0.1 })
    const at = n * 0.085 + 0.05
    ;[1, 1.25, 1.5].forEach((m) => tone(ac, { freq: (SCALE[n - 1] * m) / 2, at, dur: 1.4, gain: 0.05, attack: 0.05, wet: 1.3 }))
    if (n >= 5) noise(ac, { at, dur: 1.2, gain: 0.07, filter: 'highpass', from: 3000, to: 6000, q: 0.5, attack: 0.02, wet: 1 })
  },
  badge: (ac) => {
    ;[SCALE[5], SCALE[7], SCALE[8]].forEach((freq, i) => tone(ac, { freq, at: i * 0.07, dur: 0.5, gain: 0.08, wet: 1.2 }))
  },
  // Quiet ticks in the last seconds of fuel, rising slightly.
  tick: (ac, { step = 0 }) => tone(ac, { freq: 1480 + step * 40, dur: 0.045, type: 'triangle', gain: 0.06, attack: 0.002, wet: 0.2 }),
}

const VIBRATE: Partial<Record<Sound, number | number[]>> = {
  tap: 8,
  submit: 12,
  // A short kick, then a long soft burn under the climb.
  correct: [20, 60, 160],
  // The engine stuttering out.
  wrong: [30, 40, 25, 40, 20],
  levelUp: [20, 60, 160, 200, 20, 40, 60],
  complete: [30, 40, 60],
  badge: [20, 30, 20],
}

export function play(sound: Sound, options: SoundOptions = {}) {
  if (!on) return
  try {
    const ac = audio()
    if (ac) SOUNDS[sound](ac, options)
  } catch {
    // Audio unsupported or blocked; stay silent.
  }
  const pattern = VIBRATE[sound]
  if (pattern !== undefined && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // Some browsers throw when vibration isn't allowed.
    }
  }
}
