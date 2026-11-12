import { createContext, useContext, useEffect, useState, type VirtualNode } from "scripting"
import { initialIconPaths, loadIcons, type IconKey } from "../services/iconStore"

type IconPaths = Record<IconKey, string | null>

const IconContext = createContext<IconPaths>()

/** 图标路径：首帧同步读缓存，缺失的再异步补齐 */
export function IconProvider({ children }: { children: VirtualNode }): VirtualNode {
  const [paths, setPaths] = useState<IconPaths>(() => initialIconPaths())

  useEffect(() => {
    let alive = true
    void loadIcons().then(next => {
      if (alive) {
        setPaths(next)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  return <IconContext.Provider value={paths}>{children}</IconContext.Provider>
}

export function useIconPaths(): IconPaths {
  return useContext(IconContext)
}
