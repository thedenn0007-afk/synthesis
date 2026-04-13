'use client'
import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { graphlib, layout as dagreLayout } from '@dagrejs/dagre'
import type { SkillEdge, SkillNode, MasteryState } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

export type GraphNodeWithState = SkillNode & {
  mastery_state: MasteryState
  p_know: number
}

interface Props {
  nodes:    GraphNodeWithState[]
  edges:    SkillEdge[]
  onSelect: (node: GraphNodeWithState | null) => void
}

// ─── Mastery colours ─────────────────────────────────────────────────────────

export const MASTERY_COLOUR: Record<MasteryState, string> = {
  mastered: '#34d399',
  fragile:  '#fbbf24',
  learning: '#7c6eff',
  ready:    '#5a8a9f',   /* teal-ish — more distinct from blocked */
  blocked:  '#5a5a72',
}

export const MASTERY_LABEL: Record<MasteryState, string> = {
  mastered: 'Mastered',
  fragile:  'Fragile',
  learning: 'Learning',
  ready:    'Ready',
  blocked:  'Locked',
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const NODE_W = 175
const NODE_H = 52

// ─── Dagre layout ─────────────────────────────────────────────────────────────

function computeLayout(
  skillNodes: GraphNodeWithState[],
  skillEdges: SkillEdge[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 48, ranksep: 90, marginx: 32, marginy: 32 })

  skillNodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: NODE_H }))
  skillEdges.forEach(e => g.setEdge(e.from, e.to))
  dagreLayout(g)

  const nodes: Node[] = skillNodes.map(n => {
    const pos = g.node(n.id)
    return {
      id:       n.id,
      type:     'skillNode',
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      data:     { skillNode: n },
    }
  })

  const edges: Edge[] = skillEdges.map((e, i) => ({
    id:     `e-${i}-${e.from}-${e.to}`,
    source: e.from,
    target: e.to,
    type:   'smoothstep',
    animated: false,
    style: {
      stroke:          e.strength === 'hard' ? 'rgba(124,110,255,0.5)' : 'rgba(90,90,114,0.28)',
      strokeWidth:     e.strength === 'hard' ? 1.5 : 1,
      strokeDasharray: e.strength === 'hard' ? undefined : '5 4',
    },
  }))

  return { nodes, edges }
}

// ─── Custom skill node ────────────────────────────────────────────────────────

interface SkillNodeProps {
  data:      { skillNode: GraphNodeWithState }
  selected?: boolean
}

function SkillNodeComponent({ data, selected }: SkillNodeProps) {
  const sn      = data.skillNode
  const color   = MASTERY_COLOUR[sn.mastery_state]
  const blocked = sn.mastery_state === 'blocked'
  // Truncate at 22 chars so text is readable at 11px
  const label   = sn.label.length > 22 ? sn.label.slice(0, 21) + '…' : sn.label

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color, opacity: 0.6, width: 6, height: 6, border: 'none' }}
      />

      <div
        style={{
          width:        NODE_W,
          height:       NODE_H,
          background:   selected ? 'var(--node-bg-sel)' : 'var(--node-bg)',
          border:       `${selected ? 2 : 1}px solid ${selected ? color : color + '70'}`,
          borderRadius: 8,
          opacity:      blocked ? 0.5 : 1,
          position:     'relative',
          display:      'flex',
          alignItems:   'center',
          padding:      '0 11px',
          overflow:     'hidden',
          cursor:       'pointer',
          boxShadow:    selected ? `0 0 0 2px ${color}22, 0 2px 8px rgba(0,0,0,0.18)` : '0 1px 3px rgba(0,0,0,0.12)',
          transition:   'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        {/* p_know progress strip at bottom */}
        {!blocked && sn.p_know > 0 && (
          <div
            style={{
              position:     'absolute',
              bottom:       0,
              left:         0,
              width:        `${Math.max(0, sn.p_know * 100)}%`,
              height:       3,
              background:   color,
              opacity:      0.45,
              borderRadius: '0 2px 0 0',
            }}
          />
        )}

        {/* Mastery dot */}
        <div
          style={{
            width:        8,
            height:       8,
            borderRadius: '50%',
            background:   color,
            flexShrink:   0,
            marginRight:  8,
            boxShadow:    blocked ? 'none' : `0 0 4px ${color}88`,
          }}
        />

        {/* Skill label */}
        <span
          style={{
            fontFamily:   'system-ui, -apple-system, sans-serif',
            fontSize:     11,
            fontWeight:   blocked ? 400 : 500,
            color:        blocked ? 'var(--node-blocked)' : 'var(--node-text)',
            flex:         1,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            userSelect:   'none',
            letterSpacing: '0.01em',
          }}
        >
          {label}
        </span>

        {/* p_know % badge for non-blocked */}
        {!blocked && sn.p_know > 0 && (
          <span
            style={{
              fontFamily:   'ui-monospace, monospace',
              fontSize:     9,
              color:        color,
              opacity:      0.75,
              flexShrink:   0,
              marginLeft:   5,
            }}
          >
            {Math.round(sn.p_know * 100)}%
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color, opacity: 0.6, width: 6, height: 6, border: 'none' }}
      />
    </>
  )
}

// nodeTypes must be defined outside render to avoid remounting
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, any> = { skillNode: SkillNodeComponent }

// ─── Component ────────────────────────────────────────────────────────────────

export function GraphView({ nodes: skillNodes, edges: skillEdges, onSelect }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    if (skillNodes.length === 0) return
    const { nodes: n, edges: e } = computeLayout(skillNodes, skillEdges)
    setNodes(n)
    setEdges(e)
  }, [skillNodes, skillEdges])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const found = skillNodes.find(n => n.id === node.id) ?? null
      onSelect(found)
    },
    [skillNodes, onSelect],
  )

  const handlePaneClick = useCallback(() => onSelect(null), [onSelect])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.14 }}
      minZoom={0.2}
      maxZoom={2}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
    >
      <Background
        color="var(--border-hi)"
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1.2}
      />
      <Controls showInteractive={false} />
    </ReactFlow>
  )
}
