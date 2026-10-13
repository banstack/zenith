import { useEffect, useRef } from 'react'
import { CLIMB_DELAY, clamp01, prefersReducedMotion } from '../lib/climb'
import { seeded } from '../lib/rng'
import { CLIMB_SECONDS } from '../lib/sound'
import { MAX_HEIGHT, MILESTONES, ZONES, zoneIndexAt } from '../lib/space'

interface Props {
  /** The height being shown right now (rolls up during a climb). */
  height: number
  /** Where the ship is headed; a rise starts the climb animation. */
  target: number
  /** Changes on every miss, which plays the hold animation. */
  holdKey: number
  /** Small line above the next stop, e.g. "Q3 of 7 · History · Medium". */
  label: string
}

const ROCKET = 'M12 1.5c3.5 2.6 5 6.3 5 10.5v5H7v-5c0-4.2 1.5-7.9 5-10.5zM7 13l-3.5 3.5V20L7 18zM17 13l3.5 3.5V20L17 18zM9.5 18h5l-1 4h-3z'

const LABEL_FONT = '600 10.5px "Instrument Sans", system-ui, sans-serif'
const STOP_FONT = '800 14px "Bricolage Grotesque", system-ui, sans-serif'

const STARS = (() => {
  const rand = seeded('flight-window')
  return Array.from({ length: 90 }, () => ({ x: rand(), y: rand(), depth: 0.4 + rand() * 0.9, o: 0.35 + rand() * 0.6, big: rand() < 0.15 }))
})()

const bump = (t: number, a: number, b: number) => {
  const u = (t - a) / (b - a)
  return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u)
}

/** Each milestone as a small flat shape: a dashed line for the edge of space, the station, then bodies. */
function drawStop(ctx: CanvasRenderingContext2D, m: number, x: number, y: number, r: number) {
  const disc = (cx: number, cy: number, rr: number, color: string) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(cx, cy, rr, 0, Math.PI * 2)
    ctx.fill()
  }
  if (m === 0) {
    ctx.strokeStyle = 'rgb(255 255 255 / 0.85)'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(x - r * 2.2, y)
    ctx.lineTo(x + r * 2.2, y)
    ctx.stroke()
    ctx.setLineDash([])
  } else if (m === 1) {
    ctx.fillStyle = '#9fc3ff'
    ctx.fillRect(x - r * 1.6, y - r * 0.55, r * 1.05, r * 1.1)
    ctx.fillRect(x + r * 0.55, y - r * 0.55, r * 1.05, r * 1.1)
    ctx.fillStyle = '#e8eef7'
    ctx.fillRect(x - r * 0.55, y - r * 0.35, r * 1.1, r * 0.7)
  } else if (m === 2) {
    disc(x, y, r, '#e4e2ea')
    disc(x - r * 0.35, y - r * 0.25, r * 0.28, '#c4c0d0')
    disc(x + r * 0.35, y + r * 0.3, r * 0.2, '#c4c0d0')
  } else if (m === 3) {
    disc(x, y, r, '#d4673f')
    disc(x + r * 0.25, y - r * 0.2, r * 0.35, '#b24f2c')
  } else if (m === 4) {
    disc(x, y, r, '#5b86ff')
    ctx.fillStyle = '#4a6fe0'
    ctx.fillRect(x - r, y - r * 0.15, r * 2, r * 0.3)
  } else if (m === 5) {
    disc(x, y, r, '#ff9a5a')
    disc(x, y, r * 0.55, '#ffd0a8')
  } else {
    ctx.fillStyle = '#f3e1a0'
    ctx.beginPath()
    ctx.ellipse(x, y, r * 1.7, r * 0.55, -0.35, 0, Math.PI * 2)
    ctx.fill()
    disc(x, y, r * 0.5, '#fff6d8')
  }
}

/**
 * A short band under the HUD that always shows the ship. A right answer fires
 * the engine and flies it past the next stop while the stars streak; a miss
 * makes the engine sputter and the ship hold its place.
 */
