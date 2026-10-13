import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useRolledHeight } from '../lib/climb'
import { regionName, scoreAt } from '../lib/space'
import { FlightWindow } from './FlightWindow'
import { AltitudeGauge, Sky } from './Sky'
import { SoundToggle } from './SoundToggle'

interface FrameProps {
  height: number
  title: string
  status: ReactNode
  /** The line above the next stop in the flight window, e.g. "Q3 of 7 · History · Medium". */
  label: string
  /** Changes on every miss, so the ship plays its hold. */
  holdKey: number
  banner?: string | null
  exitTo: string
  children: ReactNode
}

/**
 * The frame around a flight: sky, gauge, altitude readout, a slot for progress (dots or fuel cells),
 * and the flight window where the ship climbs or holds after each answer.
 * On phones the site header hides and this HUD folds into one row, with `exitTo` as the way out.
 */
export function FlightFrame({ height: target, title, status, label, holdKey, banner, exitTo, children }: FrameProps) {
  // Everything on screen follows the ship as it climbs, so the readout rolls up instead of jumping.
  const height = useRolledHeight(target)
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
            {scoreAt(height)}
            <span className="readout-unit">pts</span>
          </div>
          <span className="zone-name">{regionName(height)}</span>
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
      <div className="flight-body">
        <FlightWindow height={height} target={target} holdKey={holdKey} label={label} />
        {children}
      </div>
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
