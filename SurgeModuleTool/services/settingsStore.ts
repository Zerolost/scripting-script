import { DEFAULT_SETTINGS, MODULE_FOLDER_NAME, SETTINGS_FILE_NAME } from "../constants"
import type { Settings } from "../types"

/** 设置文件路径：放在 App Group，Widget / 其它入口也能读到 */
export function settingsPath(): string {
  return `${FileManager.appGroupDocumentsDirectory}/${SETTINGS_FILE_NAME}`
}

/** 读取设置，解析失败时回退默认值 */
export function loadSettings(): Settings {
  const path = settingsPath()
  try {
    if (!FileManager.existsSync(path)) {
      return { ...DEFAULT_SETTINGS }
    }
    const raw = FileManager.readAsStringSync(path)
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    }
  } catch (error) {
    console.log("读取设置失败", error)
    return { ...DEFAULT_SETTINGS }
  }
}

/** 保存设置 */
export async function saveSettings(settings: Settings): Promise<void> {
  const dir = FileManager.appGroupDocumentsDirectory
  if (!FileManager.existsSync(dir)) {
    await FileManager.createDirectory(dir, true)
  }
  await FileManager.writeAsString(settingsPath(), JSON.stringify(settings, null, 2))
}

/** 默认模块目录：优先 iCloud/Documents，其次沙盒 Documents */
export function defaultModuleFolder(): string {
  try {
    if (FileManager.isiCloudEnabled) {
      return `${FileManager.iCloudDocumentsDirectory}/${MODULE_FOLDER_NAME}`
    }
  } catch (error) {
    console.log("iCloud 不可用，使用本地 Documents", error)
  }
  return `${FileManager.documentsDirectory}/${MODULE_FOLDER_NAME}`
}

/** 确保目录存在 */
export async function ensureFolder(path: string): Promise<void> {
  if (!FileManager.existsSync(path)) {
    await FileManager.createDirectory(path, true)
  }
}

/**
 * 解析当前可用的模块目录：
 * 1. 优先使用用户选择的目录书签
 * 2. 其次使用上次记录的路径（仍然存在时）
 * 3. 最后回退默认目录
 */
export async function resolveModuleFolder(settings: Settings): Promise<string> {
  if (settings.folderBookmark && FileManager.bookmarkExists(settings.folderBookmark)) {
    const bookmarked = FileManager.bookmarkedPath(settings.folderBookmark)
    if (bookmarked) {
      await ensureFolder(bookmarked)
      return bookmarked
    }
  }
  if (settings.folderPath && FileManager.existsSync(settings.folderPath)) {
    await ensureFolder(settings.folderPath)
    return settings.folderPath
  }
  const fallback = defaultModuleFolder()
  await ensureFolder(fallback)
  return fallback
}

/** 让用户选择一个目录并保存书签，返回新的设置 */
export async function pickModuleFolder(settings: Settings): Promise<Settings | null> {
  const result = await DocumentPicker.pickDirectoryBookmark({
    preferredName: "surge-module-folder",
    initialDirectory: settings.folderPath ?? undefined,
  })
  if (!result) {
    return null
  }
  return {
    ...settings,
    folderBookmark: result.bookmarkName,
    folderPath: result.path,
  }
}

/** 清理旧书签（切换目录时调用） */
export function removeBookmark(name: string | null): void {
  if (name && FileManager.bookmarkExists(name)) {
    try {
      FileManager.removeFileBookmark(name)
    } catch (error) {
      console.log("移除书签失败", error)
    }
  }
}

/** 用户可选择的其他目录（用于展示） */
export function candidateFolders(): Array<{ title: string; path: string }> {
  const list: Array<{ title: string; path: string }> = []
  try {
    if (FileManager.isiCloudEnabled) {
      list.push({ title: "iCloud Drive/SurgeModules", path: `${FileManager.iCloudDocumentsDirectory}/${MODULE_FOLDER_NAME}` })
    }
  } catch {
    // iCloud 不可用时忽略
  }
  list.push({ title: "App Documents/SurgeModules", path: `${FileManager.documentsDirectory}/${MODULE_FOLDER_NAME}` })
  return list
}
