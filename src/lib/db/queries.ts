/**
 * All database queries for Synaptic
 * Replaces all Supabase client calls with direct SQLite queries
 */

import { getDb, generateId } from '@/lib/db'
import type {
  LearnerProfile, LearnerSkillState, ReviewSchedule,
  AttemptEvent, Session, MotivationState,
} from '@/types'

// ─────────────────────────────────────────────
// LEARNER PROFILES
// ─────────────────────────────────────────────

export function getLearnerProfile(learnerId: string): LearnerProfile | null {
  return getDb().prepare(`
    SELECT id, email, display_name, created_at, diagnostic_done, entry_node,
           streak_days, last_session_at, graph_version
    FROM learner_profiles WHERE id = ?
  `).get(learnerId) as LearnerProfile | null
}

export function setDiagnosticDone(learnerId: string, entryNode: string) {
  getDb().prepare(`
    UPDATE learner_profiles SET diagnostic_done = 1, entry_node = ? WHERE id = ?
  `).run(entryNode, learnerId)
}

export function updateStreak(learnerId: string) {
  const row = getDb().prepare(`
    SELECT last_session_at, streak_days FROM learner_profiles WHERE id = ?
  `).get(learnerId) as any

  if (!row) return

  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const lastDate  = row.last_session_at?.slice(0, 10)

  let newStreak = row.streak_days ?? 0
  if (lastDate === today) {
    // Already counted today
  } else if (lastDate === yesterday) {
    newStreak += 1
  } else {
    newStreak = 1
  }

  getDb().prepare(`
    UPDATE learner_profiles SET streak_days = ?, last_session_at = datetime('now') WHERE id = ?
  `).run(newStreak, learnerId)
}

// ─────────────────────────────────────────────
// SKILL STATES
// ─────────────────────────────────────────────

export function getAllSkillStates(learnerId: string): LearnerSkillState[] {
  return getDb().prepare(`
    SELECT * FROM learner_skill_states WHERE learner_id = ?
  `).all(learnerId) as LearnerSkillState[]
}

export function getSkillState(learnerId: string, skillId: string): LearnerSkillState | null {
  return getDb().prepare(`
    SELECT * FROM learner_skill_states WHERE learner_id = ? AND skill_id = ?
  `).get(learnerId, skillId) as LearnerSkillState | null
}

export function upsertSkillState(state: LearnerSkillState) {
  getDb().prepare(`
    INSERT INTO learner_skill_states
      (learner_id, skill_id, p_know, p_slip, p_guess, p_transit, mastery_state,
       consecutive_correct, consecutive_wrong, total_attempts, last_attempted_at,
       first_seen_at, graph_stale)
    VALUES
      (@learner_id, @skill_id, @p_know, @p_slip, @p_guess, @p_transit, @mastery_state,
       @consecutive_correct, @consecutive_wrong, @total_attempts, @last_attempted_at,
       @first_seen_at, @graph_stale)
    ON CONFLICT(learner_id, skill_id) DO UPDATE SET
      p_know              = @p_know,
      p_slip              = @p_slip,
      p_guess             = @p_guess,
      p_transit           = @p_transit,
      mastery_state       = @mastery_state,
      consecutive_correct = @consecutive_correct,
      consecutive_wrong   = @consecutive_wrong,
      total_attempts      = @total_attempts,
      last_attempted_at   = @last_attempted_at,
      graph_stale         = @graph_stale
  `).run({ ...state, graph_stale: state.graph_stale ? 1 : 0 })
}

export function bulkUpsertSkillStates(states: LearnerSkillState[]) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO learner_skill_states
      (learner_id, skill_id, p_know, p_slip, p_guess, p_transit, mastery_state,
       consecutive_correct, consecutive_wrong, total_attempts, last_attempted_at,
       first_seen_at, graph_stale)
    VALUES
      (@learner_id, @skill_id, @p_know, @p_slip, @p_guess, @p_transit, @mastery_state,
       @consecutive_correct, @consecutive_wrong, @total_attempts, @last_attempted_at,
       @first_seen_at, @graph_stale)
    ON CONFLICT(learner_id, skill_id) DO UPDATE SET
      p_know        = @p_know,
      mastery_state = @mastery_state
  `)
  const insertMany = db.transaction((rows: LearnerSkillState[]) => {
    for (const row of rows) stmt.run({ ...row, graph_stale: 0 })
  })
  insertMany(states)
}

// ─────────────────────────────────────────────
// REVIEW SCHEDULES
// ─────────────────────────────────────────────

export function getReviewSchedules(learnerId: string): ReviewSchedule[] {
  return getDb().prepare(`
    SELECT * FROM review_schedules WHERE learner_id = ?
  `).all(learnerId) as ReviewSchedule[]
}

export function getReviewSchedule(learnerId: string, skillId: string): ReviewSchedule | null {
  return getDb().prepare(`
    SELECT * FROM review_schedules WHERE learner_id = ? AND skill_id = ?
  `).get(learnerId, skillId) as ReviewSchedule | null
}

export function upsertReviewSchedule(schedule: ReviewSchedule) {
  getDb().prepare(`
    INSERT INTO review_schedules
      (learner_id, skill_id, interval_days, ease_factor, repetitions, due_at, last_reviewed_at)
    VALUES
      (@learner_id, @skill_id, @interval_days, @ease_factor, @repetitions, @due_at, @last_reviewed_at)
    ON CONFLICT(learner_id, skill_id) DO UPDATE SET
      interval_days    = @interval_days,
      ease_factor      = @ease_factor,
      repetitions      = @repetitions,
      due_at           = @due_at,
      last_reviewed_at = @last_reviewed_at
  `).run(schedule)
}

export function schedulePhaseReview(learnerId: string, skillIds: string[]) {
  const db = getDb()
  const stmt = db.prepare(`
    UPDATE review_schedules
    SET due_at = datetime('now')
    WHERE learner_id = ? AND skill_id = ?
  `)
  const update = db.transaction((ids: string[]) => {
    for (const id of ids) stmt.run(learnerId, id)
  })
  update(skillIds)
}

export function bulkUpsertReviewSchedules(schedules: ReviewSchedule[]) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO review_schedules
      (learner_id, skill_id, interval_days, ease_factor, repetitions, due_at, last_reviewed_at)
    VALUES
      (@learner_id, @skill_id, @interval_days, @ease_factor, @repetitions, @due_at, @last_reviewed_at)
    ON CONFLICT(learner_id, skill_id) DO UPDATE SET
      interval_days = @interval_days,
      due_at        = @due_at
  `)
  const insertMany = db.transaction((rows: ReviewSchedule[]) => {
    for (const row of rows) stmt.run(row)
  })
  insertMany(schedules)
}

