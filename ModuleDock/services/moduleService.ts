import { fetch } from "scripting"
import { SURGE_OPEN_URL, SURGE_RELOAD_URL } from "../constants"
import { TARGETS } from "../constants/targets"
import type { ModuleEntry, Settings, TargetId, UpdateResult, UpdateSummary } from "../types"
import {
  composeUpdatedContent,
  deriveNameFromUrl,
  extractSubscribedUrl,
  fileNameOf,
  isModuleContent,
  isModuleFileName,
  parseModuleHeader,
  resolveTarget,
  timestampOf,
  toValidFileName,
} from "../utils/moduleContent"
import {
  buildRemoteImportUrl,
  fileNameFromConvertedUrl,
  parseModuleInput,
  stripKnownExtension,
} from "../utils/targets"
import { ensureFolder } from "./settingsStore"

/** 统一成毫秒 */
function toMillis(value: number): number {
  if (!value || value <= 0) {
    return 0
  }
  return value < 1_000_000_000_000 ? value * 1000 : value
}

/** 扫描缓存 */
type ScanCacheEntry = { mtime: number; size: number; entry: ModuleEntry }
const scanCache = new Map<string, ScanCacheEntry>()

function rememberEntry(entry: ModuleEntry): void {
  scanCache.set(entry.path, { mtime: entry.modifiedAt, size: entry.size, entry })
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
    debugLabel: "ModuleDock",
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

function isRegularFile(type: string): boolean {
  return type === "file" || type === "NSFileTypeRegular" || type.endsWith("Regular")
}

/** 直接从磁盘读一个模块，用于详情页在列表尚未刷新时也能正常展示 */
export function readLocalModuleEntry(path: string): ModuleEntry | null {
  try {
    if (!FileManager.existsSync(path)) {
      return null
    }
    const stat = FileManager.statSync(path)
    if (!isRegularFile(stat.type)) {
      return null
    }
    let content = ""
    try {
      content = FileManager.readAsStringSync(path)
    } catch (error) {
      console.log("读取本地模块失败", error)
    }
    const fileName = fileNameOf(path)
    const target = resolveTarget(content, fileName)
    const header = parseModuleHeader(content, target)
    const entry: ModuleEntry = {
      path,
      fileName,
      name: header.name || stripKnownExtension(fileName),
      desc: header.desc,
      subscribedUrl: header.subscribedUrl,
      size: stat.size,
      modifiedAt: toMillis(timestampOf(stat.modificationDate)),
      hasSubscription: Boolean(header.subscribedUrl),
      target,
      status: "idle",
    }
    rememberEntry(entry)
    return entry
  } catch (error) {
    console.log("读取本地模块失败", error)
    return null
  }
}

/** 扫描目录，生成模块列表 */
export async function scanModules(folderPath: string): Promise<ModuleEntry[]> {
  if (!FileManager.existsSync(folderPath)) {
    return []
  }
  const items = await FileManager.readDirectory(folderPath)
  const entries: ModuleEntry[] = []
  const seen = new Set<string>()
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
      if (!isRegularFile(stat.type)) {
        continue
      }
      seen.add(path)
      const mtime = toMillis(timestampOf(stat.modificationDate))
      const cached = scanCache.get(path)
      if (cached && cached.mtime === mtime && cached.size === stat.size) {
        entries.push({ ...cached.entry, status: "idle", error: undefined })
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
      const target = resolveTarget(content, fileName)
      const header = parseModuleHeader(content, target)
      const entry: ModuleEntry = {
        path,
        fileName,
        name: header.name || stripKnownExtension(fileName),
        desc: header.desc,
        subscribedUrl: header.subscribedUrl,
        size: stat.size,
        modifiedAt: mtime,
        hasSubscription: Boolean(header.subscribedUrl),
        target,
        status: readError ? "failed" : "idle",
        error: readError,
      }
      if (!readError) {
        rememberEntry(entry)
      }
      entries.push(entry)
    }
  })

  await Promise.all(workers)
  for (const key of scanCache.keys()) {
    if (!seen.has(key)) {
      scanCache.delete(key)
    }
  }
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

  const localHeader = parseModuleHeader(localContent, entry.target)
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

  if (!isModuleContent(remote, entry.target)) {
    return {
      ok: false,
      reason: "invalid",
      message: `远端内容不是合法的 ${TARGETS[entry.target].app} ${TARGETS[entry.target].kind}`,
      entry: { ...entry, status: "failed", error: "内容非法" },
    }
  }

  const remoteHeader = parseModuleHeader(remote, entry.target)
  const content = composeUpdatedContent(remote, url, entry.target)
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
  const next: ModuleEntry = {
    ...entry,
    name: remoteHeader.name || entry.name,
    desc: remoteHeader.desc,
    subscribedUrl: url,
    size: stat.size,
    modifiedAt: toMillis(timestampOf(stat.modificationDate)) || Date.now(),
    hasSubscription: true,
    status: "success",
    error: undefined,
  }
  rememberEntry(next)
  return {
    ok: true,
    changedName: Boolean(localHeader.name) && localHeader.name !== remoteHeader.name,
    changedDesc: Boolean(localHeader.desc) && localHeader.desc !== remoteHeader.desc,
    entry: next,
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

/** 同名文件存在时，生成一个不冲突的路径 */
function uniquePath(folderPath: string, stem: string, extension: string): string {
  let candidate = `${folderPath}/${stem}${extension}`
  let index = 1
  while (FileManager.existsSync(candidate)) {
    candidate = `${folderPath}/${stem}-${index}${extension}`
    index += 1
  }
  return candidate
}

/**
 * 从链接下载并保存为本地模块。
 * 链接可以是 Script-Hub 的转换结果，也可以直接是各 App 的导入链接。
 */
export async function installFromURL(
  rawUrl: string,
  name: string | null,
  folderPath: string,
  settings: Settings,
  targetOverride?: TargetId | null
): Promise<ModuleEntry> {
  const parsed = parseModuleInput(rawUrl)
  const url = parsed.url.trim()
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("请填写 http(s) 开头的模块链接")
  }

  const remote = await fetchModuleText(url, settings.userAgent)
  const nameFromUrl = fileNameFromConvertedUrl(url)
  const hint = targetOverride ?? parsed.target
  const target = resolveTarget(remote, nameFromUrl ?? undefined, hint)

  if (!isModuleContent(remote, target)) {
    const info = TARGETS[target]
    throw new Error(`目标内容不是合法的 ${info.app} ${info.kind}`)
  }

  const header = parseModuleHeader(remote, target)
  const rawName = name?.trim() || parsed.name || nameFromUrl || header.name || deriveNameFromUrl(url) || "untitled"
  const baseName = toValidFileName(stripKnownExtension(rawName)) || "untitled"
  const extension = TARGETS[target].extension
  const suggested = `${baseName}${extension}`
  let path = `${folderPath}/${suggested}`

  // 同名文件存在时，同源则视为重新安装直接覆盖，不同源则另存副本
  if (FileManager.existsSync(path)) {
    let existing = ""
    try {
      existing = await readTextFile(path)
    } catch (error) {
      console.log("读取已存在模块失败", error)
    }
    if (extractSubscribedUrl(existing) !== url) {
      path = uniquePath(folderPath, baseName, extension)
    }
  }

  const fileName = fileNameOf(path)
  const content = composeUpdatedContent(remote, url, target)
  await ensureFolder(folderPath)
  await writeTextFile(path, content)
  const stat = FileManager.statSync(path)
  const entry: ModuleEntry = {
    path,
    fileName,
    name: header.name || baseName,
    desc: header.desc,
    subscribedUrl: url,
    size: stat.size,
    modifiedAt: toMillis(timestampOf(stat.modificationDate)) || Date.now(),
    hasSubscription: true,
    target,
    status: "success",
  }
  rememberEntry(entry)
  return entry
}

/** 删除模块文件 */
export async function removeModule(entry: ModuleEntry): Promise<void> {
  scanCache.delete(entry.path)
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

/** 用目标 App 的 URL Scheme 导入远端模块 */
export async function importToTarget(entry: ModuleEntry): Promise<boolean> {
  if (!entry.subscribedUrl) {
    return false
  }
  const info = TARGETS[entry.target]
  const url = buildRemoteImportUrl(entry.target, entry.subscribedUrl, entry.name)
  try {
    return await Safari.openURL(url)
  } catch (error) {
    console.log(`打开 ${info.app} 失败`, error)
    return false
  }
}

/** 分享文件（用于导入各 App 的本地文件） */
export async function shareFile(path: string): Promise<boolean> {
  return await ShareSheet.present([path])
}
