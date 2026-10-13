import pg from 'pg'

export type Db = pg.Pool

export function createPool(connectionString: string): Db {
  const local = /localhost|127\.0\.0\.1|\.railway\.internal/.test(connectionString)
  return new pg.Pool({
    connectionString,
    // Railway's public proxy requires TLS; local and private-network connections don't.
    ssl: local ? undefined : { rejectUnauthorized: false },
    max: 10,
  })
}

/** Idempotent schema setup, run on every start. */
export async function migrate(db: Db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

    -- One row per user holding the whole client save. The client merges and
    -- sends the full state; version guards against concurrent overwrites.
    CREATE TABLE IF NOT EXISTS saves (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      training jsonb,
      learn jsonb,
      version integer NOT NULL DEFAULT 0,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    -- Who has bought the full game. Owned by the server, never by the client save.
    CREATE TABLE IF NOT EXISTS entitlements (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      unlocked_at timestamptz,
      source text
    );

    -- One finished Daily Launch per player, first result final. player is
    -- 'u:<user id>' when signed in, else a random id the browser keeps.
    CREATE TABLE IF NOT EXISTS daily_scores (
      n integer NOT NULL,
      player text NOT NULL,
      score smallint NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (n, player)
    );
    -- Launches #1 and #2 were first played as one-topic days, then replaced by
    -- Daily Mix questions. Scores from the old questions don't compare.
    DELETE FROM daily_scores WHERE n <= 2 AND created_at < '2026-10-10T13:30:00Z';
    -- Scores were out of 19 until the switch to 1,000. Old rows can't be
    -- converted, so they're left out of comparisons and replaced the next time
    -- that player sends their answers.
    ALTER TABLE daily_scores ADD COLUMN IF NOT EXISTS out_of smallint NOT NULL DEFAULT 19;
  `)
}
