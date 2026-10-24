import type { FlowPoint, FlowSegmentGeometry } from './flowGeometry'

export function flowEdgePoint(x: number, y: number, width: number, height: number, phase: number, incoming?: FlowSegmentGeometry): FlowPoint {
  const inset: number = 1.5
  const radius: number = Math.min(10.5, width / 4, height / 4)
  const left: number = x + inset
  const right: number = x + width - inset
  const top: number = y + inset
  const reverse: boolean = Boolean(incoming && incoming.dx < 0)
  const vertical: boolean = Boolean(incoming && incoming.dy > 0)
  const p: number = Math.max(0, Math.min(1, phase))
  if (vertical || !incoming) {
    const start: number = vertical ? incoming!.to.x : left + radius
    const horizontal: number = Math.max(0, right - radius - start)
    const arc: number = Math.PI * radius / 2
    const down: number = Math.max(0, height / 2 - inset - radius)
    const distance: number = p * (horizontal + arc + down)
    if (distance <= horizontal) return { x: start + distance, y: top }
    if (distance <= horizontal + arc) {
      const angle: number = -Math.PI / 2 + (distance - horizontal) / radius
      return { x: right - radius + Math.cos(angle) * radius, y: top + radius + Math.sin(angle) * radius }
    }
    return { x: right, y: top + radius + distance - horizontal - arc }
  }
  const side: number = Math.max(0, height / 2 - inset - radius)
  const arc: number = Math.PI * radius / 2
  const horizontal: number = Math.max(0, width - inset * 2 - radius * 2)
  const distance: number = p * (side + arc + horizontal)
  let point: FlowPoint
  if (distance <= side) point = { x: left, y: y + height / 2 - distance }
  else if (distance <= side + arc) {
    const angle: number = Math.PI + (distance - side) / radius
    point = { x: left + radius + Math.cos(angle) * radius, y: top + radius + Math.sin(angle) * radius }
  } else point = { x: left + radius + distance - side - arc, y: top }
  return reverse ? { x: x + width - (point.x - x), y: point.y } : point
}
