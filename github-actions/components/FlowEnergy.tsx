import { HStack, VStack, ZStack, Text, Image, Canvas, TimelineCanvas, useMemo, type CanvasRenderingContext, type Color } from 'scripting'
import { type Job, jobStatusIcon, jobStatusInfo } from '../services/AppModel'
import { visual } from '../visual.config'
import { surface } from '../design/AllPatternDesign'
import { useAccentColor } from '../hooks/useAccentColor'
import { flowStatusVisual, type FlowStatusVisual } from '../services/flowStatusVisual'
import { flowOpacity, flowPhase } from '../services/flowMotion'
import { useFlowClock } from '../hooks/useFlowClock'
import { nodeSweep } from '../services/flowSignal'
import { flowEdgePoint } from '../services/flowEdgeTrail'
import type { FlowSegmentGeometry } from '../services/flowGeometry'

export function stepElapsed(state: { started_at?: string | null; completed_at?: string | null }): string {
  if (!state.started_at || !state.completed_at) return ''
  const seconds: number = Math.round((Date.parse(state.completed_at) - Date.parse(state.started_at)) / 1000)
  if (!Number.isFinite(seconds) || seconds < 0) return ''
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

export function drawNodeFocus(ctx: CanvasRenderingContext, x: number, y: number, width: number, height: number, color: Color, opacity: number): void {
  if (!visual.flow.focusBorder || visual.flow.energyStrength <= 0 || opacity <= 0) return
  const left: number = x + 1.5
  const top: number = y + 1.5
  const right: number = x + width - 1.5
  const bottom: number = y + height - 1.5
  const radius: number = 11
  ctx.save()
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.moveTo(left + radius, top)
  ctx.arcTo(right, top, right, bottom, radius)
  ctx.arcTo(right, bottom, left, bottom, radius)
  ctx.arcTo(left, bottom, left, top, radius)
  ctx.arcTo(left, top, right, top, radius)
  ctx.closePath()
  ctx.globalAlpha = opacity * visual.flow.energyStrength * 0.12
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.globalAlpha = opacity * visual.flow.energyStrength * 0.7
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
}

export function drawNodeEnergy(ctx: CanvasRenderingContext, x: number, y: number, width: number, height: number, phase: number, color: Color, phaseOpacity: number = flowOpacity(phase), incoming?: FlowSegmentGeometry): void {
  const strength: number = visual.flow.energyStrength
  if (strength <= 0 || width < 32) return
  ctx.save()
  ctx.lineCap = 'round'
  const path: ReturnType<typeof nodeSweep> = nodeSweep({ x, y, width, offset: 0, phase: 0, opacity: 0 }, incoming, phase)
  const fade: number = phaseOpacity * strength
  const from: { x: number; y: number } = visual.flow.edgeTrail ? flowEdgePoint(x, y, width, height, Math.max(0, phase - 0.28), incoming) : path.from
  const to: { x: number; y: number } = visual.flow.edgeTrail ? flowEdgePoint(x, y, width, height, phase, incoming) : path.to
  const gradient: ReturnType<CanvasRenderingContext['createLinearGradient']> = ctx.createLinearGradient(from.x, from.y, to.x + 0.01, to.y + 0.01)
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, color)
  ctx.strokeStyle = gradient
  ctx.globalAlpha = fade * 0.22
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  if (visual.flow.edgeTrail) {
    const tail: number = Math.max(0, phase - 0.28)
    for (let sample: number = 1; sample <= 10; sample += 1) {
      const point: { x: number; y: number } = flowEdgePoint(x, y, width, height, tail + (phase - tail) * sample / 10, incoming)
      ctx.lineTo(point.x, point.y)
    }
  } else ctx.lineTo(to.x, to.y)
  ctx.stroke()
  ctx.globalAlpha = fade
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()
}

