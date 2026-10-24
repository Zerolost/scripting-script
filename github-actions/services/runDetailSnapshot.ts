import type { Run, Job } from './AppModel'

export type RunDetailSnapshot = {
  run: Run
  jobs: Job[]
  loading: boolean
  error: string
}

function equalData(previous: unknown, next: unknown): boolean {
  if (Object.is(previous, next)) return true
  if (previous === null || next === null || typeof previous !== 'object' || typeof next !== 'object') return false
  if (Array.isArray(previous) || Array.isArray(next)) {
    if (!Array.isArray(previous) || !Array.isArray(next) || previous.length !== next.length) return false
    return previous.every((value: unknown, index: number): boolean => equalData(value, next[index]))
  }
  const previousRecord: Record<string, unknown> = previous as Record<string, unknown>
  const nextRecord: Record<string, unknown> = next as Record<string, unknown>
  const keys: string[] = Object.keys(previousRecord)
  if (keys.length !== Object.keys(nextRecord).length) return false
  return keys.every((key: string): boolean => Object.prototype.hasOwnProperty.call(nextRecord, key) && equalData(previousRecord[key], nextRecord[key]))
}

function reconcileJobs(previous: Job[], next: Job[]): Job[] {
  if (previous === next) return previous
  const previousById: Map<number, Job> = new Map(previous.map((job: Job): [number, Job] => [job.id, job]))
  const jobs: Job[] = next.map((job: Job): Job => {
    const existing: Job | undefined = previousById.get(job.id)
    return existing && equalData(existing, job) ? existing : job
  })
  return previous.length === jobs.length && jobs.every((job: Job, index: number): boolean => job === previous[index]) ? previous : jobs
}

export function reconcileRunDetailSnapshot(previous: RunDetailSnapshot, next: RunDetailSnapshot): RunDetailSnapshot {
  const run: Run = equalData(previous.run, next.run) ? previous.run : next.run
  const jobs: Job[] = reconcileJobs(previous.jobs, next.jobs)
  if (run === previous.run && jobs === previous.jobs && next.loading === previous.loading && next.error === previous.error) return previous
  return { run, jobs, loading: next.loading, error: next.error }
}

export function runDetailStepDigits(jobs: Job[]): number {
  let digits: number = 2
  for (const job of jobs) {
    for (const step of job.steps ?? []) {
      digits = Math.max(digits, String(step.number).length)
    }
  }
  return digits
}
