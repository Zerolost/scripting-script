import { surface } from '../design/AllPatternDesign'
import { visual } from '../visual.config'
import { HStack, VStack, useState, useEffect, useCallback, useRef, type Color } from "scripting"
import { MotionText as Text, animateChange } from "../components/Motion"
import { glassTokens } from "../design/glassTokens"

export function storageGet(key: string): string | null {
  return Storage.get<string>(key) ?? null
}
export function storageSet(key: string, value: string): void {
  Storage.set(key, value)
}
export function storageRemove(key: string): void {
  Storage.remove(key)
}

export function getWidgetTargets(): string[] {
  const list = Storage.get<string>('widget_repos')
  if (list) {
    try {
      const arr = JSON.parse(list)
      if (Array.isArray(arr)) {
        return arr.filter((x): x is string => typeof x === 'string' && x.split('/').filter(Boolean).length >= 2)
      }
    } catch (_) { }
  }
  const legacy = Storage.get<string>('widget_repo')
  if (legacy) return [legacy]
  return []
}

export function setWidgetTargets(targets: string[]) {
  const clean = targets.filter((t) => t.split('/').filter(Boolean).length >= 2)
  if (clean.length === 0) {
    Storage.remove('widget_repos')
    Storage.remove('widget_repo')
    return
  }
  Storage.set('widget_repos', JSON.stringify(clean))
  Storage.remove('widget_repo')
}

export function recordWidgetTrigger(owner: string, repo: string, workflowId: number) {
  Storage.set('widget_last_target', `${owner}/${repo}/${workflowId}`)
}

export function errorMessage(e: any, fallback: string): string {
  return e?.message || fallback
}

export function isRunActive(run: Pick<Run, 'status'>): boolean {
  return run.status === 'in_progress' || run.status === 'queued'
}

export function runStatusColor(conclusion: Run['conclusion']): string {
  switch (conclusion) {
    case 'success': return visual.colors['#34c759']
    case 'failure': return visual.colors['#ff3b30']
    case 'cancelled': return visual.colors['#ff9500']
    default: return visual.colors['#8e8e93']
  }
}

export function runStatusInfo(run: Run): { text: string; color: Color; backgroundColor: string } {
  if (run.status === 'completed') {
    switch (run.conclusion) {
      case 'success': return { text: '成功', color: visual.colors['#1a7f37'], backgroundColor: visual.colors['#d9f2e0'] }
      case 'failure': return { text: '失败', color: visual.colors['#b42318'], backgroundColor: visual.colors['#fde3e1'] }
      case 'cancelled': return { text: '已取消', color: visual.colors['#b54708'], backgroundColor: visual.colors['#fde9d2'] }
      case 'timed_out': return { text: '超时', color: visual.colors['#b54708'], backgroundColor: visual.colors['#fde9d2'] }
      default: return { text: run.conclusion || '完成', color: visual.colors['#6b7280'], backgroundColor: visual.colors['#eef0f3'] }
    }
  }
  if (run.status === 'in_progress') return { text: '进行中', color: visual.colors['#175cd3'], backgroundColor: visual.colors['#d7e8fd'] }
  if (run.status === 'queued') return { text: '排队中', color: visual.colors['#6b7280'], backgroundColor: visual.colors['#eef0f3'] }
  return { text: run.status, color: visual.colors['#6b7280'], backgroundColor: visual.colors['#eef0f3'] }
}

export function runStatusIcon(run: Run): { systemName: string; color: Color } {
  if (run.status === 'completed') {
    switch (run.conclusion) {
      case 'success': return { systemName: visual.icons['checkmark.circle.fill'], color: visual.colors['#34c759'] }
      case 'failure': return { systemName: visual.icons['xmark.circle.fill'], color: visual.colors['#ff3b30'] }
      case 'cancelled': return { systemName: visual.icons['xmark.circle.fill'], color: visual.colors['#ff9500'] }
      case 'timed_out': return { systemName: visual.icons['clock.fill'], color: visual.colors['#ff9500'] }
      default: return { systemName: visual.icons['questionmark.circle'], color: visual.colors['secondaryLabel'] }
    }
  }
  if (run.status === 'in_progress') return { systemName: visual.icons['arrow.triangle.2.circlepath'], color: visual.colors['#0a84ff'] }
  if (run.status === 'queued') return { systemName: visual.icons['clock.fill'], color: visual.colors['secondaryLabel'] }
  return { systemName: visual.icons['questionmark.circle'], color: visual.colors['secondaryLabel'] }
}

