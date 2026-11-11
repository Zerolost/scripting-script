import { SCHEME_MODULE_FILE } from "../constants"
import type { SchemeArtifacts } from "../types"
import { ensureFolder } from "./settingsStore"

/**
 * Surge 侧的反劫持方案：
 * 使用 [Body Rewrite] + [Header Rewrite] 把响应里的 scriptable:// 改成 scripting://。
 * 纯声明式规则，不需要额外的 JS 脚本文件，放进 .sgmodule 即可生效。
 */
export function buildSurgeModule(hostname = "*"): string {
  const targets = hostname.trim() || "*"
  return [
    "#!name=Scriptable 链接转 Scripting",
    "#!desc=把 HTTP 响应里的 scriptable:// 链接改写为 scripting://，让 Scriptable 的安装/调用链接直接交给 Scripting 处理。需要开启 MITM 并信任 Surge 证书。",
    `#!arguments=hostname:${targets}`,
    "#!arguments-desc=需要解密的域名，逗号分隔；* 表示全部（默认已排除 Apple/iCloud 等无法解密的域名）。只拦截某个站点时，建议把这里改成该站域名。",
    "#!requirement=CORE_VERSION>=20",
    "",
    "[Body Rewrite]",
    "http-response ^https?:// scriptable:///run_single/ scripting://run_single/ scriptable:///run/ scripting://run/ scriptable:/// scripting:// scriptable:// scripting://",
    "",
    "[Header Rewrite]",
    "http-response ^https?:// header-replace-regex Location scriptable:///run_single/ scripting://run_single/",
    "http-response ^https?:// header-replace-regex Location scriptable:///run/ scripting://run/",
    "http-response ^https?:// header-replace-regex Location scriptable:/// scripting://",
    "",
    "[MITM]",
    "hostname = %APPEND% -*.apple.com, -*.icloud.com, -*.mzstatic.com, -*.crashlytics.com, {{{hostname}}}",
    "",
  ].join("\n")
}

/** 只写入 Surge 模块；Safari 侧已改为项目内置的 browser.tsx */
export async function writeSchemeArtifacts(folderPath: string, hostname = "*"): Promise<SchemeArtifacts> {
  await ensureFolder(folderPath)
  const moduleContent = buildSurgeModule(hostname)
  const modulePath = `${folderPath}/${SCHEME_MODULE_FILE}`
  await FileManager.writeAsString(modulePath, moduleContent)
  return { modulePath, moduleContent }
}

/** Scheme 转换的纯函数版本，供「转换测试」小工具使用 */
export function convertSchemeUrl(value: string): string {
  return value
    .replace(/scriptable:\/\/\/run_single\//g, "scripting://run_single/")
    .replace(/scriptable:\/\/\/run\//g, "scripting://run/")
    .replace(/scriptable:\/\/\//g, "scripting://")
    .replace(/scriptable:\/\//g, "scripting://")
}

/** 把 scripting://run/x 转成可在 Scripting 里直接打开的链接（校验用） */
export function isScriptingRunUrl(value: string): boolean {
  return /^scripting:\/\/run(_single)?\/[^/?#]+/.test(value)
}
