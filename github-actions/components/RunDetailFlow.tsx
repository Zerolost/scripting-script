import { VStack, Text, Toggle, useState, useEffect, type Color } from 'scripting'
import { type Run, type Job } from '../services/AppModel'
import { visual } from '../visual.config'
import { useAccentColor } from '../hooks/useAccentColor'
import { animateChange, motion, motionTransition } from './Motion'
import { ActionFlowGraph } from './ActionFlowGraph'

const visibilityKey: string = 'github_actions_run_flow_enabled_v1'
const visibilityListeners: Set<(value: boolean) => void> = new Set()

type VisibilityProps = { preview?: boolean; initialEnabled?: boolean }
type FlowProps = VisibilityProps & {
  run: Pick<Run, 'id' | 'status' | 'conclusion'>
  jobs: Job[]
  loading?: boolean
  error?: string
  showMessages?: boolean
}

function readVisibility(): boolean {
  try {
    const stored: unknown = Storage.get<boolean>(visibilityKey)
    return typeof stored === 'boolean' ? stored : true
  } catch {
    return true
  }
}

function useFlowVisibility({ preview = false, initialEnabled = true }: VisibilityProps): {
  enabled: boolean
  message: string
  change: (next: boolean) => void
} {
  const [enabled, setEnabled] = useState<boolean>(() => preview ? initialEnabled : readVisibility())
  const [message, setMessage] = useState<string>('')
  useEffect(() => {
    if (preview) return
    const receive: (value: boolean) => void = (value: boolean): void => {
      animateChange(() => { setEnabled(value); setMessage('') })
    }
    visibilityListeners.add(receive)
    receive(readVisibility())
    return () => { visibilityListeners.delete(receive) }
  }, [preview])
  function change(next: boolean): void {
    if (next === enabled) return
    if (!preview) {
      let saved: boolean = false
      try {
        saved = Storage.set(visibilityKey, next)
      } catch {
        saved = false
      }
      if (!saved) {
        animateChange(() => setMessage('流程图显示设置保存失败，已保持原状态，请重试。'))
        return
      }
    }
    animateChange(() => {
      setEnabled(next)
      setMessage(preview ? '本地预览已更新，未写入实际设置。' : '')
    })
    if (!preview) visibilityListeners.forEach((receive: (value: boolean) => void): void => receive(next))
  }
  return { enabled, message, change }
}

function VisibilityControl({ enabled, message, change }: {
  enabled: boolean
  message: string
  change: (next: boolean) => void
}) {
  const accent: Color = useAccentColor()
  return <VStack alignment="leading" spacing={visual.spacing[6]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
    <Toggle title="显示运行流程图" value={enabled} onChanged={change} toggleStyle="switch" tint={accent} />
    {message ? <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel} contentTransition={visual.textTransition}>{message}</Text> : null}
  </VStack>
}

export function FlowVisibilitySetting(props: VisibilityProps = {}) {
  const visibility: ReturnType<typeof useFlowVisibility> = useFlowVisibility(props)
  return <VStack alignment="leading" spacing={visual.spacing[6]}>
    <VisibilityControl {...visibility} />
    <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>在历史运行详情中展示已有任务与步骤；关闭后停止绘制，任务文字列表仍保留。</Text>
  </VStack>
}

export function RunDetailFlow({ run, jobs, loading = false, error = '', showMessages = true, preview = false, initialEnabled = true }: FlowProps) {
  const visibility: ReturnType<typeof useFlowVisibility> = useFlowVisibility({ preview, initialEnabled })
  return <VStack alignment="leading" spacing={visual.spacing[10]} frame={{ maxWidth: 'infinity', alignment: 'leading' }} animation={{ animation: motion, value: `${visibility.enabled}|${loading}|${error}|${jobs.length}` }}>
    <VisibilityControl {...visibility} />
    {visibility.enabled ? <VStack alignment="leading" spacing={visual.spacing[6]} transition={motionTransition}>
      {showMessages && loading ? <Text font={visual.fontSizes[13]} foregroundStyle={visual.colors.secondaryLabel}>正在加载运行任务…</Text> : null}
      {showMessages && error ? <Text font={visual.fontSizes[13]} foregroundStyle={visual.colors['#b42318']}>{error}{jobs.length ? '（流程图保留上次成功加载的数据）' : ''}</Text> : null}
      {showMessages && !loading && !error && jobs.length === 0 ? <Text font={visual.fontSizes[13]} foregroundStyle={visual.colors.secondaryLabel}>{run.status === 'completed' ? '本次运行暂无任务可展示。' : '暂无任务，等待 GitHub 分配任务。'}</Text> : null}
      {jobs.length > 0 ? <ActionFlowGraph key={run.id} jobs={jobs} status={run.status} conclusion={run.conclusion} preview={preview} /> : null}
    </VStack> : null}
  </VStack>
}

export const previewJobs: Job[] = [{
  id: 1,
  name: '构建与测试',
  status: 'completed',
  conclusion: 'failure',
  started_at: '2026-10-24T10:00:00Z',
  completed_at: '2026-10-24T10:01:00Z',
  steps: [
    { number: 1, name: '检出代码', status: 'completed', conclusion: 'success', started_at: '2026-10-24T10:00:00Z', completed_at: '2026-10-24T10:00:03Z' },
    { number: 2, name: '构建失败', status: 'completed', conclusion: 'failure', started_at: '2026-10-24T10:00:03Z', completed_at: '2026-10-24T10:01:00Z' },
    { number: 3, name: '清理临时构建缓存', status: 'completed', conclusion: 'success', started_at: '2026-10-24T10:01:00Z', completed_at: '2026-10-24T10:01:01Z' },
    { number: 4, name: '发布已跳过', status: 'completed', conclusion: 'skipped', started_at: '', completed_at: null },
  ],
}]

export function RunDetailFlowPreview({ initialEnabled = true, loading = false, error = '', empty = false }: {
  initialEnabled?: boolean
  loading?: boolean
  error?: string
  empty?: boolean
} = {}) {
  return <RunDetailFlow run={{ id: -1, status: 'completed', conclusion: 'failure' }} jobs={empty || loading ? [] : previewJobs} loading={loading} error={error} preview initialEnabled={initialEnabled} />
}
