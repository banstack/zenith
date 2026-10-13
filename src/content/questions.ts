import { hashString } from '../lib/rng'
import type { TopicId } from '../lib/topics'
import { ADDITIONS } from './additions'
import type { PictureKind } from './pictures'
import { food } from './topics/food'
import { general } from './topics/general'
import { geography } from './topics/geography'
import { history } from './topics/history'
import { math } from './topics/math'
import { music } from './topics/music'
import { science } from './topics/science'
import { screen } from './topics/screen'
import { sports } from './topics/sports'
import type { Difficulty, RawQuestion } from './topics/types'

export interface TriviaQuestion {
  /** Stable across releases as long as the prompt text doesn't change. */
  id: string
  topic: TopicId
  difficulty: Difficulty
  prompt: string
  /** Correct answer first; shuffle before showing. */
  answers: [string, string, string, string]
  explanation?: string
  /** A flag or country outline shown above the choices (see src/content/pictures.ts). */
  image?: { kind: PictureKind; src: string; alt: string }
  /** Date (YYYY-MM-DD) of the first Daily launch that can deal it. Unset for questions the game launched with. */
  since?: string
}

export const BANKS: Record<TopicId, RawQuestion[]> = { general, history, science, math, screen, geography, music, sports, food }

function build(topic: TopicId, [difficulty, prompt, a, b, c, d, explanation]: RawQuestion, since?: string): TriviaQuestion {
  return { id: `${topic}-${hashString(prompt).toString(36)}`, topic, difficulty, prompt, answers: [a, b, c, d], explanation, ...(since && { since }) }
}

const ALL: TriviaQuestion[] = [
  ...(Object.keys(BANKS) as TopicId[]).flatMap((t) => BANKS[t].map((q) => build(t, q))),
  ...ADDITIONS.flatMap(({ since, banks }) => (Object.keys(banks) as TopicId[]).flatMap((t) => banks[t]!.map((q) => build(t, q, since)))),
]

const pools = new Map<string, TriviaQuestion[]>()
for (const q of ALL) {
  const key = `${q.topic}:${q.difficulty}`
  pools.set(key, [...(pools.get(key) ?? []), q])
}

export const allQuestions = (): readonly TriviaQuestion[] => ALL

/** Questions of one topic and difficulty: the launch banks in order, then each batch of additions. */
export const pool = (topic: TopicId, difficulty: Difficulty): readonly TriviaQuestion[] => pools.get(`${topic}:${difficulty}`) ?? []

/** A question shown to the player, with its choices in display order. */
export interface AskedQuestion {
  question: TriviaQuestion
  choices: string[]
  answerIndex: number
}

export function ask(question: TriviaQuestion, rand: () => number): AskedQuestion {
  const order = [0, 1, 2, 3]
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return { question, choices: order.map((i) => question.answers[i]), answerIndex: order.indexOf(0) }
}
