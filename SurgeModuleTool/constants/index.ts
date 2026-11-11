import type { Settings, TargetId } from "../types"

/** 工具版本，与原 Scriptable 版保持一致的语义版本 */
export const TOOL_VERSION = "3.4.0"

/** 原版工具使用的请求头 */
export const DEFAULT_USER_AGENT = "script-hub/1.0.0"

/** 默认模块目录名（放在 Scripting 的 iCloud/Documents 或沙盒 Documents 下） */
export const MODULE_FOLDER_NAME = "SurgeModules"

/** 设置文件名 */
export const SETTINGS_FILE_NAME = "surge-module-tool.json"

export const IGNORED_EXTENSIONS = [".conf", ".txt", ".js", ".list"]

/** 默认设置 */
export const DEFAULT_SETTINGS: Settings = {
  folderBookmark: null,
  folderPath: null,
  userAgent: DEFAULT_USER_AGENT,
  reloadAfterUpdate: false,
  showModulesWithoutUrl: true,
}

/** Surge 重载模块的特殊地址（Surge 会拦截该请求并重载模块） */
export const SURGE_RELOAD_URL = "http://script.hub/reload"

/** 打开 Surge 的 URL Scheme */
export const SURGE_OPEN_URL = "surge:///start"

/** Surge 官方仓库地址 */
export const SURGE_MODULE_STORE_URL = "https://github.com/Script-Hub-Org/Script-Hub"

/** 已发布的反劫持模块直链（Surge / Egern 共用） */
export const REMOTE_MODULE_URL =
  "https://raw.githubusercontent.com/Zerolost/scripting-script/main/SurgeModuleTool/Scriptable2Scripting.sgmodule"

const MODULE_BASE_URL =
  "https://raw.githubusercontent.com/Zerolost/scripting-script/main/SurgeModuleTool"

/** 四个目标 App 各自的反劫持模块直链 */
export const REMOTE_MODULE_URLS: Record<TargetId, string> = {
  surge: `${MODULE_BASE_URL}/Scriptable2Scripting.sgmodule`,
  loon: `${MODULE_BASE_URL}/Scriptable2Scripting.plugin`,
  stash: `${MODULE_BASE_URL}/Scriptable2Scripting.stoverride`,
  shadowrocket: `${MODULE_BASE_URL}/Scriptable2Scripting.shadowrocket.sgmodule`,
}

/** Surge 安装远程模块 */
export const SURGE_INSTALL_PREFIX = "surge:///install-module?url="

/** Egern 安装远程模块（与 Script Hub 使用的 scheme 一致） */
export const EGERN_INSTALL_PREFIX = "egern:///modules/new?url="

/** Loon 安装远程插件 */
export const LOON_INSTALL_PREFIX = "loon://import?plugin="

/** Stash 安装远程覆写 */
export const STASH_INSTALL_PREFIX = "stash://install-override?url="

/** Shadowrocket 安装远程模块 */
export const SHADOWROCKET_INSTALL_PREFIX = "shadowrocket://install?module="
