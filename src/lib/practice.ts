import { picturePool } from '../content/pictures'
import { ask, pool, type AskedQuestion } from '../content/questions'
import { dateKey } from './dates'
import { MAX_HEIGHT, ZONES, zoneIndexAt } from './space'
import { pick } from './rng'
import { TOPICS, type PracticeTopic } from './topics'

export const MAX_FUEL = 3

/** Climb per right answer, in milestones: about seven right answers cross any zone. */
export const ZONE_STEP = ZONES.map((z) => (z.to - z.from) / 7)

export interface PracticeState {
  height: number
  fuel: number
  streak: number
  bestStreak: number
  answered: number
  correct: number
  /** Practice is endless, so only fuel ends it now; 'top' is kept for flights saved before. */
  over: null | 'fuel' | 'top'
}

export function startPractice(): PracticeState {
  return { height: 0, fuel: MAX_FUEL, streak: 0, bestStreak: 0, answered: 0, correct: 0, over: null }
}

/** 3 in a row climbs 25% faster, 5 in a row 50% faster. */
export function streakBonus(streak: number): number {
  return streak >= 5 ? 1.5 : streak >= 3 ? 1.25 : 1
}

export interface PracticeStep {
  state: PracticeState
  gained: number
  /** Set when this answer carried you into a new zone. */
  enteredZone: number | null
  /** Set when this answer carried you past a stop beyond the Galactic Center. */
  passedStop: boolean
}

export function answerPractice(s: PracticeState, correct: boolean): PracticeStep {
  if (s.over) return { state: s, gained: 0, enteredZone: null, passedStop: false }
  const answered = s.answered + 1
  if (!correct) {
    const fuel = s.fuel - 1
    return { state: { ...s, answered, fuel, streak: 0, over: fuel <= 0 ? 'fuel' : null }, gained: 0, enteredZone: null, passedStop: false }
  }
  const streak = s.streak + 1
  const from = zoneIndexAt(s.height)
  // No ceiling: past the Galactic Center you keep climbing at the Deep Galaxy pace.
  const height = Math.round((s.height + ZONE_STEP[from] * streakBonus(streak)) * 1e4) / 1e4
  const to = zoneIndexAt(height)
  const enteredZone = to > from ? to : null
  const passedStop = height >= MAX_HEIGHT && Math.floor(height + 1e-9) > Math.floor(s.height + 1e-9)
  return {
    state: {
      ...s,
      height,
      answered,
      correct: s.correct + 1,
      streak,
      bestStreak: Math.max(s.bestStreak, streak),
      // Reaching a new zone, or a stop past the Galactic Center, refills a fuel cell.
      fuel: enteredZone !== null || passedStop ? Math.min(MAX_FUEL, s.fuel + 1) : s.fuel,
      over: null,
    },
    gained: height - s.height,
    enteredZone,
    passedStop,
  }
}

/** Share of Geography questions that are a flag or a country outline. */
export const PICTURE_SHARE = 1 / 3

/** Next question at the difficulty of the current zone, avoiding ones already seen this flight. Questions join Practice on the same date they join the Daily. */
export function nextPracticeQuestion(topic: PracticeTopic, height: number, seen: Set<string>, rand = Math.random, today = dateKey()): AskedQuestion {
  const difficulty = ZONES[zoneIndexAt(height)].difficulty
  const topics = topic === 'mixed' ? TOPICS.map((t) => t.id) : [topic]
  // Pictures make up a third of the geography share: every Geography question, or one topic in eight on Mixed.
  const pictureOdds = topic === 'geography' ? PICTURE_SHARE : topic === 'mixed' ? PICTURE_SHARE / TOPICS.length : 0
  const all = (rand() < pictureOdds ? (['flag', 'outline'] as const).flatMap((k) => picturePool(k, difficulty)) : topics.flatMap((t) => pool(t, difficulty))).filter((q) => !q.since || q.since <= today)
  const fresh = all.filter((q) => !seen.has(q.id))
  return ask(pick(fresh.length ? fresh : all, rand), rand)
}
