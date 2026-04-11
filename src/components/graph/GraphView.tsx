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
  nodes: GraphNodeWithState[]
  edges: SkillEdge[]
  onSelect: (node: GraphNodeWithState | null) => void
}

// ─── Mastery colours (matches design system) ─────────────────────────────────

export const MASTERY_COLOUR: Record<MasteryState, string> = {
  mastered: '#34d399',
  fragile:  '#fbbf24',
  learning: '#7c6eff',
  ready:    '#5a5a72',
  blocked:  '#3a3a50',
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const NODE_W = 160
const NODE_H = 48

// ─── Dagre layout ─────────────────────────────────────────────────────────────

function computeLayout(
  skillNodes: GraphNodeWithState[],
  skillEdges: SkillEdge[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 44, ranksep: 80, marginx: 24, marginy: 24 })

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
    style:  {
      stroke:          e.strength === 'hard' ? 'rgba(124,110,255,0.45)' : 'rgba(90,90,114,0.30)',
      strokeWidth:     e.strength === 'hard' ? 1.5 : 1,
      strokeDasharray: e.strength === 'hard' ? undefined : '5 4',
    },
  }))

  return { nodes, edges }
}

// ─── Custom skill node ────────────────────────────────────────────────────────

interface SkillNodeProps {
  data:     { skillNode: GraphNodeWithState }
  selected?: boolean
}

function SkillNodeComponent({ data, selected }: SkillNodeProps) {
  const sn      = data.skillNode
  const color   = MASTERY_COLOUR[sn.mastery_state]
  const blocked = sn.mastery_state === 'blocked'
  const label   = sn.label.length > 19 ? sn.label.slice(0, 18) + '…' : sn.label

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color, opacity: 0.55, width: 6, height: 6, border: 'none' }}
      />

      <div
        style={{
          width:        NODE_W,
          height:       NODE_H,
          background:   selected ? '#16162a' : '#111118',
          border:       `${selected ? 2 : 1}px solid ${color}`,
          borderRadius: 7,
          opacity:      blocked ? 0.55 : 1,
          position:     'relative',
          display:      'flex',
          alignItems:   'center',
          padding:      '0 10px',
          overflow:     'hidden',
          cursor:       'pointer',
          boxShadow:    selected ? `0 0 0 1px ${color}30` : 'none',
        }}
      >
        {/* p_know progress strip at node bottom */}
        {!blocked && sn.p_know > 0 && (
          <div
            style={{
              position:     'absolute',
              bottom:       3,
              left:         4,
              width:        Math.max(0, (NODE_W - 8) * sn.p_know),
              height:       2,
              background:   color,
              opacity:      0.55,
              borderRadius: 1,
            }}
          />
        )}

        {/* Skill label */}
        <span
          style={{
            fontFamily:   'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize:     10,
            color:        blocked ? '#4a4a60' : '#c8c8d8',
            flex:         1,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            lineHeight:   1,
            userSelect:   'none',
          }}
        >
          {label}
        </span>

        {/* Mastery dot */}
        <div
          style={{
            width:        6,
            height:       6,
            borderRadius: '50%',
            background:   color,
            flexShrink:   0,
            marginLeft:   6,
          }}
        />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color, opacity: 0.55, width: 6, height: 6, border: 'none' }}
      />
    </>
  )
}

// nodeTypes must be defined outside the component to avoid remounting on render
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, any> = { skillNode: SkillNodeComponent }

// ─── Component ────────────────────────────────────────────────────────────────

export function GraphView({ nodes: skillNodes, edges: skillEdges, onSelect }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Recompute layout whenever skill data arrives/updates
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
      fitViewOptions={{ padding: 0.12 }}
      minZoom={0.25}
      maxZoom={1.8}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
    >
      <Background
        color="#1e1e30"
        variant={BackgroundVariant.Dots}
        gap={22}
        size={1.2}
      />
      <Controls
        showInteractive={false}
        style={{
          background:   '#111118',
          border:       '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8,
          boxShadow:    'none',
        }}
      />
    </ReactFlow>
  )
}
