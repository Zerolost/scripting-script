import type { Run, Job, JobStep } from './AppModel'

export type RunDetailContent = {
  completedJobs: number
  steps: number
  success: number
  failed: number
  skipped: number
  focus: { title: string; lines: string[]; tone: 'failure' | 'running' | 'neutral' }
  commit: string
  end?: string
  durationStart?: string
  inferredEnd: boolean
}

function validTime(value: string | null | undefined): number | undefined {
  const time: number = value ? Date.parse(value) : NaN
  return Number.isFinite(time) ? time : undefined
}

function failed(state: { status: string; conclusion: string | null }): boolean {
  return state.status === 'completed' && (state.conclusion === 'failure' || state.conclusion === 'timed_out' || state.conclusion === 'startup_failure' || state.conclusion === 'action_required')
}

export function describeRunDetail(run: Run, jobs: Job[]): RunDetailContent {
  const steps: JobStep[] = jobs.flatMap((job: Job): JobStep[] => job.steps ?? [])
  const failedJobs: Job[] = jobs.filter(failed)
  const active: Job[] = jobs.filter((job: Job): boolean => job.status === 'in_progress')
  const lines: string[] = failedJobs.flatMap((job: Job): string[] => {
    const failures: JobStep[] = (job.steps ?? []).filter(failed)
    return failures.length ? failures.map((step: JobStep): string => `${job.name} · ${step.name}`) : [job.name]
  })
  const title: string = failedJobs.length ? '需要关注' : active.length ? `正在执行 · ${active.length} 个任务` : run.status === 'completed' ? '执行结果' : '等待执行'
  if (!lines.length && active.length) {
    for (const job of active) {
      const current: JobStep | undefined = job.steps?.find((step: JobStep): boolean => step.status === 'in_progress')
      lines.push(current ? `${job.name} · ${current.name}` : job.name)
    }
  }
  if (!lines.length) lines.push(run.status === 'completed' ? run.conclusion === 'success' ? '本次运行已成功完成' : run.conclusion === 'failure' ? '运行失败，暂无失败步骤明细' : run.conclusion === 'timed_out' ? '运行已超时，暂无超时步骤明细' : run.conclusion === 'cancelled' ? '本次运行已取消' : '任务与步骤详情见下方' : '等待 GitHub 分配或启动任务')
  const allEnded: boolean = jobs.length > 0 && jobs.every((job: Job): boolean => job.status === 'completed')
  const ends: number[] = jobs.map((job: Job): number | undefined => validTime(job.completed_at)).filter((value: number | undefined): value is number => value !== undefined)
  const inferredEnd: boolean = run.status === 'completed' && validTime(run.completed_at) === undefined && allEnded && ends.length === jobs.length
  const end: string | undefined = validTime(run.completed_at) !== undefined ? run.completed_at : inferredEnd ? new Date(Math.max(...ends)).toISOString() : undefined
  const starts: number[] = jobs.map((job: Job): number | undefined => validTime(job.started_at)).filter((value: number | undefined): value is number => value !== undefined)
  const durationStart: string | undefined = inferredEnd ? starts.length === jobs.length ? new Date(Math.min(...starts)).toISOString() : undefined : run.run_started_at
  const message: string = run.head_commit?.message?.trim() ?? ''
  const display: string = run.display_title?.trim() ?? ''
  const first: string = message.split('\n')[0].trim()
  const commit: string = first === display ? message.slice(message.indexOf('\n') + 1).trim() : message
  return {
    completedJobs: jobs.filter((job: Job): boolean => job.status === 'completed').length,
    steps: steps.length,
    success: steps.filter((step: JobStep): boolean => step.status === 'completed' && step.conclusion === 'success').length,
    failed: steps.filter(failed).length,
    skipped: steps.filter((step: JobStep): boolean => step.status === 'completed' && step.conclusion === 'skipped').length,
    focus: { title, lines, tone: failedJobs.length ? 'failure' : active.length ? 'running' : 'neutral' },
    commit: first === display && !message.includes('\n') ? '' : commit,
    end,
    durationStart,
    inferredEnd,
  }
}
