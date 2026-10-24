import { HStack, VStack, Image, ScrollView, useState, useEffect, useMemo, type Color } from 'scripting'
import { visual } from '../visual.config'
import { useAccentColor } from '../hooks/useAccentColor'
import { MotionText as Text, animateChange, motion, motionTransition } from '../components/Motion'
import { AppBackground } from '../components/AppBackground'
import { RunStepRow } from '../components/RunStepRow'
import { RunDetailFlow } from '../components/RunDetailFlow'
import { RunDetailHeader } from '../components/RunDetailHeader'
import { RunDetailMetadata } from '../components/RunDetailMetadata'
import { GlassCard } from '../components/GlassSurface'
import { errorMessage, jobStatusInfo, jobStatusIcon, durationText, type Run, type Job, type GitHubAPI } from '../services/AppModel'
import { reconcileRunDetailSnapshot, runDetailStepDigits, type RunDetailSnapshot } from '../services/runDetailSnapshot'
import { runDetailSettled } from '../services/runDetailPolling'
import { describeRunDetail, type RunDetailContent } from '../services/runDetailContent'

export function RunDetailPage({ api, owner, repo, run: initialRun }: { api: GitHubAPI; owner: string; repo: string; run: Run }) {
  const accent: Color = useAccentColor()
  const [snapshot, setSnapshot] = useState<RunDetailSnapshot>(() => ({ run: initialRun, jobs: [], loading: true, error: '' }))
  const { run, jobs, loading: jobsLoading, error: jobsError }: RunDetailSnapshot = snapshot
  useEffect(() => {
    let cancelled: boolean = false
    let currentSnapshot: RunDetailSnapshot = snapshot
    let timer: ReturnType<typeof setTimeout> | null = null
    const loadJobs: () => Promise<void> = async (): Promise<void> => {
      const [runResult, jobsResult] = await Promise.allSettled([
        api.getRun(owner, repo, initialRun.id),
        api.getRunJobs(owner, repo, initialRun.id),
      ])
      if (cancelled) return
      const message: string = jobsResult.status === 'rejected'
        ? errorMessage(jobsResult.reason, '任务加载失败')
        : runResult.status === 'rejected' ? errorMessage(runResult.reason, '运行状态加载失败') : ''
      const nextSnapshot: RunDetailSnapshot = reconcileRunDetailSnapshot(currentSnapshot, {
        run: runResult.status === 'fulfilled' ? runResult.value : currentSnapshot.run,
        jobs: jobsResult.status === 'fulfilled' ? jobsResult.value : currentSnapshot.jobs,
        loading: false,
        error: message,
      })
      if (nextSnapshot !== currentSnapshot) {
        currentSnapshot = nextSnapshot
        animateChange(() => {
          if (cancelled) return
          setSnapshot(nextSnapshot)
        })
      }
      const completed: boolean = runResult.status === 'fulfilled' && jobsResult.status === 'fulfilled' && runDetailSettled(runResult.value, jobsResult.value)
      if (!cancelled && !completed) timer = setTimeout(() => { void loadJobs() }, 10000)
    }
    void loadJobs()
    return () => {
      cancelled = true
      if (timer !== null) clearTimeout(timer)
    }
  }, [api, owner, repo, initialRun.id])
  const content: RunDetailContent = useMemo((): RunDetailContent => describeRunDetail(run, jobs), [run, jobs])
  const stepDigits: number = useMemo((): number => runDetailStepDigits(jobs), [jobs])
  const numberWidth: number = visual.fontSizes[11] * (stepDigits + 1) * 0.7
  return <ScrollView tint={accent} navigationTitle={visual.text['运行详情']} navigationBarTitleDisplayMode={visual.navigationTitleMode} transition={motionTransition} background={<AppBackground />}>
    <VStack padding={{ horizontal: visual.spacing[12], top: visual.spacing[8], bottom: visual.spacing[28] }} spacing={visual.spacing[8]} alignment="leading" animation={{ animation: motion, value: `${jobsLoading}|${jobsError}|${run.status}|${jobs.length}` }}>
      <RunDetailHeader run={run} jobs={jobs} content={content} loading={jobsLoading} error={jobsError} owner={owner} repo={repo} />
      <RunDetailFlow key={run.id} run={run} jobs={jobs} loading={jobsLoading} error={jobsError} showMessages={false} />
      <GlassCard>
        <HStack spacing={6}>
          <Image systemName={visual.icons['list.bullet.rectangle.fill']} font={16} foregroundStyle={accent} />
          <Text font={visual.fontSizes[13]} fontWeight={visual.typography.semibold} foregroundStyle={visual.colors.secondaryLabel}>{jobsLoading ? '任务明细' : `任务明细 · ${jobs.length}`}</Text>
        </HStack>
        {!jobsLoading && !jobsError && !jobs.length ? <Text font={visual.fontSizes[13]} foregroundStyle={visual.colors.secondaryLabel}>暂无任务</Text> : null}
        {jobs.map((job: Job, index: number) => {
          const info: ReturnType<typeof jobStatusInfo> = jobStatusInfo(job)
          const icon: ReturnType<typeof jobStatusIcon> = jobStatusIcon(job)
          const duration: string | null = durationText(job.started_at, job.completed_at || undefined)
          const runner: string | null = job.runner_name || (job.labels?.length ? job.labels.join(' / ') : null)
          return <VStack key={job.id} alignment="leading" spacing={visual.spacing[5]} transition={motionTransition}>
            <HStack spacing={8}>
              <Image systemName={icon.systemName} font={14} foregroundStyle={icon.color} />
              <Text font={visual.fontSizes[14]} fontWeight={visual.typography.medium} foregroundStyle={visual.colors.label} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>{job.name}</Text>
              <Text font={visual.fontSizes[12]} foregroundStyle={icon.color}>{info.text}</Text>
            </HStack>
            {duration || runner ? <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>{[duration, runner].filter(Boolean).join(' · ')}</Text> : null}
            {job.steps?.length ? <VStack alignment="leading" spacing={visual.spacing[3]}>{job.steps.map((step: NonNullable<Job['steps']>[number]) => <RunStepRow key={step.number} step={step} numberWidth={numberWidth} />)}</VStack> : <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>暂无步骤明细</Text>}
            {index < jobs.length - 1 ? <HStack frame={{ maxWidth: 'infinity', height: 1 }} background={visual.colors['#e5e7eb']} /> : null}
          </VStack>
        })}
      </GlassCard>
      <RunDetailMetadata run={run} content={content} owner={owner} repo={repo} />
    </VStack>
  </ScrollView>
}
