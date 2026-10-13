import type { Difficulty } from '../content/topics/types'

/*
 * Zenith measures height in milestones: 0 is the launch pad and each whole
 * number is the next stop on the way to the center of the galaxy. Practice
 * moves in fractions of a milestone; the Daily Launch moves one per right
 * answer. Real distances are only for display (see formatAltitude).
 */

const AU = 149_597_870.7
const LY = 9_460_730_472_580.8

export interface Milestone {
  name: string
  /** Real distance from Earth, in km. */
  km: number
}

/** The seven stops, in order. Height n means you've reached MILESTONES[n - 1]. */
export const MILESTONES: Milestone[] = [
  { name: 'Edge of space', km: 100 },
  { name: 'Space Station', km: 408 },
  { name: 'The Moon', km: 384_400 },
  { name: 'Mars', km: 1.5 * AU },
  { name: 'Neptune', km: 30 * AU },
  { name: 'Proxima Centauri', km: 4.2 * LY },
  { name: 'Galactic Center', km: 26_000 * LY },
]

/** The top of a Daily Launch: the center of the Milky Way. */
export const MAX_HEIGHT = MILESTONES.length

/** Stops past the Galactic Center, which only Practice flies on to. */
export const BEYOND: Milestone[] = [
  { name: 'Andromeda Galaxy', km: 2.5e6 * LY },
  { name: 'Virgo Cluster', km: 54e6 * LY },
  { name: 'Great Attractor', km: 250e6 * LY },
  { name: 'Edge of the observable universe', km: 46.5e9 * LY },
]

/** Every stop in order, the daily seven first. Height n means you've reached STOPS[n - 1]. */
export const STOPS: Milestone[] = [...MILESTONES, ...BEYOND]

export interface Zone {
  id: 'near' | 'lunar' | 'planets' | 'interstellar' | 'galaxy'
  name: string
  /** Heights from `from` up to, but not including, `to`. */
  from: number
  to: number
  difficulty: Difficulty
  /** Flat sky color for the whole zone; the screen steps between them. */
  color: string
}

/** A zone is the stretch of space you're crossing, named for where you're headed. */
export const ZONES: Zone[] = [
  { id: 'near', name: 'Near Earth', from: 0, to: 2, difficulty: 1, color: '#4d9be0' },
  { id: 'lunar', name: 'Lunar Space', from: 2, to: 3, difficulty: 2, color: '#3654b4' },
  { id: 'planets', name: 'The Planets', from: 3, to: 5, difficulty: 3, color: '#3a2b85' },
  { id: 'interstellar', name: 'Interstellar Space', from: 5, to: 6, difficulty: 4, color: '#22174f' },
  { id: 'galaxy', name: 'Deep Galaxy', from: 6, to: MAX_HEIGHT, difficulty: 5, color: '#0c0a1d' },
]

export function zoneIndexAt(height: number): number {
  const i = ZONES.findIndex((z) => height < z.to)
  return i === -1 ? ZONES.length - 1 : i
}

export const zoneAt = (height: number) => ZONES[zoneIndexAt(height)]

/** Where you are, by name: the zone, or intergalactic space once past the Galactic Center. */
export const regionName = (height: number) => (height > MAX_HEIGHT + 1e-6 ? 'Intergalactic Space' : zoneAt(height).name)

/** The last stop at or below a height, or null on the launch pad. */
export const milestoneAt = (height: number): Milestone | null => STOPS[Math.min(STOPS.length, Math.floor(height + 1e-9)) - 1] ?? null

/** The next stop above a height, or null past the last one. */
export const nextStopAt = (height: number): Milestone | null => STOPS[Math.floor(height + 1e-6)] ?? null

/** Real distance for a height: linear up to the edge of space, then log-scaled between stops. */
export function heightToKm(height: number): number {
  const h = Math.min(STOPS.length, Math.max(0, height))
  if (h <= 1) return h * STOPS[0].km
  const i = Math.min(STOPS.length - 1, Math.floor(h))
  const lo = STOPS[i - 1].km
  const hi = STOPS[i]?.km ?? lo
  return lo * Math.pow(hi / lo, h - i)
}

const fmt = (n: number) => (n < 10 ? n.toFixed(1).replace(/\.0$/, '') : Math.round(n).toLocaleString('en-US'))

/** "384,400 km", "1.5 AU", "26,000 ly": the unit grows with the distance. */
export function formatAltitude(height: number): string {
  const km = heightToKm(height)
  if (km < 1_000_000) return `${Math.round(km).toLocaleString('en-US')} km`
  if (km < LY) return `${fmt(km / AU)} AU`
  return `${fmt(km / LY)} ly`
}

/**
 * The score for reaching each height, 0 to 1,000. It's the one number players
 * compare: the ship climbs by score, so the zone you end in is your score band.
 * Each daily question is worth the gap between two stops (see DAILY_POINTS).
 */
export const STOP_SCORES = [0, 50, 100, 200, 350, 500, 700, 1000] as const

export const MAX_SCORE = STOP_SCORES[MAX_HEIGHT]

/** Practice keeps scoring past the Galactic Center: each further stop is worth as much as the Expert question. */
export const BEYOND_STOP_SCORE = 300

/** Score for a height, straight-line between stops. */
export function heightToScore(height: number): number {
  const h = Math.max(0, height)
  if (h > MAX_HEIGHT) return Math.round(MAX_SCORE + (h - MAX_HEIGHT) * BEYOND_STOP_SCORE)
  const i = Math.min(MAX_HEIGHT - 1, Math.floor(h))
  return Math.round(STOP_SCORES[i] + (STOP_SCORES[i + 1] - STOP_SCORES[i]) * (h - i))
}

/** Height for a score, the inverse of heightToScore. */
export function scoreToHeight(score: number): number {
  if (score > MAX_SCORE) return MAX_HEIGHT + (score - MAX_SCORE) / BEYOND_STOP_SCORE
  const s = Math.max(0, score)
  const i = STOP_SCORES.findIndex((v, k) => k > 0 && s <= v) - 1
  return i + (s - STOP_SCORES[i]) / (STOP_SCORES[i + 1] - STOP_SCORES[i])
}

/** "720", "1,000". */
export const formatScore = (score: number) => Math.round(score).toLocaleString('en-US')

/** A height shown as its score. */
export const scoreAt = (height: number) => formatScore(heightToScore(height))

/** 0–1 position for a height on the ladder and gauge. */
export const heightScale = (h: number) => Math.min(1, Math.max(0, h) / MAX_HEIGHT)

/** Plain-words difficulty, shown on each question. */
export const DIFFICULTY_NAMES = ['', 'Easy', 'Medium', 'Tricky', 'Hard', 'Expert'] as const
