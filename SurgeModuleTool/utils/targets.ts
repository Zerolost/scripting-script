import { TARGETS } from "../constants/targets"
import type { TargetId } from "../types"

/** 目标 App 的已知后缀（含点） */
const KNOWN_EXTENSIONS = [".sgmodule", ".plugin", ".stoverride", ".module", ".yaml", ".yml"]

/** 读取 URL 查询串里的某个参数，失败时返回原值 */
export function readQueryValue(url: string, key: string): string | null {
  const index = url.indexOf("?")
  if (index < 0) {
    return null
  }
  const query = url.slice(index + 1).split("#")[0]
  for (const part of query.split("&")) {
    const eq = part.indexOf("=")
    if (eq <= 0) {
      continue
    }
    if (part.slice(0, eq) !== key) {
      continue
    }
    const raw = part.slice(eq + 1)
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
  return null
}

/** 把 Script-Hub 的 target 取值或本应用的短 id 统一成 TargetId */
export function normalizeTarget(value: string | null | undefined): TargetId | null {
  if (!value) {
    return null
  }
  const text = value.trim().toLowerCase()
  switch (text) {
    case "surge-module":
    case "surge":
      return "surge"
    case "loon-plugin":
    case "loon":
      return "loon"
    case "stash-stoverride":
    case "stash":
      return "stash"
    case "shadowrocket-module":
    case "shadowrocket":
      return "shadowrocket"
    default:
      return null
  }
}

/** 根据文件后缀推断目标 App；.sgmodule 无法区分 Surge / Shadowrocket，返回 surge */
export function detectTargetFromFileName(fileName: string): TargetId | null {
  const lower = (fileName || "").toLowerCase()
  if (lower.endsWith(".plugin")) {
    return "loon"
  }
  if (lower.endsWith(".stoverride")) {
    return "stash"
  }
  if (lower.endsWith(".sgmodule")) {
    return "surge"
  }
  if (lower.endsWith(".yaml") || lower.endsWith(".yml")) {
    return "stash"
  }
  return null
}

/** 从转换后的链接推断目标 App：target 参数 → 路径后缀 → 导入站点特征 */
export function detectTargetFromUrl(url: string): TargetId | null {
  if (!url) {
    return null
  }
  const byParam =
    normalizeTarget(readQueryValue(url, "target")) ??
    normalizeTarget(readQueryValue(url, "target-app"))
  if (byParam) {
    return byParam
  }
  const plain = url.split("?")[0].split("#")[0].toLowerCase()
  if (plain.endsWith(".plugin")) {
    return "loon"
  }
  if (plain.endsWith(".stoverride")) {
    return "stash"
  }
  const lower = url.toLowerCase()
  if (lower.includes("api.boxjs.app/shadowrocket/install")) {
    return "shadowrocket"
  }
  if (lower.includes("nsloon.com/openloon/import")) {
    return "loon"
  }
  if (lower.startsWith("stash://install-override") || lower.includes("link.stash.ws/install-override")) {
    return "stash"
  }
  if (lower.startsWith("shadowrocket://install") || lower.startsWith("shadowrocket://config/add")) {
    return "shadowrocket"
  }
  return null
}

/** 去掉已知的模块后缀，得到文件名主干 */
export function stripKnownExtension(name: string): string {
  const lower = name.toLowerCase()
  for (const ext of KNOWN_EXTENSIONS) {
    if (lower.endsWith(ext)) {
      return name.slice(0, name.length - ext.length)
    }
  }
  return name
}

/** 解析后的用户输入 */
export type ParsedModuleInput = {
  /** 真正要下载的链接 */
  url: string
  /** 链接中携带的目标 App */
  target: TargetId | null
  /** 链接中携带的文件名 */
  name: string | null
}

/** 去掉前缀后取值，前缀不匹配时返回 null */
function afterPrefix(input: string, prefix: string): string | null {
  if (!input.toLowerCase().startsWith(prefix.toLowerCase())) {
    return null
  }
  return input.slice(prefix.length)
}

/**
 * 用户可能直接粘贴各 App 的导入链接（Script-Hub 页面上的按钮就是这些），
 * 这里把它们还原成真正的资源链接。
 */
export function parseModuleInput(raw: string): ParsedModuleInput {
  const input = (raw || "").trim()
  if (!input) {
    return { url: "", target: null, name: null }
  }

  // 本应用自己的调用链接（scripting:// / scriptable:// 都兼容）
  const lowerInput = input.toLowerCase()
  if (lowerInput.startsWith("scripting://run") || lowerInput.startsWith("scriptable://")) {
    const inner = readQueryValue(input, "url") ?? ""
    return {
      url: inner,
      target: normalizeTarget(readQueryValue(input, "target")) ?? detectTargetFromUrl(inner),
      name: readQueryValue(input, "name"),
    }
  }

  // Surge 远程模块
  if (afterPrefix(input, "surge:///install-module") !== null) {
    const inner = readQueryValue(input, "url") ?? ""
    return { url: inner, target: "surge", name: readQueryValue(input, "name") }
  }

  // Stash 覆写
  if (afterPrefix(input, "stash://install-override") !== null) {
    return { url: readQueryValue(input, "url") ?? "", target: "stash", name: readQueryValue(input, "name") }
  }

  // Shadowrocket 模块
  if (afterPrefix(input, "shadowrocket://install") !== null) {
    return { url: readQueryValue(input, "module") ?? "", target: "shadowrocket", name: null }
  }
  if (afterPrefix(input, "shadowrocket://config/add/") !== null) {
    return { url: input.slice("shadowrocket://config/add/".length), target: "shadowrocket", name: null }
  }

  // Loon 插件
  if (afterPrefix(input, "loon://import") !== null) {
    return { url: readQueryValue(input, "plugin") ?? "", target: "loon", name: null }
  }
  if (afterPrefix(input, "https://www.nsloon.com/openloon/import") !== null) {
    return { url: readQueryValue(input, "plugin") ?? "", target: "loon", name: null }
  }

  // BoxJS 的 Shadowrocket 包装
  if (afterPrefix(input, "https://api.boxjs.app/shadowrocket/install") !== null) {
    return { url: readQueryValue(input, "module") ?? "", target: "shadowrocket", name: null }
  }

  // link.stash.ws/install-override/<不带 scheme 的链接>
  const stashRest = afterPrefix(input, "https://link.stash.ws/install-override/")
  if (stashRest !== null) {
    return { url: `https://${stashRest.split("?")[0]}`, target: "stash", name: null }
  }

  return {
    url: input,
    target: detectTargetFromUrl(input),
    name: readQueryValue(input, "name"),
  }
}

/** 从 Script-Hub 的转换结果里取出文件名（/_end_/<name><suffix>?<params>） */
export function fileNameFromConvertedUrl(url: string): string | null {
  const marker = "/_end_/"
  const index = url.indexOf(marker)
  if (index < 0) {
    return null
  }
  const rest = url.slice(index + marker.length).split("?")[0]
  try {
    return decodeURIComponent(rest)
  } catch {
    return rest
  }
}

/** 构造目标 App 的远程导入链接 */
export function buildRemoteImportUrl(target: TargetId, moduleUrl: string, name?: string): string {
  const info = TARGETS[target]
  const encoded = encodeURIComponent(moduleUrl)
  if (target === "surge" && name) {
    return `${info.remoteScheme}${encoded}&name=${encodeURIComponent(name)}`
  }
  return `${info.remoteScheme}${encoded}`
}
