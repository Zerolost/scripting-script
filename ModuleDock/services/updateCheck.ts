import { fetch } from "scripting"
import { REMOTE_SCRIPT_JSON_URL, TOOL_VERSION } from "../constants"

export type VersionCheck = {
  current: string
  remote: string | null
  /** 远端版本比本地新 */
  outdated: boolean
  error?: string
}

/** 比较 "3.5.0" 这类版本号，a > b 返回正数 */
function compareVersion(a: string, b: string): number {
  const left = a.split(".").map(part => Number(part.replace(/\D/g, "")) || 0)
  const right = b.split(".").map(part => Number(part.replace(/\D/g, "")) || 0)
  const size = Math.max(left.length, right.length)
  for (let i = 0; i < size; i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0)
    if (diff !== 0) {
      return diff
    }
  }
  return 0
}

/** 读取远端 script.json 的 version，与本地比较 */
export async function checkScriptUpdate(): Promise<VersionCheck> {
  try {
    const response = await fetch(REMOTE_SCRIPT_JSON_URL, {
      method: "GET",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      timeout: 15,
    })
    if (!response.ok) {
      return { current: TOOL_VERSION, remote: null, outdated: false, error: `HTTP ${response.status}` }
    }
    const text = await response.text()
    const parsed = JSON.parse(text) as { version?: string }
    const remote = typeof parsed.version === "string" ? parsed.version : null
    if (!remote) {
      return { current: TOOL_VERSION, remote: null, outdated: false, error: "远端缺少 version 字段" }
    }
    return { current: TOOL_VERSION, remote, outdated: compareVersion(remote, TOOL_VERSION) > 0 }
  } catch (error) {
    return {
      current: TOOL_VERSION,
      remote: null,
      outdated: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
