import { picturePool, type PictureKind } from '../content/pictures'
import { ask, pool, type AskedQuestion } from '../content/questions'
import type { Difficulty } from '../content/topics/types'
import { addDays, dateKey, daysBetween } from './dates'
import { MAX_HEIGHT, ZONES, formatAltitude } from './space'
import { seeded, shuffle } from './rng'
import { TOPICS, type PracticeTopic, type TopicId } from './topics'

/** Zenith #1 is this date. */
export const EPOCH = '2026-10-09'

export const DAILY_LENGTH = 7

/** Difficulty of each daily question, easiest first. */
export const DAILY_DIFFICULTY: Difficulty[] = [1, 1, 2, 3, 3, 4, 5]

/** Ocean zone each daily question sits in. */
export const DAILY_ZONE = DAILY_DIFFICULTY.map((d) => ZONES.findIndex((z) => z.difficulty === d))

export const dailyNumber = (key = dateKey()) => daysBetween(EPOCH, key) + 1
export const dailyDate = (n: number) => addDays(EPOCH, n - 1)

/** Every launch is a Daily Mix: each question has its own category. */
export const dailyTopic = (_n: number): DailyTopic => 'mixed'

/** 'mixed' for a launch with a different category per question. Saves from before Daily Mix may hold a single topic. */
export type DailyTopic = PracticeTopic

/** What the launch is called next to its number. */
export const dailyTopicName = (_n: number) => 'Daily Mix'

/** A question's category: a topic's bank, or a picture question. */
export interface Category {
  id: TopicId | PictureKind
  name: string
}

const topic = (id: TopicId): Category => ({ id, name: TOPICS.find((t) => t.id === id)!.name })

/** Every launch has these six categories... */
const CORE: Category[] = [topic('science'), topic('math'), topic('history'), topic('geography'), { id: 'flag', name: 'Flags' }, { id: 'outline', name: 'Countries' }]

/** ...plus one of these, taking turns. */
const EXTRA: Category[] = [topic('screen'), topic('music'), topic('sports'), topic('food'), topic('general')]

const themedCache: Category[][] = []

/**
 * The category of each question in launch `n`. The order is reshuffled
 * every day, so each category takes its turn at every difficulty.
 */
export function dailyCategories(n: number): Category[] {
  themedCache[n] ??= shuffle([...CORE, EXTRA[(((n - 1) % EXTRA.length) + EXTRA.length) % EXTRA.length]], seeded(`themes:${n}`))
  return themedCache[n]
}

const isPicture = (id: Category['id']): id is PictureKind => id === 'flag' || id === 'outline'
const bankFor = (id: Category['id'], d: Difficulty) => (isPicture(id) ? picturePool(id, d) : pool(id, d))

/** Deals card `index` from a deck that is reshuffled each time it runs out. */
function deal(bank: readonly AskedQuestion['question'][], deck: string, index: number) {
  const round = Math.floor(index / bank.length)
  return shuffle(bank, seeded(`${deck}:${round}`))[index % bank.length]
}

/**
 * The seven questions for launch `n`, the same on every device. Questions are
 * dealt from a fixed shuffled deck per category and difficulty, so nothing
 * repeats until its deck has been used up.
 */
export function dailyQuestions(n: number): AskedQuestion[] {
  const rand = seeded(`daily:${n}`)
  // How many cards each deck has dealt on earlier days.
  const used = new Map<string, number>()
  for (let m = 1; m < n; m++) {
    dailyCategories(m).forEach((c, i) => {
      const key = `${c.id}:${DAILY_DIFFICULTY[i]}`
      used.set(key, (used.get(key) ?? 0) + 1)
    })
  }
  return dailyCategories(n).map((c, i) => {
    const d = DAILY_DIFFICULTY[i]
    return ask(deal(bankFor(c.id, d), `themed:${c.id}:${d}`, used.get(`${c.id}:${d}`) ?? 0), rand)
  })
}

/** Each right answer climbs one milestone, so seven reach the Galactic Center. */
export function dailyHeight(answers: readonly boolean[]): number {
  return Math.min(MAX_HEIGHT, answers.filter(Boolean).length)
}

/** Each right answer scores its difficulty in points (Easy 1 to Expert 5), so the Expert question is worth five Easy ones. */
export const DAILY_POINTS: readonly number[] = DAILY_DIFFICULTY

export const MAX_POINTS = DAILY_POINTS.reduce((a, b) => a + b, 0)

export function dailyPoints(answers: readonly boolean[]): number {
  return answers.reduce((sum, ok, i) => sum + (ok ? DAILY_POINTS[i] : 0), 0)
}

/** Wordle-style result to paste into a chat. */
export function shareText(n: number, answers: readonly boolean[]): string {
  const squares = answers.map((ok, i) => (ok ? ZONES[DAILY_ZONE[i]].square : '⬛')).join('')
  return `Zenith #${n}\n${squares}  ${dailyPoints(answers)}/${MAX_POINTS} pts · ${formatAltitude(dailyHeight(answers))}`
}
