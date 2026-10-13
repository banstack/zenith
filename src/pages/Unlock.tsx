import { useState } from 'react'
import { Link } from 'react-router-dom'
import { devUnlock, useSync } from '../lib/sync'
import { canDevUnlock, setDevUnlocked, useUnlocked } from '../lib/unlock'
import { TOPICS } from '../lib/topics'

/** What the full game includes. Payments aren't wired up yet, so the purchase button is a placeholder. */
export function Unlock() {
  const unlocked = useUnlocked()
  const sync = useSync()
  const [error, setError] = useState<string | null>(null)

  if (unlocked) {
    return (
      <div className="page narrow">
        <h1>You have the full game</h1>
        <p className="lead">Practice is unlocked. Launch as much as you like.</p>
        <Link to="/practice" className="btn primary">
          Go to Practice
        </Link>
      </div>
    )
  }

  return (
    <div className="page narrow paywall">
      <span className="eyebrow">Zenith: full game</span>
      <h1>Keep flying after today's launch</h1>
      <p className="lead">The Daily Launch is free forever. One purchase unlocks everything else, for good. There's no subscription.</p>
      <ul className="perks">
        <li>
          <strong>Unlimited Practice</strong> in all {TOPICS.length} topics, or Mixed
        </li>
        <li>
          <strong>Endless flights</strong> with fuel cells and streak boosts, from the edge of space to the Galactic Center
        </li>
        <li>
          <strong>Every past Daily Launch</strong> to replay
        </li>
        <li>
          <strong>Practice-only discoveries</strong> for your star chart
        </li>
      </ul>
      <div className="price">
        <strong>$4.99</strong> <span className="muted">one time</span>
      </div>
      <button className="btn primary big" disabled>
        Purchase (coming soon)
      </button>
      <p className="muted small">The purchase is tied to your account, so it carries over to all your devices.</p>

      {canDevUnlock && (
        <div className="panel dev-box">
          <strong>Developer unlock</strong>
          <p className="muted small">For testing until payments are connected. Not available in production.</p>
          <div className="row">
            <button className="btn ghost" onClick={() => setDevUnlocked(true)}>
              Unlock on this device
            </button>
            {sync.user && (
              <button className="btn ghost" onClick={async () => setError(await devUnlock())}>
                Unlock {sync.user.email}
              </button>
            )}
          </div>
          {error && <p className="auth-error">{error}</p>}
        </div>
      )}
    </div>
  )
}
