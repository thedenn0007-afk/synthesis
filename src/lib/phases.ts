import type { SkillNode, LearnerSkillState } from '@/types'

export const PHASE_ORDER = [
  'phase_1_computer_basics',
  'phase_2_cs_data',
  'phase_3_intro_ai',
  'phase_4_machine_learning',
  'phase_5_deep_learning',
  'phase_6_modern_ai',
  'phase_7_real_world',
  'phase_8_mastery',
] as const

export type PhaseKey = typeof PHASE_ORDER[number]

export function buildPhaseGroups(allNodes: SkillNode[]): Record<string, SkillNode[]> {
  const groups: Record<string, SkillNode[]> = {}
  for (const node of allNodes.filter(n => !n.deprecated)) {
    if (!groups[node.phase]) groups[node.phase] = []
    groups[node.phase].push(node)
  }
  return groups
}

export function findActivePhase(
  allNodes: SkillNode[],
  stateMap: Map<string, LearnerSkillState>,
): string {
  const groups = buildPhaseGroups(allNodes)
  for (const phase of PHASE_ORDER) {
    const nodes = groups[phase] ?? []
    if (nodes.length === 0) continue
    const contentNodes = nodes.filter(n => n.question_ids.length > 0)
    if (contentNodes.length === 0) continue
    const allMastered = contentNodes.every(n => stateMap.get(n.id)?.mastery_state === 'mastered')
    if (!allMastered) return phase
  }
  return PHASE_ORDER[PHASE_ORDER.length - 1]
}
