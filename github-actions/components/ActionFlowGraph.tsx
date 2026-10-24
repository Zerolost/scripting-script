import { VStack, HStack, Text, Button, useState, type Color } from 'scripting'
import { type Job } from '../services/AppModel'
import { visual } from '../visual.config'
import { glassButtonStyle } from '../design/AllPatternDesign'
import { useAccentColor } from '../hooks/useAccentColor'
import { animateChange } from './Motion'
import { ActionFlowMap } from './ActionFlowMap'

export function ActionFlowGraph({ jobs, status, conclusion, preview = false }: { jobs: Job[]; status: string; conclusion?: string | null; preview?: boolean }) {
  const accent: Color = useAccentColor()
  const [playing, setPlaying] = useState<boolean>(true)
  return <VStack alignment="leading" spacing={visual.flow.nodeSpacing} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
    <HStack><Text font={visual.flow.detailFont} foregroundStyle={visual.colors.secondaryLabel}>{preview ? '竖向流程实时预览' : '步骤电路 · 竖向自适应'}</Text><Button title={playing ? '暂停动效' : '播放动效'} action={() => animateChange(() => setPlaying(!playing))} buttonStyle={glassButtonStyle(false)} tint={accent} /></HStack>
    {jobs.length ? <ActionFlowMap jobs={jobs} status={status} conclusion={conclusion} playing={playing} preview={preview} /> : <Text font={visual.flow.detailFont} foregroundStyle={visual.colors.secondaryLabel}>等待 GitHub 分配任务</Text>}
    {visual.flow.showLegend ? <Text font={visual.flow.detailFont} foregroundStyle={visual.colors.secondaryLabel}>绿：成功 · 红：失败 · 灰虚线：跳过。箭头表示步骤顺序，进度条表示已结束占比。动效仅作演示，任务间不表示依赖。</Text> : null}
  </VStack>
}

const exampleJobs: Job[] = [
  { id: 1, name: '构建与测试', status: 'in_progress', conclusion: null, started_at: '', completed_at: null, steps: [
    { number: 1, name: '检出代码', status: 'completed', conclusion: 'success', started_at: '2026-10-24T10:00:00Z', completed_at: '2026-10-24T10:00:03Z' },
    { number: 2, name: '安装依赖', status: 'completed', conclusion: 'success', started_at: '2026-10-24T10:00:03Z', completed_at: '2026-10-24T10:00:28Z' },
    { number: 3, name: '构建应用', status: 'in_progress', conclusion: null, started_at: '', completed_at: null },
    { number: 4, name: '执行测试', status: 'queued', conclusion: null, started_at: '', completed_at: null },
  ] },
  { id: 2, name: '代码检查', status: 'completed', conclusion: 'success', started_at: '', completed_at: null, steps: [
    { number: 1, name: '静态检查', status: 'completed', conclusion: 'success', started_at: '', completed_at: null },
  ] },
]

export function ActionFlowPreview() {
  return <ActionFlowGraph jobs={exampleJobs} status="in_progress" preview />
}
