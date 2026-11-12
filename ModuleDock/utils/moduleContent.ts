import { IGNORED_EXTENSIONS } from "../constants"
import type { ModuleHeader, TargetId } from "../types"
import { detectTargetFromFileName } from "./targets"

/** 匹配 #!name 行 */
const NAME_RE = /^#!\s*name\s*=\s*(.*?)\s*$/im
/** 匹配 #!desc 行 */
const DESC_RE = /^#!\s*desc\s*=\s*(.*?)\s*$/im
/** 匹配 #SUBSCRIBED 行 */
const SUBSCRIBED_RE = /^#SUBSCRIBED\s+(.*?)\s*$/im
/** 匹配本工具写入的目标标记行 */
const TARGET_MARKER_RE = /^#\s*@target\s+([a-z-]+)\s*$/im
/** 匹配所有 #! 指令行 */
const DIRECTIVE_RE = /^#!.+$/gm

/** 统一换行符，避免 CRLF 造成解析差异 */
export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n")
}

/** 去掉描述里由本工具写入的 “🔗 [时间]” 前缀 */
export function stripStamp(desc: string): string {
  return desc.replace(/^🔗\s*\[[^\]]*\]\s*/, "").trim()
}

/** 去掉 YAML 值两侧的引号 */
function unquote(value: string): string {
  const text = value.trim()
  if (text.length >= 2) {
    const first = text[0]
    const last = text[text.length - 1]
    if ((first === "'" && last === "'") || (first === '"' && last === '"')) {
      return text.slice(1, -1)
    }
  }
  return text
}

/**
 * 只解析 YAML 头部的 name / desc，不引入完整 YAML 解析器。
 * Stash 覆写由 Script-Hub 输出为 `name: |-` 这种块标量，需要按缩进收集。
 */
export function parseYamlHeader(raw: string): { name: string; desc: string } {
  const lines = normalizeNewlines(raw).split("\n")
  const result: Record<string, string> = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line || /^\s/.test(line) || line.startsWith("#")) {
      continue
    }
    const match = line.match(/^(name|desc)\s*:\s*(.*)$/)
    if (!match) {
      continue
    }
    const key = match[1]
    const value = match[2].trim()

    // 块标量：|、|-、>、>-
    if (/^[|>][+-]?$/.test(value)) {
      const parts: string[] = []
      let j = i + 1
      while (j < lines.length) {
        const next = lines[j]
        if (next.trim() === "") {
          parts.push("")
          j += 1
          continue
        }
        if (!/^\s/.test(next)) {
          break
        }
        parts.push(next.trim())
        j += 1
      }
      result[key] = parts.join(" ").trim()
      i = j - 1
      continue
    }

    result[key] = unquote(value)
  }

  return { name: result.name ?? "", desc: result.desc ?? "" }
}

/** 判断文本是否像一份 Stash 覆写（YAML，且不是 #! 开头的模块） */
export function isStashOverride(raw: string): boolean {
  const content = normalizeNewlines(raw)
  if (NAME_RE.test(content)) {
    return false
  }
  return /^name\s*:/m.test(content) || /^(rules|http|scriptings|mitm|proxy-groups)\s*:/m.test(content)
}

/** 读取文件里由本工具写入的目标标记 */
export function readTargetMarker(raw: string): TargetId | null {
  const match = normalizeNewlines(raw).match(TARGET_MARKER_RE)
  if (!match) {
    return null
  }
  switch (match[1].toLowerCase()) {
    case "surge": return "surge"
    case "loon": return "loon"
    case "stash": return "stash"
    case "shadowrocket": return "shadowrocket"
    default: return null
  }
}

/** 只根据内容判断目标 App（能识别 Stash 覆写与目标标记） */
export function detectTargetFromContent(raw: string): TargetId | null {
  const marker = readTargetMarker(raw)
  if (marker) {
    return marker
  }
  if (isStashOverride(raw)) {
    return "stash"
  }
  return null
}

/**
 * 综合判断目标 App：
 * 文件内的目标标记 > 非歧义后缀 > Stash YAML 特征 > 调用方提示 > 后缀 > Surge
 */
export function resolveTarget(raw: string, fileName?: string, hint?: TargetId | null): TargetId {
  const marker = readTargetMarker(raw)
  if (marker) {
    return marker
  }
  if (fileName) {
    const byExt = detectTargetFromFileName(fileName)
    if (byExt && byExt !== "surge") {
      return byExt
    }
  }
  if (isStashOverride(raw)) {
    return "stash"
  }
  if (hint) {
    return hint
  }
  if (fileName) {
    const byExt = detectTargetFromFileName(fileName)
    if (byExt) {
      return byExt
    }
  }
  return "surge"
}

/** 解析模块头部信息 */
export function parseModuleHeader(raw: string, target?: TargetId): ModuleHeader {
  const content = normalizeNewlines(raw)
  const resolved = target ?? resolveTarget(content)
  const nameMatch = content.match(NAME_RE)
  const descMatch = content.match(DESC_RE)
  const subscribedMatch = content.match(SUBSCRIBED_RE)

  let name = nameMatch ? nameMatch[1].trim() : ""
  let rawDesc = descMatch ? descMatch[1].trim() : ""

  // Stash 覆写用 YAML 的 name / desc
  if (resolved === "stash") {
    const yaml = parseYamlHeader(content)
    if (yaml.name) {
      name = yaml.name
    }
    if (yaml.desc) {
      rawDesc = yaml.desc
    }
  }

  return {
    name,
    desc: stripStamp(rawDesc),
    rawDesc,
    subscribedUrl: subscribedMatch ? subscribedMatch[1].trim() : null,
  }
}

