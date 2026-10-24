import { signalPosition } from './flowSignal'

export type TransferSlot = { index: number; start: number; end: number }
export type TransferPlan = { slots: TransferSlot[]; period: number }

export function createTransferPlan(moving: boolean[], duration: number, compactQuiet: boolean): TransferPlan {
  const d: number = Number.isFinite(duration) ? Math.max(0.1, duration) : 1.4
  let cursor: number = 0
  const slots: TransferSlot[] = moving.map((active: boolean, index: number): TransferSlot => {
    const start: number = cursor
    cursor += d * (compactQuiet && !active ? 0.16 : index === 0 && compactQuiet ? 0.36 : 0.72)
    return { index, start, end: cursor }
  })
  return { slots, period: cursor + d * 0.4 }
}

export function transferFrame(plan: TransferPlan, elapsed: number, arrivalStart: number): { index: number; phase: number } {
  if (!Number.isFinite(elapsed) || plan.period <= 0) return { index: -1, phase: -1 }
  const cycle: number = ((elapsed % plan.period) + plan.period) % plan.period
  const slot: TransferSlot | undefined = plan.slots.find((item: TransferSlot): boolean => cycle >= item.start && cycle < item.end)
  if (!slot) return { index: -1, phase: -1 }
  const progress: number = Math.min(1 - Number.EPSILON, (cycle - slot.start) / (slot.end - slot.start))
  const start: number = Number.isFinite(arrivalStart) ? Math.max(0.45, Math.min(0.8, arrivalStart)) : 0.64
  return { index: slot.index, phase: slot.index === 0 ? start + (1 - start) * progress : progress }
}

export type TransferPlayback = { plan: TransferPlan; origin: number }

export function advanceTransferPlayback(state: TransferPlayback | null, next: TransferPlan, elapsed: number): TransferPlayback {
  if (!state || next.slots.length !== state.plan.slots.length || !Number.isFinite(elapsed)) return { plan: next, origin: Number.isFinite(elapsed) ? elapsed : 0 }
  // 持续记录当前周期起点，状态改变只在旧周期结束后交接。
  const local: number = elapsed - state.origin
  if (local < state.plan.period) return state
  const boundary: number = state.origin + Math.floor(local / state.plan.period) * state.plan.period
  return { plan: next, origin: boundary }
}

export function dockedSignal(progress: number, smooth: boolean, settle: number = 0.22): { position: number; opacity: number } {
  const window: number = Number.isFinite(settle) ? Math.max(0.01, settle) : 0.22
  if (!Number.isFinite(progress) || progress <= 0 || progress >= 1 + window) return { position: 0, opacity: 0 }
  const position: number = Math.min(1, progress)
  const fadeIn: number = Math.min(1, progress / 0.2)
  const fadeOut: number = progress <= 1 ? 1 : Math.max(0, 1 - (progress - 1) / window)
  return { position: smooth ? signalPosition(position) : position, opacity: fadeIn * fadeOut }
}