export function FlowRunSummary({ jobs, status, conclusion, playing }: { jobs: Job[]; status: string; conclusion?: string | null; playing: boolean }) {
  const accent: Color = useAccentColor()
  const state: { status: string; conclusion: string | null } = { status, conclusion: conclusion ?? null }
  const icon: { systemName: string; color: Color } = jobStatusIcon(state)
  const info: { text: string; color: Color; backgroundColor: string } = jobStatusInfo(state)
  const appearance: FlowStatusVisual = flowStatusVisual(state)
  const summaryColor: Color = visual.flow.statusColors ? icon.color : accent
  const stats: { completed: number; steps: number; elapsed: string; results: string } = useMemo(() => {
    const completed: number = jobs.filter((job: Job) => job.status === 'completed').length
    const steps: number = jobs.reduce((sum: number, job: Job) => sum + (job.steps?.length ?? 0), 0)
    const starts: number[] = jobs.map((job: Job) => Date.parse(job.started_at)).filter(Number.isFinite)
    const ends: number[] = jobs.map((job: Job) => job.completed_at ? Date.parse(job.completed_at) : NaN).filter(Number.isFinite)
    const elapsed: string = completed === jobs.length && starts.length === jobs.length && ends.length === jobs.length && jobs.length > 0 ? stepElapsed({ started_at: new Date(Math.min(...starts)).toISOString(), completed_at: new Date(Math.max(...ends)).toISOString() }) : ''
    const allSteps: NonNullable<Job['steps']> = jobs.flatMap((job: Job) => job.steps ?? [])
    const success: number = allSteps.filter((step: NonNullable<Job['steps']>[number]) => step.status === 'completed' && step.conclusion === 'success').length
    const failed: number = allSteps.filter((step: NonNullable<Job['steps']>[number]) => flowStatusVisual(step).tone === 'failure').length
    const skipped: number = allSteps.filter((step: NonNullable<Job['steps']>[number]) => step.status === 'completed' && step.conclusion === 'skipped').length
    return { completed, steps, elapsed, results: `成功 ${success} · 失败 ${failed} · 跳过 ${skipped}` }
  }, [jobs])
  const { completed, steps, elapsed, results } = stats
  const active: boolean = playing && visual.flow.animate && visual.animation.enabled
  const clock: (time: number) => number = useFlowClock(active && appearance.motion !== 'none')
  return <HStack spacing={12} padding={12} frame={{ maxWidth: 'infinity' }} {...surface('clear', { type: 'rect', cornerRadius: 18 })}>
    <ZStack frame={{ width: 72, height: 72 }}>
      <Canvas opaque={false} frame={{ width: 72, height: 72 }} accessibilityHidden draw={(ctx: CanvasRenderingContext): void => {
        ctx.lineCap = 'round'
        ctx.strokeStyle = accent
        ctx.lineWidth = 2.5
        ctx.globalAlpha = 0.15
        ctx.beginPath()
        ctx.arc(36, 36, 27, 0, Math.PI * 2)
        ctx.stroke()
        if (completed > 0) {
          ctx.strokeStyle = icon.color
          ctx.globalAlpha = 0.7
          ctx.beginPath()
          ctx.arc(36, 36, 27, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * completed / jobs.length)
          ctx.stroke()
        }
      }} />
      <TimelineCanvas opaque={false} paused={!active || appearance.motion === 'none' || visual.flow.energyStrength <= 0} schedule={{ minimumInterval: 1 / 30 }} frame={{ width: 72, height: 72 }} accessibilityHidden draw={(ctx: CanvasRenderingContext, _size: { width: number; height: number }, time: number): void => {
        const elapsed: number = clock(time)
        if (visual.flow.animate && visual.animation.enabled && appearance.motion !== 'none' && visual.flow.energyStrength > 0) {
          ctx.lineCap = 'round'
          const angle: number = flowPhase(elapsed, visual.flow.cycleDuration * 3) * Math.PI * 2
          ctx.strokeStyle = summaryColor
          ctx.lineWidth = visual.flow.quietSummary ? 1 : 1.5
          ctx.globalAlpha = visual.flow.energyStrength * (visual.flow.quietSummary ? Math.sin(angle / 2) ** 2 * 0.35 : appearance.motion === 'pulse' ? 0.3 + Math.sin(angle / 2) ** 2 * 0.7 : 1)
          ctx.beginPath()
          ctx.arc(36, 36, visual.flow.quietSummary ? 31 : 34, visual.flow.quietSummary || appearance.motion === 'pulse' ? 0 : angle, visual.flow.quietSummary || appearance.motion === 'pulse' ? Math.PI * 2 : angle + Math.PI * 0.45)
          ctx.stroke()
        }
      }} />
      <VStack spacing={0}>
        <Text font={visual.flow.titleFont + 6} fontWeight={visual.typography.semibold} foregroundStyle={visual.colors.label}>{`${completed}/${jobs.length}`}</Text>
        <Text font={visual.flow.detailFont * 0.75} foregroundStyle={visual.colors.secondaryLabel}>任务结束</Text>
      </VStack>
    </ZStack>
    <VStack alignment="leading" spacing={5} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
      <Text font={visual.flow.detailFont} foregroundStyle={accent}>运行汇总</Text>
      <HStack spacing={5}>
        <Image systemName={icon.systemName} font={visual.flow.iconSize} foregroundStyle={icon.color} />
        <Text font={visual.flow.titleFont + 2} fontWeight={visual.typography.semibold} foregroundStyle={icon.color}>{info.text}</Text>
      </HStack>
      <Text font={visual.flow.detailFont} foregroundStyle={visual.colors.label}>{results}</Text>
      <Text font={visual.flow.detailFont} foregroundStyle={visual.colors.secondaryLabel}>{`${steps} 个步骤${visual.flow.showTiming && elapsed ? ` · 耗时 ${elapsed}` : ''}`}</Text>
    </VStack>
  </HStack>
}