/** 从任意文本中取出 #SUBSCRIBED 链接 */
export function extractSubscribedUrl(raw: string): string | null {
  return parseModuleHeader(raw).subscribedUrl
}

/** 判断文本是否像一份合法的模块（Surge / Loon / Shadowrocket 用 #!name，Stash 用 YAML name） */
export function isModuleContent(raw: string, target?: TargetId): boolean {
  const content = normalizeNewlines(raw)
  if (!content.trim()) {
    return false
  }
  if (target === "stash") {
    return isStashOverride(content) || /^#SUBSCRIBED\s/m.test(content)
  }
  if (NAME_RE.test(content)) {
    return true
  }
  if (!target) {
    return isStashOverride(content)
  }
  return false
}

/** 在最后一个 #! 指令行之后插入内容 */
export function insertAfterLastDirective(content: string, addition: string): string {
  const re = new RegExp(DIRECTIVE_RE.source, "gm")
  let end = -1
  let match: RegExpExecArray | null = re.exec(content)
  while (match !== null) {
    end = match.index + match[0].length
    match = re.exec(content)
  }
  if (end < 0) {
    return addition + content
  }
  return content.slice(0, end) + addition + content.slice(end)
}

/** 生成带时间戳的描述 */
export function formatStamp(date: Date): string {
  return date.toLocaleString()
}

/** 移除旧的订阅链接、链接标题与目标标记 */
function removeMarkers(body: string): string {
  const cleaned = body
    .replace(/^#SUBSCRIBED.*$/gim, "")
    .replace(/^#\s*🔗\s*模块链接.*$/gim, "")
    .replace(/^#\s*@target\s+\S+\s*$/gim, "")
  return cleaned.replace(/\n{3,}/g, "\n\n").replace(/^\n+/, "")
}

/**
 * 把远端内容合成为本地模块内容。
 * Surge / Loon / Shadowrocket：在最后一条 #! 指令后插入链接区块，并给 #!desc 加时间戳。
 */
export function composeUpdatedContent(
  remote: string,
  sourceUrl: string,
  target: TargetId = "surge",
  at: Date = new Date()
): string {
  let body = removeMarkers(normalizeNewlines(remote))

  if (target === "stash") {
    const header = `# 🔗 模块链接\n#SUBSCRIBED ${sourceUrl}\n# @target stash\n\n`
    return `${header}${body.replace(/\s+$/, "")}\n`
  }

  if (!DESC_RE.test(body)) {
    const nameLine = body.match(/^#!\s*name\s*=.*$/im)
    if (nameLine && nameLine.index !== undefined) {
      const insertAt = nameLine.index + nameLine[0].length
      body = `${body.slice(0, insertAt)}\n#!desc=${body.slice(insertAt)}`
    } else {
      body = `#!desc=\n${body}`
    }
  }

  body = insertAfterLastDirective(
    body,
    `\n\n# 🔗 模块链接\n#SUBSCRIBED ${sourceUrl}\n# @target ${target}\n`
  )
  body = body.replace(/\n{3,}/g, "\n\n")
  body = body.replace(/^#!\s*desc\s*=\s*/im, `#!desc=🔗 [${formatStamp(at)}] `)
  return `${body.replace(/\s+$/, "")}\n`
}

/** 判断文件夹中的文件名是否应当作为模块处理 */
export function isModuleFileName(fileName: string): boolean {
  if (!fileName || fileName.startsWith(".")) {
    return false
  }
  const lower = fileName.toLowerCase()
  return !IGNORED_EXTENSIONS.some(ext => lower.endsWith(ext))
}

/** 把任意字符串转为合法文件名 */
export function toValidFileName(input: string): string {
  return input
    .replace(/[/:*?"<>|]/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^[\s.]+|[\s.]+$/g, "")
}

/** 从 URL 推断模块名称 */
export function deriveNameFromUrl(url: string): string {
  const plain = url.split("?")[0].split("#")[0]
  const segment = plain.substring(plain.lastIndexOf("/") + 1)
  let decoded = segment
  try {
    decoded = decodeURIComponent(segment)
  } catch {
    decoded = segment
  }
  const name = decoded.replace(/\.(sgmodule|plugin|stoverride|module|snippet|conf)$/i, "")
  return toValidFileName(name)
}

/** 取路径中的文件名 */
export function fileNameOf(path: string): string {
  const index = path.lastIndexOf("/")
  return index >= 0 ? path.substring(index + 1) : path
}

/** 取路径中的目录 */
export function directoryOf(path: string): string {
  const index = path.lastIndexOf("/")
  return index > 0 ? path.substring(0, index) : path
}

/** 取 URL 的 host，用于列表摘要 */
export function hostOf(url: string | null): string {
  if (!url) {
    return ""
  }
  const match = url.match(/^[a-z]+:\/\/([^/]+)/i)
  return match ? match[1] : url
}

/** 读取文件时间戳（毫秒） */
export function timestampOf(date: Date | number | null | undefined): number {
  if (!date) {
    return 0
  }
  return typeof date === "number" ? date : date.getTime()
}

/** 时间戳格式化为 “x 分钟前” */
export function relativeTime(timestamp: number): string {
  if (!timestamp) {
    return "未更新"
  }
  const diff = Date.now() - timestamp
  if (diff < 60_000) {
    return "刚刚"
  }
  if (diff < 3_600_000) {
    return `${Math.floor(diff / 60_000)} 分钟前`
  }
  if (diff < 86_400_000) {
    return `${Math.floor(diff / 3_600_000)} 小时前`
  }
  if (diff < 30 * 86_400_000) {
    return `${Math.floor(diff / 86_400_000)} 天前`
  }
  return new Date(timestamp).toLocaleDateString()
}

/** 文件大小格式化 */
export function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}
