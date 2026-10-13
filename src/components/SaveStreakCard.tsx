import { useState } from 'react'
import { FlameIcon } from './Icons'
import { dailyStreak } from '../lib/discoveries'
import { SAVE_PROMPT_MIN_STREAK, openSignIn, savePromptSnoozed, snoozeSavePrompt } from '../lib/signIn'
import { useAppData } from '../lib/store'
import { useSync } from '../lib/sync'

/** After the Daily Launch: a signed-out player with a streak going is offered an account to keep it. */
export function SaveStreakCard() {
  const data = useAppData()
  const sync = useSync()
  const [email, setEmail] = useState('')
  const [hidden, setHidden] = useState(savePromptSnoozed)
  const days = dailyStreak(data)

  if (!sync.available || sync.user || hidden || days < SAVE_PROMPT_MIN_STREAK) return null

  return (
    <form
      className="save-card"
      onSubmit={(e) => {
        e.preventDefault()
        openSignIn({ email, mode: 'signup' })
      }}
    >
      <h2 className="with-icon">
        <FlameIcon size={20} /> Save your {days}-day streak
      </h2>
      <p className="muted">Right now it only lives in this browser. Add an email to keep it on any device.</p>
      <label className="save-card-field">
        <span>Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </label>
      <div className="row">
        <button className="btn primary" type="submit">
          Save my progress
        </button>
        <button
          className="btn quiet"
          type="button"
          onClick={() => {
            snoozeSavePrompt()
            setHidden(true)
          }}
        >
          Not now
        </button>
      </div>
    </form>
  )
}
