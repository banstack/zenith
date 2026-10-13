import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { hashPassword, rateLimiter, verifyPassword } from './auth.ts'
import { createApp } from './app.ts'
import { createPool, migrate, type Db } from './db.ts'
import { utcDailyNumber } from './scores.ts'

describe('password hashing', () => {
  it('verifies the right password and rejects others', async () => {
    const stored = await hashPassword('correct horse')
    expect(stored.startsWith('scrypt$')).toBe(true)
    expect(await verifyPassword('correct horse', stored)).toBe(true)
    expect(await verifyPassword('wrong horse', stored)).toBe(false)
    expect(await verifyPassword('x', 'garbage')).toBe(false)
  })

  it('rate limiter allows `limit` hits per window', () => {
    const allow = rateLimiter(2, 1000)
    expect([allow('a', 0), allow('a', 1), allow('a', 2), allow('b', 2), allow('a', 1001)]).toEqual([true, true, false, true, true])
  })
})

describe('serving the app', () => {
  it('revalidates index.html on every load and keeps hashed assets for good', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'zenith-dist-'))
    mkdirSync(path.join(dir, 'assets'))
    writeFileSync(path.join(dir, 'index.html'), '<!doctype html>')
    writeFileSync(path.join(dir, 'assets', 'index-abc123.js'), '')
    writeFileSync(path.join(dir, 'favicon.svg'), '<svg/>')
    const server = createApp({ db: {} as Db, staticDir: dir }).listen(0)
    const base = `http://localhost:${(server.address() as AddressInfo).port}`
    try {
      const cache = async (p: string) => (await fetch(base + p)).headers.get('cache-control')
      expect(await cache('/')).toBe('no-cache')
      expect(await cache('/index.html')).toBe('no-cache')
      expect(await cache('/somewhere')).toBe('no-cache')
      expect(await cache('/assets/index-abc123.js')).toBe('public, max-age=31536000, immutable')
      expect(await cache('/favicon.svg')).toBe('public, max-age=3600')
    } finally {
      server.close()
    }
  })
})

// Integration tests need a throwaway Postgres: TEST_DATABASE_URL=postgres://... npm test
const url = process.env.TEST_DATABASE_URL

