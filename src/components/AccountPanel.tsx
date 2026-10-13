import { useState } from 'react'
import { logIn, logOut, signUp, useSync, type SyncState } from '../lib/sync'
import { openSignIn } from '../lib/signIn'

function statusText(s: SyncState): string {
  switch (s.status) {
    case 'syncing':
      return 'Syncing…'
    case 'synced':
      return s.lastSyncedAt ? `Synced at ${new Date(s.lastSyncedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : 'Synced'
    case 'offline':
      return "Offline. Changes are saved here and will sync when you're back online."
    case 'error':
      return s.error ?? 'Sync failed.'
    default:
      return 'Ready'
  }
}

/**
 * The account part of the Star chart header: who you're signed in as and
 * whether progress is synced, or a prompt to sign in. Hidden when there's no server.
 */
export function AccountStatus() {
  const sync = useSync()
  if (!sync.available) return null

  if (!sync.user) {
    return (
      <div className="account-status">
        <p className="sync-status">
          <span className="sync-dot" aria-hidden /> Guest pilot. Your progress is saved in this browser only.
        </p>
        <button className="btn primary" onClick={() => openSignIn()}>
          Sign in to keep your progress
        </button>
      </div>
    )
  }

  return (
    <div className="account-status signed-in">
      <div>
        <p>
          Signed in as <strong>{sync.user.email}</strong>
        </p>
        <p className={`sync-status ${sync.status}`} role="status">
          <span className="sync-dot" aria-hidden /> {statusText(sync)}
        </p>
      </div>
      <button className="btn ghost small" onClick={() => void logOut()}>
        Log out
      </button>
    </div>
  )
}

interface AuthFormProps {
  initialEmail?: string
  initialMode?: 'login' | 'signup'
  onModeChange?: (mode: 'login' | 'signup') => void
  onSuccess?: (email: string) => void
}

export function AuthForm({ initialEmail = '', initialMode = 'signup', onModeChange, onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err = await (mode === 'signup' ? signUp : logIn)(email, password)
    setBusy(false)
    if (err) setError(err)
    else onSuccess?.(email)
  }

  const switchMode = () => {
    const next = mode === 'signup' ? 'login' : 'signup'
    setMode(next)
    setError(null)
    onModeChange?.(next)
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="auth-fields">
        <label>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus={!initialEmail}
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            autoFocus={!!initialEmail}
            placeholder={mode === 'signup' ? 'At least 8 characters' : undefined}
            minLength={mode === 'signup' ? 8 : undefined}
            required
          />
        </label>
      </div>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn primary" type="submit" disabled={busy}>
        {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
      </button>
      <button type="button" className="link-btn" onClick={switchMode}>
        {mode === 'signup' ? 'Already have an account? Log in' : 'New here? Create an account'}
      </button>
    </form>
  )
}
