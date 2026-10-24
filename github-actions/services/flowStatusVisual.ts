export type FlowStatus = { status: string; conclusion: string | null }
export type FlowStatusVisual = {
  tone: 'success' | 'failure' | 'inactive' | 'running' | 'waiting'
  motion: 'travel' | 'pulse' | 'none'
  dashed: boolean
}

export function flowStatusVisual(state: FlowStatus): FlowStatusVisual {
  if (state.status !== 'completed') {
    return state.status === 'in_progress'
      ? { tone: 'running', motion: 'travel', dashed: false }
      : { tone: 'waiting', motion: 'none', dashed: true }
  }
  switch (state.conclusion) {
    case 'success': return { tone: 'success', motion: 'travel', dashed: false }
    case 'failure':
    case 'timed_out':
    case 'action_required':
    case 'startup_failure': return { tone: 'failure', motion: 'pulse', dashed: false }
    default: return { tone: 'inactive', motion: 'none', dashed: true }
  }
}
