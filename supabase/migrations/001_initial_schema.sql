-- Synaptic — Supabase Schema
-- Only needed if you switch to Supabase (DB_BACKEND=supabase in .env.local)

CREATE TABLE IF NOT EXISTS learner_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT UNIQUE NOT NULL,
  display_name     TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  diagnostic_done  BOOLEAN DEFAULT false,
  entry_node       TEXT,
  streak_days      INT DEFAULT 0,
  last_session_at  TIMESTAMPTZ,
  graph_version    TEXT DEFAULT '1.0.0'
);

CREATE TABLE IF NOT EXISTS learner_skill_states (
  learner_id          UUID REFERENCES learner_profiles(id) ON DELETE CASCADE,
  skill_id            TEXT NOT NULL,
  p_know              FLOAT DEFAULT 0.1,
  p_slip              FLOAT DEFAULT 0.1,
  p_guess             FLOAT DEFAULT 0.2,
  p_transit           FLOAT DEFAULT 0.15,
  mastery_state       TEXT DEFAULT 'blocked',
  consecutive_correct INT DEFAULT 0,
  consecutive_wrong   INT DEFAULT 0,
  total_attempts      INT DEFAULT 0,
  last_attempted_at   TIMESTAMPTZ,
  first_seen_at       TIMESTAMPTZ DEFAULT now(),
  graph_stale         BOOLEAN DEFAULT false,
  PRIMARY KEY (learner_id, skill_id)
);

CREATE TABLE IF NOT EXISTS review_schedules (
  learner_id       UUID REFERENCES learner_profiles(id) ON DELETE CASCADE,
  skill_id         TEXT NOT NULL,
  interval_days    INT DEFAULT 1,
  ease_factor      FLOAT DEFAULT 2.5,
  repetitions      INT DEFAULT 0,
  due_at           TIMESTAMPTZ DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,
  PRIMARY KEY (learner_id, skill_id)
);

CREATE TABLE IF NOT EXISTS attempt_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id       UUID REFERENCES learner_profiles(id) ON DELETE CASCADE,
  skill_id         TEXT NOT NULL,
  question_id      TEXT NOT NULL,
  session_id       UUID,
  correct          BOOLEAN NOT NULL,
  latency_ms       INT,
  revision_count   INT DEFAULT 0,
  error_type       TEXT,
  difficulty_tier  TEXT,
  question_format  TEXT,
  attempted_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id    UUID REFERENCES learner_profiles(id) ON DELETE CASCADE,
  started_at    TIMESTAMPTZ DEFAULT now(),
  ended_at      TIMESTAMPTZ,
  tasks_count   INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  abandoned     BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS motivation_states (
  learner_id                  UUID PRIMARY KEY REFERENCES learner_profiles(id),
  state                       TEXT DEFAULT 'neutral',
  consecutive_errors          INT DEFAULT 0,
  slow_response_streak        INT DEFAULT 0,
  intervention_cooldown_until TIMESTAMPTZ,
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE learner_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_skill_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_schedules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivation_states    ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "self" ON learner_profiles     USING (id = auth.uid());
CREATE POLICY "self" ON learner_skill_states USING (learner_id = auth.uid());
CREATE POLICY "self" ON review_schedules     USING (learner_id = auth.uid());
CREATE POLICY "self" ON attempt_events       USING (learner_id = auth.uid());
CREATE POLICY "self" ON sessions             USING (learner_id = auth.uid());
CREATE POLICY "self" ON motivation_states    USING (learner_id = auth.uid());
