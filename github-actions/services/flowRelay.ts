export function flowRelayPhase(time: number, duration: number, index: number, count: number, lane: number = 0, arrivalStart: number = 0.64): number {
  if (!Number.isFinite(time) || !Number.isFinite(duration) || !Number.isInteger(count) || count < 1 || !Number.isInteger(index) || index < 0 || index >= count) return -1
  const d: number = Math.max(0.1, duration)
  const slot: number = d * 0.72
  const period: number = count * slot + d * 0.4
  const offset: number = Number.isFinite(lane) ? Math.max(0, lane) * d * 0.23 : 0
  const cycle: number = (((time + offset) % period) + period) % period
  const position: number = cycle / slot
  //避免浮点边界让相邻步骤同时激活。
  if (Math.floor(position) !== index) return -1
  const progress: number = Math.max(0, Math.min(1 - Number.EPSILON, position - index))
  const start: number = Number.isFinite(arrivalStart) ? Math.max(0.45, Math.min(0.8, arrivalStart)) : 0.64
  return index === 0 ? start + (1 - start) * progress : progress
}
