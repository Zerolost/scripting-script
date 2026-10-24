import { useState, useEffect } from 'scripting'

export function useRunElapsed(active: boolean): number {
  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    if (!active) return
    let cancelled: boolean = false
    let timer: ReturnType<typeof setTimeout> | null = null
    const tick: () => void = (): void => {
      if (cancelled) return
      setNow(Date.now())
      timer = setTimeout(tick, 10000)
    }
    tick()
    return () => {
      cancelled = true
      if (timer !== null) clearTimeout(timer)
    }
  }, [active])
  return now
}
