'use client'
import { useState, useEffect, useMemo } from 'react'
import { Navbar }           from '@/components/layout/Navbar'
import { GraphView }        from '@/components/graph/GraphView'
import { SkillDetailPanel } from '@/components/graph/SkillDetailPanel'
import type { GraphNodeWithState } from '@/components/graph/GraphView'
import type { SkillEdge } from '@/types'

// ─── Legend config ────────────────────────────────────────────────────────────

const LEGEND = [
  { color: '#34d399', label: 'Mastered' },
  { color: '#fbbf24', label: 'Fragile' },
  { color: '#7c6eff', label: 'Learning' },
  { color: '#5a8a9f', label: 'Ready' },
  { color: '#5a5a72', label: 'Locked' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GraphPage() {
  const [nodes,    setNodes]    = useState<GraphNodeWithState[]>([])
  const [edges,    setEdges]    = useState<SkillEdge[]>([])
  const [selected, setSelected] = useState<GraphNodeWithState | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch('/api/graph')
        if (!r.ok) throw new Error('not ok')
        const data = await r.json()
        setNodes(data.nodes ?? [])
        setEdges(data.edges ?? [])
      } catch {
        setError('Could not load your learning graph. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Keep selected node fresh when data updates
  useEffect(() => {
    if (selected) {
      const fresh = nodes.find(n => n.id === selected.id)
      if (fresh) setSelected(fresh)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes])

  const nodesMap = useMemo(
    () => new Map(nodes.map(n => [n.id, n])),
    [nodes]
  )

  const stats = useMemo(() => ({
    mastered: nodes.filter(n => n.mastery_state === 'mastered').length,
    learning: nodes.filter(n => n.mastery_state === 'learning' || n.mastery_state === 'fragile').length,
    ready:    nodes.filter(n => n.mastery_state === 'ready').length,
    total:    nodes.length,
  }), [nodes])

  return (
    <div className="min-h-screen bg-c-bg">
      <Navbar />

      <div className="px-6 py-7">

        {/* ── Header + stats ──────────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto mb-5 animate-slide-up">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-serif italic text-[26px] text-c-text leading-none mb-1.5">
                Learning Graph
              </h1>
              <p className="text-[12px] text-c-faint font-mono">
                Click any node to explore prerequisites and next steps
              </p>
            </div>

            {/* Stats */}
            {!loading && !error && (
              <div className="flex items-center gap-6">
                {[
                  { val: stats.mastered, label: 'Mastered',    color: '#34d399' },
                  { val: stats.learning, label: 'In progress', color: '#7c6eff' },
                  { val: stats.ready,    label: 'Ready',       color: '#5a8a9f' },
                  { val: stats.total,    label: 'Total',       color: 'var(--text-faint)' },
                ].map(s => (
                  <div key={s.label} className="flex items-baseline gap-1.5">
                    <span className="font-serif text-[20px] font-semibold" style={{ color: s.color }}>
                      {s.val}
                    </span>
                    <span className="font-mono text-[10px] text-c-faint uppercase tracking-[0.07em]">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legend */}
          {!loading && !error && (
            <div className="flex flex-wrap items-center gap-5 mt-4 pt-4 border-t border-[var(--border)]">
              {LEGEND.map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  <span className="font-mono text-[10px] text-c-muted">{l.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <svg width="18" height="6">
                  <line x1="0" y1="3" x2="18" y2="3" stroke="rgba(124,110,255,0.55)" strokeWidth="1.5" />
                </svg>
                <span className="font-mono text-[10px] text-c-muted">Required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="18" height="6">
                  <line x1="0" y1="3" x2="18" y2="3" stroke="rgba(90,90,114,0.5)" strokeWidth="1" strokeDasharray="4 3" />
                </svg>
                <span className="font-mono text-[10px] text-c-muted">Helpful</span>
              </div>
              <span className="font-mono text-[10px] text-c-ghost ml-auto">
                Tip: scroll to zoom · click background to deselect
              </span>
            </div>
          )}
        </div>

        {/* ── Main content area ────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-32 gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-c-purple/30 border-t-c-purple animate-spin" />
            <p className="text-[12px] text-c-faint font-mono">Loading your graph…</p>
          </div>
        ) : error ? (
          <div className="max-w-6xl mx-auto rounded-xl border border-[var(--border)] bg-c-bg2 px-5 py-4">
            <p className="text-[13px] text-c-yellow font-mono">{error}</p>
          </div>
        ) : (
          /* Split layout: graph | detail panel */
          <div
            className="max-w-6xl mx-auto flex gap-4 items-start"
            style={{ minHeight: 560 }}
          >
            {/* Graph canvas — shrinks when panel is open */}
            <div
              className="rounded-xl border border-[var(--border)] bg-c-bg4 overflow-hidden transition-all duration-300"
              style={{
                flex: selected ? '0 0 62%' : '1 1 100%',
                height: 580,
              }}
            >
              <GraphView
                nodes={nodes}
                edges={edges}
                onSelect={setSelected}
              />
            </div>

            {/* Detail panel — slides in from right */}
            {selected && (
              <div className="flex-1 min-w-0 animate-slide-up">
                <SkillDetailPanel
                  node={selected}
                  edges={edges}
                  nodesMap={nodesMap}
                  onClose={() => setSelected(null)}
                />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
