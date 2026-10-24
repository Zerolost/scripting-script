import { Script } from 'scripting'
import { collectGitHubPages, type GitHubPage } from './githubPagination'
import { runDetailSettled } from './runDetailPolling'
import type { Run, Job } from './AppModel'

type Item = { id: number }
let checks: number = 0
function assert(value: boolean, message: string): void {
  checks += 1
  if (!value) throw new Error(message)
}
function items(start: number, count: number): Item[] {
  return Array.from({ length: count }, (_: unknown, index: number): Item => ({ id: start + index }))
}
async function run(): Promise<void> {
  let calls: number = 0
  const full: Item[] = await collectGitHubPages<Item>(async (page: number): Promise<GitHubPage<Item>> => {
    calls += 1
    return { items: items((page - 1) * 100, page === 3 ? 5 : 100) }
  })
  assert(full.length === 205 && calls === 3 && full[204].id === 204, '完整顺序分页')
  calls = 0
  const counted: Item[] = await collectGitHubPages<Item>(async (page: number): Promise<GitHubPage<Item>> => { calls += 1; return { items: items((page - 1) * 100, 100), total: 200 } })
  assert(counted.length === 200 && calls === 2, '已知总数避免空页请求')
  const overlap: Item[] = await collectGitHubPages<Item>(async (page: number): Promise<GitHubPage<Item>> => ({ items: page === 1 ? items(0, 100) : items(99, 2) }))
  assert(overlap.length === 101 && overlap[100].id === 100, '跨页重复ID去重')
  assert((await collectGitHubPages<Item>(async (): Promise<GitHubPage<Item>> => ({ items: [] }))).length === 0, '空结果立即结束')
  let repeated: boolean = false
  try { await collectGitHubPages<Item>(async (): Promise<GitHubPage<Item>> => ({ items: items(0, 100) })) } catch { repeated = true }
  assert(repeated, '重复整页明确报错')
  let rejected: boolean = false
  try { await collectGitHubPages<Item>(async (page: number): Promise<GitHubPage<Item>> => { if (page > 1) throw new Error('network'); return { items: items(0, 100) } }) } catch { rejected = true }
  assert(rejected, '后续页失败不能返回残缺成功结果')
  const done: Run = { status: 'completed' } as Run
  const job: Job = { status: 'completed' } as Job
  assert(runDetailSettled(done, [job]), '运行任务均结束才停止')
  assert(!runDetailSettled(done, []), '空任务继续确认最终状态')
  assert(!runDetailSettled(done, [{ ...job, status: 'in_progress' }]), '任务尚未同步继续轮询')
  assert(!runDetailSettled({ ...done, status: 'in_progress' }, [job]), '运行未结束继续轮询')
  console.log(JSON.stringify({ checks, passed: true }))
  Script.exit()
}
void run().catch((error: unknown): void => { console.log(JSON.stringify({ checks, passed: false, error: String(error) })); Script.exit() })
