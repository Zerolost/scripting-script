import type { CanvasRenderingContext } from 'scripting'

export const flowNodeHeight: number = 72
export const flowRowGap: number = 24

export type FlowPoint = { x: number; y: number }
export type FlowNodeGeometry = { x: number; y: number; width: number; offset: number; phase: number; opacity: number }
export type FlowSegmentGeometry = { from: FlowPoint; to: FlowPoint; dx: number; dy: number; nodeIndex: number }
export type FlowGeometry = {
  width: number
  height: number
  count: number
  lane: number
  nodes: FlowNodeGeometry[]
  segments: FlowSegmentGeometry[]
}
export type FlowBaseContext = Pick<CanvasRenderingContext, 'save' | 'restore' | 'lineCap' | 'globalAlpha' | 'beginPath' | 'moveTo' | 'lineTo' | 'stroke' | 'arc' | 'fill'>

export function getFlowGeometry(cached: FlowGeometry | null, width: number, height: number, count: number, lane: number): FlowGeometry {
  if (cached && cached.width === width && cached.height === height && cached.count === count && cached.lane === lane) return cached
  const half: number = width / 2
  const nodes: FlowNodeGeometry[] = []
  const segments: FlowSegmentGeometry[] = []
  for (let index: number = 0; index < count; index += 1) {
    const row: number = Math.floor(index / 2)
    const column: number = row % 2 === 0 ? index % 2 : 1 - index % 2
    nodes.push({ x: column * (half + flowRowGap / 2), y: row * (flowNodeHeight + flowRowGap), width: count === 1 ? width : half - flowRowGap / 2, offset: index * 0.17 + lane * 0.23, phase: 0, opacity: 0 })
    if (index === 0) continue
    const previousRow: number = Math.floor((index - 1) / 2)
    let from: FlowPoint
    let to: FlowPoint
    if (row === previousRow) {
      const y: number = previousRow * (flowNodeHeight + flowRowGap) + flowNodeHeight / 2
      const direction: number = row % 2 === 0 ? 1 : -1
      from = { x: half - direction * 12, y }
      to = { x: half + direction * 12, y }
    } else {
      const x: number = row % 2 === 1 ? half * 1.5 + 6 : half * 0.5 - 6
      from = { x, y: previousRow * (flowNodeHeight + flowRowGap) + flowNodeHeight }
      to = { x, y: row * (flowNodeHeight + flowRowGap) }
    }
    segments.push({ from, to, dx: to.x - from.x, dy: to.y - from.y, nodeIndex: index })
  }
  return { width, height, count, lane, nodes, segments }
}

export function drawFlowBase(ctx: FlowBaseContext, segments: FlowSegmentGeometry[]): void {
  for (const segment of segments) {
    ctx.save()
    ctx.lineCap = 'round'
    ctx.globalAlpha = 0.2
    ctx.beginPath()
    ctx.moveTo(segment.from.x, segment.from.y)
    ctx.lineTo(segment.to.x, segment.to.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(segment.from.x, segment.from.y, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(segment.to.x, segment.to.y, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}
