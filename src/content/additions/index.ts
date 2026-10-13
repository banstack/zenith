import type { TopicId } from '../../lib/topics'
import type { RawQuestion } from '../topics/types'
import { food } from './2026-10-20/food'
import { general } from './2026-10-20/general'
import { geography } from './2026-10-20/geography'
import { history } from './2026-10-20/history'
import { math } from './2026-10-20/math'
import { music } from './2026-10-20/music'
import { science } from './2026-10-20/science'
import { screen } from './2026-10-20/screen'
import { sports } from './2026-10-20/sports'

/**
 * Questions added after launch, one batch per date. A batch joins the Daily
 * on its `since` date, so launches before then deal exactly what they always
 * have and results already played keep lining up. Practice can use every
 * question straight away.
 *
 * To add questions, start a new batch dated after the next unplayed launch,
 * in its own folder. Never remove or reorder questions in a batch or in
 * src/content/topics/ once it's live: fixing a typo in place is fine.
 */
export interface Addition {
  since: string
  banks: Partial<Record<TopicId, RawQuestion[]>>
}

export const ADDITIONS: Addition[] = [{ since: '2026-10-20', banks: { science, math, history, geography, screen, music, sports, food, general } }]
