# Zenith

A daily trivia launch. Every day there's one free 7-question launch on a rotating topic, the same for everyone. Harder questions are worth more, for one score out of 1,000, and your score is how far you fly toward the center of the galaxy as the sky gets darker. Get all seven and you reach the center of the Milky Way, 26,000 light-years away.

Zenith was called Fathom, an ocean dive, until October 2026, then briefly Apogee.

```bash
npm install
npm run dev     # http://localhost:5173 (works on its own; progress stays in the browser)
npm test        # question banks, daily deck, altitude and fuel rules, save merging
npm run build
```

To try accounts and sync locally, you also need Postgres:

```bash
cp .env.example .env          # point DATABASE_URL at a local Postgres database
npm run dev:server            # API on :3001; Vite proxies /api to it
```

Server integration tests run when a throwaway database is provided: `TEST_DATABASE_URL=postgres://... npm test`.

## How it works

- **Milestones and zones** (`src/lib/space.ts`): height is counted in milestones: the edge of space (100 km), the Space Station (408 km), the Moon (384,400 km), Mars (1.5 AU), Neptune (30 AU), Proxima Centauri (4.2 ly) and the Galactic Center (26,000 ly). Between milestones the distance shown is log-scaled. The milestones fall into five zones, Near Earth, Lunar Space, The Planets, Interstellar Space and Deep Galaxy, each a difficulty from 1 (Easy) to 5 (Expert).
- **Daily Launch** (free, `src/lib/daily.ts`): 7 questions at difficulties 1, 1, 2, 3, 3, 4, 5. Questions are worth 50, 50, 100, 150, 150, 200 and 300 points, for a score out of 1,000. The ship climbs by score: each stop has a score (Edge of space 50 up to the Galactic Center at 1,000, `STOP_SCORES` in `src/lib/space.ts`), so answering every question right lands on each stop in turn, and a miss means no climb for that question while the launch carries on. Your rank is the zone your score reaches ("Interstellar Space"), or Galactic Center for a perfect 1,000, and it goes in the share text. Each question has 20 seconds; running out of fuel counts as a miss. Zenith #1 (first Fathom #1, then Apogee #1) was 9 October 2026, and the day rolls over at local midnight. Topics take turns, one per day. Questions are dealt from a fixed, seeded deck per topic and difficulty, so every device gets the same launch with no server, and a topic doesn't repeat a question until it has used them all. Each answer is saved as it's given, so a reload can't re-roll a question. Results share as a grid of colored squares.
- **Practice** (full game, `src/lib/practice.ts`): endless flights in any topic or Mixed. Scored on the same scale as the daily, but with no ceiling: past the Galactic Center (1,000) the ship flies on to Andromeda, the Virgo Cluster, the Great Attractor and the edge of the observable universe, at 300 points per stop (`BEYOND` in `src/lib/space.ts`). You have 3 fuel cells, a miss costs one, and reaching a new zone or a stop past the center refills one. About seven right answers cross a zone; 3 in a row climbs 25% faster and 5 in a row 50% faster. Practice also replays any past Daily Launch.
- **Unlock** (`src/lib/unlock.ts`, `/unlock`): Practice is a one-time purchase tied to an account. Payments aren't wired up yet. The server keeps an `entitlements` table, and `/api/me` reports `unlocked`. To test, use the developer unlock on the unlock page, or add `?unlock=1` to the URL (development builds only). A dev server (not `NODE_ENV=production`) also accepts `POST /api/dev/unlock` for the signed-in account. A payment webhook will write the same row later.
- **Star chart & discoveries** (`src/lib/discoveries.ts`): 14 discoveries across the zones, each found by reaching a milestone, streaks, a perfect launch or Practice records. They're checked after every change and never taken away.
- **Storage**: saves live in `localStorage` under `fathom:v1` (`src/lib/store.ts`; the key is kept from Fathom). A Fathom save is migrated on read: daily depths become heights, practice depths keep their place between milestones, and discoveries are worked out again from that history. A Funmental save is read once and only its profile carries over.
- **Accounts & sync (optional)**: same as before. The server stores one JSON save per user with a version number. Merging keeps the first finished result for each day, so a launch can't be replayed on a second device (`src/lib/merge.ts`).

## Adding questions

Each topic has a bank in `src/content/topics/<topic>.ts`. A question is `[difficulty, prompt, correct answer, wrong, wrong, wrong, explanation?]`, with the correct answer always listed first; choices are shuffled when shown. A question's id comes from its prompt, so editing a prompt makes it a new question. `npm test` checks that every topic has enough questions at each difficulty, that no choices repeat, and that prompts are unique. Adding questions to the end of a bank changes which questions later Daily Launches deal, so accept that upcoming launches will shift.

## Deploying to Railway

One service runs `server/index.ts`, which serves the built app and the `/api` routes from the same origin. A second service is Railway Postgres.

1. Create a project from this GitHub repo, and add a **PostgreSQL** database to it.
2. On the app service, set `DATABASE_URL` to `${{Postgres.DATABASE_URL}}` (a reference variable) and `NODE_ENV=production`.
3. Generate a public domain for the app service.

`railway.json` sets the build (`npm run build`), start (`npm start`) and health check (`/api/health`). Tables are created automatically on startup. Node 24+ is required (see `engines` in `package.json`).
