import { createContext, useContext, useEffect, useState, type VirtualNode } from "scripting"
import { loadIcons, type IconKey } from "../services/iconStore"

type IconPaths = Record<IconKey, string | null>

const EMPTY: IconPaths = { surge: null, loon: null, stash: null, shadowrocket: null, egern: null }

const IconContext = createContext<IconPaths>()

/** 启动时把四个 App 图标下载到本地，之后列表只读本地文件 */
export function IconProvider({ children }: { children: VirtualNode }): VirtualNode {
  const [paths, setPaths] = useState<IconPaths>(EMPTY)

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
