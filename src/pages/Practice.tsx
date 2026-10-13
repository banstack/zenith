import { Link, Navigate } from 'react-router-dom'
import { TopicIcon } from '../components/Icons'
import { dailyDate, dailyNumber, dailyTopic } from '../lib/daily'
import { scoreAt } from '../lib/space'
import { useAppData } from '../lib/store'
import { MIXED, TOPICS, topicMeta, type PracticeTopic } from '../lib/topics'
import { useUnlocked } from '../lib/unlock'

const ARCHIVE_SHOWN = 30

/** Practice home: pick a topic for an endless flight, or replay a past Daily Launch. */
export function Practice() {
  const data = useAppData()
  const unlocked = useUnlocked()
  if (!unlocked) return <Navigate to="/unlock" replace />

  const best = (t: PracticeTopic) => Math.max(0, ...data.practice.filter((p) => p.topic === t).map((p) => p.maxHeight))
  const today = dailyNumber()
  const past = Array.from({ length: Math.min(ARCHIVE_SHOWN, today - 1) }, (_, i) => today - 1 - i)

  return (
    <div className="page">
      <span className="eyebrow">Practice</span>
      <h1>Pick a topic and launch</h1>
      <p className="lead">
        You have 3 fuel cells. A miss costs one, and each new zone gives one back. Every right answer adds to your score. 1,000 reaches the Galactic Center, and there's no ceiling: keep flying toward Andromeda and beyond.
      </p>
      <div className="topic-grid">
        {[MIXED, ...TOPICS].map((t) => (
          <Link key={t.id} to={`/practice/${t.id}`} className="topic-card">
            <TopicIcon topic={t.id} size={28} />
            <strong>{t.name}</strong>
            <span className="muted small">{best(t.id) > 0 ? `Best ${scoreAt(best(t.id))}` : 'Not flown yet'}</span>
          </Link>
        ))}
      </div>

      <h2 className="section-title">Past Daily Launches</h2>
      {past.length === 0 ? (
        <p className="muted">Past launches show up here from tomorrow.</p>
      ) : (
        <ul className="archive">
          {past.map((n) => {
            const mine = data.daily[dailyDate(n)]
            const meta = topicMeta(dailyTopic(n))
            return (
              <li key={n}>
                <Link to={`/archive/${n}`}>
                  <span>
                    <TopicIcon topic={meta.id} size={18} /> #{n} · {meta.name}
                  </span>
                  <span className="muted small">{mine?.finishedAt ? `${scoreAt(mine.height)} pts` : 'Missed'}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
