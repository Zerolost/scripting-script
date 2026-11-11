import { APP_ICONS } from "./appIcons"
import type { TargetId, TargetInfo } from "../types"

/**
 * 四个目标 App 的元信息。
 * Script-Hub 的 target 取值与文件后缀均来自其页面源码：
 * surge-module(.sgmodule) / loon-plugin(.plugin) /
 * stash-stoverride(.stoverride) / shadowrocket-module(.sgmodule)
 */
export const TARGETS: Record<TargetId, TargetInfo> = {
  surge: {
    id: "surge",
    app: "Surge",
    kind: "模块",
    extension: ".sgmodule",
    scriptHubTarget: "surge-module",
    remoteScheme: "surge:///install-module?url=",
    iconUrl: APP_ICONS.surge,
  },
  loon: {
    id: "loon",
    app: "Loon",
    kind: "插件",
    extension: ".plugin",
    scriptHubTarget: "loon-plugin",
    remoteScheme: "loon://import?plugin=",
    iconUrl: APP_ICONS.loon,
  },
  stash: {
    id: "stash",
    app: "Stash",
    kind: "覆写",
    extension: ".stoverride",
    scriptHubTarget: "stash-stoverride",
    remoteScheme: "stash://install-override?url=",
    iconUrl: APP_ICONS.stash,
  },
  shadowrocket: {
    id: "shadowrocket",
    app: "Shadowrocket",
    kind: "模块",
    extension: ".sgmodule",
    scriptHubTarget: "shadowrocket-module",
    remoteScheme: "shadowrocket://install?module=",
    iconUrl: APP_ICONS.shadowrocket,
  },
}

/** 界面上的固定顺序 */
export const TARGET_ORDER: TargetId[] = ["surge", "loon", "stash", "shadowrocket"]

export const TARGET_LIST: TargetInfo[] = TARGET_ORDER.map(id => TARGETS[id])

/** 目标 App 在界面上的完整叫法，例如 “Loon 插件” */
export function targetTitle(id: TargetId): string {
  const info = TARGETS[id]
  return `${info.app} ${info.kind}`
}
