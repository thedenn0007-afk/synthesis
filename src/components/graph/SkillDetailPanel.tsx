'use client'
import type { SkillEdge } from '@/types'
import type { GraphNodeWithState } from './GraphView'
import { MASTERY_COLOUR, MASTERY_LABEL } from './GraphView'

interface Props {
  node:     GraphNodeWithState
  edges:    SkillEdge[]
  nodesMap: Map<string, GraphNodeWithState>
  onClose:  () => void
}

const PHASE_LABEL: Record<string, string> = {
  phase_1_computer_basics:  'Phase 1 — Computer & Python Basics',
  phase_2_cs_data:          'Phase 2 — CS & Data Thinking',
  phase_3_intro_ai:         'Phase 3 — Intro to AI',
  phase_4_machine_learning: 'Phase 4 — Machine Learning',
  phase_5_deep_learning:    'Phase 5 — Deep Learning',
  phase_6_modern_ai:        'Phase 6 — Modern AI Systems',
  phase_7_real_world:       'Phase 7 — Real-World AI Products',
  phase_8_mastery:          'Phase 8 — Mastery & System Design',
}

function NodeTag({ node, strength }: { node: GraphNodeWithState; strength?: 'hard' | 'soft' }) {
  const c = MASTERY_COLOUR[node.mastery_state]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border"
      style={{ color: c, borderColor: c + '38', background: c + '10' }}
    >
      {strength && (
        <span style={{ opacity: 0.7 }}>{strength === 'hard' ? '⬤' : '○'}</span>
      )}
      {node.label}
    </span>
  )
}

export function SkillDetailPanel({ node, edges, nodesMap, onClose }: Props) {
  const color      = MASTERY_COLOUR[node.mastery_state]
  const pKnowPct   = Math.round(node.p_know * 100)
  const isBlocked  = node.mastery_state === 'blocked'
  const isMastered = node.mastery_state === 'mastered'

  const prerequisites = edges
    .filter(e => e.to === node.id)
    .map(e => ({ strength: e.strength, node: nodesMap.get(e.from) }))
    .filter((p): p is { strength: 'hard' | 'soft'; node: GraphNodeWithState } => !!p.node)

  const unlocks = edges
    .filter(e => e.from === node.id)
    .map(e => ({ strength: e.strength, node: nodesMap.get(e.to) }))
    .filter((u): u is { strength: 'hard' | 'soft'; node: GraphNodeWithState } => !!u.node)

  const unmetHardPrereqs = prerequisites.filter(
    p => p.strength === 'hard' && p.node.mastery_state !== 'mastered'
  )

  return (
    <div className="rounded-xl border border-[var(--border)] bg-c-bg2 overflow-hidden animate-slide-up">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-start justify-between gap-4">
        <div className="min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: color, boxShadow: `0 0 5px ${color}66` }}
            />
            <h2 className="text-c-text text-[16px] font-semibold leading-tight truncate">{node.label}</h2>
          </div>

          {/* Meta pills row */}
          <div className="flex flex-wrap items-center gap-2 pl-5">
            <span
              className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium"
              style={{ color, background: color + '18' }}
            >
              {MASTERY_LABEL[node.mastery_state]}
            </span>
            <span className="text-[11px] font-mono text-c-muted">
              {pKnowPct}% known
            </span>
            <span className="text-[11px] font-mono text-c-faint truncate">
              {PHASE_LABEL[node.phase] ?? node.phase}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-c-faint hover:text-c-muted transition-colors text-[20px] leading-none flex-shrink-0 mt-0.5"
          aria-label="Close detail panel"
        >
          ×
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 space-y-4">

        {/* Intuition */}
        <p className="text-[13px] text-c-muted leading-relaxed">{node.intuition}</p>

        {/* Progress bar */}
        {!isBlocked && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-mono text-c-faint uppercase tracking-[0.07em]">Mastery</span>
              <span className="text-[10px] font-mono" style={{ color }}>{pKnowPct}%</span>
            </div>
            <div className="h-1.5 bg-c-bg3 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pKnowPct}%`, background: color }}
              />
            </div>
          </div>
        )}

        {/* Blocked notice */}
        {isBlocked && unmetHardPrereqs.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-c-bg4 px-4 py-3">
            <p className="text-[10px] font-mono text-c-faint uppercase tracking-[0.08em] mb-2.5">
              🔒 Requires first
            </p>
            <div className="flex flex-wrap gap-2">
              {unmetHardPrereqs.map(p => (
                <NodeTag key={p.node.id} node={p.node} />
              ))}
            </div>
          </div>
        )}

        {/* Prerequisites */}
        {prerequisites.length > 0 && (
          <div>
            <p className="text-[10px] font-mono text-c-faint uppercase tracking-[0.08em] mb-2">
              Prerequisites
            </p>
            <div className="flex flex-wrap gap-2">
              {prerequisites.map(p => (
                <NodeTag key={p.node.id} node={p.node} strength={p.strength} />
              ))}
            </div>
            <p className="text-[9px] font-mono text-c-ghost mt-1.5">
              ⬤ required &nbsp;·&nbsp; ○ helpful
            </p>
          </div>
        )}

        {/* Unlocks */}
        {unlocks.length > 0 && (
          <div>
            <p className="text-[10px] font-mono text-c-faint uppercase tracking-[0.08em] mb-2">
              Unlocks
            </p>
            <div className="flex flex-wrap gap-2">
              {unlocks.map(u => (
                <NodeTag key={u.node.id} node={u.node} />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="pt-1">
          {isMastered ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-c-green text-[12px] font-mono">✓ Skill mastered</span>
              <a
                href={`/learn/skill/${node.id}`}
                className="text-[12px] font-mono text-c-faint hover:text-c-muted transition-colors underline underline-offset-2"
              >
                revise again →
              </a>
            </div>
          ) : isBlocked ? (
            <p className="text-[12px] font-mono text-c-faint">
              Complete the required skills above to unlock this.
            </p>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={`/learn/skill/${node.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-c-purple hover:bg-[var(--purple-hover)] text-white text-[13px] font-medium transition-all hover:scale-[1.02] shadow-sm"
              >
                Study this skill →
              </a>
              <a
                href="/learn"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-c-faint hover:text-c-muted text-[12px] font-mono transition-all"
                title="Let the engine pick the next skill for you"
              >
                Auto-session
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
