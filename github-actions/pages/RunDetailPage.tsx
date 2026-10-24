import { visual } from '../visual.config'
import { HStack, VStack, Image, ScrollView, useState, useEffect } from "scripting"
import { MotionText as Text, animateChange, motion, motionTransition } from "../components/Motion"
import { AppBackground } from "../components/AppBackground"
import { RunStepRow } from '../components/RunStepRow'
import { GlassCard, glassListRow } from "../components/GlassSurface"
import { errorMessage, runStatusInfo, runStatusIcon, jobStatusInfo, jobStatusIcon, formatTime, formatShortTime, timeAgoText, durationText, InfoRow, Run, Job, GitHubAPI } from "../services/AppModel"

export function RunDetailPage({
  api,
  owner,
  repo,
  run: initialRun,
}: {
  api: GitHubAPI
  owner: string
  repo: string
  run: Run
}) {
  const [run, setRun] = useState<Run>(initialRun)
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [jobsError, setJobsError] = useState('')

  useEffect(() => {
    let cancelled: boolean = false
    let timer: ReturnType<typeof setTimeout> | null = null
    const loadJobs = async (): Promise<void> => {
      const [runResult, jobsResult] = await Promise.allSettled([
        api.getRun(owner, repo, initialRun.id),
        api.getRunJobs(owner, repo, initialRun.id),
      ])
      if (cancelled) return
      const message: string = jobsResult.status === 'rejected'
        ? errorMessage(jobsResult.reason, '任务加载失败')
        : runResult.status === 'rejected'
          ? errorMessage(runResult.reason, '运行状态加载失败')
          : ''
      animateChange(() => {
        if (cancelled) return
        if (runResult.status === 'fulfilled') setRun(runResult.value)
        if (jobsResult.status === 'fulfilled') setJobs(jobsResult.value)
        setJobsError(message)
        setJobsLoading(false)
      })
      const completed: boolean = runResult.status === 'fulfilled'
        && runResult.value.status === 'completed'
        && jobsResult.status === 'fulfilled'
      if (!cancelled && !completed) timer = setTimeout(() => { void loadJobs() }, 10000)
    }
    void loadJobs()
    return () => {
      cancelled = true
      if (timer !== null) clearTimeout(timer)
    }
  }, [api, owner, repo, initialRun.id])

  const info = runStatusInfo(run)
  const runIcon: ReturnType<typeof runStatusIcon> = runStatusIcon(run)
  const stepDigits: number = Math.max(2, ...jobs.flatMap((job: Job) => (job.steps ?? []).map((step: NonNullable<Job['steps']>[number]) => String(step.number).length)))
  const numberWidth: number = visual.fontSizes[11] * (stepDigits + 1) * 0.7
  const isRunDone = run.status === 'completed'
  const runDuration = durationText(run.run_started_at, run.completed_at)
  const liveDuration =
    !isRunDone && run.run_started_at ? durationText(run.run_started_at, new Date().toISOString()) : null
  const completedText = isRunDone ? formatTime(run.completed_at) : run.status === 'in_progress' ? visual.text['进行中'] : visual.text['排队中']
  const completedSubtitle = run.completed_at ? timeAgoText(run.completed_at) : null
  const durationDisplay = runDuration || (liveDuration ? `${visual.text['已运行 ']}${liveDuration}` : visual.text['—'])
  const repoFull = run.repository?.full_name || `${owner}/${repo}`
  const commitAuthor = run.head_commit?.author?.name || run.head_commit?.committer?.name
  const triggeringActor =
    run.triggering_actor && run.triggering_actor.login !== run.actor.login
      ? run.triggering_actor.login
      : null
  const prCount = run.pull_requests?.length || 0
  const sha = run.head_sha?.slice(0, 7) || ''

  return (
    <ScrollView navigationTitle={visual.text['运行详情']} navigationBarTitleDisplayMode={visual.navigationTitleMode} transition={motionTransition} background={<AppBackground />}>
      <VStack padding={{ horizontal: visual.spacing[12], top: visual.spacing[8], bottom: visual.spacing[28] }} spacing={visual.spacing[8]} alignment="leading" animation={{ animation: motion, value: `${jobsLoading}|${jobsError}|${run.status}|${jobs.length}` }}>
        <GlassCard>
          <HStack spacing={visual.spacing[10]} alignment="center">
            <VStack alignment="center" spacing={visual.spacing[0]} frame={{ width: visual.sizes[32], height: visual.sizes[32] }} clipShape={{ type: 'rect', cornerRadius: visual.radii[23], style: 'continuous' }}>
              <Image systemName={runIcon.systemName} frame={{ width: visual.sizes[22], height: visual.sizes[22] }} foregroundStyle={runIcon.color} />
            </VStack>
            <VStack alignment="leading" spacing={visual.spacing[4]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
              <Text style={{ fontSize: visual.fontSizes[22], fontWeight: 'bold', color: visual.colors['label'] }}>{visual.text['运行 #']}{run.run_number}</Text>
              <Text style={{ fontSize: visual.fontSizes[12], color: visual.colors['secondaryLabel'] }}>{repoFull} · {run.event}</Text>
            </VStack>
            <Text font={visual.fontSizes[12]} fontWeight={visual.typography.semibold} foregroundStyle={runIcon.color}>{info.text}</Text>
          </HStack>
          {run.display_title ? (
            <Text style={{ fontSize: visual.fontSizes[15], fontWeight: '500', color: visual.colors['label'] }} numberOfLines={visual.lineLimits[1]}>{run.display_title}</Text>
          ) : null}
          <HStack spacing={visual.spacing[8]} alignment="center">
            <Image systemName={visual.icons['arrow.triangle.branch']} frame={{ width: visual.sizes[14], height: visual.sizes[14] }} foregroundStyle={visual.colors['#8e8e93']} />
            <Text style={{ fontSize: visual.fontSizes[14], color: visual.colors['label'] }}>{run.head_branch || visual.text['未知分支']}</Text>
            {sha ? <Text style={{ fontSize: visual.fontSizes[13], fontFamily: 'monospace', color: visual.colors['secondaryLabel'] }}>{sha}</Text> : null}
          </HStack>
          {run.head_commit?.message ? (
            <Text style={{ fontSize: visual.fontSizes[13], color: visual.colors['secondaryLabel'] }} numberOfLines={visual.lineLimits[1]}>{run.head_commit.message}</Text>
          ) : null}
          {commitAuthor ? (
            <HStack spacing={visual.spacing[8]} alignment="center">
              <Image systemName={visual.icons['person.crop.circle']} frame={{ width: visual.sizes[13], height: visual.sizes[13] }} foregroundStyle={visual.colors['#8e8e93']} />
              <Text style={{ fontSize: visual.fontSizes[13], color: visual.colors['secondaryLabel'] }}>{commitAuthor}</Text>
              {run.head_commit?.timestamp ? (
                <Text style={{ fontSize: visual.fontSizes[13], color: visual.colors['secondaryLabel'] }}>· {timeAgoText(run.head_commit.timestamp) || formatShortTime(run.head_commit.timestamp)}</Text>
              ) : null}
            </HStack>
          ) : null}
          <HStack spacing={visual.spacing[8]}>
            <Text style={{ fontSize: visual.fontSizes[13], color: visual.colors['secondaryLabel'] }}>{run.event}</Text>
            <Text style={{ fontSize: visual.fontSizes[13], color: visual.colors['secondaryLabel'] }}>· {run.actor.login}</Text>
            <Text style={{ fontSize: visual.fontSizes[13], color: visual.colors['secondaryLabel'] }}>{visual.text['· 第 ']}{run.run_attempt}{visual.text[' 次尝试']}</Text>
          </HStack>
        </GlassCard>

        <GlassCard>
          <VStack alignment="leading" spacing={visual.spacing[6]}>
            <HStack spacing={visual.spacing[6]} alignment="center">
              <Image systemName={visual.icons['info.circle.fill']} frame={{ width: visual.sizes[16], height: visual.sizes[16] }} foregroundStyle={visual.colors['#0a84ff']} />
            <Text style={{ fontSize: visual.fontSizes[13], fontWeight: '600', color: visual.colors['secondaryLabel'] }}>{visual.text['概览']}</Text>
            </HStack>
          <InfoRow label={visual.text['仓库']} value={repoFull} />
          {run.repository?.default_branch ? <InfoRow label={visual.text['默认分支']} value={run.repository.default_branch} /> : null}
          <InfoRow label={visual.text['工作流']} value={run.name || String(run.workflow_id)} />
          {run.path ? <InfoRow label={visual.text['文件']} value={run.path} /> : null}
          <InfoRow label={visual.text['触发者']} value={run.actor.login} />
          {triggeringActor ? <InfoRow label={visual.text['实际触发']} value={triggeringActor} /> : null}
          {run.check_suite_id ? <InfoRow label={visual.text['Check Suite']} value={`#${run.check_suite_id}`} /> : null}
          {prCount > 0 ? (
            <InfoRow label={visual.text['关联 PR']} value={run.pull_requests!.map((pr) => `#${pr.number}`).join(', ')} />
          ) : null}
          </VStack>
        </GlassCard>

        <GlassCard>
          <VStack alignment="leading" spacing={visual.spacing[6]}>
            <HStack spacing={visual.spacing[6]} alignment="center">
              <Image systemName={visual.icons['clock.fill']} frame={{ width: visual.sizes[16], height: visual.sizes[16] }} foregroundStyle={visual.colors['#0a84ff']} />
            <Text style={{ fontSize: visual.fontSizes[13], fontWeight: '600', color: visual.colors['secondaryLabel'] }}>{visual.text['时间']}</Text>
            </HStack>
          <InfoRow label={visual.text['创建']} value={formatTime(run.created_at)} subtitle={timeAgoText(run.created_at)} />
          <InfoRow label={visual.text['开始']} value={formatTime(run.run_started_at)} subtitle={timeAgoText(run.run_started_at)} />
          <InfoRow label={visual.text['完成']} value={completedText} subtitle={completedSubtitle} />
          <InfoRow label={visual.text['耗时']} value={durationDisplay} />
          <InfoRow label={visual.text['更新']} value={formatTime(run.updated_at)} subtitle={timeAgoText(run.updated_at)} />
          </VStack>
        </GlassCard>

        <GlassCard>
          <VStack alignment="leading" spacing={visual.spacing[6]}>
            <HStack spacing={visual.spacing[6]} alignment="center">
              <Image systemName={visual.icons['list.bullet.rectangle.fill']} frame={{ width: visual.sizes[16], height: visual.sizes[16] }} foregroundStyle={visual.colors['#0a84ff']} />
            <Text style={{ fontSize: visual.fontSizes[13], fontWeight: '600', color: visual.colors['secondaryLabel'] }}>{visual.text['任务']} ({jobs.length})</Text>
          </HStack>
          {jobsLoading ? <Text {...glassListRow} style={{ fontSize: visual.fontSizes[13], color: visual.colors['secondaryLabel'] }}>{visual.text['加载中...']}</Text> : null}
          {jobsError ? <Text {...glassListRow} style={{ fontSize: visual.fontSizes[13], color: visual.colors['#b42318'] }}>{jobsError}</Text> : null}
          {!jobsLoading && !jobsError && jobs.length === 0 ? (
            <Text style={{ fontSize: visual.fontSizes[13], color: visual.colors['secondaryLabel'] }}>{visual.text['暂无任务']}</Text>
          ) : null}
          {jobs.map((job, idx) => {
            const j = jobStatusInfo(job)
            const icon = jobStatusIcon(job)
            const jobDuration = durationText(job.started_at, job.completed_at || undefined)
            const runner = job.runner_name || (job.labels && job.labels.length ? job.labels.join(' / ') : null)
            return (
              <VStack key={job.id} alignment="leading" spacing={visual.spacing[5]} transition={motionTransition}>
                <HStack spacing={visual.spacing[8]} alignment="center">
                  <Image systemName={icon.systemName} frame={{ width: visual.sizes[14], height: visual.sizes[14] }} foregroundStyle={icon.color} />
                  <VStack alignment="leading" spacing={visual.spacing[2]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
                    <Text style={{ fontSize: visual.fontSizes[14], fontWeight: '500', color: visual.colors['label'] }}>{job.name}</Text>
                    <Text style={{ fontSize: visual.fontSizes[12], color: visual.colors['secondaryLabel'] }}>
                      {j.text}{jobDuration ? ` · ${jobDuration}` : ''}{runner ? ` · ${runner}` : ''}
                    </Text>
                  </VStack>
                </HStack>
                {job.steps && job.steps.length > 0 ? (
                  <VStack alignment="leading" spacing={visual.spacing[3]}>
                    {job.steps.map((step: NonNullable<Job['steps']>[number]) => <RunStepRow key={step.number} step={step} numberWidth={numberWidth} />)}
                  </VStack>
                ) : null}
                {idx < jobs.length - 1 ? (
                  <HStack frame={{ maxWidth: 'infinity', minHeight: visual.sizes[1], maxHeight: visual.sizes[1] }} background={visual.colors['#e5e7eb']} />
                ) : null}
              </VStack>
            )
          })}
          </VStack>
        </GlassCard>
      </VStack>
    </ScrollView>
  )
}
