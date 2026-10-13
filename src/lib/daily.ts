import { picturePool, type PictureKind } from '../content/pictures'
import { ask, pool, type AskedQuestion, type TriviaQuestion } from '../content/questions'
import type { Difficulty } from '../content/topics/types'
import { addDays, dateKey, daysBetween } from './dates'
import { MAX_SCORE, STOP_SCORES, ZONES, formatScore, heightToScore, scoreToHeight, zoneIndexAt } from './space'
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
/** Every question a category can deal at a difficulty, before checking dates. */
export const bankFor = (id: Category['id'], d: Difficulty) => (isPicture(id) ? picturePool(id, d) : pool(id, d))

/**
 * Launches before this date were dealt by the first dealer, which reshuffles
 * a deck of the launch-day questions each time it runs out. They still are,
 * so results already played keep lining up with their questions.
 */
export const DEALER_SWITCH = '2026-10-20'

type Bank = (id: Category['id'], d: Difficulty) => readonly TriviaQuestion[]

/** Deals card `index` from a deck that is reshuffled each time it runs out. */
function legacyDeal(bank: readonly TriviaQuestion[], deck: string, index: number) {
  const round = Math.floor(index / bank.length)
  return shuffle(bank, seeded(`${deck}:${round}`))[index % bank.length]
}

/**
 * Deals launches in order, remembering when each question was last shown.
 * From DEALER_SWITCH on, each slot gets a question never shown in any earlier
 * launch, picked at random from its deck. Only once a deck has shown every
 * question does one come back, and then only from the half shown longest ago.
 *
 * A question joins its deck on its `since` date, so launch n depends only on
 * questions dated n or earlier: adding questions never changes a past launch.
 */
export function makeDealer(bankFor: Bank) {
  const switchN = dailyNumber(DEALER_SWITCH)
  const dealt: TriviaQuestion[][] = []
  const lastShown = new Map<string, number>()
  const legacyUsed = new Map<string, number>()

  function dealLaunch(n: number): TriviaQuestion[] {
    return dailyCategories(n).map((c, i) => {
      const d = DAILY_DIFFICULTY[i]
      const key = `${c.id}:${d}`
      let q: TriviaQuestion
      if (n < switchN) {
        const used = legacyUsed.get(key) ?? 0
        q = legacyDeal(bankFor(c.id, d).filter((x) => !x.since), `themed:${key}`, used)
        legacyUsed.set(key, used + 1)
      } else {
        const bank = bankFor(c.id, d).filter((x) => !x.since || dailyNumber(x.since) <= n)
        const unseen = bank.filter((x) => !lastShown.has(x.id))
        const rand = seeded(`deal:${key}:${n}`)
        // Each deck deals at most once a launch, so no two questions share a last-shown launch.
        const choices = unseen.length ? unseen : [...bank].sort((a, b) => lastShown.get(a.id)! - lastShown.get(b.id)!).slice(0, Math.ceil(bank.length / 2))
        q = choices[Math.floor(rand() * choices.length)]
      }
      lastShown.set(q.id, n)
      return q
    })
  }

  /** The questions of launch `n`, in slot order. */
  return (n: number): readonly TriviaQuestion[] => {
    while (dealt.length < n) dealt.push(dealLaunch(dealt.length + 1))
    return dealt[n - 1]
  }
}

const dealt = makeDealer(bankFor)

/** The seven questions for launch `n`, the same on every device. */
export function dailyQuestions(n: number): AskedQuestion[] {
  const rand = seeded(`daily:${n}`)
  return dealt(n).map((q) => ask(q, rand))
}

/**
 * Points for each question, out of 1,000 for the launch. Harder questions are
 * worth more, and each one is the gap between two stops, so getting every
 * question right lands on each stop in turn.
 */
export const DAILY_POINTS: readonly number[] = STOP_SCORES.slice(1).map((s, i) => s - STOP_SCORES[i])

export const MAX_POINTS = MAX_SCORE

export function dailyPoints(answers: readonly boolean[]): number {
  return answers.reduce((sum, ok, i) => sum + (ok ? DAILY_POINTS[i] : 0), 0)
}

/** The ship climbs by score: a miss on an Easy question costs a little height, a miss on the Expert one costs a lot. */
export function dailyHeight(answers: readonly boolean[]): number {
  return scoreToHeight(dailyPoints(answers))
}

/** Your rank for a launch: the zone the score reaches, or the Galactic Center for a perfect 1,000. */
export function dailyRank(points: number): string {
  return points >= MAX_POINTS ? 'Galactic Center' : ZONES[zoneIndexAt(scoreToHeight(points))].name
}

/** The next rank up and the score it starts at, or null at the top. */
export function nextRank(points: number): { name: string; score: number } | null {
  if (points >= MAX_POINTS) return null
  const next = ZONES[zoneIndexAt(scoreToHeight(points)) + 1]
  return next ? { name: next.name, score: heightToScore(next.from) } : { name: 'Galactic Center', score: MAX_POINTS }
}

/** Wordle-style result to paste into a chat. */
export function shareText(n: number, answers: readonly boolean[]): string {
  const squares = answers.map((ok, i) => (ok ? ZONES[DAILY_ZONE[i]].square : '⬛')).join('')
  return `Zenith #${n}\n${squares}  ${formatScore(dailyPoints(answers))}/${formatScore(MAX_POINTS)} · ${dailyRank(dailyPoints(answers))}`
}
