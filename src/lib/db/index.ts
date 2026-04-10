/**
 * SQLite Database Layer — Primary storage
 * 
 * Uses better-sqlite3 for synchronous, fast local SQLite access.
 * Zero configuration — database file is created automatically at ./data/synaptic.db
 * 
 * To switch to Supabase later:
 *   1. Set DB_BACKEND=supabase in .env.local
 *   2. Add Supabase env vars
 *   3. Import from @/lib/db/supabase-adapter instead of this file
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_DIR  = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DB_DIR, 'synaptic_local.db')

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    // MEMORY journal mode works on all filesystems (incl. network/virtual mounts like SMB/FUSE).
    // For a dedicated production server, switch to WAL for better read concurrency.
    _db.pragma('journal_mode = MEMORY')
    _db.pragma('synchronous = OFF')
    _db.pragma('foreign_keys = ON')
    initSchema(_db)
  }
  return _db
}

// ─────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────
function initSchema(db: Database.Database) {
  db.exec(`
    -- ── Core learner identity
    CREATE TABLE IF NOT EXISTS learner_profiles (
      id               TEXT PRIMARY KEY,
      email            TEXT UNIQUE NOT NULL,
      password_hash    TEXT NOT NULL,
      display_name     TEXT,
      created_at       TEXT DEFAULT (datetime('now')),
      diagnostic_done  INTEGER DEFAULT 0,
      entry_node       TEXT,
      streak_days      INTEGER DEFAULT 0,
      last_session_at  TEXT,
      graph_version    TEXT DEFAULT '1.0.0'
    );

    -- ── Sessions (JWT tokens, for auth)
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token        TEXT PRIMARY KEY,
      learner_id   TEXT NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
      expires_at   TEXT NOT NULL,
      created_at   TEXT DEFAULT (datetime('now'))
    );

    -- ── BKT knowledge state per (learner × skill)
    CREATE TABLE IF NOT EXISTS learner_skill_states (
      learner_id          TEXT NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
      skill_id            TEXT NOT NULL,
      p_know              REAL DEFAULT 0.1,
      p_slip              REAL DEFAULT 0.1,
      p_guess             REAL DEFAULT 0.2,
      p_transit           REAL DEFAULT 0.15,
      mastery_state       TEXT DEFAULT 'blocked',
      consecutive_correct INTEGER DEFAULT 0,
      consecutive_wrong   INTEGER DEFAULT 0,
      total_attempts      INTEGER DEFAULT 0,
      last_attempted_at   TEXT,
      first_seen_at       TEXT DEFAULT (datetime('now')),
      graph_stale         INTEGER DEFAULT 0,
      PRIMARY KEY (learner_id, skill_id)
    );
    CREATE INDEX IF NOT EXISTS idx_lss_mastery ON learner_skill_states(learner_id, mastery_state);
    CREATE INDEX IF NOT EXISTS idx_lss_pknow   ON learner_skill_states(learner_id, p_know);

    -- ── SM-2 spaced repetition schedule per (learner × skill)
    CREATE TABLE IF NOT EXISTS review_schedules (
      learner_id       TEXT NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
      skill_id         TEXT NOT NULL,
      interval_days    INTEGER DEFAULT 1,
      ease_factor      REAL DEFAULT 2.5,
      repetitions      INTEGER DEFAULT 0,
      due_at           TEXT DEFAULT (datetime('now')),
      last_reviewed_at TEXT,
      PRIMARY KEY (learner_id, skill_id)
    );
    CREATE INDEX IF NOT EXISTS idx_rs_due ON review_schedules(learner_id, due_at);

    -- ── Immutable attempt log
    CREATE TABLE IF NOT EXISTS attempt_events (
      id               TEXT PRIMARY KEY,
      learner_id       TEXT NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
      skill_id         TEXT NOT NULL,
      question_id      TEXT NOT NULL,
      session_id       TEXT,
      correct          INTEGER NOT NULL,
      latency_ms       INTEGER,
      revision_count   INTEGER DEFAULT 0,
      error_type       TEXT,
      difficulty_tier  TEXT,
      question_format  TEXT,
      attempted_at     TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_ae_learner ON attempt_events(learner_id, attempted_at);

    -- ── Study sessions
    CREATE TABLE IF NOT EXISTS sessions (
      id            TEXT PRIMARY KEY,
      learner_id    TEXT NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
      started_at    TEXT DEFAULT (datetime('now')),
      ended_at      TEXT,
      tasks_count   INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      abandoned     INTEGER DEFAULT 0
    );

    -- ── Motivation state (one row per learner)
    CREATE TABLE IF NOT EXISTS motivation_states (
      learner_id                  TEXT PRIMARY KEY REFERENCES learner_profiles(id) ON DELETE CASCADE,
      state                       TEXT DEFAULT 'neutral',
      consecutive_errors          INTEGER DEFAULT 0,
      slow_response_streak        INTEGER DEFAULT 0,
      intervention_cooldown_until TEXT,
      updated_at                  TEXT DEFAULT (datetime('now'))
    );

    -- ── Study intentions (optional scheduling)
    CREATE TABLE IF NOT EXISTS implementation_intentions (
      learner_id   TEXT PRIMARY KEY REFERENCES learner_profiles(id) ON DELETE CASCADE,
      study_time   TEXT,
      duration_min INTEGER DEFAULT 25,
      days_of_week TEXT,
      created_at   TEXT DEFAULT (datetime('now'))
    );
  `)
}

// ─────────────────────────────────────────────
// HELPERS — typed query wrappers
// ─────────────────────────────────────────────

export function generateId(): string {
  // Simple UUID v4 without crypto dependency
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
