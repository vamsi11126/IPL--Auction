-- Crick Auction — Neon PostgreSQL Schema
-- Run this in your Neon SQL editor to set up the database

-- ─── AUCTIONS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auctions (
  id                TEXT        PRIMARY KEY,
  host_id           TEXT        NOT NULL,
  host_name         TEXT        NOT NULL DEFAULT 'Manager',
  host_online       BOOLEAN     NOT NULL DEFAULT false,
  is_public         BOOLEAN     NOT NULL DEFAULT false,
  status            TEXT        NOT NULL DEFAULT 'waiting'
                    CHECK (status IN ('waiting', 'active', 'completed')),
  auction_type      TEXT        NOT NULL DEFAULT 'mega',
  squad_limit       INTEGER     NOT NULL DEFAULT 25,
  overseas_limit    INTEGER     NOT NULL DEFAULT 8,
  server            TEXT                 DEFAULT 'primary',
  players           JSONB       NOT NULL DEFAULT '[]',
  settings          JSONB       NOT NULL DEFAULT '{}',
  player_order      JSONB       NOT NULL DEFAULT '[]',
  banned_players    JSONB       NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for public lobby listing (the most frequent query)
CREATE INDEX IF NOT EXISTS idx_auctions_public_lobby
  ON auctions (is_public, host_online, status, created_at DESC)
  WHERE is_public = true AND host_online = true;

-- Index for status filtering in admin panel
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions (status);

-- ─── TEAMS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id                TEXT        PRIMARY KEY,
  auction_id        TEXT        NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  user_id           TEXT        NOT NULL,
  team_id           TEXT        NOT NULL DEFAULT '',
  team_name         TEXT        NOT NULL DEFAULT 'Unknown',
  budget_remaining  NUMERIC     NOT NULL DEFAULT 120.0,
  spent             NUMERIC     NOT NULL DEFAULT 0.0,
  squad             JSONB       NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for per-user history queries
CREATE INDEX IF NOT EXISTS idx_teams_user_id
  ON teams (user_id, created_at DESC);

-- Index for per-auction team queries
CREATE INDEX IF NOT EXISTS idx_teams_auction_id ON teams (auction_id);

-- ─── FEEDBACKS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedbacks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT,
  message     TEXT        NOT NULL,
  rating      INTEGER     CHECK (rating BETWEEN 1 AND 5),
  page        TEXT,
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks (created_at DESC);

-- ─── Auto-update updated_at trigger ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER auctions_updated_at
  BEFORE UPDATE ON auctions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
