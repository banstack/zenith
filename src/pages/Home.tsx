import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AltitudeLadder } from '../components/ClimbCharts'
import { FlameIcon, TopicIcon } from '../components/Icons'
import { DAILY_LENGTH, DAILY_ZONE, dailyCategories, dailyNumber, dailyTopic, dailyTopicName, shareText } from '../lib/daily'
import { DISCOVERIES, dailyStreak } from '../lib/discoveries'
import { dateKey, fromKey, untilMidnight } from '../lib/dates'
import { MAX_HEIGHT, MILESTONES, ZONES, formatAltitude } from '../lib/space'
import { shareResult } from '../lib/share'
import { useAppData } from '../lib/store'
import { TOPICS, topicMeta } from '../lib/topics'
import { useUnlocked } from '../lib/unlock'

function useCountdown() {
  const [label, setLabel] = useState(() => untilMidnight())
  useEffect(() => {
    const id = setInterval(() => setLabel(untilMidnight()), 30_000)
    return () => clearInterval(id)
  }, [])
  return label
}

/** The launch pad: today's launch, your streak, and the way into Practice. */
export function Home() {
  const data = useAppData()
  const unlocked = useUnlocked()
  const today = dateKey()
  const n = dailyNumber(today)
  const topic = topicMeta(dailyTopic(n))
  const result = data.daily[today]
  const done = result?.finishedAt != null
  const streak = dailyStreak(data)
  const countdown = useCountdown()
  const [shared, setShared] = useState<string | null>(null)

  const share = async () => {
    if (!result) return
    const r = await shareResult(shareText(n, result.answers))
    setShared(r === 'copied' ? 'Copied!' : r === 'shared' ? 'Shared!' : "Couldn't copy")
  }

  const weekday = fromKey(today).toLocaleDateString(undefined, { weekday: 'long' })
  const launches = Object.values(data.daily).filter((r) => r.finishedAt !== null).length
  const found = Object.keys(data.discoveries).length

  return (
    <div className="page home">
      <section className="today">
        <div className="today-head">
          <span className="eyebrow">
            Zenith #{n} · {weekday}
          </span>
          <h1 className="topic-title">
            <TopicIcon topic={topic.id} size={30} />
            {dailyTopicName(n)}
          </h1>
          {topic.id === 'mixed' && <p className="category-list">{dailyCategories(n).map((c) => c.name).join(' · ')}</p>}
          {!done ? (
            <>
              <p className="lead">
                {DAILY_LENGTH} questions, 20 seconds each. Every right answer lifts you to the next milestone. Get them all to reach the center of the galaxy.
              </p>
              <Link to="/daily" className="btn primary big">
                {result && result.answers.length > 0 ? `Continue launch (${result.answers.length}/${DAILY_LENGTH})` : 'Launch'}
              </Link>
            </>
          ) : (
            <>
              <div className="hero-result">
                <span className="results-altitude">{formatAltitude(result.height)}</span>
                <span>
                  {result.height >= MAX_HEIGHT ? 'Galactic Center!' : result.height > 0 ? MILESTONES[result.height - 1].name : 'Launch pad'} · {result.answers.filter(Boolean).length} of 7 right
                </span>
              </div>
              <div className="squares">
                {result.answers.map((ok, i) => (
                  <span key={i} className={`square ${ok ? `z-${ZONES[DAILY_ZONE[i]].id}` : 'miss'}`} />
                ))}
              </div>
              <div className="row">
                <button className="btn primary" onClick={share}>
                  {shared ?? 'Share result'}
                </button>
                <Link to="/daily" className="btn ghost">
                  Review answers
                </Link>
              </div>
              <p className="small">Next launch in {countdown}.</p>
            </>
          )}
        </div>
        <AltitudeLadder height={result?.height} />
      </section>

      <p className="home-stats">
        <span>
          <FlameIcon /> {streak}-day streak
        </span>
        <span>
          {launches} {launches === 1 ? 'launch' : 'launches'}
        </span>
        <span>
          {found} of {DISCOVERIES.length} discoveries
        </span>
      </p>

      <section className={`panel practice-card ${unlocked ? '' : 'locked'}`}>
        <div>
          <span className="eyebrow">{unlocked ? 'Practice' : 'Full game'}</span>
          <h2>Want to keep flying?</h2>
          <p className="muted">
            Unlimited flights in any of {TOPICS.length} topics, with fuel cells and streak boosts, plus every past Daily Launch to replay.
          </p>
        </div>
        <Link to={unlocked ? '/practice' : '/unlock'} className="btn primary">
          {unlocked ? 'Practice' : 'Unlock Zenith'}
        </Link>
      </section>
    </div>
  )
}
