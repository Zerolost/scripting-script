import type { FlowNodeGeometry, FlowPoint, FlowSegmentGeometry } from './flowGeometry'

export function signalPosition(value: number): number {
  if (value < 0 || value > 1) return value
  return value * value * (3 - 2 * value)
}

export function nodeSweep(node: FlowNodeGeometry, incoming: FlowSegmentGeometry | undefined, phase: number): { from: FlowPoint; to: FlowPoint } {
  const p: number = Math.max(0, Math.min(1, phase))
  const reverse: boolean = Boolean(incoming && incoming.dx < 0)
  const vertical: boolean = Boolean(incoming && incoming.dy > 0)
  const start: FlowPoint = vertical ? { x: incoming!.to.x, y: node.y + 2 } : { x: node.x + (reverse ? node.width - 14 : 14), y: node.y + 2 }
  const end: FlowPoint = { x: node.x + (reverse ? 14 : node.width - 14), y: node.y + 2 }
  const tail: number = Math.max(0, p - 0.28)
  return {
    from: { x: start.x + (end.x - start.x) * tail, y: start.y + (end.y - start.y) * tail },
    to: { x: start.x + (end.x - start.x) * p, y: start.y + (end.y - start.y) * p },
  }
}

export function arrivalPulse(progress: number, echo: boolean): number {
  const local: number = echo ? (progress - 0.36) / 0.64 : progress / 0.72
  return local > 0 && local < 1 ? Math.sin(Math.PI * local) ** 2 : 0
}
