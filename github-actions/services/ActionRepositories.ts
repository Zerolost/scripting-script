import type { GitHubAPI, Repo, Workflow } from './AppModel'

interface RepositoryFailure {
  repo: Repo
  error: unknown
  permission: boolean
}

const inflight: WeakMap<GitHubAPI, Promise<Repo[]>> = new WeakMap()
const notices: WeakMap<GitHubAPI, string> = new WeakMap()
const completed: WeakMap<GitHubAPI, { repos: Repo[]; notice: string; expiresAt: number }> = new WeakMap()

function isPermissionError(error: unknown): boolean {
  const message: string = error instanceof Error ? error.message : String(error)
  const status: number = Number((error as { status?: number } | null)?.status)
    || Number(message.match(/GitHub API error \((\d{3})\)/i)?.[1])
  if (status === 429 || status >= 500 || /rate[\s_-]*limit|secondary[\s_-]*limit|abuse detection/i.test(message)) return false
  return status === 403 || status === 404
}

async function filterActionRepositories(api: GitHubAPI, force: boolean): Promise<Repo[]> {
  notices.delete(api)
  const repos: Repo[] = await api.getRepos()
  const included: boolean[] = new Array<boolean>(repos.length).fill(false)
  const failures: RepositoryFailure[] = []
  let cursor: number = 0
  let checked: number = 0

  const worker = async (): Promise<void> => {
    while (cursor < repos.length) {
      const index: number = cursor++
      const repo: Repo = repos[index]
      try {
        const workflows: Workflow[] = await api.getWorkflows(repo.owner.login, repo.name, force)
        included[index] = workflows.length > 0
        checked += 1
      } catch (error: unknown) {
        failures.push({ repo, error, permission: isPermissionError(error) })
      }
    }
  }

  const workers: Promise<void>[] = Array.from(
    { length: Math.min(4, repos.length) },
    (): Promise<void> => worker()
  )
  await Promise.all(workers)
  const denied: number = failures.filter((failure: RepositoryFailure): boolean => failure.permission).length
  const failed: number = failures.length - denied
  const parts: string[] = []
  if (denied > 0) parts.push(`无权 ${denied} 个`)
  if (failed > 0) parts.push(`检查失败 ${failed} 个`)
  notices.set(api, parts.length > 0 ? `已跳过：${parts.join('，')}` : '')
  if (checked === 0 && failed > 0) throw new Error('仓库检查失败，请稍后重试')
  const result: Repo[] = repos.filter((_repo: Repo, index: number): boolean => included[index])
  if (failed === 0) completed.set(api, { repos: result, notice: notices.get(api) ?? '', expiresAt: Date.now() + 30000 })
  return result
}

export function getActionRepositoryNotice(api: GitHubAPI): string {
  return notices.get(api) ?? ''
}

export function getActionRepositories(api: GitHubAPI, force: boolean = false): Promise<Repo[]> {
  const existing: Promise<Repo[]> | undefined = inflight.get(api)
  if (existing) return existing

  const cached: { repos: Repo[]; notice: string; expiresAt: number } | undefined = completed.get(api)
  if (!force && cached && cached.expiresAt > Date.now()) {
    notices.set(api, cached.notice)
    return Promise.resolve(cached.repos)
  }
  completed.delete(api)
  const pending: Promise<Repo[]> = filterActionRepositories(api, force).finally((): void => {
    if (inflight.get(api) === pending) inflight.delete(api)
  })
  inflight.set(api, pending)
  return pending
}
