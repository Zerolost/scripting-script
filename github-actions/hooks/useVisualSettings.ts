import { createContext, useContext, useEffect, useState } from 'scripting'
import { subscribeVisual, visualRevision } from '../services/visualSettings'

export const VisualRevisionContext = createContext<number>()

export function useVisualSettings(): number {
  return useContext(VisualRevisionContext) ?? visualRevision()
}

// 整个应用只建立一次外部订阅，子组件通过上下文读取版本。
export function useVisualRevision(): number {
  const [revision, setRevision] = useState<number>(visualRevision())
  useEffect(() => {
    const unsubscribe: () => void = subscribeVisual(() => setRevision(visualRevision()))
    setRevision(visualRevision())
    return unsubscribe
  }, [])
  return revision
}
