import { useMemo, useState } from 'react'
import { DAILY_ZONE, MAX_POINTS, dailyCategories, dailyHeight, dailyPoints, dailyQuestions, dailyTopicName, shareText } from '../lib/daily'
import { MILESTONES, ZONES, formatAltitude } from '../lib/space'
import { ClimbProfile } from './ClimbCharts'
import { SaveStreakCard } from './SaveStreakCard'
import { TopicIcon } from './Icons'
import { shareResult } from '../lib/share'
import { standingText, useStanding } from '../lib/standing'
import type { PracticeTopic } from '../lib/topics'

interface Props {
  n: number
  topic: PracticeTopic
  answers: readonly boolean[]
  /** Submit this as the player's score for the day. Replays only compare. */
  record?: boolean
  children?: React.ReactNode
}

/** End-of-launch summary: altitude, points and how they compare, the share grid, and each question with its answer. */
export function DailyResults({ n, topic, answers, record = false, children }: Props) {
  const height = dailyHeight(answers)
  const questions = useMemo(() => dailyQuestions(n), [n])
  const categories = useMemo(() => dailyCategories(n), [n])
  const [shared, setShared] = useState<string | null>(null)
  const right = answers.filter(Boolean).length
  const points = dailyPoints(answers)
  const standing = useStanding(n, answers, record)

  const share = async () => {
    const r = await shareResult(shareText(n, answers))
    setShared(r === 'copied' ? 'Copied!' : r === 'shared' ? 'Shared!' : "Couldn't copy")
  }

  return (
    <div className="results">
      <span className="eyebrow with-icon">
        <TopicIcon topic={topic} size={16} /> Zenith #{n} · {dailyTopicName(n)}
      </span>
      <div className="results-altitude">{formatAltitude(height)}</div>
      <p className="lead">
        {right === 7 ? 'You reached the center of the galaxy!' : height === 0 ? 'You stayed on the launch pad today.' : `You reached ${MILESTONES[height - 1].name}.`}{' '}
        {right} of 7 right.
      </p>
      <p className="results-points">
        <strong>{points}</strong> of {MAX_POINTS} points
      </p>
      {standing && <p className="standing">{standingText(standing, record)}</p>}
      <div className="squares" aria-label={`${right} of 7 right`}>
        {answers.map((ok, i) => (
          <span key={i} className={`square ${ok ? `z-${ZONES[DAILY_ZONE[i]].id}` : 'miss'}`} />
        ))}
      </div>
      <ClimbProfile answers={answers} />
      <div className="row">
        <button className="btn primary" onClick={share}>
          {shared ?? 'Share result'}
        </button>
        {children}
      </div>
      {record && <SaveStreakCard />}
      <ol className="review">
        {questions.map((q, i) => (
          <li key={q.question.id} className={answers[i] ? 'good' : 'bad'}>
            <span className="review-mark" aria-label={answers[i] ? 'Right' : 'Missed'}>
              {answers[i] ? '✓' : '✕'}
            </span>
            {q.question.image && <img className={`review-picture ${q.question.image.kind}`} src={q.question.image.src} alt="" />}
            <div>
              <p>{q.question.prompt}</p>
              <p className="muted small">
                {q.choices[q.answerIndex]} · {categories[i].name}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
