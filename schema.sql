-- Dear Diary database schema (PostgreSQL / CockroachDB)
-- Run this once against your DATABASE_URL to create the tables.

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      STRING NOT NULL UNIQUE,
  email         STRING NOT NULL UNIQUE,
  password_hash STRING NOT NULL,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS diary_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      STRING,
  content    STRING NOT NULL,
  mood       STRING,
  mood_color STRING,
  entry_date DATE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_entries_user_date
  ON diary_entries (user_id, entry_date DESC);
