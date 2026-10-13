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

/** The top: the center of the Milky Way. */
export const MAX_HEIGHT = MILESTONES.length

export interface Zone {
  id: 'near' | 'lunar' | 'planets' | 'interstellar' | 'galaxy'
  name: string
  /** Heights from `from` up to, but not including, `to`. */
  from: number
  to: number
  difficulty: Difficulty
  /** Share-grid square for a right answer in this zone. */
  square: string
  /** Flat sky color for the whole zone; the screen steps between them. */
  color: string
}

/** A zone is the stretch of space you're crossing, named for where you're headed. */
export const ZONES: Zone[] = [
  { id: 'near', name: 'Near Earth', from: 0, to: 2, difficulty: 1, square: '🟦', color: '#4d9be0' },
  { id: 'lunar', name: 'Lunar Space', from: 2, to: 3, difficulty: 2, square: '⬜', color: '#3654b4' },
  { id: 'planets', name: 'The Planets', from: 3, to: 5, difficulty: 3, square: '🟧', color: '#3a2b85' },
  { id: 'interstellar', name: 'Interstellar Space', from: 5, to: 6, difficulty: 4, square: '🟪', color: '#22174f' },
  { id: 'galaxy', name: 'Deep Galaxy', from: 6, to: MAX_HEIGHT, difficulty: 5, square: '🟨', color: '#0c0a1d' },
]

export function zoneIndexAt(height: number): number {
  const i = ZONES.findIndex((z) => height < z.to)
  return i === -1 ? ZONES.length - 1 : i
}

export const zoneAt = (height: number) => ZONES[zoneIndexAt(height)]

/** The last milestone at or below a height, or null on the launch pad. */
export const milestoneAt = (height: number): Milestone | null => MILESTONES[Math.min(MAX_HEIGHT, Math.floor(height + 1e-9)) - 1] ?? null

/** Real distance for a height: linear up to the edge of space, then log-scaled between milestones. */
export function heightToKm(height: number): number {
  const h = Math.min(MAX_HEIGHT, Math.max(0, height))
  if (h <= 1) return h * MILESTONES[0].km
  const i = Math.min(MAX_HEIGHT - 1, Math.floor(h))
  const lo = MILESTONES[i - 1].km
  const hi = MILESTONES[i]?.km ?? lo
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

/** 0–1 position for a height on the ladder and gauge. */
export const heightScale = (h: number) => Math.min(1, Math.max(0, h) / MAX_HEIGHT)

/** Plain-words difficulty, shown on each question. */
export const DIFFICULTY_NAMES = ['', 'Easy', 'Medium', 'Tricky', 'Hard', 'Expert'] as const
