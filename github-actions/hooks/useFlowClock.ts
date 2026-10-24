import { useEffect, useRef } from 'scripting'

type FlowClock = { elapsed: number; last: number | null }

export function useFlowClock(active: boolean): (time: number) => number {
  const clock = useRef<FlowClock>({ elapsed: 0, last: null })
  useEffect((): void => { clock.current.last = null }, [active])
  return (time: number): number => {
    const state: FlowClock = clock.current
    if (!active) {
      state.last = null
      return state.elapsed
    }
    if (state.last !== null) state.elapsed += Math.max(0, Math.min(0.1, time - state.last))
    state.last = time
    return state.elapsed
  }
}
