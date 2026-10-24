import { Script } from 'scripting'
import { createWidgetTargetStore, type WidgetTargetStorage, type WidgetTargetStore } from './widgetTargetStore'

type WriteMode = 'ok' | 'false' | 'throw' | 'ignore' | 'corrupt' | 'mutateFalse'

class MemoryStorage implements WidgetTargetStorage {
  readonly values: Map<string, unknown> = new Map()
  writes: number = 0
  mode: WriteMode = 'ok'
  failRead: boolean = false
  failVerification: boolean = false

  get(key: string): unknown {
    if (this.failRead || (this.failVerification && this.writes === 1)) throw new Error('模拟读取失败')
    return this.values.get(key) ?? null
  }

  set(key: string, value: unknown): boolean {
    this.writes += 1
    const mode: WriteMode = this.mode
    this.mode = 'ok'
    if (mode === 'throw') throw new Error('模拟写入失败')
    if (mode === 'false') return false
    if (mode === 'ignore') return true
    this.values.set(key, mode === 'corrupt' ? '损坏' : value)
    return mode !== 'mutateFalse'
  }
}

let checks: number = 0
function equal(actual: unknown, expected: unknown): void {
  checks += 1
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`断言失败：第 ${checks} 项`)
}

function rejects(action: () => void): void {
  checks += 1
  try {
    action()
  } catch (error: unknown) {
    if (error instanceof Error && /[\u4e00-\u9fff]/.test(error.message)) return
    throw new Error(`异常未提供中文提示：第 ${checks} 项`)
  }
  throw new Error(`预期抛错：第 ${checks} 项`)
}

function runTests(): void {
  const first: string = 'sample-owner/project-one/12'
  const second: string = 'other-owner/project-two/build.yml'
  const memory: MemoryStorage = new MemoryStorage()
  const store: WidgetTargetStore = createWidgetTargetStore(memory)
  equal(store.getWidgetTargets(), [])
  memory.values.set('widget_repo', 'sample-owner/legacy')
  equal(store.getWidgetTargets(), ['sample-owner/legacy'])
  store.setWidgetTargets([first, second, first])
  equal(memory.values.get('widget_repos'), JSON.stringify([first, second]))
  equal(createWidgetTargetStore(memory).getWidgetTargets(), [first, second])
  equal(memory.values.get('widget_repo'), 'sample-owner/legacy')
  store.setWidgetTargets([second])
  equal(createWidgetTargetStore(memory).getWidgetTargets(), [second])
  store.setWidgetTargets([])
  equal(memory.values.get('widget_repos'), '[]')
  equal(createWidgetTargetStore(memory).getWidgetTargets(), [])
  const oldFormats: unknown[] = [[first, first, second, null, 'bad'], JSON.stringify([first, first, second, false, '/bad/'])]
  oldFormats.forEach((raw: unknown): void => {
    memory.values.set('widget_repos', raw)
    equal(store.getWidgetTargets(), [first, second])
    store.setWidgetTargets([second])
    equal(memory.values.get('widget_repos'), JSON.stringify([second]))
  })
  const brokenFormats: unknown[] = ['broken JSON', '{}', '', 3, ['bad']]
  brokenFormats.forEach((raw: unknown): void => {
    memory.values.set('widget_repos', raw)
    const before: number = memory.writes
    rejects((): void => { store.getWidgetTargets() })
    rejects((): void => store.setWidgetTargets([]))
    equal(memory.writes, before)
    equal(memory.values.get('widget_repos'), raw)
  })
  const modes: WriteMode[] = ['false', 'throw', 'ignore', 'corrupt', 'mutateFalse']
  modes.forEach((mode: WriteMode): void => {
    const oldValues: unknown[] = [JSON.stringify([first]), [first]]
    oldValues.forEach((old: unknown): void => {
      memory.values.set('widget_repos', old)
      memory.mode = mode
      rejects((): void => store.setWidgetTargets([second]))
      equal(memory.values.get('widget_repos'), old)
      equal(createWidgetTargetStore(memory).getWidgetTargets(), [first])
    })
  })
  memory.values.set('widget_repos', JSON.stringify([first]))
  const invalidTargets: string[] = ['bad', 'a//b', '/a/b', 'a/b/', 'a/b/c/d', 'a b/repo', 'a/b/\n']
  invalidTargets.forEach((bad: string): void => {
    rejects((): void => store.setWidgetTargets([bad]))
    equal(store.getWidgetTargets(), [first])
  })
  memory.failRead = true
  const before: number = memory.writes
  rejects((): void => store.setWidgetTargets([second]))
  rejects((): void => { store.getWidgetTargets() })
  equal(memory.writes, before)
  memory.failRead = false
  equal(store.getWidgetTargets(), [first])
  const verifyMemory: MemoryStorage = new MemoryStorage()
  verifyMemory.values.set('widget_repos', [first])
  verifyMemory.failVerification = true
  rejects((): void => createWidgetTargetStore(verifyMemory).setWidgetTargets([second]))
  equal(createWidgetTargetStore(verifyMemory).getWidgetTargets(), [first])
  const legacyMemory: MemoryStorage = new MemoryStorage()
  legacyMemory.values.set('widget_repo', first)
  legacyMemory.mode = 'corrupt'
  rejects((): void => createWidgetTargetStore(legacyMemory).setWidgetTargets([second]))
  equal(createWidgetTargetStore(legacyMemory).getWidgetTargets(), [first])
  equal(legacyMemory.values.get('widget_repo'), first)
  const invalidLegacy: MemoryStorage = new MemoryStorage()
  invalidLegacy.values.set('widget_repo', 'bad')
  rejects((): void => createWidgetTargetStore(invalidLegacy).setWidgetTargets([]))
  equal(invalidLegacy.writes, 0)
}

try {
  runTests()
  console.log(`小组件目标存储测试通过：${checks} 项断言，仅使用模拟数据`)
  Script.exit({ ok: true, checks })
} catch (error: unknown) {
  console.log(error instanceof Error ? error.message : '测试失败')
  Script.exit({ ok: false, checks })
}
