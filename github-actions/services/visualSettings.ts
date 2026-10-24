type Scalar = string | number | boolean
type Entry = { path: string; value: Scalar }
type Listener = () => void
type Tree = { [key: string]: unknown }

const storageKey: string = 'github_actions_visual_overrides_v1'
const listeners: Set<Listener> = new Set<Listener>()
let target: Tree = {}
let defaults: Entry[] = []
let revision: number = 0
let pendingPublish: number | undefined
const entryIndex: Map<string, Entry> = new Map<string, Entry>()
const groupIndex: Map<string, Entry[]> = new Map<string, Entry[]>()

export const visualGroups: Record<string, string> = {
  colors: '颜色与强调色', background: '浅深色背景', glass: '官方玻璃', animation: '动画',
  fontSizes: '字号', spacing: '间距', sizes: '图标与容器尺寸', radii: '圆角',
  typography: '字重', lineLimits: '文字行数', shadow: '阴影', icons: 'SF Symbols',
  text: '界面文案', brand: '品牌图标', login: '登录页', widget: '桌面小组件', account: '登录账户资料', settings: 'Actions 关注策略',
  detail: '运行详情内容', flow: 'Actions 动态流程图', navigationTitleMode: '导航标题', textTransition: '文字过渡',
}

function flatten(value: unknown, path: string = ''): Entry[] {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return [{ path, value }]
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, child]: [string, unknown]) => flatten(child, path ? `${path}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}` : key.replace(/~/g, '~0').replace(/\//g, '~1')))
}

export function visualValue(path: string): Scalar {
  let value: unknown = target
  for (const key of path.split('/')) value = (value as Tree)[key.replace(/~1/g, '/').replace(/~0/g, '~')]
  return value as Scalar
}

export function visualChoices(path: string): string[] | undefined {
  if (path === 'navigationTitleMode') return ['inline', 'large', 'automatic']
  if (path === 'textTransition') return ['opacity']
  if (path === 'glass/transition') return ['identity', 'materialize', 'matchedGeometry']
  if (/^glass\/(row|card|input|brand|widget)$/.test(path)) return ['clear', 'regular']
  if (path.startsWith('typography/')) return ['ultraLight', 'thin', 'light', 'regular', 'medium', 'semibold', 'bold', 'heavy', 'black']
  if (/background\/(startPoint|endPoint)/.test(path)) return ['topLeading', 'top', 'topTrailing', 'leading', 'center', 'trailing', 'bottomLeading', 'bottom', 'bottomTrailing']
  if (/widget\/(small|medium|large|extraLarge|extraLargePortrait)\/.*Font$/.test(path)) return ['largeTitle', 'title', 'title2', 'title3', 'headline', 'subheadline', 'body', 'callout', 'footnote', 'caption', 'caption2']
  return undefined
}

export function visualRange(path: string): { min: number; max: number; step: number } {
  if (path === 'flow/cycleDuration') return { min: 0.4, max: 5, step: 0.1 }
  if (path === 'flow/lineWidth') return { min: 1, max: 6, step: 0.5 }
  if (path === 'flow/nodeSpacing') return { min: 2, max: 24, step: 1 }
  if (path === 'flow/arrivalStart') return { min: 0.45, max: 0.8, step: 0.01 }
  if (path === 'flow/energyStrength') return { min: 0, max: 1, step: 0.05 }
  if (path === 'flow/glowStrength') return { min: 0, max: 1, step: 0.05 }
  if (path === 'flow/trailLength') return { min: 2, max: 10, step: 1 }
  if (path.startsWith('flow/')) return { min: 8, max: 32, step: 1 }
  if (path === 'animation/duration') return { min: 0, max: 2, step: 0.01 }
  if (path.startsWith('animation/')) return { min: 0, max: 1, step: 0.01 }
  if (path === 'detail/titleLines' || path === 'detail/commitLines') return { min: 1, max: 8, step: 1 }
  if (path.startsWith('lineLimits/')) return { min: 1, max: 10, step: 1 }
  if (path === 'shadow/y') return { min: -30, max: 30, step: 1 }
  if (path.startsWith('fontSizes/')) return { min: 8, max: 60, step: 1 }
  if (path.startsWith('sizes/')) return { min: 1, max: 160, step: 1 }
  if (path === 'account/avatarSize') return { min: 24, max: 100, step: 1 }
  if (path === 'account/nameFont' || path === 'account/detailFont') return { min: 8, max: 36, step: 1 }
  if (path.includes('/history/') || path === 'widget/nextVisibleMaxLargeTargets' || path === 'widget/nextVisibleMaxExtraLargeTargets') return { min: 0, max: 8, step: 1 }
  return { min: 0, max: 64, step: 1 }
}

function assign(path: string, value: Scalar): void {
  const keys: string[] = path.split('/').map((key: string) => key.replace(/~1/g, '/').replace(/~0/g, '~'))
  let node: Tree = target
  for (const key of keys.slice(0, -1)) node = node[key] as Tree
  node[keys[keys.length - 1]] = value
}

function valid(entry: Entry, value: unknown): value is Scalar {
  if (typeof value !== typeof entry.value) return false
  if (typeof value === 'number') {
    const range: { min: number; max: number } = visualRange(entry.path)
    // 允许配置文件已有的超范围值；界面编辑仍限制在可用区间内。
    return Number.isFinite(value) && (value === entry.value || (value >= range.min && value <= range.max))
  }
  const choices: string[] | undefined = visualChoices(entry.path)
  return !choices || choices.includes(value as string)
}

export function hydrateVisual(config: object): void {
  target = config as Tree
  defaults = flatten(config)
  entryIndex.clear()
  groupIndex.clear()
  for (const entry of defaults) {
    entryIndex.set(entry.path, entry)
    const group: string = entry.path.split('/')[0]
    const items: Entry[] = groupIndex.get(group) ?? []
    items.push(entry)
    groupIndex.set(group, items)
  }
  try {
    const saved: Record<string, unknown> | null = Storage.get<Record<string, unknown>>(storageKey)
    if (saved && typeof saved === 'object') {
      for (const entry of defaults) if (Object.prototype.hasOwnProperty.call(saved, entry.path) && valid(entry, saved[entry.path])) assign(entry.path, saved[entry.path] as Scalar)
    }
  } catch (_) { console.warn('外观配置读取失败，使用文件中的默认值') }
}

export function subscribeVisual(listener: Listener): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function visualRevision(): number { return revision }

function publish(): void {
  revision += 1
  for (const listener of listeners) listener()
}

// 连续拖动合并到下一帧附近；值立即写入，保存始终读取最新值。
function schedulePublish(): void {
  if (pendingPublish !== undefined) return
  pendingPublish = setTimeout(() => {
    pendingPublish = undefined
    publish()
  }, 16)
}

export function flushVisual(): void {
  if (pendingPublish === undefined) return
  clearTimeout(pendingPublish)
  pendingPublish = undefined
  publish()
}

export function updateVisual(path: string, value: Scalar): void {
  const entry: Entry | undefined = entryIndex.get(path)
  if (!entry || !valid(entry, value) || Object.is(visualValue(path), value)) return
  assign(path, value)
  // 两个历史强调色键统一，避免同一页面出现不同的操作色。
  if (path === 'colors/#0a84ff' || path === 'colors/#0A84FF') {
    assign('colors/#0a84ff', value)
    assign('colors/#0A84FF', value)
  }
  schedulePublish()
}

export function visualEntries(group: string): Entry[] {
  return (groupIndex.get(group) ?? []).map((entry: Entry) => ({ path: entry.path, value: visualValue(entry.path) }))
}

export function saveVisual(): boolean {
  flushVisual()
  const overrides: Record<string, Scalar> = {}
  for (const entry of defaults) {
    const value: Scalar = visualValue(entry.path)
    if (value !== entry.value) overrides[entry.path] = value
  }
  try { return Storage.set(storageKey, overrides) } catch (_) { return false }
}

export function resetVisual(): boolean {
  try { Storage.remove(storageKey) } catch (_) { return false }
  if (pendingPublish !== undefined) clearTimeout(pendingPublish)
  pendingPublish = undefined
  for (const entry of defaults) assign(entry.path, entry.value)
  publish()
  return true
}
