import { describe, expect, it } from 'vitest'
import type { AppData, DailyResult } from '../types'
import * as server from '../../server/scores.ts'
import { DAILY_LENGTH, DAILY_POINTS, EPOCH, dailyCategories, MAX_POINTS, dailyDate, dailyHeight, dailyNumber, dailyPoints, dailyQuestions, dailyTopic, shareText } from './daily'
import { standingFrom, standingText } from './standing'
import { emptyData, migrate } from './data'
import { addDays, longestStreak, streak } from './dates'
import { mergeAppData } from './merge'
import { DISCOVERIES, dailyStreak, newlyFound } from './discoveries'
import { MAX_FUEL, answerPractice, nextPracticeQuestion, startPractice } from './practice'
import { MAX_HEIGHT, formatAltitude, heightToKm, zoneAt } from './space'

const result = (date: string, answers: boolean[], finishedAt: number | null = 1): DailyResult => ({
  date,
  number: dailyNumber(date),
  topic: dailyTopic(dailyNumber(date)),
  answers,
  height: dailyHeight(answers),
  startedAt: 0,
  finishedAt,
})

describe('daily launch', () => {
  it('numbers days from the epoch', () => {
    expect(dailyNumber(EPOCH)).toBe(1)
    expect(dailyNumber(addDays(EPOCH, 9))).toBe(10)
    expect(dailyDate(10)).toBe(addDays(EPOCH, 9))
  })

  it('gives every question its own category, with the core six every day', () => {
    for (let n = 1; n <= 30; n++) {
      const cats = dailyCategories(n)
      const ids = cats.map((c) => c.id)
      expect(new Set(ids).size, `day ${n}`).toBe(DAILY_LENGTH)
      for (const core of ['science', 'math', 'history', 'geography', 'flag', 'outline']) expect(ids, `day ${n}`).toContain(core)
      dailyQuestions(n).forEach((q, i) => {
        const id = cats[i].id
        if (id === 'flag' || id === 'outline') expect(q.question.image?.kind).toBe(id)
        else expect([q.question.topic, q.question.image]).toEqual([id, undefined])
      })
    }
    // The order changes from day to day.
    expect(dailyCategories(1).map((c) => c.id)).not.toEqual(dailyCategories(2).map((c) => c.id))
  })

  it('deals the same seven questions every time, easiest first', () => {
    const a = dailyQuestions(5)
    const b = dailyQuestions(5)
    expect(a).toHaveLength(DAILY_LENGTH)
    expect(a.map((q) => [q.question.id, q.choices.join('|'), q.answerIndex])).toEqual(b.map((q) => [q.question.id, q.choices.join('|'), q.answerIndex]))
    expect(a.map((q) => q.question.difficulty)).toEqual([1, 1, 2, 3, 3, 4, 5])
    for (const q of a) expect(q.choices[q.answerIndex]).toBe(q.question.answers[0])
  })

  it("doesn't repeat a question until its deck runs out", () => {
    const ids = Array.from({ length: 20 }, (_, i) => dailyQuestions(i + 1).map((q) => q.question.id)).flat()
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('climbs one milestone per right answer, and a perfect launch reaches the Galactic Center', () => {
    expect(dailyHeight(Array(7).fill(true))).toBe(MAX_HEIGHT)
    expect(dailyHeight([true, false, true])).toBe(2)
    expect(dailyHeight([false, false, false, false, false, false, true])).toBe(1)
  })

  it('builds a share grid', () => {
    expect(shareText(12, [true, true, true, false, true, true, false])).toBe('Zenith #12\n🟦🟦⬜⬛🟧🟪⬛  11/19 pts · 30 AU')
  })
})

describe('daily points', () => {
  it('scores each right answer by its difficulty, up to 19', () => {
    expect(MAX_POINTS).toBe(19)
    expect(dailyPoints(Array(7).fill(true))).toBe(19)
    expect(dailyPoints([true, true, true, true, true, true, false])).toBe(14)
    expect(dailyPoints([false, false, false, false, false, false, true])).toBe(5)
  })

  it('matches the copy the server scores with', () => {
    expect(server.DAILY_POINTS).toEqual(DAILY_POINTS)
    expect(server.EPOCH).toBe(EPOCH)
    const answers = [true, false, true, true, false, true, true]
    expect(server.pointsFor(answers)).toBe(dailyPoints(answers))
  })

  it('compares a score with everyone else on the launch', () => {
    const counts = Array(20).fill(0)
    counts[5] = 2
    counts[10] = 1 // you
    counts[19] = 1
    const s = standingFrom(counts, 10, true)
    expect(s).toEqual({ score: 10, others: 3, beat: 2 / 3 })
    expect(standingText(s, true)).toBe('You beat 66% of the 3 other players today.')
    expect(standingText(standingFrom(counts, 19, false), false)).toBe('That beats 75% of the 4 players who flew it.')
    expect(standingText(standingFrom([0, 1], 1, true), true)).toMatch(/first to finish/)
    expect(standingText(standingFrom([1, 1], 1, true), true)).toBe('You beat the one other player today!')
  })
})

describe('practice flight', () => {
  it('climbs on right answers with a streak bonus, and costs fuel on misses', () => {
    let s = startPractice()
    const gains: number[] = []
    for (let i = 0; i < 5; i++) {
      const step = answerPractice(s, true)
      gains.push(Math.round(step.gained * 1e4) / 1e4)
      s = step.state
    }
    // A Near Earth step is 2/7 of a milestone; 3 in a row adds 25%, 5 in a row 50%.
    expect(gains).toEqual([0.2857, 0.2857, 0.3571, 0.3571, 0.4286])
    expect(s.bestStreak).toBe(5)
    s = answerPractice(s, false).state
    expect(s.fuel).toBe(MAX_FUEL - 1)
    expect(s.streak).toBe(0)
  })

  it('refills a fuel cell in each new zone and ends when the cells are empty', () => {
    let s = { ...startPractice(), height: 1.9, fuel: 1 }
    const step = answerPractice(s, true)
    expect(step.enteredZone).toBe(1)
    expect(step.state.fuel).toBe(2)
    s = answerPractice(answerPractice(step.state, false).state, false).state
    expect(s.over).toBe('fuel')
    expect(answerPractice(s, true).state).toBe(s)
  })

  it('stops at the Galactic Center', () => {
    const s = answerPractice({ ...startPractice(), height: MAX_HEIGHT - 0.01 }, true).state
    expect(s.height).toBe(MAX_HEIGHT)
    expect(s.over).toBe('top')
  })

  it('asks questions matching the zone and avoids repeats', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 8; i++) {
      const q = nextPracticeQuestion('history', 5.5, seen)
      expect(q.question.difficulty).toBe(zoneAt(5.5).difficulty)
      expect(seen.has(q.question.id)).toBe(false)
      seen.add(q.question.id)
    }
  })
})

