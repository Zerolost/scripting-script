import { Script } from 'scripting'
import { getActionRepositories, getActionRepositoryNotice } from './ActionRepositories'
import type { Repo, Workflow } from './AppModel'

type TestRepo = Repo & { updated_at?: string; pushed_at?: string }

function assert(value: boolean, message: string): void {
  if (!value) throw new Error(message)
}

function repositories(count: number): TestRepo[] {
  return Array.from({ length: count }, (_value: unknown, index: number): TestRepo => ({
    id: index + 1,
    name: `repo-${index + 1}`,
    full_name: `owner/repo-${index + 1}`,
    owner: { login: 'owner' },
    private: false,
    default_branch: 'main',
    updated_at: 'v1',
    pushed_at: 'p1'
  }))
}

class MockAPI {
  repos: TestRepo[] = repositories(12)
  repoCalls: number = 0
  workflowCalls: number = 0
  active: number = 0
  peak: number = 0
  failures: Map<string, string> = new Map()
  gate: Promise<void> | undefined
  delay: (() => Promise<void>) | undefined

  async getRepos(): Promise<Repo[]> {
    this.repoCalls += 1
    return this.repos.map((repo: TestRepo): TestRepo => ({ ...repo }))
  }

  async getWorkflows(_owner: string, name: string, force: boolean = false): Promise<Workflow[]> {
    assert(force, '实际重查必须绕过底层工作流缓存')
    this.workflowCalls += 1
    this.active += 1
    this.peak = Math.max(this.peak, this.active)
    try {
      await this.gate
      if (this.delay) await this.delay()
      const failure: string | undefined = this.failures.get(name)
      if (failure) throw new Error(failure)
      const id: number = Number(name.slice(5))
      return id % 2 === 0 ? [] : [{ id, name, path: '.github/workflows/check.yml', state: 'active', created_at: 'v1', updated_at: 'v1' }]
    } finally {
      this.active -= 1
    }
  }
}

async function measureWaves(baseline: boolean): Promise<number> {
  const api: MockAPI = new MockAPI()
  const waiting: (() => void)[] = []
  api.delay = (): Promise<void> => new Promise<void>((resolve: () => void): void => { waiting.push(resolve) })
  let done: boolean = false
  let waves: number = 0
  let cursor: number = 0
  const worker = async (): Promise<void> => {
    while (cursor < api.repos.length) {
      const repo: TestRepo = api.repos[cursor++]
      await api.getWorkflows(repo.owner.login, repo.name, true)
    }
  }
  const pending: Promise<unknown> = baseline
    ? Promise.all(Array.from({ length: 4 }, (): Promise<void> => worker()))
    : getActionRepositories(api)
  const completion: Promise<void> = pending.then((): void => { done = true })
  for (let tick: number = 0; tick < 100 && !done; tick += 1) {
    for (let turn: number = 0; turn < 20; turn += 1) await Promise.resolve()
    if (waiting.length > 0) {
      waves += 1
      const batch: (() => void)[] = waiting.splice(0)
      batch.forEach((release: () => void): void => release())
    }
  }
  assert(done, '模拟调度必须结束')
  await completion
  assert(api.workflowCalls === 12 && api.peak === (baseline ? 4 : 6), '延迟模拟请求数和峰值')
  return waves
}

