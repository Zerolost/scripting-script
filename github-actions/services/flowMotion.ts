export function flowOpacity(position: number): number {
  if (position <= 0 || position >= 1) return 0
  const edge: number = Math.min(position / 0.24, (1 - position) / 0.24, 1)
  return edge * edge * (3 - 2 * edge)
}

export function flowPhase(time: number, duration: number, offset: number = 0): number {
  const cycles: number = time / Math.max(0.1, duration) + offset
  return ((cycles % 1) + 1) % 1
}
