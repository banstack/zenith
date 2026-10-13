import type { AppData, PracticeRecord } from '../types'
import { newlyFound } from './discoveries'

export function emptyData(now = Date.now()): AppData {
  return { version: 3, profile: { name: '', createdAt: now }, daily: {}, practice: [], discoveries: {} }
}

/** Depths (m) that Fathom's daily dive reached after each right answer; each one is a milestone in Zenith. */
const FATHOM_DEPTHS = [0, 100, 200, 1000, 2500, 4000, 6000, 10935]

/** Converts a Fathom depth to a Zenith height, keeping its place between milestones. */
export function depthToHeight(m: number): number {
  const i = FATHOM_DEPTHS.findIndex((d) => m < d)
  if (i === -1) return FATHOM_DEPTHS.length - 1
  if (i === 0) return 0
  const lo = FATHOM_DEPTHS[i - 1]
  return Math.round((i - 1 + (m - lo) / (FATHOM_DEPTHS[i] - lo)) * 1e4) / 1e4
}

type FathomPractice = Omit<PracticeRecord, 'maxHeight' | 'endReason'> & { maxDepth: number; endReason: 'oxygen' | 'bottom' | 'quit' }
interface FathomSave {
  version: 2
  profile: AppData['profile']
  daily: Record<string, Omit<AppData['daily'][string], 'height'> & { depth: number }>
  practice: FathomPractice[]
}

/**
 * Reads any saved shape. Version 1 saves come from Funmental, the brain-gym
 * this app replaced: only the profile carries over. Version 2 saves come from
 * Fathom, the ocean version of this game: dives become launches and depths
 * become heights. Discoveries are worked out again from that history.
 */
export function migrate(saved: unknown, now = Date.now()): AppData {
  const s = (saved && typeof saved === 'object' ? saved : {}) as Partial<AppData> & { version?: number }
  const base = emptyData(s.profile?.createdAt ?? now)
  const profile = { ...base.profile, ...s.profile }
  let data: AppData
  if (s.version === 3) {
    data = { version: 3, profile, daily: { ...s.daily }, practice: s.practice ?? [], discoveries: { ...s.discoveries } }
  } else if (s.version === 2) {
    const old = s as unknown as FathomSave
    data = {
      version: 3,
      profile,
      daily: Object.fromEntries(
        Object.entries(old.daily ?? {}).map(([date, { depth: _depth, ...r }]) => [date, { ...r, height: r.answers.filter(Boolean).length }]),
      ),
      practice: (old.practice ?? []).map(({ maxDepth, endReason, ...p }) => ({
        ...p,
        maxHeight: depthToHeight(maxDepth),
        endReason: endReason === 'oxygen' ? 'fuel' : endReason === 'bottom' ? 'top' : 'quit',
      })),
      discoveries: {},
    }
  } else {
    return { ...base, profile }
  }
  data.discoveries = { ...data.discoveries, ...newlyFound(data, now) }
  // Launches from before Daily Mix had one topic and other questions, so their results no longer line up.
  // Discoveries they earned are kept.
  data.daily = Object.fromEntries(Object.entries(data.daily).filter(([, r]) => r.topic === 'mixed'))
  return data
}