describe('altitude', () => {
  it('shows each milestone at its real distance, in a unit that fits', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(formatAltitude)).toEqual(['100 km', '408 km', '384,400 km', '1.5 AU', '30 AU', '4.2 ly', '26,000 ly'])
    expect(formatAltitude(0)).toBe('0 km')
  })

  it('climbs smoothly between milestones', () => {
    expect(heightToKm(0.5)).toBe(50)
    expect(heightToKm(2.5)).toBeGreaterThan(408)
    expect(heightToKm(2.5)).toBeLessThan(384_400)
  })

  it('puts each daily question in the zone of its difficulty when every answer is right', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map((h) => zoneAt(h).difficulty)).toEqual([1, 1, 2, 3, 3, 4, 5])
  })
})

describe('streaks', () => {
  it('counts consecutive days ending today or yesterday', () => {
    const today = '2026-10-20'
    expect(streak(['2026-10-18', '2026-10-19', '2026-10-20'], today)).toBe(3)
    expect(streak(['2026-10-18', '2026-10-19'], today)).toBe(2)
    expect(streak(['2026-10-17'], today)).toBe(0)
    expect(longestStreak(['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07'])).toBe(3)
  })

  it('only finished Daily Launches count', () => {
    const data: AppData = { ...emptyData(), daily: { '2026-10-19': result('2026-10-19', [true]), '2026-10-20': result('2026-10-20', [true], null) } }
    expect(dailyStreak(data, '2026-10-20')).toBe(1)
  })
})

