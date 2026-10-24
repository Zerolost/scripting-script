export interface WidgetTargetStorage {
  get(key: string): unknown
  set(key: string, value: unknown): boolean
}

export interface WidgetTargetStore {
  getWidgetTargets(): string[]
  setWidgetTargets(targets: readonly string[]): void
}

const listKey: string = 'widget_repos'
const legacyKey: string = 'widget_repo'

function normalizeTarget(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const target: string = value.trim()
  const parts: string[] = target.split('/')
  if (parts.length !== 2 && parts.length !== 3) return null
  if (!parts.slice(0, 2).every((part: string): boolean => /^[A-Za-z0-9_.-]+$/.test(part) && part !== '.' && part !== '..')) return null
  if (parts.length === 3 && (!parts[2].trim() || parts[2] !== parts[2].trim() || /[\u0000-\u001f\u007f]/.test(parts[2]))) return null
  return target
}

function cleanTargets(values: readonly unknown[], strict: boolean): string[] {
  const targets: string[] = []
  values.forEach((value: unknown): void => {
    const target: string | null = normalizeTarget(value)
    if (!target) {
      if (strict) throw new Error('小组件目标格式无效，请检查仓库与工作流设置')
      return
    }
    if (!targets.includes(target)) targets.push(target)
  })
  if (values.length > 0 && targets.length === 0) throw new Error('已存小组件目标均无效，已停止覆盖，请检查原有设置')
  return targets
}

function decodeList(raw: unknown): string[] {
  let values: unknown = raw
  if (typeof raw === 'string') {
    try {
      values = JSON.parse(raw) as unknown
    } catch (_) {
      throw new Error('小组件设置无法解析，已停止覆盖，请检查原有设置')
    }
  }
  if (!Array.isArray(values)) throw new Error('小组件设置格式错误，已停止覆盖，请检查原有设置')
  return cleanTargets(values, false)
}

export function createWidgetTargetStore(storage: WidgetTargetStorage): WidgetTargetStore {
  const read = (key: string): unknown => {
    try {
      return storage.get(key)
    } catch (_) {
      throw new Error('读取小组件设置失败，已停止操作，请稍后重试')
    }
  }
  const decode = (raw: unknown): string[] => {
    if (raw !== null && raw !== undefined) return decodeList(raw)
    const legacy: unknown = read(legacyKey)
    if (legacy === null || legacy === undefined) return []
    return cleanTargets([legacy], true)
  }
  return {
    getWidgetTargets(): string[] {
      return decode(read(listKey))
    },
    setWidgetTargets(targets: readonly string[]): void {
      if (!Array.isArray(targets)) throw new Error('小组件目标必须为数组')
      const clean: string[] = cleanTargets(targets, true)
      const oldRaw: unknown = read(listKey)
      const oldTargets: string[] = decode(oldRaw)
      const encoded: string = JSON.stringify(clean)
      const restoreValue: unknown = oldRaw ?? JSON.stringify(oldTargets)
      try {
        if (storage.set(listKey, encoded) !== true) throw new Error('写入未成功')
        if (read(listKey) !== encoded) throw new Error('回读不一致')
      } catch (_) {
        let restored: boolean = false
        try {
          const current: unknown = read(listKey)
          restored = JSON.stringify(current) === JSON.stringify(oldRaw)
        } catch (_) { }
        if (!restored) {
          try {
            restored = storage.set(listKey, restoreValue) === true
            restored = JSON.stringify(read(listKey)) === JSON.stringify(restoreValue) && restored
          } catch (_) {
            restored = false
          }
        }
        throw new Error(restored
          ? '保存小组件设置失败，已保留原有选择，请重试'
          : '保存小组件设置失败，无法确认旧值恢复，请检查存储后重试')
      }
    },
  }
}

const defaultStore: WidgetTargetStore = createWidgetTargetStore({
  get: (key: string): unknown => Storage.get<unknown>(key),
  set: (key: string, value: unknown): boolean => Storage.set(key, value),
})

export const getWidgetTargets: () => string[] = defaultStore.getWidgetTargets
export const setWidgetTargets: (targets: readonly string[]) => void = defaultStore.setWidgetTargets
