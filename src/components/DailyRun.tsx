import { useMemo, useRef, useState } from 'react'
import { DAILY_LENGTH, DAILY_ZONE, dailyCategories, dailyHeight, dailyQuestions } from '../lib/daily'
import { DIFFICULTY_NAMES, MILESTONES, ZONES, formatAltitude, zoneIndexAt } from '../lib/space'
import { play } from '../lib/sound'
import { FlightFrame, ProgressDots } from './FlightHud'
import { Round } from './Round'

interface Props {
  n: number
  title: string
  /** Answers already given (a dive resumed after a reload). */
  initial: readonly boolean[]
  /** Saves each answer; called with the new answers list. */
  onAnswer?: (answers: boolean[]) => void
  onFinish: (answers: boolean[]) => void
  /** Where the phone-only exit button goes. */
  exitTo?: string
}

/** Plays the seven questions of Daily Launch `n`. */
export function DailyRun({ n, title, initial, onAnswer, onFinish, exitTo = '/' }: Props) {
  const questions = useMemo(() => dailyQuestions(n), [n])
  const categories = useMemo(() => dailyCategories(n), [n])
  const [answers, setAnswers] = useState<boolean[]>([...initial])
  const answersRef = useRef(answers)
  // The question on screen; it stays put after answering until Next is pressed.
  const [index, setIndex] = useState(initial.length)
  const [banner, setBanner] = useState<string | null>(null)

  const height = dailyHeight(answers)
  const answered = answers.length > index

  const handleAnswer = (correct: boolean) => {
    const prev = answersRef.current
    if (prev.length > index) return
    const next = [...prev, correct]
    answersRef.current = next
    setAnswers(next)
    onAnswer?.(next)
    const after = zoneIndexAt(dailyHeight(next))
    if (after > zoneIndexAt(dailyHeight(prev))) {
      play('levelUp')
      setBanner(ZONES[after].name)
    }
  }

  const next = () => {
    setBanner(null)
    if (index + 1 >= DAILY_LENGTH) {
      play('complete')
      onFinish(answersRef.current)
    } else setIndex(index + 1)
  }

  const zoneOf = (i: number) => ZONES[DAILY_ZONE[i]].id
  return (
    <FlightFrame height={height} title={title} status={<ProgressDots answers={answers} total={DAILY_LENGTH} zoneOf={zoneOf} />} banner={banner} exitTo={exitTo}>
      <p className="question-meta">
        Question {index + 1} of {DAILY_LENGTH} · {categories[index].name} · {DIFFICULTY_NAMES[questions[index].question.difficulty]}
        {height < MILESTONES.length && ` · next stop ${MILESTONES[height].name}`}
      </p>
      <Round
        key={index}
        asked={questions[index]}
        onAnswered={handleAnswer}
        onNext={next}
        nextLabel={index + 1 >= DAILY_LENGTH ? 'See results' : 'Next question'}
        outcome={answered ? (answers[index] ? `Up to ${MILESTONES[height - 1].name}, ${formatAltitude(height)}` : 'No climb this time') : null}
      />
    </FlightFrame>
  )
}
