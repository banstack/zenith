import express, { type NextFunction, type Request, type Response } from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  createSession,
  deleteSession,
  hashPassword,
  MAX_PASSWORD,
  MIN_PASSWORD,
  normalizeEmail,
  rateLimiter,
  SESSION_DAYS,
  userForSession,
  verifyPassword,
  type SessionUser,
} from './auth.ts'
import type { Db } from './db.ts'
import { isAnswers, isCurrentLaunch, isPlayerId, MAX_POINTS, pointsFor } from './scores.ts'

const COOKIE = 'fm_session'
const MAX_SAVE_BYTES = '2mb'

interface Options {
  db: Db
  /** Serve the built frontend from this directory, if it exists. */
  staticDir?: string
  /** Mark cookies Secure (true behind HTTPS in production). */
  secureCookies?: boolean
  /** Auth attempts allowed per IP per 15 minutes. */
  authLimit?: number
  /** Allow POST /api/dev/unlock, which unlocks Practice for free. Never in production. */
  allowDevUnlock?: boolean
  /** Daily score submissions allowed per IP per 15 minutes. */
  scoreLimit?: number
}

type AuthedRequest = Request & { user?: SessionUser }

/** The save lives in the `training` column, a name kept from Funmental so existing rows carry over. */
function saveBody(row: { training: unknown; version: number; updated_at: Date } | undefined) {
  return row ? { save: row.training, version: row.version, updatedAt: row.updated_at } : { save: null, version: 0, updatedAt: null }
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return undefined
}

