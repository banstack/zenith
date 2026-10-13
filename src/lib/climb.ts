import { useEffect, useRef, useState } from 'react'
import { CLIMB_SECONDS } from './sound'

/** The engine lights a beat after the answer, then the climb runs as long as the thrust sound. */
export const CLIMB_DELAY = 0.1

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2)

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * The height to show while the ship climbs toward `target`: it eases up over
 * the climb so the altitude readout rolls through real distances instead of
 * jumping. Drops and reduced motion jump straight to the target.
 */
export function useRolledHeight(target: number): number {
  const [shown, setShown] = useState(target)
  const shownRef = useRef(target)

  useEffect(() => {
    const from = shownRef.current
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const u = target <= from || prefersReducedMotion() ? 1 : clamp01(((now - t0) / 1000 - CLIMB_DELAY) / CLIMB_SECONDS)
      const h = from + (target - from) * easeInOut(u)
      shownRef.current = h
      setShown(h)
      if (u < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])

  return shown
}
