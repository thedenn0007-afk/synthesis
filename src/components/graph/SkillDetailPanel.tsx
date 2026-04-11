'use client'
import type { SkillEdge } from '@/types'
import type { GraphNodeWithState } from './GraphView'
import { MASTERY_COLOUR } from './GraphView'

interface Props {
  node:     GraphNodeWithState
  edges:    SkillEdge[]
  nodesMap: Map<string, GraphNodeWithState>
  onClose:  () => void
}

const MASTERY_LABEL: Record<string, string> = {
  mastered: 'Mastered',
  fragile:  'Fragile — review due',
  learning: 'Learning',
  ready:    'Ready to start',
  blocked:  'Locked',
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

export function SkillDetailPanel({ node, edges, nodesMap, onClose }: Props) {
  const color      = MASTERY_COLOUR[node.mastery_state]
  const pKnowPct   = Math.round(node.p_know * 100)
  const isBlocked  = node.mastery_state === 'blocked'
  const isMastered = node.mastery_state === 'mastered'

  // Inbound edges (prerequisites of this skill)
  const prerequisites = edges
    .filter(e => e.to === node.id)
    .map(e => ({ strength: e.strength, node: nodesMap.get(e.from) }))
    .filter((p): p is { strength: 'hard' | 'soft'; node: GraphNodeWithState } => !!p.node)

  // Outbound edges (skills this unlocks)
  const unlocks = edges
    .filter(e => e.from === node.id)
    .map(e => ({ strength: e.strength, node: nodesMap.get(e.to) }))
    .filter((u): u is { strength: 'hard' | 'soft'; node: GraphNodeWithState } => !!u.node)

  // For blocked skills, find which hard prerequisites are still unmet
  const unmetHardPrereqs = prerequisites.filter(
    p => p.strength === 'hard' && p.node.mastery_state !== 'mastered'
  )

  return (
    <div className="mt-4 rounded-xl border border-white/[0.07] bg-[#111118] overflow-hidden animate-slide-up">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-white/[0.05] flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <h2 className="text-[#e8e8f0] text-[15px] font-medium leading-tight">{node.label}</h2>
          </div>
          <div className="flex items-center gap-3 pl-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color }}>
              {MASTERY_LABEL[node.mastery_state]}
            </span>
            <span className="font-mono text-[10px] text-[#5a5a72]">{pKnowPct}% known</span>
            <span className="font-mono text-[10px] text-[#3a3a50]">
              {PHASE_LABEL[node.phase] ?? node.phase}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#5a5a72] hover:text-[#9898b0] transition-colors text-[11px] font-mono ml-4 flex-shrink-0"
          aria-label="Close detail panel"
        >
          ✕ close
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* ── Intuition ──────────────────────────────────────────────── */}
        <p className="text-[12px] text-[#9898b0] leading-relaxed">{node.intuition}</p>

        {/* ── Blocked notice ─────────────────────────────────────────── */}
        {isBlocked && unmetHardPrereqs.length > 0 && (
          <div className="rounded-lg border border-white/[0.05] bg-[#0d0d13] px-4 py-3">
            <p className="font-mono text-[10px] text-[#5a5a72] uppercase tracking-[0.08em] mb-2">
              🔒 Requires first
            </p>
            <div className="flex flex-wrap gap-2">
              {unmetHardPrereqs.map(p => {
                const c = MASTERY_COLOUR[p.node.mastery_state]
                return (
                  <span
                    key={p.node.id}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono border"
                    style={{ color: c, borderColor: c + '40', background: c + '12' }}
                  >
                    {p.node.label}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Prerequisites ───────────────────────────────────────────── */}
        {prerequisites.length > 0 && (
          <div>
            <p className="font-mono text-[10px] text-[#5a5a72] uppercase tracking-[0.08em] mb-2">
              Prerequisites
            </p>
            <div className="flex flex-wrap gap-2">
              {prerequisites.map(p => {
                const c = MASTERY_COLOUR[p.node.mastery_state]
                return (
                  <span
                    key={p.node.id}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono border"
                    style={{ color: c, borderColor: c + '40', background: c + '12' }}
                  >
                    {p.strength === 'hard' ? '⬤' : '○'}&nbsp;{p.node.label}
                  </span>
                )
              })}
            </div>
            <p className="font-mono text-[9px] text-[#3a3a50] mt-1.5">
              ⬤ required &nbsp;·&nbsp; ○ helpful
            </p>
          </div>
        )}

        {/* ── Unlocks ─────────────────────────────────────────────────── */}
        {unlocks.length > 0 && (
          <div>
            <p className="font-mono text-[10px] text-[#5a5a72] uppercase tracking-[0.08em] mb-2">
              Unlocks
            </p>
            <div className="flex flex-wrap gap-2">
              {unlocks.map(u => {
                const c = MASTERY_COLOUR[u.node.mastery_state]
                return (
                  <span
                    key={u.node.id}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono border"
                    style={{ color: c, borderColor: c + '40', background: c + '12' }}
                  >
                    {u.node.label}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* ── CTA ────────────────────────────────────────────────────── */}
        <div className="pt-1">
          {isMastered ? (
            <div className="flex items-center gap-2">
              <span className="text-[#34d399] text-[12px] font-mono">✓ Skill mastered</span>
              <a
                href="/learn"
                className="text-[11px] font-mono text-[#5a5a72] hover:text-[#9898b0] transition-colors underline underline-offset-2"
              >
                review anyway →
              </a>
            </div>
          ) : isBlocked ? (
            <p className="text-[11px] font-mono text-[#5a5a72]">
              Complete the required skills above to unlock this.
            </p>
          ) : (
            <a
              href="/learn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7c6eff] hover:bg-[#6a5cdd] text-white text-[12px] font-medium transition-all hover:scale-[1.02]"
            >
              Study this skill →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
