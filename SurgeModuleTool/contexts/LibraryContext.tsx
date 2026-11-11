import { createContext, useCallback, useContext, useEffect, useMemo, useState, type VirtualNode } from "scripting"
import type { ModuleEntry, Settings, UpdateResult, UpdateSummary } from "../types"
import {
  installFromURL,
  reloadSurge,
  removeModule,
  scanModules,
  updateAllModules,
  updateModule,
} from "../services/moduleService"
import { pickModuleFolder, removeBookmark, resolveModuleFolder, saveSettings } from "../services/settingsStore"

/** 全局状态：设置、模块列表与全部操作 */
export type LibraryContextValue = {
  settings: Settings
  folderPath: string
  modules: ModuleEntry[]
  loading: boolean
  busy: boolean
  showNotice: (text: string | null) => void
  refresh: () => Promise<void>
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  chooseFolder: () => Promise<void>
  updateOne: (entry: ModuleEntry) => Promise<UpdateResult>
  updateAll: () => Promise<UpdateSummary>
  addFromURL: (url: string, name: string) => Promise<ModuleEntry>
  remove: (entry: ModuleEntry) => Promise<void>
  reload: () => Promise<boolean>
}

const LibraryContext = createContext<LibraryContextValue>()

/** 提示条单独一个 Context：避免 Toast 变化重渲染整个页面 */
type ToastContextValue = {
  notice: string | null
  showNotice: (text: string | null) => void
}

const ToastContext = createContext<ToastContextValue>()

/** 读取当前上下文的快捷 Hook */
export function useLibrary(): LibraryContextValue {
  return useContext(LibraryContext)
}

/** 读取提示条状态 */
export function useToast(): ToastContextValue {
  return useContext(ToastContext)
}

/** 把一条更新结果合并回列表 */
function mergeEntry(list: ModuleEntry[], entry: ModuleEntry): ModuleEntry[] {
  return list.map(item => (item.path === entry.path ? entry : item))
}

export function LibraryProvider({
  children,
  initialSettings,
}: {
  children: VirtualNode
  initialSettings: Settings
}): VirtualNode {
  const [settings, setSettings] = useState<Settings>(initialSettings)
  const [folderPath, setFolderPath] = useState<string>(initialSettings.folderPath ?? "")
  const [modules, setModules] = useState<ModuleEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [busy, setBusy] = useState<boolean>(false)
  const [notice, setNotice] = useState<string | null>(null)

  const showNotice = useCallback((text: string | null) => {
    setNotice(text)
  }, [])

  /** 重新解析目录并扫描模块 */
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const folder = await resolveModuleFolder(settings)
      setFolderPath(folder)
      setModules(await scanModules(folder))
      setSettings(current => {
        if (current.folderPath === folder) {
          return current
        }
        const next: Settings = { ...current, folderPath: folder }
        void saveSettings(next)
        return next
      })
    } catch (error) {
      console.log("扫描模块失败", error)
      showNotice(`扫描失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }, [settings, showNotice])

  useEffect(() => {
    void refresh()
    // 仅在首次挂载时扫描
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const next: Settings = { ...settings, ...patch }
      setSettings(next)
      await saveSettings(next)
    },
    [settings]
  )

  const chooseFolder = useCallback(async () => {
    const picked = await pickModuleFolder(settings)
    if (!picked) {
      return
    }
    if (settings.folderBookmark && settings.folderBookmark !== picked.folderBookmark) {
      removeBookmark(settings.folderBookmark)
    }
    setSettings(picked)
    await saveSettings(picked)
    const folder = await resolveModuleFolder(picked)
    setFolderPath(folder)
    setLoading(true)
    try {
      setModules(await scanModules(folder))
    } finally {
      setLoading(false)
    }
    showNotice("模块目录已更新")
  }, [settings, showNotice])

  const updateOne = useCallback(
    async (entry: ModuleEntry): Promise<UpdateResult> => {
      setBusy(true)
      setModules(current => mergeEntry(current, { ...entry, status: "updating", error: undefined }))
      try {
        const result = await updateModule(entry, settings)
        setModules(current => mergeEntry(current, result.entry))
        if (result.ok) {
          showNotice(`✅ ${result.entry.name} 已更新`)
        } else if (result.reason === "no-url") {
          showNotice(`🈚️ ${entry.fileName} 没有订阅链接`)
        } else {
          showNotice(`❌ ${entry.name}：${result.message}`)
        }
        return result
      } finally {
        setBusy(false)
      }
    },
    [settings, showNotice]
  )

  const updateAll = useCallback(async (): Promise<UpdateSummary> => {
    setBusy(true)
    try {
      const summary = await updateAllModules(modules, settings, result => {
        setModules(current => mergeEntry(current, result.entry))
      })
      if (settings.reloadAfterUpdate) {
        await reloadSurge()
      }
      const parts = [`✅ 成功 ${summary.success}`]
      if (summary.noUrl > 0) {
        parts.push(`🈚️ 无链接 ${summary.noUrl}`)
      }
      if (summary.failed.length > 0) {
        parts.push(`❌ 失败 ${summary.failed.length}`)
      }
      showNotice(`共 ${summary.total} 个模块 · ${parts.join(" · ")}`)
      return summary
    } finally {
      setBusy(false)
    }
  }, [modules, settings, showNotice])

  const addFromURL = useCallback(
    async (url: string, name: string): Promise<ModuleEntry> => {
      setBusy(true)
      try {
        // 首次从 URL Scheme 进入时目录可能还没解析出来，这里再解析一次
        const targetFolder = folderPath || (await resolveModuleFolder(settings))
        const entry = await installFromURL(url, name, targetFolder, settings)
        await refresh()
        showNotice(`✅ 已保存 ${entry.fileName}`)
        return entry
      } finally {
        setBusy(false)
      }
    },
    [folderPath, settings, refresh, showNotice]
  )

  const remove = useCallback(
    async (entry: ModuleEntry) => {
      await removeModule(entry)
      setModules(current => current.filter(item => item.path !== entry.path))
      showNotice(`已删除 ${entry.fileName}`)
    },
    [showNotice]
  )

  const reload = useCallback(async () => {
    const ok = await reloadSurge()
    showNotice(ok ? "已请求 Surge 重载模块" : "重载请求失败，可在 Surge 内手动重载")
    return ok
  }, [showNotice])

  const value = useMemo<LibraryContextValue>(
    () => ({
      settings,
      folderPath,
      modules,
      loading,
      busy,
      showNotice,
      refresh,
      updateSettings,
      chooseFolder,
      updateOne,
      updateAll,
      addFromURL,
      remove,
      reload,
    }),
    [
      settings,
      folderPath,
      modules,
      loading,
      busy,
      showNotice,
      refresh,
      updateSettings,
      chooseFolder,
      updateOne,
      updateAll,
      addFromURL,
      remove,
      reload,
    ]
  )

  const toastValue = useMemo<ToastContextValue>(() => ({ notice, showNotice }), [notice, showNotice])

  return (
    <LibraryContext.Provider value={value}>
      <ToastContext.Provider value={toastValue}>{children}</ToastContext.Provider>
    </LibraryContext.Provider>
  )
}
