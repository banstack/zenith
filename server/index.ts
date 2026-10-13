import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.ts'
import { createPool, migrate } from './db.ts'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Add a Postgres database and reference its DATABASE_URL.')
  process.exit(1)
}

const db = createPool(databaseUrl)
await migrate(db)

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const staticDir = path.join(root, 'dist')
const production = process.env.NODE_ENV === 'production'
const app = createApp({ db, staticDir, secureCookies: production, allowDevUnlock: !production })

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => {
  const ui = existsSync(staticDir) ? 'serving the app from dist/' : 'API only (run `npm run dev` for the UI)'
  console.log(`zenith server listening on :${port}, ${ui}`)
})