export function FlightWindow({ height, target, holdKey, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const props = useRef({ height, target, holdKey, label })
  useEffect(() => {
    props.current = { height, target, holdKey, label }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const rocket = new Path2D(ROCKET)
    const still = prefersReducedMotion()
    let raf = 0
    let last = performance.now()
    let offset = 0
    let shownBefore = props.current.height
    let target = props.current.target
    let holdKey = props.current.holdKey
    let anim: { kind: 'climb' | 'hold'; t0: number; from: number; to: number } | null = null

    const frame = (now: number) => {
      const p = props.current
      const t = now / 1000
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (p.target > target) anim = { kind: 'climb', t0: t, from: target, to: p.target }
      else if (p.holdKey !== holdKey) anim = { kind: 'hold', t0: t, from: p.target, to: p.target }
      target = p.target
      holdKey = p.holdKey
      const lt = anim ? t - anim.t0 : Infinity
      if (lt > 3) anim = null

      // Size to the element, at up to 2x for sharp edges.
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const W = rect.width
      const H = rect.height
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr)
        canvas.height = Math.round(H * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const h = p.height
      const dH = h - shownBefore
      shownBefore = h
      const z = zoneIndexAt(h)
      offset += dH * 2.4 + (still ? 0 : dt * 0.03)

      // Sky: the zone's flat color, a shade lighter so the band reads against the page.
      ctx.fillStyle = ZONES[z].color
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = 'rgb(255 255 255 / 0.08)'
      ctx.fillRect(0, 0, W, H)

      // The text in the top left, measured first so stars stay out from behind it.
      const top = h >= MAX_HEIGHT - 1e-6
      const stop = top ? 'Galactic Center reached' : `Next stop: ${MILESTONES[Math.min(MAX_HEIGHT - 1, Math.floor(h + 1e-6))].name}`
      ctx.font = LABEL_FONT
      const labelW = ctx.measureText(p.label).width
      ctx.font = STOP_FONT
      const textRight = 12 + Math.max(labelW, ctx.measureText(stop).width) + 6

      // Stars, more of them farther out; they streak while you climb.
      const streak = still ? 0 : Math.abs(dH) * H * 4.5
      ctx.fillStyle = '#fff'
      for (let i = 0; i < 26 + z * 16; i++) {
        const s = STARS[i]
        const y = ((((s.y + offset * s.depth) % 1) + 1) % 1) * (H + 20) - 10
        const size = s.big ? 2.4 : 1.4
        const len = Math.max(size, Math.min(36, streak * s.depth))
        if (s.x * W < textRight && y - len < 44) continue
        ctx.globalAlpha = s.o
        ctx.fillRect(s.x * W, y - len, size, len)
      }
      ctx.globalAlpha = 1

      // Earth's surface below the launch pad.
      if (h < 1) {
        ctx.fillStyle = '#2e8a6e'
        ctx.fillRect(0, H - 10 + h * (H + 20), W, 40)
      }

      // The next stop waits ahead and slides past as you reach it; the one after drops in from above.
      const ox = W - Math.min(56, W * 0.16)
      const oy = H * 0.5
      for (let m = 0; m < MILESTONES.length; m++) {
        const d = m + 1 - h
        if (d <= -0.05 || d >= 2) continue
        const y = d <= 1 ? oy + (1 - d) * (H + 10) : oy - (d - 1) * (H * 0.9)
        drawStop(ctx, m, ox, y, 10 + clamp01(1 - d) * 7)
      }

      // Label and next stop, top left.
      ctx.font = LABEL_FONT
      ctx.fillStyle = 'rgb(255 255 255 / 0.8)'
      ctx.fillText(p.label, 12, 19)
      ctx.font = STOP_FONT
      ctx.fillStyle = '#fff'
      ctx.fillText(stop, 12, 37)

      // The ship: a steady flicker at rest, a long burn on a climb, a sputter and a dip on a miss.
      let lift = 0
      let flame = still ? 5 : 4.5 + Math.random() * 2.2
      let rot = 0
      if (anim && !still) {
        if (anim.kind === 'climb') {
          lift = -7 * bump(lt, CLIMB_DELAY, CLIMB_DELAY + CLIMB_SECONDS + 0.2)
          flame += 16 * bump(lt, 0, CLIMB_DELAY + CLIMB_SECONDS + 0.25)
        } else {
          lift = 5 * bump(lt, 0.05, 0.8)
          if (lt < 0.75) flame = Math.floor(lt * 16) % 2 ? 0.5 : 7
          rot = 0.12 * Math.sin(lt * 26) * clamp01(1 - lt / 0.8)
        }
      }
      const sx = W * 0.5
      const sy = H * 0.68 + lift
      ctx.save()
      ctx.translate(sx, sy)
      ctx.rotate(rot)
      ctx.scale(28 / 24, 28 / 24)
      ctx.translate(-12, -12)
      if (flame > 0.3) {
        const L = flame / (28 / 24)
        ctx.fillStyle = '#ff6b3d'
        ctx.beginPath()
        ctx.moveTo(9.6, 21.5)
        ctx.lineTo(14.4, 21.5)
        ctx.lineTo(12, 22 + L)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.moveTo(10.8, 21.5)
        ctx.lineTo(13.2, 21.5)
        ctx.lineTo(12, 22 + L * 0.55)
        ctx.fill()
      }
      ctx.fillStyle = '#ffb627'
      ctx.fill(rocket)
      ctx.fillStyle = '#241500'
      ctx.beginPath()
      ctx.arc(12, 9.5, 1.7, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // A word beside the ship: the stop you reached, or that you're holding.
      if (anim) {
        const fade = anim.kind === 'climb' ? bump(lt, 0.7, 2.4) : bump(lt, 0.05, 1.6)
        if (fade > 0) {
          const crossed = Math.floor(anim.to + 1e-6) > Math.floor(anim.from + 1e-6)
          const word = anim.kind === 'hold' ? 'Holding' : crossed ? `${MILESTONES[Math.floor(anim.to + 1e-6) - 1].name}!` : 'Climbing'
          ctx.globalAlpha = Math.min(1, fade * 1.6)
          ctx.font = '700 11px "Instrument Sans", system-ui, sans-serif'
          ctx.fillStyle = '#fff'
          ctx.fillText(word, sx + 22, H * 0.68 + 4 - (anim.kind === 'climb' && !still ? (lt - 0.7) * 8 : 0))
          ctx.globalAlpha = 1
        }
      }

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={canvasRef} className="flight-window" aria-hidden />
}
