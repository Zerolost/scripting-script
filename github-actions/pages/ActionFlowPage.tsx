import { Button, HStack, Image, VStack, useCallback, useEffect, useState, type Color, type VirtualNode } from 'scripting'
import { GlassList, GlassSection } from '../components/GlassList'
import { AppBackground } from '../components/AppBackground'
import { ActionFlowGraph } from '../components/ActionFlowGraph'
import { MotionRow, MotionText as Text, animateChange, motion, motionTransition } from '../components/Motion'
import { useAccentColor } from '../hooks/useAccentColor'
import { GitHubAPI, errorMessage, formatShortTime, runStatusIcon, runStatusInfo, useLoadList, type Job, type Repo, type Run, type Workflow } from '../services/AppModel'
import { visual } from '../visual.config'
import { glassButtonStyle } from '../design/AllPatternDesign'
import { useActionRepositories } from '../hooks/useActionRepositories'

type Selection = { repo: Repo; workflow: Workflow | null } | null

type RunState = {
  run: Run | null
  jobs: Job[]
  loading: boolean
  error: string
}

export function ActionFlowPage({ api }: { api: GitHubAPI }): VirtualNode {
  const accent: Color = useAccentColor()
  const [selection, setSelection] = useState<Selection>(null)
  const select = (next: Selection): void => {
    animateChange(() => setSelection(next))
  }

  return (
    <VStack
      spacing={0}
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
      background={<AppBackground />}
      navigationTitle="Action 流程图"
      navigationBarTitleDisplayMode={visual.navigationTitleMode}
      tint={accent}
      animation={{ animation: motion, value: `${selection?.repo.id ?? ''}:${selection?.workflow?.id ?? ''}` }}
    >
      {selection ? (
        <HStack spacing={visual.spacing[8]} padding={{ horizontal: visual.spacing[12], vertical: visual.spacing[8] }}>
          <Button title="仓库" systemImage="chevron.left" tint={accent} buttonStyle={glassButtonStyle(false)} action={() => select(null)} />
          {selection.workflow ? (
            <Button title="工作流" tint={accent} buttonStyle={glassButtonStyle(false)} action={() => select({ repo: selection.repo, workflow: null })} />
          ) : null}
          <Text style={{ fontSize: visual.fontSizes[12], color: visual.colors.secondaryLabel }} numberOfLines={1}>{selection.repo.full_name}</Text>
        </HStack>
      ) : null}
      {!selection ? (
        <FlowRepositories api={api} onSelect={(repo: Repo): void => select({ repo, workflow: null })} />
      ) : !selection.workflow ? (
        <FlowWorkflows key={selection.repo.id} api={api} repo={selection.repo} onSelect={(workflow: Workflow): void => select({ repo: selection.repo, workflow })} />
      ) : (
        <FlowRun key={`${selection.repo.id}:${selection.workflow.id}`} api={api} repo={selection.repo} workflow={selection.workflow} />
      )}
    </VStack>
  )
}

