export interface WidgetTarget {
  owner: string
  repo: string
  workflowId?: number
  branch: string
}

export interface RunLite {
  id: number
  run_number: number
  status: string
  conclusion: string | null
  created_at: string
  event: string
}

export function getStoredAuth(): { token: string; username: string } | null {
  const username = Storage.get<string>('github_username')
  const token = Storage.get<string>('github_token')
  if (username && token) return { username, token }
  return null
}

const getInflight: Map<string, Promise<unknown>> = new Map()

export function ghRequest<T>(
  path: string,
  token: string,
  options?: { method?: string; body?: string }
): Promise<T> {
  const method: string = (options?.method ?? 'GET').toUpperCase()
  if (method !== 'GET' || options?.body !== undefined) return performGhRequest<T>(path, token, options)
  const key: string = JSON.stringify([token, path])
  const existing: Promise<unknown> | undefined = getInflight.get(key)
  if (existing) return existing as Promise<T>
  const pending: Promise<T> = performGhRequest<T>(path, token, options).finally((): void => {
    if (getInflight.get(key) === pending) getInflight.delete(key)
  })
  getInflight.set(key, pending)
  return pending
}

async function performGhRequest<T>(
  path: string,
  token: string,
  options?: { method?: string; body?: string }
): Promise<T> {
  const resp = await fetch(`https://api.github.com${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: options?.body,
  })
  if (!resp.ok) throw new Error(`GitHub API error (${resp.status})`)
  const text = await resp.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export function parseTarget(param: string): { owner: string; repo: string; workflowRef?: string } {
  const parts = (param || '').split('/').filter(Boolean)
  if (parts.length >= 2) {
    return { owner: parts[0], repo: parts[1], workflowRef: parts[2] }
  }
  return { owner: '', repo: '' }
}

export { getWidgetTargets, setWidgetTargets, createWidgetTargetStore } from './widgetTargetStore'
export type { WidgetTargetStorage, WidgetTargetStore } from './widgetTargetStore'

export function recordWidgetTrigger(owner: string, repo: string, workflowId: number) {
  Storage.set('widget_last_target', `${owner}/${repo}/${workflowId}`)
}

export async function fetchWorkflowInfo(owner: string, repo: string, token: string, workflowRef?: string) {
  const [repoInfo, wfList] = await Promise.all([
    ghRequest<{ default_branch: string }>(`/repos/${owner}/${repo}`, token),
    ghRequest<{ workflows: { id: number; name: string; path: string }[] }>(
      `/repos/${owner}/${repo}/actions/workflows`, token
    ),
  ])
  const branch: string = repoInfo.default_branch || 'main'
  let wf = wfList.workflows[0]
  if (workflowRef) {
    wf =
      wfList.workflows.find((w) => String(w.id) === workflowRef) ??
      wfList.workflows.find((w) => w.name === workflowRef) ??
      wfList.workflows.find((w) => w.path.endsWith('/' + workflowRef)) ??
      wf
  }
  return { branch, workflow: wf, all: wfList.workflows }
}

export async function fetchCron(owner: string, repo: string, branch: string, path: string, token: string): Promise<string | null> {
  const resp = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`, {
    headers: { 'Authorization': `token ${token}` },
  })
  if (!resp.ok) return null
  const content = await resp.text()
  const lines = content.split('\n').filter((l) => !l.trim().startsWith('#'))
  const crons = lines.join('\n').match(/cron\s*:\s*['"]?([^'"\n#]+)['"]?/gi)
  if (!crons) return null
  return crons.map((c: string) => c.replace(/cron\s*:\s*['"]?/i, '').replace(/['"]\s*$/, '').trim())[0] || null
}

export async function fetchLatestRuns(owner: string, repo: string, workflowId: number, token: string): Promise<RunLite[]> {
  const data = await ghRequest<{ workflow_runs: RunLite[] }>(
    `/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?per_page=5`,
    token
  )
  return data.workflow_runs ?? []
}

interface CronField {
  values: Set<number>
  star: boolean
}

function parseCronField(field: string, min: number, max: number): CronField {
  const values = new Set<number>()
  let star = false
  for (const part of field.split(',')) {
    let range = part
    let step = 1
    if (part.includes('/')) {
      const [r, s] = part.split('/')
      range = r
      step = parseInt(s, 10) || 1
    }
    if (range === '*') {
      star = true
      for (let i = min; i <= max; i += step) values.add(i)
    } else if (range.includes('-')) {
      const [a, b] = range.split('-').map(Number)
      for (let i = a; i <= b; i += step) values.add(i)
    } else {
      const v = parseInt(range, 10)
      if (!isNaN(v)) values.add(v)
    }
  }
  return { values, star }
}

function parseCron(expr: string): { minutes: CronField; hours: CronField; dom: CronField; months: CronField; dow: CronField } | null {
  const fields = expr.trim().split(/\s+/)
  if (fields.length < 5) return null
  return {
    minutes: parseCronField(fields[0], 0, 59),
    hours: parseCronField(fields[1], 0, 23),
    dom: parseCronField(fields[2], 1, 31),
    months: parseCronField(fields[3], 1, 12),
    dow: parseCronField(fields[4], 0, 7),
  }
}

function dayMatches(date: Date, c: NonNullable<ReturnType<typeof parseCron>>): boolean {
  const month = date.getUTCMonth() + 1
  const dom = date.getUTCDate()
  const dow = date.getUTCDay()
  if (!c.months.values.has(month)) return false
  const domOk = c.dom.values.has(dom)
  const dowOk = c.dow.values.has(dow) || (dow === 0 && c.dow.values.has(7))
  const domRestricted = !c.dom.star
  const dowRestricted = !c.dow.star
  return domRestricted && dowRestricted ? domOk || dowOk : domOk && dowOk
}

export function nextCronRun(expr: string, from: Date = new Date()): Date | null {
  const c = parseCron(expr)
  if (!c) return null
  const minutes: number[] = Array.from(c.minutes.values).sort((a: number, b: number): number => a - b)
  for (let d = 0; d <= 366; d++) {
    const day = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + d))
    if (!dayMatches(day, c)) continue
    for (let h = 0; h < 24; h++) {
      if (!c.hours.values.has(h)) continue
      for (const m of minutes) {
        const t = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, m, 0, 0))
        if (t.getTime() > from.getTime()) return t
      }
    }
  }
  return null
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

export function runStatusText(run: RunLite): string {
  if (run.status === 'completed') {
    return run.conclusion === 'success' ? '成功' : run.conclusion || '失败'
  }
  if (run.status === 'in_progress') return '运行中'
  if (run.status === 'queued') return '排队中'
  return run.status
}
