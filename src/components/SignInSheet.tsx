import { useEffect, useRef, useState } from 'react'
import { AuthForm } from './AccountPanel'
import { DISCOVERIES, dailyStreak } from '../lib/discoveries'
import { closeSignIn, useSignInRequest } from '../lib/signIn'
import { useAppData } from '../lib/store'

const TOAST_MS = 4000

/** The sign-in sheet every "Sign in" button opens, plus the toast that confirms it. */
export function SignInSheet() {
  const request = useSignInRequest()
  const dialog = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [signedIn, setSignedIn] = useState<string | null>(null)

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (request && !d.open) {
      setMode(request.mode ?? 'signup')
      d.showModal()
    } else if (!request && d.open) {
      d.close()
    }
  }, [request])

  useEffect(() => {
    if (!signedIn) return
    const t = setTimeout(() => setSignedIn(null), TOAST_MS)
    return () => clearTimeout(t)
  }, [signedIn])

  return (
    <>
      <dialog
        ref={dialog}
        className="sheet"
        aria-labelledby="sign-in-title"
        onClose={closeSignIn}
        onClick={(e) => e.target === e.currentTarget && closeSignIn()}
      >
        {request && (
          <div className="sheet-body">
            <div className="sheet-head">
              <h2 id="sign-in-title">{mode === 'signup' ? 'Keep your climb on every device' : 'Welcome back'}</h2>
              <button className="icon-btn" onClick={closeSignIn} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <SheetIntro mode={mode} />
            <AuthForm
              initialEmail={request.email}
              initialMode={request.mode}
              onModeChange={setMode}
              onSuccess={(email) => {
                closeSignIn()
                setSignedIn(email)
              }}
            />
          </div>
        )}
      </dialog>
      {signedIn && (
        <div className="toast" role="status">
          <div className="toast-body">
            <strong>Signed in as {signedIn}</strong>
            <span className="muted small">Your progress now syncs to every device you sign in on.</span>
          </div>
        </div>
      )}
    </>
  )
}

function SheetIntro({ mode }: { mode: 'login' | 'signup' }) {
  const data = useAppData()
  if (mode === 'login') return <p className="muted">Progress on this device is merged into your account, so nothing is lost.</p>

  const days = dailyStreak(data)
  const found = DISCOVERIES.filter((c) => data.discoveries[c.id]).length
  const kept = [days > 1 && `your ${days}-day streak`, found > 0 && `${found} ${found === 1 ? 'discovery' : 'discoveries'}`].filter(Boolean)
  return (
    <p className="muted">
      {kept.length ? `Create an account and ${kept.join(' and ')} come with you.` : 'Create an account and everything on this device comes with you.'}
    </p>
  )
}