describe.skipIf(!url)('API', () => {
  let db: Db
  let server: Server
  let base: string

  /** A tiny client that keeps its own session cookie, like one browser. */
  function client() {
    let cookie = ''
    return async (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) => {
      const res = await fetch(base + path, {
        method,
        headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers },
        body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
      })
      const set = res.headers.get('set-cookie')
      if (set) cookie = set.split(';')[0]
      const text = await res.text()
      return { status: res.status, body: text ? JSON.parse(text) : null, setCookie: set }
    }
  }

  beforeAll(async () => {
    db = createPool(url!)
    await migrate(db)
    server = createApp({ db, authLimit: 1000 }).listen(0)
    base = `http://localhost:${(server.address() as AddressInfo).port}/api`
  })

  beforeEach(async () => {
    await db.query('TRUNCATE users CASCADE')
  })

  afterAll(async () => {
    server?.close()
    await db?.end()
  })

  it('reports health', async () => {
    expect((await client()('GET', '/health')).body).toEqual({ ok: true })
  })

  it('validates sign-up input', async () => {
    const api = client()
    expect((await api('POST', '/auth/signup', { email: 'nope', password: 'longenough' })).status).toBe(400)
    expect((await api('POST', '/auth/signup', { email: 'a@b.co', password: 'short' })).status).toBe(400)
  })

  it('signs up, keeps a session, and rejects duplicate emails', async () => {
    const api = client()
    const res = await api('POST', '/auth/signup', { email: ' Sam@Example.com ', password: 'hunter2hunter2' })
    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('sam@example.com')
    expect(res.setCookie).toMatch(/fm_session=.+HttpOnly/i)
    expect(res.setCookie).toMatch(/SameSite=Lax/i)

    expect((await api('GET', '/me')).body.user.email).toBe('sam@example.com')
    expect((await client()('GET', '/me')).status).toBe(401)
    expect((await client()('POST', '/auth/signup', { email: 'sam@example.com', password: 'another-password' })).status).toBe(409)
  })

  it('logs in with the right password only, and logs out', async () => {
    await client()('POST', '/auth/signup', { email: 'sam@example.com', password: 'hunter2hunter2' })
    const api = client()
    expect((await api('POST', '/auth/login', { email: 'sam@example.com', password: 'wrong-password' })).status).toBe(401)
    expect((await api('POST', '/auth/login', { email: 'nobody@example.com', password: 'hunter2hunter2' })).status).toBe(401)
    expect((await api('POST', '/auth/login', { email: 'SAM@example.com', password: 'hunter2hunter2' })).status).toBe(200)
    expect((await api('GET', '/me')).status).toBe(200)
    await api('POST', '/auth/logout', {})
    expect((await api('GET', '/me')).status).toBe(401)
  })

  it('saves with optimistic versioning and returns the current save on conflict', async () => {
    const api = client()
    await api('POST', '/auth/signup', { email: 'sam@example.com', password: 'hunter2hunter2' })
    expect((await api('GET', '/save')).body).toMatchObject({ save: null, version: 0 })

    const first = await api('PUT', '/save', { save: { n: 1 }, baseVersion: 0 })
    expect(first.body.version).toBe(1)

    // A second device that also thinks there's no save gets a conflict with the current data.
    const stale = await api('PUT', '/save', { save: { n: 99 }, baseVersion: 0 })
    expect(stale.status).toBe(409)
    expect(stale.body).toMatchObject({ save: { n: 1 }, version: 1 })

    expect((await api('PUT', '/save', { save: { n: 2 }, baseVersion: 1 })).body.version).toBe(2)
    expect((await api('PUT', '/save', { save: { n: 3 }, baseVersion: 1 })).status).toBe(409)
    expect((await api('GET', '/save')).body).toMatchObject({ save: { n: 2 }, version: 2 })
  })

  it("keeps each user's save private", async () => {
    const a = client()
    const b = client()
    await a('POST', '/auth/signup', { email: 'a@example.com', password: 'password-a' })
    await b('POST', '/auth/signup', { email: 'b@example.com', password: 'password-b' })
    await a('PUT', '/save', { save: { secret: 'a' }, baseVersion: 0 })
    expect((await b('GET', '/save')).body.save).toBeNull()
    expect((await client()('GET', '/save')).status).toBe(401)
  })

  it('rejects non-JSON writes, malformed saves and oversized bodies', async () => {
    const api = client()
    await api('POST', '/auth/signup', { email: 'sam@example.com', password: 'hunter2hunter2' })
    expect((await api('POST', '/auth/logout', 'x=1', { 'content-type': 'application/x-www-form-urlencoded' })).status).toBe(415)
    expect((await api('PUT', '/save', { save: [1, 2], baseVersion: 0 })).status).toBe(400)
    expect((await api('PUT', '/save', { save: {}, baseVersion: 'x' })).status).toBe(400)
    const huge = { save: { blob: 'x'.repeat(3 * 1024 * 1024) }, baseVersion: 0 }
    expect((await api('PUT', '/save', huge)).status).toBe(413)
  })

  it('starts locked and unlocks Practice only where the dev unlock is allowed', async () => {
    const api = client()
    await api('POST', '/auth/signup', { email: 'sam@example.com', password: 'hunter2hunter2' })
    expect((await api('GET', '/me')).body.unlocked).toBe(false)
    expect((await api('POST', '/dev/unlock', {})).status).toBe(404)

    const dev = createApp({ db, authLimit: 1000, allowDevUnlock: true }).listen(0)
    const devBase = `http://localhost:${(dev.address() as AddressInfo).port}/api`
    const cookie = (await fetch(base + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'sam@example.com', password: 'hunter2hunter2' }) })).headers
      .get('set-cookie')!
      .split(';')[0]
    const unlock = await fetch(devBase + '/dev/unlock', { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: '{}' })
    dev.close()
    expect(unlock.status).toBe(200)
    expect((await api('GET', '/me')).body.unlocked).toBe(true)
  })

  it('records the first daily score per player and reports how everyone scored', async () => {
    await db.query('TRUNCATE daily_scores')
    const n = utcDailyNumber()
    const anon = client()
    const all = Array(7).fill(true)
    const post = (c: ReturnType<typeof client>, player: string, answers: boolean[], launch = n) => c('POST', `/daily/${launch}/scores`, { player, answers })

    const first = await post(anon, 'a'.repeat(32), [true, true, true, true, true, true, false])
    expect(first.status).toBe(200)
    expect(first.body.score).toBe(700)
    expect(first.body.counts).toHaveLength(1001)
    expect(first.body.counts[700]).toBe(1)

    // The first result is final.
    const again = await post(anon, 'a'.repeat(32), all)
    expect(again.body.score).toBe(700)
    expect(again.body.counts[1000]).toBe(0)

    // A signed-in player counts once, whichever browser id they send.
    const user = client()
    await user('POST', '/auth/signup', { email: 'sc@example.com', password: 'longenough' })
    await post(user, 'b'.repeat(32), all)
    expect((await post(user, 'c'.repeat(32), [false, false, false, false, false, false, false])).body.score).toBe(1000)

    const read = await anon('GET', `/daily/${n}/scores`)
    expect(read.body.counts[700] + read.body.counts[1000]).toBe(2)
  })

  it('replaces a score from the old 19-point scale and leaves it out of comparisons', async () => {
    await db.query('TRUNCATE daily_scores')
    const n = utcDailyNumber()
    await db.query("INSERT INTO daily_scores (n, player, score) VALUES ($1, $2, 14), ($1, $3, 19)", [n, 'd'.repeat(32), 'e'.repeat(32)])
    const c = client()
    expect((await c('GET', `/daily/${n}/scores`)).body.counts.reduce((a: number, b: number) => a + b, 0)).toBe(0)
    const res = await c('POST', `/daily/${n}/scores`, { player: 'd'.repeat(32), answers: [true, true, true, true, true, true, false] })
    expect(res.body.score).toBe(700)
    expect(res.body.counts.reduce((a: number, b: number) => a + b, 0)).toBe(1)
  })

  it('only scores the current launch, with well-formed answers', async () => {
    const c = client()
    const n = utcDailyNumber()
    expect((await c('POST', `/daily/${n - 5}/scores`, { player: 'a'.repeat(32), answers: Array(7).fill(true) })).status).toBe(400)
    expect((await c('POST', `/daily/${n}/scores`, { player: 'short', answers: Array(7).fill(true) })).status).toBe(400)
    expect((await c('POST', `/daily/${n}/scores`, { player: 'a'.repeat(32), answers: [true] })).status).toBe(400)
    expect((await c('POST', `/daily/${n}/scores`, { player: 'a'.repeat(32), answers: Array(7).fill('yes') })).status).toBe(400)
    expect((await c('GET', '/daily/abc/scores')).status).toBe(400)
  })

  it('rate-limits repeated auth attempts', async () => {
    const limited = createApp({ db, authLimit: 2 }).listen(0)
    const limitedBase = `http://localhost:${(limited.address() as AddressInfo).port}/api`
    const attempt = () =>
      fetch(limitedBase + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'x@y.co', password: 'whatever1' }) })
    const statuses = [(await attempt()).status, (await attempt()).status, (await attempt()).status]
    limited.close()
    expect(statuses).toEqual([401, 401, 429])
  })
})
