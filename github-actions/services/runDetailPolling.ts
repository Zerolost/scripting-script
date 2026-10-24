import type { Run, Job } from './AppModel'

export function runDetailSettled(run: Run, jobs: Job[]): boolean {
  return run.status === 'completed' && jobs.length > 0 && jobs.every((job: Job): boolean => job.status === 'completed')
}