export function StatusBadge({ text }: { text: string }) {
  return <Text font={visual.fontSizes[11]} fontWeight={visual.typography.semibold} foregroundStyle={visual.colors['label']} padding={{ horizontal: visual.spacing[10], vertical: visual.spacing[5] }} {...surface('regular', glassTokens.pillShape)}>{text}</Text>
}

export function jobStatusInfo(job: { status: string; conclusion: string | null }): { text: string; color: Color; backgroundColor: string } {
  if (job.status === 'completed') {
    switch (job.conclusion) {
      case 'success': return { text: '成功', color: visual.colors['#1a7f37'], backgroundColor: visual.colors['#d9f2e0'] }
      case 'failure': return { text: '失败', color: visual.colors['#b42318'], backgroundColor: visual.colors['#fde3e1'] }
      case 'cancelled': return { text: '已取消', color: visual.colors['#b54708'], backgroundColor: visual.colors['#fde9d2'] }
      case 'timed_out': return { text: '超时', color: visual.colors['#b54708'], backgroundColor: visual.colors['#fde9d2'] }
      case 'skipped': return { text: '跳过', color: visual.colors['#6b7280'], backgroundColor: visual.colors['#eef0f3'] }
      default: return { text: job.conclusion || '完成', color: visual.colors['#6b7280'], backgroundColor: visual.colors['#eef0f3'] }
    }
  }
  if (job.status === 'in_progress') return { text: '进行中', color: visual.colors['#175cd3'], backgroundColor: visual.colors['#d7e8fd'] }
  if (job.status === 'queued' || job.status === 'waiting') return { text: '排队中', color: visual.colors['#6b7280'], backgroundColor: visual.colors['#eef0f3'] }
  return { text: job.status, color: visual.colors['#6b7280'], backgroundColor: visual.colors['#eef0f3'] }
}

export function jobStatusIcon(job: { status: string; conclusion: string | null }): { systemName: string; color: Color } {
  if (job.status === 'completed') {
    switch (job.conclusion) {
      case 'success': return { systemName: visual.icons['checkmark.circle.fill'], color: visual.colors['#34c759'] }
      case 'failure': return { systemName: visual.icons['xmark.circle.fill'], color: visual.colors['#ff3b30'] }
      case 'cancelled': return { systemName: visual.icons['xmark.circle.fill'], color: visual.colors['#ff9500'] }
      case 'timed_out': return { systemName: visual.icons['clock.fill'], color: visual.colors['#ff9500'] }
      case 'skipped': return { systemName: visual.icons['circle.dashed'], color: visual.colors['secondaryLabel'] }
      default: return { systemName: visual.icons['questionmark.circle'], color: visual.colors['secondaryLabel'] }
    }
  }
  if (job.status === 'in_progress') return { systemName: visual.icons['arrow.triangle.2.circlepath'], color: visual.colors['#0a84ff'] }
  if (job.status === 'queued' || job.status === 'waiting') return { systemName: visual.icons['clock.fill'], color: visual.colors['secondaryLabel'] }
  return { systemName: visual.icons['questionmark.circle'], color: visual.colors['secondaryLabel'] }
}

export function formatTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatShortTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const hhmm = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  if (day === startOfDay) return `今天 ${hhmm}`
  if (day === startOfDay - 86400000) return `昨天 ${hhmm}`
  return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${hhmm}`
}

export function timeAgoText(iso?: string): string | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (isNaN(t)) return null
  const diff = Date.now() - t
  if (diff < 0) return null
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} 天前`
  return formatShortTime(iso)
}

