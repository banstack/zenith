import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { DailyResults } from '../components/DailyResults'
import { DailyRun } from '../components/DailyRun'
import { DAILY_LENGTH, dailyHeight, dailyNumber, dailyTopic, dailyTopicName } from '../lib/daily'
import { dateKey } from '../lib/dates'
import { answerDaily, startDaily, useAppData } from '../lib/store'

/** Today's free launch. Each answer is saved as it's given, and there's one attempt per day. */
export function Daily() {
  const [today] = useState(dateKey)
  const n = dailyNumber(today)
  const topic = dailyTopic(n)
  const data = useAppData()
  const saved = data.daily[today]
  // Results show once the player presses "See results", or straight away if today is already done.
  const [showResults, setShowResults] = useState(false)
  const [playedHere, setPlayedHere] = useState(false)

  useEffect(() => {
    if (n >= 1) startDaily(today, n, topic)
  }, [today, n, topic])

  if (n < 1) return <Navigate to="/" replace />
  if (!saved) return null

  if (showResults || (saved.finishedAt !== null && !playedHere)) {
    return (
      <div className="page">
        <DailyResults n={n} topic={topic} answers={saved.answers} record>
          <Link to="/" className="btn ghost">
            Back to Earth
          </Link>
        </DailyResults>
      </div>
    )
  }

  return (
    <DailyRun
      n={n}
      title={`Zenith #${n} · ${dailyTopicName(n)}`}
      initial={saved.answers}
      onAnswer={(answers) => {
        setPlayedHere(true)
        answerDaily(today, answers[answers.length - 1], dailyHeight(answers), DAILY_LENGTH)
      }}
      onFinish={() => setShowResults(true)}
    />
  )
}