export function createApp({ db, staticDir, secureCookies = false, authLimit = 20, allowDevUnlock = false, scoreLimit = 30 }: Options) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1) // Railway terminates TLS in front of us.

  const authAttempt = rateLimiter(authLimit, 15 * 60 * 1000)
  const scoreAttempt = rateLimiter(scoreLimit, 15 * 60 * 1000)

  const setSessionCookie = (res: Response, token: string) =>
    res.cookie(COOKIE, token, {
      httpOnly: true,
      secure: secureCookies,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    })

  const api = express.Router()
  api.use(express.json({ limit: MAX_SAVE_BYTES }))

  // Mutating requests must be JSON. Browsers can't send that cross-site without
  // a CORS preflight, which we never allow, so this doubles as CSRF protection.
  api.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD' && !req.is('application/json')) {
      res.status(415).json({ error: 'Expected application/json' })
      return
    }
    next()
  })

  const requireUser = async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const user = await userForSession(db, readCookie(req, COOKIE))
    if (!user) {
      res.status(401).json({ error: 'Not signed in' })
      return
    }
    req.user = user
    next()
  }

  api.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  api.post('/auth/signup', async (req, res) => {
    if (!authAttempt(req.ip ?? 'unknown')) {
      res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' })
      return
    }
    const email = normalizeEmail(req.body?.email)
    const password = req.body?.password
    if (!email) {
      res.status(400).json({ error: 'Enter a valid email address.' })
      return
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
      res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters.` })
      return
    }
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING RETURNING id`,
      [email, await hashPassword(password)],
    )
    if (!rows[0]) {
      res.status(409).json({ error: 'An account with that email already exists. Try logging in.' })
      return
    }
    setSessionCookie(res, await createSession(db, rows[0].id))
    res.status(201).json({ user: { id: rows[0].id, email } })
  })

  api.post('/auth/login', async (req, res) => {
    if (!authAttempt(req.ip ?? 'unknown')) {
      res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' })
      return
    }
    const email = normalizeEmail(req.body?.email)
    const password = req.body?.password
    const { rows } = email
      ? await db.query<{ id: string; password_hash: string }>('SELECT id, password_hash FROM users WHERE email = $1', [email])
      : { rows: [] }
    const ok = rows[0] && typeof password === 'string' && password.length <= MAX_PASSWORD && (await verifyPassword(password, rows[0].password_hash))
    if (!ok) {
      res.status(401).json({ error: 'Incorrect email or password.' })
      return
    }
    setSessionCookie(res, await createSession(db, rows[0].id))
    res.json({ user: { id: rows[0].id, email } })
  })

  api.post('/auth/logout', async (req, res) => {
    await deleteSession(db, readCookie(req, COOKIE))
    res.clearCookie(COOKIE, { path: '/' })
    res.json({ ok: true })
  })

  const isUnlocked = async (userId: string) => {
    const { rows } = await db.query('SELECT 1 FROM entitlements WHERE user_id = $1 AND unlocked_at IS NOT NULL', [userId])
    return rows.length > 0
  }

  api.get('/me', requireUser, async (req: AuthedRequest, res) => {
    res.json({ user: req.user, unlocked: await isUnlocked(req.user!.id) })
  })

  // Stand-in for the purchase flow until payments are wired up. A payment
  // webhook will write the same entitlements row with source 'stripe'.
  if (allowDevUnlock) {
    api.post('/dev/unlock', requireUser, async (req: AuthedRequest, res) => {
      await db.query(
        `INSERT INTO entitlements (user_id, unlocked_at, source) VALUES ($1, now(), 'dev')
         ON CONFLICT (user_id) DO UPDATE SET unlocked_at = COALESCE(entitlements.unlocked_at, now())`,
        [req.user!.id],
      )
      res.json({ unlocked: true })
    })
  }

  api.get('/save', requireUser, async (req: AuthedRequest, res) => {
    const { rows } = await db.query('SELECT training, version, updated_at FROM saves WHERE user_id = $1', [req.user!.id])
    res.json(saveBody(rows[0]))
  })

  /**
   * Replace the save if the client's baseVersion matches the stored version.
   * On mismatch, return 409 with the current save so the client can merge and retry.
   */
  api.put('/save', requireUser, async (req: AuthedRequest, res) => {
    const { save, baseVersion } = req.body ?? {}
    const isObj = (v: unknown) => v === null || (typeof v === 'object' && !Array.isArray(v))
    if (!isObj(save) || !Number.isInteger(baseVersion)) {
      res.status(400).json({ error: 'Expected { save, baseVersion }' })
      return
    }
    const userId = req.user!.id
    // baseVersion 0 means "no save yet": only insert. Otherwise only update the exact version we merged from.
    const { rows } =
      baseVersion === 0
        ? await db.query(
            `INSERT INTO saves (user_id, training, version) VALUES ($1, $2, 1)
             ON CONFLICT (user_id) DO NOTHING RETURNING version, updated_at`,
            [userId, save],
          )
        : await db.query(
            `UPDATE saves SET training = $2, learn = NULL, version = version + 1, updated_at = now()
             WHERE user_id = $1 AND version = $3 RETURNING version, updated_at`,
            [userId, save, baseVersion],
          )
    if (rows[0]) {
      res.json({ version: rows[0].version, updatedAt: rows[0].updated_at })
      return
    }
    const current = await db.query('SELECT training, version, updated_at FROM saves WHERE user_id = $1', [userId])
    res.status(409).json(saveBody(current.rows[0]))
  })

  /** How many players finished launch n with each score, from 0 to MAX_POINTS. */
  const scoreCounts = async (n: number) => {
    const counts = Array<number>(MAX_POINTS + 1).fill(0)
    const { rows } = await db.query<{ score: number; players: number }>('SELECT score, count(*)::int AS players FROM daily_scores WHERE n = $1 AND out_of = $2 GROUP BY score', [n, MAX_POINTS])
    for (const r of rows) counts[r.score] = r.players
    return counts
  }

  const launchNumber = (req: Request) => {
    const n = Number(req.params.n)
    return Number.isInteger(n) && n >= 1 ? n : null
  }

  api.get('/daily/:n/scores', async (req, res) => {
    const n = launchNumber(req)
    if (n === null) {
      res.status(400).json({ error: 'Unknown launch' })
      return
    }
    res.json({ counts: await scoreCounts(n), max: MAX_POINTS })
  })

  /**
   * Record a finished Daily Launch and return how everyone scored. The first
   * result per player is final; `score` is the one on record.
   */
  api.post('/daily/:n/scores', async (req: AuthedRequest, res) => {
    const n = launchNumber(req)
    const { player, answers } = req.body ?? {}
    if (n === null || !isCurrentLaunch(n)) {
      res.status(400).json({ error: "Only today's launch can be scored." })
      return
    }
    if (!isPlayerId(player) || !isAnswers(answers)) {
      res.status(400).json({ error: 'Expected { player, answers }' })
      return
    }
    if (!scoreAttempt(req.ip ?? 'unknown')) {
      res.status(429).json({ error: 'Too many scores. Try again in a few minutes.' })
      return
    }
    const user = await userForSession(db, readCookie(req, COOKIE))
    const key = user ? `u:${user.id}` : player
    // A score from the old 19-point scale is swapped for this one; otherwise the first score stands.
    await db.query(
      `INSERT INTO daily_scores (n, player, score, out_of) VALUES ($1, $2, $3, $4)
       ON CONFLICT (n, player) DO UPDATE SET score = EXCLUDED.score, out_of = EXCLUDED.out_of WHERE daily_scores.out_of <> EXCLUDED.out_of`,
      [n, key, pointsFor(answers), MAX_POINTS],
    )
    const { rows } = await db.query<{ score: number }>('SELECT score FROM daily_scores WHERE n = $1 AND player = $2', [n, key])
    res.json({ counts: await scoreCounts(n), max: MAX_POINTS, score: rows[0].score })
  })

  app.use('/api', api)
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  if (staticDir && existsSync(staticDir)) {
    app.use(express.static(staticDir, { index: 'index.html', maxAge: '1h' }))
    // Hash routing means only "/" is ever requested, but fall back for safety.
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'))
    })
  }

  app.use((err: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
    if (err.type === 'entity.too.large') {
      res.status(413).json({ error: 'Save is too large.' })
      return
    }
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  })

  return app
}
