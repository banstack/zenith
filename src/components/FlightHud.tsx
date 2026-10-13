import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatAltitude, zoneAt } from '../lib/space'
import { AltitudeGauge, Sky } from './Sky'
import { SoundToggle } from './SoundToggle'

/**
 * The frame around a flight: sky, gauge, altitude readout, and a slot for progress (dots or fuel cells).
 * On phones the site header hides and this HUD folds into one row, with `exitTo` as the way out.
 */
export function FlightFrame({ height, title, status, banner, exitTo, children }: { height: number; title: string; status: ReactNode; banner?: string | null; exitTo: string; children: ReactNode }) {
  return (
    <div className="flight">
      <Sky height={height} />
      <AltitudeGauge height={height} />
      <header className="flight-hud">
        <Link to={exitTo} className="flight-exit" aria-label="Leave flight">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
        <div className="hud-left">
          <span className="eyebrow">{title}</span>
          <div className="altitude-readout" aria-live="polite">
            {formatAltitude(height)}
          </div>
          <span className="zone-name">{zoneAt(height).name}</span>
        </div>
        <div className="hud-right">
          {status}
          <SoundToggle />
        </div>
      </header>
      {banner && (
        <div className="zone-banner" role="status" key={banner}>
          Entering {banner}
        </div>
      )}
      <div className="flight-body">{children}</div>
    </div>
  )
}

/** One dot per daily question: filled by zone color when right, dark when missed. */
export function ProgressDots({ answers, total, zoneOf }: { answers: readonly boolean[]; total: number; zoneOf: (i: number) => string }) {
  return (
    <div className="dots" aria-label={`Question ${Math.min(answers.length + 1, total)} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`dot ${i < answers.length ? (answers[i] ? `hit z-${zoneOf(i)}` : 'miss') : i === answers.length ? 'current' : ''}`} />
      ))}
    </div>
  )
}

export function FuelCells({ fuel, max }: { fuel: number; max: number }) {
  return (
    <div className="fuel-cells" aria-label={`${fuel} of ${max} fuel cells left`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`cell ${i < fuel ? 'full' : 'empty'}`} />
      ))}
    </div>
  )
}
