import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { AskedQuestion } from '../content/questions'
import { play } from '../lib/sound'

/** Seconds per question. Running out counts as a miss. */
export const QUESTION_SECONDS = 20
/** The fuel bar turns urgent, and ticks, for the last seconds. */
const LOW_FUEL_SECONDS = 5
/** Longest answer, in characters, that still fits half a phone-width row. */
const SHORT_CHOICE = 12

interface Props {
  asked: AskedQuestion
  /** Right answers in a row before this question; a right answer plays a note higher for each. */
  streak?: number
  /** Called once, when the player picks an answer or the fuel runs out. */
  onAnswered: (correct: boolean) => void
  onNext: () => void
  nextLabel?: string
  /** A line shown above the explanation after answering, e.g. "Up to The Moon". */
  outcome?: string | null
}

/** One question: four choices, a fuel timer, then the reveal and a Next button. */
export function Round({ asked, streak = 0, onAnswered, onNext, nextLabel = 'Next', outcome }: Props) {
  const [picked, setPicked] = useState<number | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const [left, setLeft] = useState(QUESTION_SECONDS)
  const done = picked !== null || timedOut
  const answeredRef = useRef(false)
  const nextRef = useRef<HTMLButtonElement>(null)

  const resolve = (correct: boolean) => {
    if (answeredRef.current) return
    answeredRef.current = true
    play(correct ? 'correct' : 'wrong', { streak })
    onAnswered(correct)
  }

  const onTimeout = useEffectEvent(() => {
    setTimedOut(true)
    resolve(false)
  })

  useEffect(() => {
    if (done) return
    const started = Date.now()
    let ticked = Math.ceil(QUESTION_SECONDS)
    const id = setInterval(() => {
      const remaining = Math.max(0, QUESTION_SECONDS - (Date.now() - started) / 1000)
      setLeft(remaining)
      // A quiet tick for each of the last seconds of fuel.
      const whole = Math.ceil(remaining)
      if (whole < ticked) {
        ticked = whole
        if (whole > 0 && whole <= LOW_FUEL_SECONDS) play('tick', { step: LOW_FUEL_SECONDS - whole })
      }
      if (remaining <= 0) {
        clearInterval(id)
        onTimeout()
      }
    }, 100)
    return () => clearInterval(id)
  }, [done])

  useEffect(() => {
    if (done) nextRef.current?.focus()
  }, [done])

  const choose = (i: number) => {
    if (done) return
    setPicked(i)
    resolve(i === asked.answerIndex)
  }

  const correct = picked === asked.answerIndex
  // Short answers sit two by two on phones, so the whole question fits on one screen.
  const short = asked.choices.every((c) => c.length <= SHORT_CHOICE)
  const low = left <= LOW_FUEL_SECONDS

  return (
    <div className={`round ${done ? 'done' : ''}`}>
      <div className={`fuel ${low && !done ? 'low' : ''}`} role="timer" aria-label={`${Math.ceil(left)} seconds of fuel left`}>
        <span style={{ width: `${(left / QUESTION_SECONDS) * 100}%` }} />
      </div>
      <h2 className="prompt">{asked.question.prompt}</h2>
      {asked.question.image && <img className={`picture ${asked.question.image.kind}`} src={asked.question.image.src} alt={asked.question.image.alt} draggable={false} />}
      <div className={`choices ${short ? 'short' : ''}`}>
        {asked.choices.map((c, i) => {
          const state = !done ? '' : i === asked.answerIndex ? 'right' : i === picked ? 'wrong' : 'dim'
          return (
            <button key={i} className={`choice ${state}`} onClick={() => choose(i)} disabled={done}>
              {c}
            </button>
          )
        })}
      </div>
      {done && (
        // On phones this is a bar pinned to the bottom of the screen, so Next is always in reach.
        <div className={`reveal ${correct ? 'good' : 'bad'}`} role="status">
          <div className="reveal-head">
            <strong>{timedOut ? 'Out of fuel!' : correct ? 'Correct!' : 'Not quite.'}</strong>
            {outcome && <span className="outcome">{outcome}</span>}
          </div>
          {!correct && <p>The answer is {asked.choices[asked.answerIndex]}.</p>}
          {asked.question.explanation && <p className="muted">{asked.question.explanation}</p>}
          <button ref={nextRef} className="btn primary" onClick={onNext}>
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  )
}
