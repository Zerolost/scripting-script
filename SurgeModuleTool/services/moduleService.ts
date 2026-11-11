import { fetch } from "scripting"
import { SURGE_OPEN_URL, SURGE_RELOAD_URL } from "../constants"
import type { ModuleEntry, Settings, UpdateResult, UpdateSummary } from "../types"
import {
  composeUpdatedContent,
  deriveNameFromUrl,
  extractSubscribedUrl,
  fileNameOf,
  isModuleContent,
  isModuleFileName,
  parseModuleHeader,
  timestampOf,
  toValidFileName,
} from "../utils/moduleContent"
import { ensureFolder } from "./settingsStore"

/** 统一成毫秒 */
function toMillis(value: number): number {
  if (!value || value <= 0) {
    return 0
  }
  return value < 1_000_000_000_000 ? value * 1000 : value
}

/** 读取文本；iCloud 文件未下载时先触发下载 */
export async function readTextFile(path: string): Promise<string> {
  if (FileManager.isFileStoredIniCloud(path) && !FileManager.isiCloudFileDownloaded(path)) {
    const downloaded = await FileManager.downloadFileFromiCloud(path)
    if (!downloaded) {
      throw new Error("iCloud 文件尚未下载")
    }
  }
  return await FileManager.readAsString(path)
}

/** 写入文本 */
export async function writeTextFile(path: string, content: string): Promise<void> {
  await FileManager.writeAsString(path, content)
}

/** 下载远端文本，失败时抛出可读错误 */
export async function fetchModuleText(url: string, userAgent: string): Promise<string> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": userAgent,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    timeout: 25,
    // Script Hub 的转换结果走 http://script.hub/，必须放行明文请求
    allowInsecureRequest: true,
    debugLabel: "SurgeModuleTool",
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const text = await response.text()
  if (!text) {
    throw new Error("响应为空，未获取到模块内容")
  }
  return text
}

/** 把目录中的文件名解析成完整路径 */
function joinPath(folder: string, item: string): string {
  return item.startsWith("/") ? item : `${folder}/${item}`
}

/** 扫描目录，生成模块列表 */
export async function scanModules(folderPath: string): Promise<ModuleEntry[]> {
  if (!FileManager.existsSync(folderPath)) {
    return []
  }
  const items = await FileManager.readDirectory(folderPath)
  const entries: ModuleEntry[] = []
  let cursor = 0

  // 并发 4 个读取任务
  const workers = Array.from({ length: Math.min(4, Math.max(1, items.length)) }, async () => {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= items.length) {
        return
      }
      const item = items[index]
      const path = joinPath(folderPath, item)
      const fileName = fileNameOf(path)
      if (!isModuleFileName(fileName)) {
        continue
      }
      let stat: FileStat
      try {
        stat = FileManager.statSync(path)
      } catch {
        continue
      }
      if (stat.type !== "file") {
        continue
      }
      let content = ""
      let readError: string | undefined
      try {
        content = await readTextFile(path)
      } catch (error) {
        readError = error instanceof Error ? error.message : String(error)
        console.log(`读取失败: ${fileName}`, error)
      }
      const header = parseModuleHeader(content)
      entries.push({
        path,
        fileName,
        name: header.name || fileName.replace(/\.[^.]+$/, ""),
        desc: header.desc,
        subscribedUrl: header.subscribedUrl,
        size: stat.size,
        modifiedAt: toMillis(timestampOf(stat.modificationDate)),
        hasSubscription: Boolean(header.subscribedUrl),
        status: readError ? "failed" : "idle",
        error: readError,
      })
    }
  })

  await Promise.all(workers)
  entries.sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"))
  return entries
}