// ─────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────

export function createSession(learnerId: string): Session {
  const id = generateId()
  getDb().prepare(`
    INSERT INTO sessions (id, learner_id) VALUES (?, ?)
  `).run(id, learnerId)
  return { id, learner_id: learnerId, started_at: new Date().toISOString(), ended_at: null, tasks_count: 0, correct_count: 0, abandoned: false }
}

export function getSession(sessionId: string): Session | null {
  return getDb().prepare(`
    SELECT * FROM sessions WHERE id = ?
  `).get(sessionId) as Session | null
}

export function incrementSessionCounts(sessionId: string, correct: boolean) {
  getDb().prepare(`
    UPDATE sessions SET
      tasks_count   = tasks_count + 1,
      correct_count = correct_count + ?
    WHERE id = ?
  `).run(correct ? 1 : 0, sessionId)
}

export function endSession(sessionId: string) {
  getDb().prepare(`
    UPDATE sessions SET ended_at = datetime('now') WHERE id = ?
  `).run(sessionId)
}

export function getRecentSessions(learnerId: string, limit = 10): Session[] {
  return getDb().prepare(`
    SELECT * FROM sessions WHERE learner_id = ? ORDER BY started_at DESC LIMIT ?
  `).all(learnerId, limit) as Session[]
}

// ─────────────────────────────────────────────
// ATTEMPTS
// ─────────────────────────────────────────────

export function insertAttempt(attempt: Omit<AttemptEvent, 'id' | 'attempted_at'>): string {
  const id = generateId()
  getDb().prepare(`
    INSERT INTO attempt_events
      (id, learner_id, skill_id, question_id, session_id, correct, latency_ms,
       revision_count, error_type, difficulty_tier, question_format)
    VALUES
      (@id, @learner_id, @skill_id, @question_id, @session_id, @correct, @latency_ms,
       @revision_count, @error_type, @difficulty_tier, @question_format)
  `).run({ ...attempt, id, correct: attempt.correct ? 1 : 0 })
  return id
}

export function getLastAttemptForQuestion(learnerId: string, questionId: string): AttemptEvent | null {
  return getDb().prepare(`
    SELECT * FROM attempt_events
    WHERE learner_id = ? AND question_id = ?
    ORDER BY attempted_at DESC LIMIT 1
  `).get(learnerId, questionId) as AttemptEvent | null
}

export function getRecentAttempts(learnerId: string, limit = 200): AttemptEvent[] {
  return getDb().prepare(`
    SELECT * FROM attempt_events WHERE learner_id = ? ORDER BY attempted_at DESC LIMIT ?
  `).all(learnerId, limit) as AttemptEvent[]
}

// ─────────────────────────────────────────────
// MOTIVATION STATE
// ─────────────────────────────────────────────

export function getMotivationState(learnerId: string): MotivationState | null {
  return getDb().prepare(`
    SELECT * FROM motivation_states WHERE learner_id = ?
  `).get(learnerId) as MotivationState | null
}

export function upsertMotivationState(state: MotivationState) {
  getDb().prepare(`
    INSERT INTO motivation_states
      (learner_id, state, consecutive_errors, slow_response_streak,
       intervention_cooldown_until, updated_at)
    VALUES
      (@learner_id, @state, @consecutive_errors, @slow_response_streak,
       @intervention_cooldown_until, @updated_at)
    ON CONFLICT(learner_id) DO UPDATE SET
      state                       = @state,
      consecutive_errors          = @consecutive_errors,
      slow_response_streak        = @slow_response_streak,
      intervention_cooldown_until = @intervention_cooldown_until,
      updated_at                  = @updated_at
  `).run(state)
}
