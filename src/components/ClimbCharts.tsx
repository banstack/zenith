import { dailyHeight } from '../lib/daily'
import { MAX_HEIGHT, MILESTONES, ZONES, heightScale, scoreAt } from '../lib/space'
import { RocketIcon } from './Icons'

/** Ladder position for a height, as a % from the bottom; the lowest slice is Earth. */
const EARTH = 11
const pos = (h: number) => EARTH + heightScale(h) * (100 - EARTH - 6)

/** Space as a cross-section: Earth at the bottom, one flat band per zone, and a rung for each milestone. */
export function AltitudeLadder({ height = 0 }: { height?: number }) {
  // The rocket sits on the last stop you passed.
  const passed = Math.floor(height + 1e-9)
  return (
    <div className="ladder" role="img" aria-label={`Seven milestones from Earth to the Galactic Center, scored up to 1,000. You're at ${scoreAt(height)}.`}>
      {ZONES.map((z, i) => (
        <div
          key={z.id}
          className="ladder-band"
          style={{ bottom: `${pos(z.from)}%`, top: i === ZONES.length - 1 ? 0 : `${100 - pos(z.to)}%`, background: z.color }}
        >
          <span>{z.name}</span>
        </div>
      ))}
      <div className="earth" style={{ height: `${EARTH * 2}%` }} />
      {passed === 0 && (
        <span className="rung you" style={{ bottom: `${EARTH - 4}%` }}>
          <RocketIcon size={18} />
          Launch pad
        </span>
      )}
      {MILESTONES.map((m, i) => (
        <span key={m.name} className={`rung ${height >= i + 1 ? 'reached' : ''} ${passed === i + 1 ? 'you' : ''} ${i + 1 === MAX_HEIGHT ? 'top' : ''}`} style={{ bottom: `${pos(i + 1)}%` }}>
          {passed === i + 1 ? <RocketIcon size={18} /> : <i />}
          {scoreAt(i + 1)}
          <small>{m.name}</small>
        </span>
      ))}
    </div>
  )
}

const W = 320
const H = 150
const x = (i: number) => 10 + (i * (W - 70)) / 7
const y = (h: number) => H - 8 - heightScale(h) * (H - 16)
const LABELLED = [3, 5, 7]

function steps(heights: readonly number[]): string {
  let d = `M${x(0)} ${y(0)}`
  heights.forEach((h, i) => (d += ` H${x(i + 1)} V${y(h)}`))
  return d
}

/** A flight-log profile: the climb if every answer were right dashed, the actual one solid. */
export function ClimbProfile({ answers }: { answers: readonly boolean[] }) {
  const actual = answers.map((_, i) => dailyHeight(answers.slice(0, i + 1)))
  const height = actual.at(-1) ?? 0
  return (
    <svg className="profile" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Climb profile, ending at ${scoreAt(height)} points`}>
      {LABELLED.map((h) => (
        <g key={h}>
          <line className="profile-grid" x1={x(0)} x2={W - 4} y1={y(h)} y2={y(h)} />
          <text className="profile-label" x={W - 4} y={y(h) - 3} textAnchor="end">
            {MILESTONES[h - 1].name}
          </text>
        </g>
      ))}
      <path className="profile-plan" d={steps(MILESTONES.map((_, i) => i + 1))} />
      <path className="profile-line" d={steps(actual)} />
      <circle className="profile-end" cx={x(actual.length)} cy={y(height)} r="4" />
    </svg>
  )
}