function FlowChoice({ title, subtitle, icon, onSelect }: { title: string; subtitle: string; icon: string; onSelect: () => void }): VirtualNode {
  const accent: Color = useAccentColor()
  return (
    <Button buttonStyle="plain" tint={accent} action={onSelect}>
      <MotionRow spacing={visual.spacing[8]}>
        <Image systemName={icon} foregroundStyle={accent} frame={{ width: visual.sizes[32], height: visual.sizes[32] }} />
        <VStack alignment="leading" spacing={visual.spacing[4]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
          <Text style={{ fontSize: visual.fontSizes[16], fontWeight: '600', color: visual.colors.label }} numberOfLines={2}>{title}</Text>
          <Text style={{ fontSize: visual.fontSizes[12], color: visual.colors.secondaryLabel }} numberOfLines={2}>{subtitle}</Text>
        </VStack>
      </MotionRow>
    </Button>
  )
}

function FlowNotice({ message, error = false }: { message: string; error?: boolean }): VirtualNode {
  return (
    <MotionRow>
      <Text style={{ fontSize: visual.fontSizes[13], color: error ? visual.colors['#b42318'] : visual.colors.secondaryLabel }}>{message}</Text>
    </MotionRow>
  )
}

function FlowRefresh({ loading, onRefresh }: { loading: boolean; onRefresh: () => void }): VirtualNode {
  const accent: Color = useAccentColor()
  return <Button title={loading ? '正在刷新…' : '刷新'} systemImage="arrow.clockwise" buttonStyle={glassButtonStyle(false)} tint={accent} disabled={loading} action={onRefresh} />
}

function FlowRepositories({ api, onSelect }: { api: GitHubAPI; onSelect: (repo: Repo) => void }): VirtualNode {
  const { data, loading, errorMsg, noticeMsg, load } = useActionRepositories(api)
  return (
    <GlassList>
      <GlassSection header={<Text>选择仓库</Text>}>
        <FlowRefresh loading={loading} onRefresh={() => { void load() }} />
        <FlowNotice message="选择仓库后浏览其 Actions 工作流，再查看最近一次运行。" />
        {loading ? <FlowNotice message="正在加载仓库…" /> : null}
        {noticeMsg ? <FlowNotice message={noticeMsg} /> : null}
        {errorMsg ? <FlowNotice error message={`仓库加载失败：${errorMsg}`} /> : null}
        {!loading && !errorMsg && data.length === 0 ? <FlowNotice message="暂无可访问的仓库，请检查账户和 Token 的仓库读取权限。" /> : null}
        {data.map((repo: Repo) => (
          <FlowChoice key={repo.id} title={repo.full_name} subtitle={`默认分支：${repo.default_branch}`} icon={repo.private ? 'lock.fill' : 'globe.americas.fill'} onSelect={() => onSelect(repo)} />
        ))}
      </GlassSection>
    </GlassList>
  )
}

function FlowWorkflows({ api, repo, onSelect }: { api: GitHubAPI; repo: Repo; onSelect: (workflow: Workflow) => void }): VirtualNode {
  const { data, loading, errorMsg, load } = useLoadList<Workflow>(useCallback((force: boolean = true): Promise<Workflow[]> => api.getWorkflows(repo.owner.login, repo.name, force), [api, repo.owner.login, repo.name]))
  return (
    <GlassList>
      <GlassSection header={<Text>选择工作流</Text>}>
        <FlowRefresh loading={loading} onRefresh={() => { void load() }} />
        {loading ? <FlowNotice message="正在加载工作流…" /> : null}
        {errorMsg ? <FlowNotice error message={`工作流加载失败：${errorMsg}`} /> : null}
        {!loading && !errorMsg && data.length === 0 ? <FlowNotice message="该仓库暂无可读取的 Actions 工作流。" /> : null}
        {data.map((workflow: Workflow) => (
          <FlowChoice key={workflow.id} title={workflow.name} subtitle={workflow.path} icon="bolt.fill" onSelect={() => onSelect(workflow)} />
        ))}
      </GlassSection>
    </GlassList>
  )
}

function FlowRun({ api, repo, workflow }: { api: GitHubAPI; repo: Repo; workflow: Workflow }): VirtualNode {
  const [revision, setRevision] = useState<number>(0)
  const [state, setState] = useState<RunState>({ run: null, jobs: [], loading: true, error: '' })

  useEffect(() => {
    let cancelled: boolean = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let currentRun: Run | null = null
    const update = (change: (previous: RunState) => RunState): void => {
      if (cancelled) return
      animateChange(() => {
        if (!cancelled) setState(change)
      })
    }
    const schedule = (load: () => Promise<void>): void => {
      if (!cancelled) timer = setTimeout(() => { void load() }, 10000)
    }
    const loadRun = async (): Promise<void> => {
      if (cancelled || !currentRun) return
      const runId: number = currentRun.id
      const [runResult, jobsResult] = await Promise.allSettled([
        api.getRun(repo.owner.login, repo.name, runId),
        api.getRunJobs(repo.owner.login, repo.name, runId),
      ])
      if (cancelled) return
      if (runResult.status === 'fulfilled') currentRun = runResult.value
      const errors: string[] = []
      if (runResult.status === 'rejected') errors.push(`运行状态刷新失败：${errorMessage(runResult.reason, '请稍后刷新重试')}`)
      if (jobsResult.status === 'rejected') errors.push(`任务加载失败：${errorMessage(jobsResult.reason, '请稍后刷新重试')}`)
      const nextRun: Run = currentRun
      update((previous: RunState): RunState => ({
        run: nextRun,
        jobs: jobsResult.status === 'fulfilled' ? jobsResult.value : previous.jobs,
        loading: false,
        error: errors.join('\n'),
      }))
      if (nextRun.status !== 'completed' || errors.length > 0) schedule(loadRun)
    }
    const loadLatest = async (): Promise<void> => {
      update((previous: RunState): RunState => ({ ...previous, loading: true, error: '' }))
      try {
        const runs: Run[] = await api.getWorkflowRuns(repo.owner.login, repo.name, workflow.id)
        if (cancelled) return
        currentRun = runs.reduce<Run | null>((latest: Run | null, candidate: Run): Run => {
          if (!latest) return candidate
          return candidate.run_number > latest.run_number || (candidate.run_number === latest.run_number && candidate.id > latest.id) ? candidate : latest
        }, null)
        if (!currentRun) {
          update((): RunState => ({ run: null, jobs: [], loading: false, error: '' }))
          return
        }
        const latestRun: Run = currentRun
        update((previous: RunState): RunState => ({ ...previous, run: latestRun, jobs: previous.run?.id === latestRun.id ? previous.jobs : [] }))
        await loadRun()
      } catch (error: unknown) {
        update((previous: RunState): RunState => ({ ...previous, loading: false, error: `最近运行加载失败：${errorMessage(error, '请稍后刷新重试')}` }))
      }
    }
    void loadLatest()
    return () => {
      cancelled = true
      if (timer !== null) clearTimeout(timer)
    }
  }, [api, repo.owner.login, repo.name, workflow.id, revision])

  const run: Run | null = state.run
  const status: ReturnType<typeof runStatusInfo> | null = run ? runStatusInfo(run) : null
  const icon: ReturnType<typeof runStatusIcon> | null = run ? runStatusIcon(run) : null
  const refresh = (): void => {
    if (state.loading) return
    animateChange(() => setRevision((previous: number): number => previous + 1))
  }

  return (
    <GlassList>
      <GlassSection header={<Text>{workflow.name} · 最近运行</Text>}>
        <FlowRefresh loading={state.loading} onRefresh={refresh} />
        {state.loading ? <FlowNotice message="正在加载最近运行与任务…" /> : null}
        {state.error ? <FlowNotice error message={state.error} /> : null}
        {!state.loading && !state.error && !run ? <FlowNotice message="该工作流暂无运行记录。" /> : null}
        {run && status && icon ? (
          <VStack alignment="leading" spacing={visual.spacing[8]} transition={motionTransition}>
            <MotionRow spacing={visual.spacing[8]}>
              <Image systemName={icon.systemName} foregroundStyle={icon.color} />
              <VStack alignment="leading" spacing={visual.spacing[4]}>
                <Text style={{ fontSize: visual.fontSizes[16], fontWeight: '600', color: status.color }}>{`运行 #${run.run_number} · ${status.text}`}</Text>
                <Text style={{ fontSize: visual.fontSizes[13], color: visual.colors.label }} numberOfLines={2}>{run.display_title || run.name}</Text>
                <Text style={{ fontSize: visual.fontSizes[12], color: visual.colors.secondaryLabel }}>{`${run.head_branch || '未知分支'} · ${formatShortTime(run.created_at)}`}</Text>
              </VStack>
            </MotionRow>
            {run.status !== 'completed' ? <FlowNotice message="运行尚未结束，每 10 秒自动刷新状态和任务。" /> : null}
            {!state.loading && state.jobs.length === 0 ? <FlowNotice message={run.status === 'completed' ? '此次运行暂无任务记录。' : '任务尚未生成，等待下一次刷新。'} /> : null}
            <ActionFlowGraph jobs={state.jobs} status={run.status} conclusion={run.conclusion} />
          </VStack>
        ) : null}
      </GlassSection>
    </GlassList>
  )
}
