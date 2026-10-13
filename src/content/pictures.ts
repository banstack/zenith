import { seeded, shuffle } from '../lib/rng'
import { COUNTRIES, LOOKALIKE_FLAGS, geoAsset, type CountryRow } from './countries'
import type { TriviaQuestion } from './questions'
import type { Difficulty } from './topics/types'

/** "What flag is this?" shows a flag; "What country is this?" shows the country's outline. */
export type PictureKind = 'flag' | 'outline'

export const PICTURE_PROMPTS: Record<PictureKind, string> = {
  flag: 'What flag is this?',
  outline: 'What country is this?',
}

/** Describes the picture without giving the answer away. */
export const PICTURE_ALT: Record<PictureKind, string> = {
  flag: 'A national flag',
  outline: "A country's outline",
}

const byCode = new Map(COUNTRIES.map((c) => [c[0], c]))
const difficultyOf = (c: CountryRow, kind: PictureKind) => (kind === 'flag' ? c[3] : c[4])

/**
 * Three wrong answers, the same every time for a given question: flags that
 * look alike first, then countries from the same region at a similar
 * difficulty, then the rest of the region, then anywhere.
 */
function wrongAnswers(country: CountryRow, kind: PictureKind, rand: () => number): string[] {
  const [code, , region] = country
  const d = difficultyOf(country, kind)
  const others = COUNTRIES.filter((c) => c[0] !== code)
  const lookalikes = kind === 'flag' ? LOOKALIKE_FLAGS.filter((g) => g.includes(code)).flatMap((g) => g.map((x) => byCode.get(x))) : []
  const tiers = [
    lookalikes.filter((c): c is CountryRow => !!c && c[0] !== code),
    others.filter((c) => c[2] === region && Math.abs(c[3] - d) <= 1),
    others.filter((c) => c[2] === region),
    others,
  ]
  const out: string[] = []
  for (const tier of tiers) {
    for (const c of shuffle(tier, rand)) {
      if (out.length === 3) return out
      if (!out.includes(c[1])) out.push(c[1])
    }
  }
  return out
}

function build(country: CountryRow, kind: PictureKind): TriviaQuestion {
  const [code, name, , , , since] = country
  const id = `geography-${kind}-${code}`
  const [a, b, c] = wrongAnswers(country, kind, seeded(id))
  return {
    id,
    topic: 'geography',
    difficulty: difficultyOf(country, kind) as Difficulty,
    prompt: PICTURE_PROMPTS[kind],
    answers: [name, a, b, c],
    image: { kind, src: geoAsset(kind, code), alt: PICTURE_ALT[kind] },
    ...(since && { since }),
  }
}

const ALL: TriviaQuestion[] = (['flag', 'outline'] as const).flatMap((kind) => COUNTRIES.filter((c) => difficultyOf(c, kind) > 0).map((c) => build(c, kind)))

export const allPictureQuestions = (): readonly TriviaQuestion[] => ALL

const pools = new Map<string, TriviaQuestion[]>()
for (const q of ALL) {
  const key = `${q.image!.kind}:${q.difficulty}`
  pools.set(key, [...(pools.get(key) ?? []), q])
}

/** Picture questions of one kind and difficulty, in list order. */
export const picturePool = (kind: PictureKind, difficulty: Difficulty): readonly TriviaQuestion[] => pools.get(`${kind}:${difficulty}`) ?? []
