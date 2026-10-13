/**
 * Daily Launch scores, kept on the server so players can see how they compare.
 * The server can't import the app's code, so these mirror src/lib/daily.ts;
 * src/lib/zenith.test.ts checks that they agree.
 */

/** Zenith #1 is this date. */
export const EPOCH = '2026-10-09'

/** Points for each daily question, in order, out of 1,000; harder questions are worth more. */
export const DAILY_POINTS = [50, 50, 100, 150, 150, 200, 300]

export const MAX_POINTS = DAILY_POINTS.reduce((a, b) => a + b, 0)

/** Today's launch number by the UTC calendar. Players' local dates are within a day of it. */
export function utcDailyNumber(now = new Date()): number {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.round((today - Date.parse(`${EPOCH}T00:00:00Z`)) / 86_400_000) + 1
}

/** Only today's launch counts, give or take a day for time zones, so replays of old days stay out. */
export const isCurrentLaunch = (n: number, now = new Date()) => Math.abs(n - utcDailyNumber(now)) <= 1

export function pointsFor(answers: readonly boolean[]): number {
  return answers.reduce((sum, ok, i) => sum + (ok ? DAILY_POINTS[i] : 0), 0)
}

export const isAnswers = (v: unknown): v is boolean[] => Array.isArray(v) && v.length === DAILY_POINTS.length && v.every((a) => typeof a === 'boolean')

/** A random id the browser makes for itself, so anonymous players are counted once per launch. */
export const isPlayerId = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(v)
