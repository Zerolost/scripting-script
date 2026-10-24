export type FlowArrival = { travel: number; arrival: number; sweep: number }

export function flowArrival(phase: number, arrivalStart: number = 0.64): FlowArrival {
  const start: number = Math.max(0.45, Math.min(0.8, arrivalStart))
  const travel: number = phase / start
  const progress: number = (phase - start) / (1 - start)
  return {
    travel,
    arrival: progress > 0 && progress < 1 ? Math.sin(Math.PI * progress) ** 2 : 0,
    sweep: progress,
  }
}
