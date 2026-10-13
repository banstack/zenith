import { describe, expect, it } from 'vitest'
import type { TriviaQuestion } from '../content/questions'
import { allQuestions } from '../content/questions'
import { ADDITIONS } from '../content/additions'
import { DAILY_DIFFICULTY, DEALER_SWITCH, bankFor, dailyCategories, dailyNumber, dailyQuestions, makeDealer } from './daily'
import played from './fixtures/launches-1-11.json'
import { nextPracticeQuestion } from './practice'
import { seeded } from './rng'
import { MAX_HEIGHT } from './space'

describe('daily dealer', () => {
  it('still deals the launches dealt before the switch exactly as they were played', () => {
    expect(dailyNumber(DEALER_SWITCH)).toBe(12)
    for (const [n, ids] of Object.entries(played)) {
      expect(dailyQuestions(Number(n)).map((q) => `${q.question.id}@${q.answerIndex}`), `launch ${n}`).toEqual(ids)
    }
  })

  it('never changes an earlier launch when questions are added', () => {
    // Pretend every third question is a batch added for a later date.
    const later = '2027-01-01'
    const hidden = new Set(allQuestions().filter((_, i) => i % 3 === 0).map((q) => q.id))
    const dated = (q: TriviaQuestion) => (hidden.has(q.id) ? { ...q, since: later } : q)
    const withBatch = makeDealer((id, d) => bankFor(id, d).map(dated))
    const withoutBatch = makeDealer((id, d) => bankFor(id, d).filter((q) => !hidden.has(q.id)))
    for (let n = 1; n < dailyNumber(later); n++) expect(withBatch(n).map((q) => q.id), `launch ${n}`).toEqual(withoutBatch(n).map((q) => q.id))
    // ...and from that date the new questions do get dealt.
    const after = Array.from({ length: 60 }, (_, i) => withBatch(dailyNumber(later) + i)).flat()
    expect(after.some((q) => hidden.has(q.id))).toBe(true)
  })

  it('only repeats a question once its deck has shown every question it has', () => {
    const shown = new Map<string, Set<string>>()
    for (let n = 1; n <= 730; n++) {
      const cats = dailyCategories(n)
      dailyQuestions(n).forEach(({ question: q }, i) => {
        const picture = cats[i].id === 'flag' || cats[i].id === 'outline'
        const key = picture ? cats[i].id : `${cats[i].id}:${DAILY_DIFFICULTY[i]}`
        const seen = shown.get(key) ?? new Set<string>()
        if (seen.has(q.id)) {
          // Picture decks borrow from other difficulties, so they only repeat once every country is used.
          const picture = cats[i].id === 'flag' || cats[i].id === 'outline'
          const pool = picture ? ([1, 2, 3, 4, 5] as const).flatMap((d) => bankFor(cats[i].id, d)) : bankFor(cats[i].id, DAILY_DIFFICULTY[i])
          const eligible = pool.filter((x) => !x.since || dailyNumber(x.since) <= n)
          expect(eligible.every((x) => seen.has(x.id)), `launch ${n} repeats ${q.id}`).toBe(true)
        }
        shown.set(key, seen.add(q.id))
      })
    }
  })

  it('keeps new questions out of Practice until their date', () => {
    const since = ADDITIONS[0].since
    const added = new Set(allQuestions().filter((q) => q.since === since).map((q) => q.id))
    const seenBefore = new Set<string>(), seenAfter = new Set<string>()
    const rand = seeded('practice-test')
    for (let i = 0; i < 2000; i++) {
      seenBefore.add(nextPracticeQuestion('mixed', i % MAX_HEIGHT, new Set(), rand, '2026-10-19').question.id)
      seenAfter.add(nextPracticeQuestion('mixed', i % MAX_HEIGHT, new Set(), rand, since).question.id)
    }
    expect([...seenBefore].some((id) => added.has(id))).toBe(false)
    expect([...seenAfter].some((id) => added.has(id))).toBe(true)
  })

  it('dates every batch of added questions on or after the switch, oldest first', () => {
    const dates = ADDITIONS.map((a) => a.since)
    expect([...dates].sort()).toEqual(dates)
    for (const d of dates) expect(d >= DEALER_SWITCH, d).toBe(true)
  })
})
