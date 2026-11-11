// 数据类型定义：模块条目、设置项与更新结果

/** 模块文件解析出的头部信息 */
export type ModuleHeader = {
  /** #!name 的值 */
  name: string
  /** #!desc 的值（已去掉时间戳前缀） */
  desc: string
  /** #!desc 原始值，含 🔗 时间戳 */
  rawDesc: string
  /** #SUBSCRIBED 后面的订阅链接 */
  subscribedUrl: string | null
}

/** 单个模块在界面上的状态 */
export type ModuleStatus = "idle" | "updating" | "success" | "failed" | "no-url"

/** 列表中的模块条目 */
export type ModuleEntry = {
  /** 绝对路径，作为唯一标识 */
  path: string
  /** 文件名 */
  fileName: string
  /** 模块名称 */
  name: string
  /** 模块描述 */
  desc: string
  /** 订阅链接 */
  subscribedUrl: string | null
  /** 文件大小（字节） */
  size: number
  /** 文件修改时间（毫秒） */
  modifiedAt: number
  /** 是否包含可更新的订阅链接 */
  hasSubscription: boolean
  /** 最近一次操作状态 */
  status: ModuleStatus
  /** 失败原因 */
  error?: string
}

/** 持久化设置 */
export type Settings = {
  /** 模块文件夹书签名称，用于跨启动访问 */
  folderBookmark: string | null
  /** 上次解析出的文件夹路径，仅作展示 */
  folderPath: string | null
  /** 下载模块时使用的 User-Agent */
  userAgent: string
  /** 更新完成后是否尝试重载 Surge */
  reloadAfterUpdate: boolean
  /** 是否显示无订阅链接的模块 */
  showModulesWithoutUrl: boolean
}

/** 更新单个模块的结果 */
export type UpdateResult =
  | { ok: true; entry: ModuleEntry; changedName: boolean; changedDesc: boolean }
  | { ok: false; reason: "no-url" | "network" | "invalid" | "write"; message: string; entry: ModuleEntry }

/** 批量更新的统计 */
export type UpdateSummary = {
  total: number
  success: number
  noUrl: number
  failed: string[]
}

/** 生成的反劫持资源 */
export type SchemeArtifacts = {
  modulePath: string
  moduleContent: string
}

/** 新建 / 更新模块时可选的落盘目录 */
export type FolderState = {
  path: string | null
  source: "bookmark" | "default"
}

/** 应用内路由（单栈切换，避免模态页面丢失 Context） */
export type Route =
  | { name: "home" }
  | { name: "add"; url?: string; moduleName?: string }
  | { name: "detail"; path: string }
  | { name: "settings" }
  | { name: "tools" }

export type Navigate = (route: Route) => void
