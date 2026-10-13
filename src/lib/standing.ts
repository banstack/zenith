import { useEffect, useState } from 'react'
import { dailyPoints } from './daily'

/**
 * How a Daily Launch compares with everyone else's. Scores go to the server
 * when there is one; without it (offline, or a static-only deploy) there's
 * simply no standing to show.
 */

// Kept from Apogee so existing players keep their id.
const PLAYER_KEY = 'apogee:player'

/** A random id this browser keeps, so a player without an account is counted once per launch. */
function playerId(): string {
  try {
    const saved = localStorage.getItem(PLAYER_KEY)
    if (saved) return saved
  } catch {
    // Storage blocked: fall through to a fresh id for this visit.
  }
  const id = crypto.randomUUID().replaceAll('-', '')
  try {
    localStorage.setItem(PLAYER_KEY, id)
  } catch {
    // ignore
  }
  return id
}

export interface Standing {
  /** Your points: the score on record for today's launch, else this attempt's. */
  score: number
  /** Everyone else who has a score for this launch. */
  others: number
  /** Share of those others you outscored, 0 to 1. */
  beat: number
}

/** `counts[s]` is how many players scored s. Set `included` when your own score is among them. */
export function standingFrom(counts: readonly number[], score: number, included: boolean): Standing {
  const total = counts.reduce((a, b) => a + b, 0)
  const others = Math.max(0, total - (included ? 1 : 0))
  const below = counts.slice(0, score).reduce((a, b) => a + b, 0)
  return { score, others, beat: others ? below / others : 0 }
}

/**
 * "You beat 72% of players today." For today's launch (`record`), this also
 * submits the score; for a replay it only compares.
 */
export function useStanding(n: number, answers: readonly boolean[], record: boolean): Standing | null {
  const [standing, setStanding] = useState<Standing | null>(null)
  const key = answers.map(Number).join('')

  useEffect(() => {
    let live = true
    const answers = [...key].map((c) => c === '1')
    const request = record
      ? fetch(`/api/daily/${n}/scores`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ player: playerId(), answers }),
        })
      : fetch(`/api/daily/${n}/scores`, { credentials: 'same-origin' })
    request
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { counts?: number[]; score?: number } | null) => {
        if (!live || !Array.isArray(data?.counts)) return
        const recorded = typeof data.score === 'number'
        setStanding(standingFrom(data.counts, recorded ? data.score! : dailyPoints(answers), recorded))
      })
      // No server, or offline: show no standing.
      .catch(() => {})
    return () => {
      live = false
    }
  }, [n, key, record])

  return standing
}

/** One line for the results screen. */
export function standingText(s: Standing, record: boolean): string {
  if (s.others === 0) return record ? "You're the first to finish today. Check back later to see how you compare." : 'Nobody has a score for this launch yet.'
  const count = s.others.toLocaleString('en-US')
  if (record) {
    if (s.others === 1) return s.beat === 1 ? 'You beat the one other player today!' : 'One other player has finished so far. Check back later to see how you compare.'
    return s.beat === 1 ? `You beat all ${count} other players today!` : `You beat ${Math.floor(s.beat * 100)}% of the ${count} other players today.`
  }
  const players = s.others === 1 ? 'the 1 player' : `the ${count} players`
  return `That beats ${Math.floor(s.beat * 100)}% of ${players} who flew it.`
}
