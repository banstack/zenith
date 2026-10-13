import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { dailyStreak } from '../lib/discoveries'
import { openSignIn } from '../lib/signIn'
import { useAppData } from '../lib/store'
import { useSync } from '../lib/sync'
import { Avatar } from './Avatar'
import { DiscoveryToaster } from './DiscoveryToaster'
import { FlameIcon } from './Icons'
import { SignInSheet } from './SignInSheet'

const LINKS = [
  { to: '/', label: 'Today', end: true },
  { to: '/practice', label: 'Practice' },
]

export function Layout() {
  const data = useAppData()
  const sync = useSync()
  const days = dailyStreak(data)
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const signedOut = sync.available === true && !sync.user
  const dot = sync.user ? (sync.status === 'offline' || sync.status === 'error' ? 'warn' : 'ok') : undefined
  const syncLabel = sync.user ? (dot === 'ok' ? ', synced' : ', not synced') : ''

  const signInButton = signedOut && (
    <button className="btn ghost small sign-in-btn" onClick={() => (close(), openSignIn())}>
      Sign in
    </button>
  )

  const profileChip = (
    <NavLink to="/star-chart" className="profile-chip" aria-label={`Star chart, ${days} day streak${syncLabel}`} onClick={close}>
      <Avatar name={data.profile.name} size="sm" dot={dot} />
      <span className="streak">
        <FlameIcon size={15} /> {days}
      </span>
    </NavLink>
  )

  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="logo" onClick={close}>
          zenith
        </NavLink>
        <nav className="nav-links" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}
          {signInButton}
          {profileChip}
        </nav>
        {/* Small screens: profile chip stays visible, the rest moves into a menu. */}
        <div className="nav-compact">
          {signInButton}
          {profileChip}
          <button
            className="menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className="mobile-menu-backdrop" onClick={close} aria-hidden />
          <nav id="mobile-menu" className="mobile-menu" aria-label="Main">
            {[...LINKS, { to: '/star-chart', label: 'Star chart', end: false }].map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} onClick={close}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </>
      )}

      <main className="main">
        <Outlet />
      </main>
      <DiscoveryToaster />
      <SignInSheet />
    </div>
  )
}