async function check(): Promise<void> {
  const baselineWaves: number = await measureWaves(true)
  const optimizedWaves: number = await measureWaves(false)
  assert(baselineWaves === 3 && optimizedWaves === 2, '12仓库并发4需3波，并发6需2波')
  console.log('模拟相同延迟，12请求: 4并发=3波；实际服务6并发=2波；峰值=6')
  const api: MockAPI = new MockAPI()
  let result: Repo[] = await getActionRepositories(api)
  assert(api.workflowCalls === 12 && api.peak === 6, '首次12次工作流请求，最大并发6')
  assert(result.map((repo: Repo): number => repo.id).join(',') === '1,3,5,7,9,11', '仅有工作流，保留顺序')
  console.log('首次: repos=1 workflows=12 peak=6')
  api.repos.reverse()
  result = await getActionRepositories(api)
  assert(api.workflowCalls === 12 && api.repoCalls === 2, '重复仅重读仓库列表')
  assert(result[0].id === 11, '复用仍按最新列表排序')
  console.log('重复: repos=1 workflows=0，排序随最新列表')
  api.repos[0].updated_at = 'v2'
  await getActionRepositories(api)
  assert(api.workflowCalls === 13, '单仓版本变化只查一次')
  console.log('单仓变更: repos=1 workflows=1')
  await getActionRepositories(api, true)
  assert(api.workflowCalls === 25, 'force全部真实重查')
  console.log('force: repos=1 workflows=12')

  const isolated: MockAPI = new MockAPI()
  await getActionRepositories(isolated)
  assert(isolated.workflowCalls === 12, 'API实例缓存隔离')
  console.log('另一API实例: repos=1 workflows=12')

  const failed: MockAPI = new MockAPI()
  failed.failures.set('repo-1', 'timeout')
  failed.failures.set('repo-2', 'GitHub API error (403)')
  await getActionRepositories(failed)
  assert(getActionRepositoryNotice(failed) === '已跳过：无权 1 个，检查失败 1 个', '保留分类错误提示')
  await getActionRepositories(failed)
  assert(failed.workflowCalls === 14, '两种失败均须重试')
  failed.failures.clear()
  result = await getActionRepositories(failed)
  assert(failed.workflowCalls === 16 && result.some((repo: Repo): boolean => repo.id === 1), '失败恢复不能缓存为空')
  assert(getActionRepositoryNotice(failed) === '', '恢复清空提示')
  console.log('失败/重试/恢复: workflows=12/2/2，权限与网络失败均不缓存')

  failed.failures.set('repo-1', 'timeout')
  await getActionRepositories(failed, true)
  failed.failures.clear()
  await getActionRepositories(failed)
  assert(failed.workflowCalls === 29, 'force失败须失效之前成功确认')

  const concurrent: MockAPI = new MockAPI()
  let release: () => void = (): void => {}
  concurrent.gate = new Promise<void>((resolve: () => void): void => { release = resolve })
  const first: Promise<Repo[]> = getActionRepositories(concurrent)
  const same: Promise<Repo[]> = getActionRepositories(concurrent)
  assert(first === same, '普通并发合并同一Promise')
  const forced: Promise<Repo[]> = getActionRepositories(concurrent, true)
  assert(forced !== first && forced === getActionRepositories(concurrent, true), '加载中的force排队且合并')
  assert(forced === getActionRepositories(concurrent), '后续普通加载合并到排队force')
  release()
  await Promise.all([first, same, forced])
  assert(concurrent.repoCalls === 2 && concurrent.workflowCalls === 24 && concurrent.peak === 6, '普通加force两轮，不叠加并发')
  const forceFirst: Promise<Repo[]> = getActionRepositories(concurrent, true)
  assert(forceFirst === getActionRepositories(concurrent, true), '进行中force合并')
  await forceFirst
  assert(concurrent.workflowCalls === 36, '并发force只一轮')
  console.log('普通并发+中途force: repos=2 workflows=24 peak=6；并发force: workflows=12')

  const missing: MockAPI = new MockAPI()
  missing.repos = repositories(1)
  delete missing.repos[0].updated_at
  await getActionRepositories(missing)
  await getActionRepositories(missing)
  assert(missing.workflowCalls === 2, '缺失版本不得长期复用')

  const originalNow: () => number = Date.now
  let now: number = originalNow()
  try {
    Date.now = (): number => now
    const expiring: MockAPI = new MockAPI()
    await getActionRepositories(expiring)
    now += 5 * 60 * 1000 - 1
    await getActionRepositories(expiring)
    assert(expiring.workflowCalls === 12, 'TTL到期前复用')
    now += 1
    await getActionRepositories(expiring)
    assert(expiring.workflowCalls === 24, 'TTL边界全部重查')
    console.log('TTL: 首次/到期前/到期边界 workflows=12/0/12；时钟已恢复')
  } finally {
    Date.now = originalNow
  }

  const unavailable: MockAPI = new MockAPI()
  unavailable.repos = repositories(1)
  unavailable.failures.set('repo-1', 'GitHub API error (500)')
  let message: string = ''
  try { await getActionRepositories(unavailable) } catch (error: unknown) { message = error instanceof Error ? error.message : String(error) }
  assert(message === '仓库检查失败，请稍后重试', '全部网络失败保留错误')
  unavailable.failures.clear()
  await getActionRepositories(unavailable)
  assert(unavailable.workflowCalls === 2, '失败后解除inflight并重试')
  console.log('PASS: 实际getActionRepositories路径；无凭据、无网络、无UI')
}

void check().then((): void => {
  Script.exit({ passed: true })
}, (error: unknown): void => {
  const message: string = error instanceof Error ? error.message : String(error)
  console.error(`FAIL: ${message}`)
  Script.exit({ passed: false, error: message })
})