/** 更新单个模块 */
export async function updateModule(entry: ModuleEntry, settings: Settings): Promise<UpdateResult> {
  let localContent = ""
  try {
    localContent = await readTextFile(entry.path)
  } catch (error) {
    return {
      ok: false,
      reason: "write",
      message: `无法读取文件：${error instanceof Error ? error.message : String(error)}`,
      entry: { ...entry, status: "failed", error: "读取失败" },
    }
  }

  const localHeader = parseModuleHeader(localContent)
  const url = localHeader.subscribedUrl
  if (!url) {
    return {
      ok: false,
      reason: "no-url",
      message: "模块缺少 #SUBSCRIBED 订阅链接",
      entry: { ...entry, status: "no-url", error: "无订阅链接" },
    }
  }

  let remote: string
  try {
    remote = await fetchModuleText(url, settings.userAgent)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      reason: "network",
      message,
      entry: { ...entry, status: "failed", error: message },
    }
  }

  if (!isModuleContent(remote)) {
    return {
      ok: false,
      reason: "invalid",
      message: "远端内容不是合法模块（缺少 #!name）",
      entry: { ...entry, status: "failed", error: "内容非法" },
    }
  }

  const remoteHeader = parseModuleHeader(remote)
  const content = composeUpdatedContent(remote, url)
  try {
    await writeTextFile(entry.path, content)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      reason: "write",
      message: `写入失败：${message}`,
      entry: { ...entry, status: "failed", error: "写入失败" },
    }
  }

  const stat = FileManager.statSync(entry.path)
  return {
    ok: true,
    changedName: Boolean(localHeader.name) && localHeader.name !== remoteHeader.name,
    changedDesc: Boolean(localHeader.desc) && localHeader.desc !== remoteHeader.desc,
    entry: {
      ...entry,
      name: remoteHeader.name || entry.name,
      desc: remoteHeader.desc,
      subscribedUrl: url,
      size: stat.size,
      modifiedAt: toMillis(timestampOf(stat.modificationDate)) || Date.now(),
      hasSubscription: true,
      status: "success",
      error: undefined,
    },
  }
}

/** 批量更新 */
export async function updateAllModules(
  entries: ModuleEntry[],
  settings: Settings,
  onEntry: (result: UpdateResult) => void
): Promise<UpdateSummary> {
  const summary: UpdateSummary = { total: entries.length, success: 0, noUrl: 0, failed: [] }
  for (const entry of entries) {
    const result = await updateModule(entry, settings)
    onEntry(result)
    if (result.ok) {
      summary.success += 1
    } else if (result.reason === "no-url") {
      summary.noUrl += 1
    } else {
      summary.failed.push(result.entry.name || result.entry.fileName)
    }
  }
  return summary
}

/** 从链接下载并保存为本地模块 */
export async function installFromURL(
  url: string,
  name: string | null,
  folderPath: string,
  settings: Settings
): Promise<ModuleEntry> {
  const trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error("请填写 http(s) 开头的模块链接")
  }
  const remote = await fetchModuleText(trimmed, settings.userAgent)
  if (!isModuleContent(remote)) {
    throw new Error("目标内容不是合法模块（缺少 #!name）")
  }
  const header = parseModuleHeader(remote)
  const baseName = toValidFileName(name?.trim() || header.name || deriveNameFromUrl(trimmed) || "untitled")
  const suggested = baseName.toLowerCase().endsWith(".sgmodule") ? baseName : `${baseName}.sgmodule`
  let path = `${folderPath}/${suggested}`

  // 同名文件存在时：同源则视为重新安装直接覆盖，不同源则另存副本，避免覆盖用户手工修改
  if (FileManager.existsSync(path)) {
    let existing = ""
    try {
      existing = await readTextFile(path)
    } catch (error) {
      console.log("读取已存在模块失败", error)
    }
    if (extractSubscribedUrl(existing) !== trimmed) {
      const stem = baseName.replace(/\.sgmodule$/i, "")
      let index = 1
      let candidate = `${folderPath}/${stem}-${index}.sgmodule`
      while (FileManager.existsSync(candidate)) {
        index += 1
        candidate = `${folderPath}/${stem}-${index}.sgmodule`
      }
      path = candidate
    }
  }

  const fileName = fileNameOf(path)
  const content = composeUpdatedContent(remote, trimmed)
  await ensureFolder(folderPath)
  await writeTextFile(path, content)
  const stat = FileManager.statSync(path)
  return {
    path,
    fileName,
    name: header.name || baseName,
    desc: header.desc,
    subscribedUrl: trimmed,
    size: stat.size,
    modifiedAt: toMillis(timestampOf(stat.modificationDate)) || Date.now(),
    hasSubscription: true,
    status: "success",
  }
}

/** 删除模块文件 */
export async function removeModule(entry: ModuleEntry): Promise<void> {
  await FileManager.remove(entry.path)
}

/** 尽力让 Surge 重新加载模块；失败不抛出 */
export async function reloadSurge(): Promise<boolean> {
  try {
    await fetch(SURGE_RELOAD_URL, {
      method: "GET",
      timeout: 5,
      allowInsecureRequest: true,
    })
    return true
  } catch (error) {
    console.log("重载 Surge 失败", error)
    return false
  }
}

/** 打开 Surge */
export async function openSurge(): Promise<boolean> {
  try {
    return await Safari.openURL(SURGE_OPEN_URL)
  } catch (error) {
    console.log("打开 Surge 失败", error)
    return false
  }
}

/** 分享文件（用于导入 Surge） */
export async function shareFile(path: string): Promise<boolean> {
  return await ShareSheet.present([path])
}