describe('saves', () => {
  it('migrates a Funmental save to an empty save that keeps the profile', () => {
    const old = { version: 1, profile: { name: 'Sam', createdAt: 5 }, subjects: {}, sessions: [{}], activeDays: ['2026-01-01'] }
    const data = migrate(old)
    expect(data).toEqual({ ...emptyData(5), profile: { name: 'Sam', createdAt: 5 } })
  })

  it('migrates a Fathom save: depths become heights and discoveries are found again', () => {
    const answers = [true, true, true, true, false, true, false]
    const old = {
      version: 2,
      profile: { name: 'Sam', createdAt: 5 },
      daily: { '2026-10-09': { date: '2026-10-09', number: 1, topic: 'general', answers, depth: 4500, startedAt: 1, finishedAt: 2 } },
      practice: [{ id: 'p', topic: 'mixed', startedAt: 1, endedAt: 2, maxDepth: 3250, answered: 9, correct: 8, bestStreak: 5, endReason: 'oxygen' }],
      creatures: { clownfish: { spottedAt: 1 } },
    }
    const data = migrate(old, 99)
    expect(data.version).toBe(3)
    // Its one-topic launch doesn't match today's questions, so it's dropped; what it earned stays.
    expect(data.daily).toEqual({})
    expect(data.practice[0]).toMatchObject({ maxHeight: 4.5, endReason: 'fuel' })
    expect(Object.keys(data.discoveries)).toEqual(expect.arrayContaining(['sputnik', 'hubble', 'moon', 'mars', 'jupiter', 'neptune']))
    expect(data.discoveries).not.toHaveProperty('clownfish')
  })

  it('drops launches from before Daily Mix', () => {
    const mix = result('2026-10-10', Array(7).fill(true))
    const saved = { ...emptyData(), daily: { '2026-10-09': { ...mix, date: '2026-10-09', topic: 'general' }, '2026-10-10': mix } }
    expect(Object.keys(migrate(saved).daily)).toEqual(['2026-10-10'])
  })

  it('merging keeps the first finished result for a day', () => {
    const local = { ...emptyData(), daily: { d: { ...result('2026-10-10', [true, true, true, true, true, true, true]), finishedAt: 200 } } }
    const remote = { ...emptyData(), daily: { d: { ...result('2026-10-10', [false, false, false, false, false, false, false]), finishedAt: 100 } } }
    expect(mergeAppData(local, remote).daily.d.finishedAt).toBe(100)
    expect(mergeAppData(remote, local).daily.d.finishedAt).toBe(100)
    // A finished dive beats one still in progress.
    const partial = { ...emptyData(), daily: { d: result('2026-10-10', [true, true], null) } }
    expect(mergeAppData(partial, remote).daily.d.finishedAt).toBe(100)
  })

  it('merging unions practice flights and keeps the earliest discoveries', () => {
    const p = (id: string) => ({ id, topic: 'mixed' as const, startedAt: Number(id), endedAt: 0, maxHeight: 1, answered: 1, correct: 1, bestStreak: 1, endReason: 'quit' as const })
    const a = { ...emptyData(), practice: [p('1'), p('2')], discoveries: { sputnik: { spottedAt: 50 } } }
    const b = { ...emptyData(), practice: [p('2'), p('3')], discoveries: { sputnik: { spottedAt: 20 } } }
    const m = mergeAppData(a, b)
    expect(m.practice.map((x) => x.id)).toEqual(['3', '2', '1'])
    expect(m.discoveries.sputnik.spottedAt).toBe(20)
  })
})

describe('discoveries', () => {
  it('finds discoveries from launch history', () => {
    const data: AppData = { ...emptyData(), daily: { '2026-10-10': result('2026-10-10', Array(7).fill(true)) } }
    const found = Object.keys(newlyFound(data))
    expect(found).toEqual(expect.arrayContaining(['sputnik', 'hubble', 'moon', 'mars', 'neptune', 'proxima', 'galactic-center']))
    expect(found).not.toContain('black-hole')
  })

  it('every discovery has a unique id', () => {
    expect(new Set(DISCOVERIES.map((c) => c.id)).size).toBe(DISCOVERIES.length)
  })
})
