import { fetch } from "scripting"
import { APP_ICONS } from "../constants/appIcons"
import { TARGET_ORDER } from "../constants/targets"
import type { TargetId } from "../types"

export type IconKey = TargetId | "egern"

const ICON_DIR = `${FileManager.appGroupDocumentsDirectory}/icons`

const cache = new Map<IconKey, string>()

/** 图标缓存目录里的文件路径 */
export function iconFilePath(id: IconKey): string {
  return `${ICON_DIR}/${id}.png`
}

/** 已下载的图标路径；未就绪时返回 null */
export function cachedIconPath(id: IconKey): string | null {
  return cache.get(id) ?? null
}

async function ensureDir(): Promise<void> {
  if (!FileManager.existsSync(ICON_DIR)) {
    await FileManager.createDirectory(ICON_DIR, true)
  }
}

async function ensureIcon(id: IconKey): Promise<string> {
  const path = iconFilePath(id)
  if (FileManager.existsSync(path)) {
    cache.set(id, path)
    return path
  }
  const response = await fetch(APP_ICONS[id], {
    method: "GET",
    timeout: 15,
    headers: { "Cache-Control": "no-cache" },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const bytes = await response.bytes()
  await FileManager.writeAsBytes(path, bytes)
  cache.set(id, path)
  return path
}

/**
 * 把四个 App 图标下载到本地缓存。
 * 列表滚动时直接读本地文件，避免每行发起网络请求。
 */
export async function loadIcons(): Promise<Record<IconKey, string | null>> {
  const result = {} as Record<IconKey, string | null>
  try {
    await ensureDir()
  } catch (error) {
    console.log("创建图标目录失败", error)
  }
  const keys: IconKey[] = [...TARGET_ORDER, "egern"]
  await Promise.all(
    keys.map(async id => {
      try {
        result[id] = await ensureIcon(id)
      } catch (error) {
        console.log(`加载 ${id} 图标失败`, error)
        result[id] = null
      }
    })
  )
  return result
}
