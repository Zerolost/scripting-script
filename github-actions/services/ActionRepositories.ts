import type { GitHubAPI, Repo, Workflow } from './AppModel'

interface RepositoryFailure {
  repo: Repo
  error: unknown
  permission: boolean
}

type RepositoryAPI = Pick<GitHubAPI, 'getRepos' | 'getWorkflows'>
type VersionedRepo = Repo & { updated_at?: string; pushed_at?: string }

interface ConfirmedRepository {
  version: string
  included: boolean
  expiresAt: number
}

interface RepositoryLoad {
  promise: Promise<Repo[]>
  force: boolean
}

const inflight: WeakMap<RepositoryAPI, RepositoryLoad> = new WeakMap()
const forced: WeakMap<RepositoryAPI, Promise<Repo[]>> = new WeakMap()
const notices: WeakMap<RepositoryAPI, string> = new WeakMap()
const confirmed: WeakMap<RepositoryAPI, Map<number, ConfirmedRepository>> = new WeakMap()
const CONFIRMATION_TTL_MS: number = 5 * 60 * 1000

function repositoryVersion(repo: VersionedRepo): string | undefined {
  if (!repo.updated_at) return undefined
  return JSON.stringify([repo.owner.login, repo.name, repo.updated_at, repo.pushed_at, repo.default_branch, repo.private])
}

function isPermissionError(error: unknown): boolean {
  const message: string = error instanceof Error ? error.message : String(error)
  const status: number = Number((error as { status?: number } | null)?.status)
    || Number(message.match(/GitHub API error \((\d{3})\)/i)?.[1])
  if (status === 429 || status >= 500 || /rate[\s_-]*limit|secondary[\s_-]*limit|abuse detection/i.test(message)) return false
  return status === 403 || status === 404
}

async function filterActionRepositories(api: RepositoryAPI, force: boolean): Promise<Repo[]> {
  notices.delete(api)
  const repos: Repo[] = await api.getRepos()
  let cache: Map<number, ConfirmedRepository> | undefined = confirmed.get(api)
  if (!cache) {
    cache = new Map()
    confirmed.set(api, cache)
  }
  const results: Map<number, ConfirmedRepository> = cache
  const currentIds: Set<number> = new Set(repos.map((repo: Repo): number => repo.id))
  for (const id of results.keys()) {
    if (!currentIds.has(id)) results.delete(id)
  }
  const included: boolean[] = new Array<boolean>(repos.length).fill(false)
  const failures: RepositoryFailure[] = []
  let cursor: number = 0
  let checked: number = 0

  const worker = async (): Promise<void> => {
    while (cursor < repos.length) {
      const index: number = cursor++
      const repo: Repo = repos[index]
      const version: string | undefined = repositoryVersion(repo)
      const cached: ConfirmedRepository | undefined = results.get(repo.id)
      if (!force && version && cached?.version === version && cached.expiresAt > Date.now()) {
        included[index] = cached.included
        checked += 1
        continue
      }
      results.delete(repo.id)
      try {
        const workflows: Workflow[] = await api.getWorkflows(repo.owner.login, repo.name, true)
        included[index] = workflows.length > 0
        checked += 1
        if (version) results.set(repo.id, { version, included: included[index], expiresAt: Date.now() + CONFIRMATION_TTL_MS })
      } catch (error: unknown) {
        failures.push({ repo, error, permission: isPermissionError(error) })
      }
    }
  }

  const workers: Promise<void>[] = Array.from(
    { length: Math.min(6, repos.length) },
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
  return result
}

export function getActionRepositoryNotice(api: RepositoryAPI): string {
  return notices.get(api) ?? ''
}

export function getActionRepositories(api: RepositoryAPI, force: boolean = false): Promise<Repo[]> {
  const queued: Promise<Repo[]> | undefined = forced.get(api)
  if (queued) return queued
  const existing: RepositoryLoad | undefined = inflight.get(api)
  if (existing) {
    if (!force || existing.force) return existing.promise
    const pending: Promise<Repo[]> = existing.promise.catch((): void => {}).then((): Promise<Repo[]> => {
      forced.delete(api)
      return getActionRepositories(api, true)
    })
    forced.set(api, pending)
    return pending
  }

  const pending: Promise<Repo[]> = filterActionRepositories(api, force).finally((): void => {
    if (inflight.get(api)?.promise === pending) inflight.delete(api)
  })
  inflight.set(api, { promise: pending, force })
  return pending
}
