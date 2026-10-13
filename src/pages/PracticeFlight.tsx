import { useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { FlightFrame, FuelCells } from '../components/FlightHud'
import { TopicIcon } from '../components/Icons'
import { Round } from '../components/Round'
import type { AskedQuestion } from '../content/questions'
import { DIFFICULTY_NAMES, MAX_HEIGHT, ZONES, formatAltitude, milestoneAt, zoneAt } from '../lib/space'
import { MAX_FUEL, answerPractice, nextPracticeQuestion, startPractice, streakBonus, type PracticeState } from '../lib/practice'
import { play } from '../lib/sound'
import { addPractice } from '../lib/store'
import { isPracticeTopic, topicMeta, type PracticeTopic } from '../lib/topics'
import { useUnlocked } from '../lib/unlock'

export function PracticeFlight() {
  const { topic } = useParams()
  const unlocked = useUnlocked()
  const [run, setRun] = useState(0)
  if (!unlocked) return <Navigate to="/unlock" replace />
  if (!isPracticeTopic(topic)) return <Navigate to="/practice" replace />
  return <Flight key={`${topic}-${run}`} topic={topic} onAgain={() => setRun((r) => r + 1)} />
}

function Flight({ topic, onAgain }: { topic: PracticeTopic; onAgain: () => void }) {
  const meta = topicMeta(topic)
  const seen = useRef(new Set<string>())
  const startedAt = useRef(Date.now())
  const stateRef = useRef<PracticeState>(startPractice())
  const [state, setState] = useState(stateRef.current)
  const [asked, setAsked] = useState<AskedQuestion>(() => draw(0))
  const [count, setCount] = useState(0)
  const [outcome, setOutcome] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const saved = useRef(false)

  function draw(height: number) {
    const q = nextPracticeQuestion(topic, height, seen.current)
    seen.current.add(q.question.id)
    return q
  }

  const save = (s: PracticeState, endReason: 'fuel' | 'top' | 'quit') => {
    if (saved.current || s.answered === 0) return
    saved.current = true
    addPractice({
      id: `${startedAt.current}-${Math.random().toString(36).slice(2, 7)}`,
      topic,
      startedAt: startedAt.current,
      endedAt: Date.now(),
      maxHeight: s.height,
      answered: s.answered,
      correct: s.correct,
      bestStreak: s.bestStreak,
      endReason,
    })
  }

  const handleAnswer = (correct: boolean) => {
    const step = answerPractice(stateRef.current, correct)
    stateRef.current = step.state
    setState(step.state)
    if (step.enteredZone !== null) {
      play('levelUp')
      setBanner(ZONES[step.enteredZone].name)
    }
    const bonus = streakBonus(step.state.streak)
    setOutcome(correct ? `Up to ${formatAltitude(step.state.height)}${bonus > 1 ? ` · ${step.state.streak} in a row` : ''}` : step.state.over ? 'Out of fuel' : '−1 fuel cell')
    if (step.state.over) save(step.state, step.state.over)
  }

  const next = () => {
    setBanner(null)
    setOutcome(null)
    if (stateRef.current.over) {
      play('complete')
      setFinished(true)
      return
    }
    setAsked(draw(stateRef.current.height))
    setCount((c) => c + 1)
  }

  const land = () => {
    save(stateRef.current, 'quit')
    setFinished(true)
  }

  if (finished) {
    const s = stateRef.current
    return (
      <div className="page narrow results">
        <span className="eyebrow with-icon">
          <TopicIcon topic={topic} size={16} /> Practice · {meta.name}
        </span>
        <div className="results-altitude">{formatAltitude(s.height)}</div>
        <p className="lead">
          {s.height >= MAX_HEIGHT ? 'You reached the center of the galaxy!' : milestoneAt(s.height) ? `You made it past ${milestoneAt(s.height)!.name}, into ${zoneAt(s.height).name}.` : 'You stayed close to Earth.'}
        </p>
        <div className="stats-row">
          <div className="stat">
            <strong>
              {s.correct}/{s.answered}
            </strong>
            <span className="muted small">right</span>
          </div>
          <div className="stat">
            <strong>{s.bestStreak}</strong>
            <span className="muted small">best streak</span>
          </div>
        </div>
        <div className="row">
          <button className="btn primary" onClick={onAgain}>
            Launch again
          </button>
          <Link to="/practice" className="btn ghost">
            Change topic
          </Link>
        </div>
      </div>
    )
  }

  return (
    <FlightFrame height={state.height} title={`Practice · ${meta.name}`} status={<FuelCells fuel={state.fuel} max={MAX_FUEL} />} banner={banner} exitTo="/practice">
      <p className="question-meta">
        {DIFFICULTY_NAMES[zoneAt(state.height).difficulty]} questions{state.streak >= 3 ? ` · ${state.streak} in a row, climbing ${Math.round((streakBonus(state.streak) - 1) * 100)}% faster` : ''}
      </p>
      <Round key={count} asked={asked} onAnswered={handleAnswer} onNext={next} nextLabel={state.over ? 'See results' : 'Next question'} outcome={outcome} />
      {!state.over && (
        <button className="link-btn land-btn" onClick={land}>
          Land and end flight
        </button>
      )}
    </FlightFrame>
  )
}