export function durationText(start?: string, end?: string): string | null {
  if (!start || !end) return null
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (isNaN(ms) || ms < 0) return null
  const totalSec = Math.floor(ms / 1000)
  if (totalSec < 60) return `${totalSec} 秒`
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m < 60) return `${m} 分 ${s} 秒`
  const h = Math.floor(m / 60)
  return `${h} 小时 ${m % 60} 分`
}

export function InfoRow({ label, value, subtitle }: { label: string; value: string; subtitle?: string | null }) {
  return (
    <HStack spacing={visual.spacing[6]} alignment="top">
      <Text style={{ color: visual.colors['secondaryLabel'], fontSize: visual.fontSizes[13] }}>{label}</Text>
      <VStack alignment="leading" spacing={visual.spacing[2]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
        <Text style={{ color: visual.colors['label'], fontSize: visual.fontSizes[13] }}>{value}</Text>
        {subtitle ? <Text style={{ color: visual.colors['secondaryLabel'], fontSize: visual.fontSizes[11] }}>{subtitle}</Text> : null}
      </VStack>
    </HStack>
  )
}

export const API_BASE = 'https://api.github.com'
export const REQUEST_TIMEOUT_MS = 15000
export const RERUN_REFRESH_DELAY_MS = 1000

export interface Repo {
  id: number
  name: string
  full_name: string
  owner: { login: string }
  private: boolean
  default_branch: string
}

export interface Workflow {
  id: number
  name: string
  path: string
  state: 'active' | 'disabled' | 'deleted'
  created_at: string
  updated_at: string
}

export interface Run {
  id: number
  name: string
  display_title?: string
  path?: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out' | null
  created_at: string
  updated_at: string
  run_started_at?: string
  completed_at?: string
  run_attempt: number
  head_branch: string
  head_sha: string
  head_commit?: {
    message?: string
    author?: { name?: string }
    committer?: { name?: string }
    timestamp?: string
  }
  actor: { login: string }
  triggering_actor?: { login: string }
  check_suite_id?: number
  pull_requests?: Array<{ number: number; title?: string }>
  repository?: { full_name?: string; default_branch?: string; private?: boolean }
  event: string
  workflow_id: number
  run_number: number
  url: string
  html_url: string
}

export interface JobStep {
  name: string
  status: string
  conclusion: string | null
  number: number
  started_at: string
  completed_at: string | null
}

export interface Job {
  id: number
  name: string
  status: string
  conclusion: string | null
  started_at: string
  completed_at: string | null
  steps?: JobStep[]
  runner_name?: string | null
  labels?: string[]
  workflow_name?: string
  head_branch?: string
}

export class GitHubAPI {
  private token: string
  private username: string
  private readonly getInflight: Map<string, Promise<unknown>> = new Map()
  private readonly workflowCache: Map<string, { workflows: Workflow[]; expiresAt: number }> = new Map()

  constructor(auth: { token: string; username: string }) {
    this.token = auth.token
    this.username = auth.username
  }

  private request<T>(path: string, options?: RequestInit): Promise<T> {
    const method: string = (options?.method ?? 'GET').toUpperCase()
    if (method !== 'GET') return this.performRequest<T>(path, options)

    const existing: Promise<unknown> | undefined = this.getInflight.get(path)
    if (existing) return existing as Promise<T>

    const pending: Promise<T> = this.performRequest<T>(path, options).finally(() => {
      if (this.getInflight.get(path) === pending) this.getInflight.delete(path)
    })
    this.getInflight.set(path, pending)
    return pending
  }

  private async performRequest<T>(path: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const url = `${API_BASE}${path}`
      const headers = {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        ...options?.headers,
      }
      const resp = await fetch(url, { ...options, headers, signal: controller.signal })
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`GitHub API error (${resp.status}): ${text}`)
      }
      const body = await resp.text()
      if (!body) return undefined as T
      return JSON.parse(body) as T
    } catch (err) {
      if ((err as any)?.name === 'AbortError') {
        throw new Error('请求超时，请检查网络或 Token 权限')
      }
      throw err
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async getRepos(): Promise<Repo[]> {
    return this.request<Repo[]>('/user/repos?per_page=100&sort=updated')
  }

  async getWorkflows(owner: string, repo: string, force: boolean = true): Promise<Workflow[]> {
    const path: string = `/repos/${owner}/${repo}/actions/workflows`
    const cached: { workflows: Workflow[]; expiresAt: number } | undefined = this.workflowCache.get(path)
    if (!force && !this.getInflight.has(path) && cached && cached.expiresAt > Date.now()) return cached.workflows
    this.workflowCache.delete(path)
    const data: { workflows: Workflow[] } = await this.request<{ workflows: Workflow[] }>(path)
    this.workflowCache.set(path, { workflows: data.workflows, expiresAt: Date.now() + 30000 })
    return data.workflows
  }

  async getWorkflowRuns(owner: string, repo: string, workflowId: number): Promise<Run[]> {
    const data = await this.request<{ workflow_runs: Run[] }>(
      `/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?per_page=50`
    )
    return data.workflow_runs
  }

  async rerunRun(owner: string, repo: string, runId: number): Promise<void> {
    await this.request(`/repos/${owner}/${repo}/actions/runs/${runId}/rerun`, {
      method: 'POST',
    })
  }

  async cancelRun(owner: string, repo: string, runId: number): Promise<void> {
    await this.request(`/repos/${owner}/${repo}/actions/runs/${runId}/cancel`, {
      method: 'POST',
    })
  }

  async dispatchWorkflow(
    owner: string,
    repo: string,
    workflowId: number,
    ref: string,
    inputs?: Record<string, any>
  ): Promise<void> {
    await this.request(
      `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
      {
        method: 'POST',
        body: JSON.stringify({ ref, inputs: inputs || {} }),
      }
    )
  }

  async getRun(owner: string, repo: string, runId: number): Promise<Run> {
    return this.request<Run>(`/repos/${owner}/${repo}/actions/runs/${runId}`)
  }

  async getRunJobs(owner: string, repo: string, runId: number): Promise<Job[]> {
    const data = await this.request<{ total_count: number; jobs: Job[] }>(
      `/repos/${owner}/${repo}/actions/runs/${runId}/jobs?per_page=100`
    )
    return data.jobs
  }
}

export function useLoadList<T>(fetcher: (force?: boolean) => Promise<T[]>) {
  const [state, setState] = useState<{ data: T[]; loading: boolean; errorMsg: string }>({
    data: [], loading: false, errorMsg: '',
  })
  const active = useRef<boolean>(false)
  const inflight = useRef<Promise<void> | null>(null)
  const generation = useRef<number>(0)

  const setErrorMsg = useCallback((message: string): void => {
    if (active.current) setState((previous) => ({ ...previous, errorMsg: message }))
  }, [])

  const load = useCallback((force: boolean = true): Promise<void> => {
    if (!active.current) return Promise.resolve()
    if (inflight.current) return inflight.current
    const requestGeneration: number = ++generation.current
    let settled: boolean = false
    const isCurrent = (): boolean => active.current && generation.current === requestGeneration
    animateChange(() => {
      if (!isCurrent() || settled) return
      setState((previous) => ({ ...previous, loading: true, errorMsg: '' }))
    })
    const pending: Promise<void> = Promise.resolve().then(async (): Promise<void> => {
      try {
        const nextData: T[] = await fetcher(force)
        settled = true
        if (!isCurrent()) return
        animateChange(() => {
          if (!isCurrent()) return
          setState({ data: nextData, errorMsg: '', loading: false })
        })
      } catch (error: unknown) {
        settled = true
        if (!isCurrent()) return
        const message: string = errorMessage(error, '加载失败')
        animateChange(() => {
          if (!isCurrent()) return
          setState((previous) => ({ ...previous, errorMsg: message, loading: false }))
        })
      } finally {
        if (generation.current === requestGeneration) inflight.current = null
      }
    })
    inflight.current = pending
    return pending
  }, [fetcher])

  useEffect(() => {
    active.current = true
    void load(false)
    return () => {
      active.current = false
      generation.current += 1
      inflight.current = null
    }
  }, [load])

  return { ...state, setErrorMsg, load }
}
