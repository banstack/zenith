import { useState } from 'react'
import { AccountStatus } from '../components/AccountPanel'
import { Avatar } from '../components/Avatar'
import { DiscoveryIcon, TopicIcon } from '../components/Icons'
import { DISCOVERIES, dailyStreak, longestDailyStreak } from '../lib/discoveries'
import { addDays, dateKey, fromKey } from '../lib/dates'
import { MAX_HEIGHT, ZONES, scoreAt, zoneAt } from '../lib/space'
import { setSoundOn, useSoundOn } from '../lib/sound'
import { resetAll, setProfileName, useAppData } from '../lib/store'
import { MIXED, TOPICS } from '../lib/topics'

const CALENDAR_WEEKS = 6

/** Your profile, stats and discoveries. */
export function StarChart() {
  const data = useAppData()
  const finished = Object.values(data.daily).filter((r) => r.finishedAt !== null)
  const highest = Math.max(0, ...finished.map((r) => r.height), ...data.practice.map((p) => p.maxHeight))
  const perfect = finished.filter((r) => r.height >= MAX_HEIGHT).length
  const found = DISCOVERIES.filter((c) => data.discoveries[c.id]).length

  const tiles = [
    { label: 'day streak', value: String(dailyStreak(data)) },
    { label: 'longest streak', value: String(longestDailyStreak(data)) },
    { label: 'daily launches', value: String(finished.length) },
    { label: 'perfect launches', value: String(perfect) },
    { label: 'best score', value: scoreAt(highest) },
    { label: 'practice flights', value: String(data.practice.length) },
  ]

  return (
    <div className="page star-chart">
      <section className="panel profile-header">
        <Avatar name={data.profile.name} size="lg" />
        <div className="profile-info">
          <NameEditor name={data.profile.name} />
          <p className="muted">
            Flying since {new Date(data.profile.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <AccountStatus />
      </section>

      <section className="tiles">
        {tiles.map((t) => (
          <div key={t.label} className="stat">
            <strong>{t.value}</strong>
            <span className="muted small">{t.label}</span>
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Star chart</h2>
          <span className="muted small">
            {found} of {DISCOVERIES.length} discovered
          </span>
        </div>
        {ZONES.map((z) => (
          <div key={z.id} className="discovery-zone">
            <h3>{z.name}</h3>
            <div className="discovery-grid">
              {DISCOVERIES.filter((c) => c.zone === z.id).map((c) => {
                const seen = data.discoveries[c.id]
                return (
                  <div key={c.id} className={`discovery ${seen ? 'seen' : 'unseen'}`}>
                    <DiscoveryIcon id={c.id} size={40} />
                    <strong>{seen ? c.name : '???'}</strong>
                    <span className="muted small">{seen ? c.fact : c.hint}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>Daily Launches</h2>
        <LaunchCalendar daily={data.daily} />
      </section>

      {data.practice.length > 0 && (
        <section className="panel">
          <h2>Practice bests</h2>
          <ul className="bests">
            {[MIXED, ...TOPICS].map((t) => {
              const best = Math.max(0, ...data.practice.filter((p) => p.topic === t.id).map((p) => p.maxHeight))
              return (
                <li key={t.id}>
                  <span className="with-icon">
                    <TopicIcon topic={t.id} size={18} /> {t.name}
                  </span>
                  <span className="muted">{best ? scoreAt(best) : '—'}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section className="panel settings">
        <h2>Settings</h2>
        <SoundSetting />
        <ResetButton />
      </section>
    </div>
  )
}

function LaunchCalendar({ daily }: { daily: ReturnType<typeof useAppData>['daily'] }) {
  const today = dateKey()
  const start = addDays(today, -(fromKey(today).getDay() + (CALENDAR_WEEKS - 1) * 7))
  const days = Array.from({ length: CALENDAR_WEEKS * 7 }, (_, i) => addDays(start, i))
  return (
    <div className="calendar" role="list">
      {days.map((d) => {
        const r = daily[d]
        const future = d > today
        const cls = future ? 'future' : !r?.finishedAt ? 'empty' : r.height === 0 ? 'grounded' : `z-${zoneAt(r.height - 1e-6).id}`
        const label = `${fromKey(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${r?.finishedAt ? `${scoreAt(r.height)} points` : 'no launch'}`
        return <span key={d} role="listitem" className={`cal-day ${cls} ${d === today ? 'today' : ''}`} title={label} aria-label={label} />
      })}
    </div>
  )
}

function NameEditor({ name }: { name: string }) {
  const [editing, setEditing] = useState(!name)
  const [draft, setDraft] = useState(name)
  if (!editing) {
    return (
      <div className="name-row">
        <h1>{name}</h1>
        <button className="btn ghost small" onClick={() => (setDraft(name), setEditing(true))}>
          Edit
        </button>
      </div>
    )
  }
  return (
    <form
      className="name-row"
      onSubmit={(e) => {
        e.preventDefault()
        if (!draft.trim()) return
        setProfileName(draft)
        setEditing(false)
      }}
    >
      <input className="name-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Your name" aria-label="Your name" maxLength={40} />
      <button className="btn primary small" type="submit" disabled={!draft.trim()}>
        Save
      </button>
    </form>
  )
}

function SoundSetting() {
  const on = useSoundOn()
  return (
    <label className="setting">
      <input type="checkbox" checked={on} onChange={(e) => setSoundOn(e.target.checked)} /> Sounds and vibration
    </label>
  )
}

function ResetButton() {
  const [confirm, setConfirm] = useState(false)
  if (!confirm) {
    return (
      <button className="btn ghost danger" onClick={() => setConfirm(true)}>
        Reset all progress on this device
      </button>
    )
  }
  return (
    <div className="row">
      <span>This erases your launches and star chart on this device. Are you sure?</span>
      <button className="btn danger" onClick={() => (resetAll(), setConfirm(false))}>
        Yes, reset
      </button>
      <button className="btn ghost" onClick={() => setConfirm(false)}>
        Cancel
      </button>
    </div>
  )
}
