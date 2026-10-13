import { memo } from 'react'
import { DISCOVERIES } from '../lib/discoveries'
import { seeded } from '../lib/rng'
import { ZONES, formatAltitude, heightScale, zoneAt, zoneIndexAt } from '../lib/space'
import { DiscoveryIcon, RocketIcon } from './Icons'

/** Star positions per zone: more of them the farther from Earth you get. */
const STARS = ZONES.map((z, i) => {
  const rand = seeded(`stars:${z.id}`)
  return Array.from({ length: 12 + i * 22 }, () => ({ x: rand() * 100, y: rand() * 100, big: rand() < 0.15, o: 0.35 + rand() * 0.65 }))
})

/** The sky behind a flight: one flat color per zone, stepping darker as you climb, with stars and the zone's discoveries drifting past. */
export function Sky({ height }: { height: number }) {
  return <ZoneSky index={zoneIndexAt(height)} />
}

// The height rolls every frame during a climb; the sky only changes with the zone.
const ZoneSky = memo(function ZoneSky({ index }: { index: number }) {
  const zone = ZONES[index]
  const drifters = DISCOVERIES.filter((c) => c.zone === zone.id)
  return (
    <div className={`sky zone-${zone.id}`} style={{ background: zone.color }} aria-hidden>
      {STARS[index].map((s, i) => (
        <i key={i} className={`star ${s.big ? 'big' : ''}`} style={{ left: `${s.x}%`, top: `${s.y}%`, opacity: s.o }} />
      ))}
      {drifters.map((c, i) => (
        <span key={c.id} className="drifter" style={{ top: `${18 + i * 24}%`, animationDelay: `${-i * 9}s`, animationDuration: `${34 + i * 8}s` }}>
          <DiscoveryIcon id={c.id} size={56} />
        </span>
      ))}
    </div>
  )
})

const gaugePos = (h: number) => (1 - heightScale(h)) * 100

/** Vertical altitude gauge: the zones as flat bands, Earth at the bottom, with a rocket at your height. */
export function AltitudeGauge({ height }: { height: number }) {
  return (
    <div className="gauge" role="img" aria-label={`Altitude ${formatAltitude(height)}, ${zoneAt(height).name}`}>
      {ZONES.map((z) => (
        <span key={z.id} className="gauge-band" style={{ top: `${gaugePos(z.to)}%`, height: `${gaugePos(z.from) - gaugePos(z.to)}%`, background: z.color }} title={z.name} />
      ))}
      <span className="gauge-marker" style={{ top: `${gaugePos(height)}%` }}>
        <RocketIcon size={18} />
      </span>
    </div>
  )
}
