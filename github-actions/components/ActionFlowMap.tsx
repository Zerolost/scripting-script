import { VStack, HStack, ZStack, Text, Image, Canvas, TimelineCanvas, useMemo, useRef, type Color, type CanvasRenderingContext } from 'scripting'
import { type Job, type JobStep, jobStatusIcon } from '../services/AppModel'
import { visual } from '../visual.config'
import { FlowNodeCard } from './FlowNodeCard'
import { createTransferPlan, transferFrame, advanceTransferPlayback, dockedSignal, type TransferPlan, type TransferPlayback } from '../services/flowTransfer'
import { useFlowClock } from '../hooks/useFlowClock'
import { useAccentColor } from '../hooks/useAccentColor'
import { signalPosition, arrivalPulse } from '../services/flowSignal'
import { flowArrival, type FlowArrival } from '../services/flowArrival'
import { flowOpacity, flowPhase } from '../services/flowMotion'
import { drawNodeEnergy, drawNodeFocus, FlowRunSummary } from './FlowEnergy'
import { flowStatusVisual, type FlowStatusVisual } from '../services/flowStatusVisual'
import { getFlowGeometry, flowNodeHeight as nodeHeight, flowRowGap as rowGap, type FlowGeometry, type FlowNodeGeometry, type FlowSegmentGeometry } from '../services/flowGeometry'

function statusColor(appearance: FlowStatusVisual, accent: Color): Color {
  if (!visual.flow.statusColors || appearance.tone === 'running') return accent
  if (appearance.tone === 'success') return visual.colors['#34c759']
  if (appearance.tone === 'failure') return visual.colors['#ff3b30']
  return visual.colors.secondaryLabel
}

type FlowState = { status: string; conclusion: string | null; started_at?: string | null; completed_at?: string | null }

function drawSegment(ctx: CanvasRenderingContext, segment: FlowSegmentGeometry, phase: number, phaseOpacity: number, count: number): void {
  const arrival: number = Math.max(0.45, Math.min(0.8, visual.flow.arrivalStart))
  const settle: number = (1 / arrival - 1) * 0.4
  const spacing: number = visual.flow.dockTransfer ? Math.min(0.045, settle / Math.max(1, count - 1)) : 0.045
  for (let pass: number = 0; pass < 2; pass += 1) {
    ctx.globalAlpha = phaseOpacity * (pass === 0 ? visual.flow.glowStrength * 0.24 : 0.9)
    ctx.beginPath()
    let visible: boolean = false
    for (let index: number = count - 1; index >= 0; index -= 1) {
      const progress: number = phase - index * spacing
      const signal: ReturnType<typeof dockedSignal> = dockedSignal(progress, visual.flow.smoothTravel, settle)
      const position: number = visual.flow.dockTransfer ? signal.position : visual.flow.smoothTravel ? signalPosition(progress) : progress
      const fade: number = (visual.flow.dockTransfer ? signal.opacity : flowOpacity(position)) * (1 - index / count)
      if (fade <= 0) continue
      const x: number = segment.from.x + segment.dx * position
      const y: number = segment.from.y + segment.dy * position
      const radius: number = (pass === 0 ? 5 - index * 0.15 : index === 0 ? 2.2 : 1.3) * Math.sqrt(fade)
      ctx.moveTo(x + radius, y)
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      visible = true
    }
    if (visible) ctx.fill()
  }
}

function CompactLane({ job, playing, lane }: { job: Job; playing: boolean; lane: number }) {
  const accent: Color = useAccentColor()
  const layout: { steps: JobStep[]; rows: JobStep[][]; completed: number } = useMemo(() => {
    const steps: JobStep[] = job.steps ?? []
    const rows: JobStep[][] = []
    for (let index: number = 0; index < steps.length; index += 2) {
      const row: JobStep[] = steps.slice(index, index + 2)
      rows.push(index % 4 === 0 ? row : row.reverse())
    }
    return { steps, rows, completed: steps.filter((step: JobStep) => step.status === 'completed').length }
  }, [job.steps])
  const { steps, rows, completed } = layout
  const states: FlowState[] = steps.length ? steps : [job]
  const styles: { appearance: FlowStatusVisual; color: Color }[] = states.map((state: FlowState) => {
    const appearance: FlowStatusVisual = flowStatusVisual(state)
    return { appearance, color: statusColor(appearance, accent) }
  })
  const motionKey: string = styles.map((style: { appearance: FlowStatusVisual; color: Color }): string => style.appearance.motion).join('|')
  const transfer: TransferPlan = useMemo((): TransferPlan => createTransferPlan(styles.map((style: { appearance: FlowStatusVisual; color: Color }): boolean => style.appearance.motion !== 'none'), visual.flow.cycleDuration, visual.flow.compactQuietSteps), [motionKey, visual.flow.cycleDuration, visual.flow.compactQuietSteps])
  const playback = useRef<TransferPlayback | null>(null)
  const geometry = useRef<FlowGeometry | null>(null)
  const resolveGeometry = (width: number, height: number): FlowGeometry => {
    const cached: FlowGeometry = getFlowGeometry(geometry.current, width, height, Math.max(1, steps.length), lane)
    geometry.current = cached
    return cached
  }
  const icon: { systemName: string; color: Color } = jobStatusIcon(job)
  const active: boolean = playing && visual.flow.animate && visual.animation.enabled && styles.some((style: { appearance: FlowStatusVisual; color: Color }) => style.appearance.motion !== 'none')
  const clock: (time: number) => number = useFlowClock(active)
  const height: number = Math.max(1, rows.length) * (nodeHeight + rowGap) - rowGap
  return <VStack alignment="leading" spacing={10} padding={{ vertical: 8 }} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
    <HStack spacing={7}>
      <Image systemName="cpu" foregroundStyle={accent} font={visual.flow.iconSize} />
      <Text font={visual.flow.titleFont} fontWeight={visual.typography.semibold} foregroundStyle={visual.colors.label} frame={{ maxWidth: 'infinity', alignment: 'leading' }} lineLimit={2}>{job.name}</Text>
      <Image systemName={icon.systemName} foregroundStyle={icon.color} font={visual.flow.detailFont} />
      <Text font={visual.flow.detailFont} foregroundStyle={visual.colors.secondaryLabel}>{`${completed}/${steps.length}`}</Text>
    </HStack>
    <Canvas opaque={false} frame={{ maxWidth: 'infinity', height: 2 }} accessibilityHidden draw={(ctx: CanvasRenderingContext, size: { width: number; height: number }): void => {
      ctx.fillStyle = accent
      ctx.globalAlpha = 0.12
      ctx.fillRect(0, 0, size.width, 2)
      ctx.globalAlpha = 0.65
      ctx.fillRect(0, 0, size.width * (steps.length ? completed / steps.length : job.status === 'completed' ? 1 : 0), 2)
    }} />
    <ZStack alignment="topLeading" frame={{ maxWidth: 'infinity', minHeight: height, maxHeight: height }}>
      {visual.flow.showGrid ? <Canvas opaque={false} frame={{ maxWidth: 'infinity', minHeight: height, maxHeight: height }} allowsHitTesting={false} accessibilityHidden draw={(ctx: CanvasRenderingContext, size: { width: number; height: number }): void => {
        ctx.fillStyle = accent
        ctx.globalAlpha = 0.055
        for (let x: number = 8; x < size.width; x += 24) {
          for (let y: number = 6; y < size.height; y += 24) {
            ctx.fillRect(x, y, 1, 1)
          }
        }
      }} /> : null}
      <VStack spacing={rowGap} frame={{ maxWidth: 'infinity' }}>
        {rows.length ? rows.map((row: JobStep[], index: number) => <HStack key={index} spacing={rowGap} frame={{ maxWidth: 'infinity' }}>
          {row.length === 1 && index % 2 === 1 ? <VStack frame={{ maxWidth: 'infinity', minHeight: nodeHeight }} /> : null}
          {row.map((step: JobStep) => <FlowNodeCard key={step.number} title={step.name} number={step.number} state={step} />)}
          {row.length === 1 && steps.length > 1 && index % 2 === 0 ? <VStack frame={{ maxWidth: 'infinity', minHeight: nodeHeight }} /> : null}
        </HStack>) : <FlowNodeCard title={job.name} state={job} />}
      </VStack>
      <Canvas opaque={false} frame={{ maxWidth: 'infinity', minHeight: height, maxHeight: height }} allowsHitTesting={false} accessibilityHidden draw={(ctx: CanvasRenderingContext, size: { width: number; height: number }): void => {
        ctx.strokeStyle = accent
        ctx.fillStyle = accent
        ctx.lineWidth = visual.flow.lineWidth
        const cached: FlowGeometry = resolveGeometry(size.width, size.height)
        for (const segment of cached.segments) {
          const style: { appearance: FlowStatusVisual; color: Color } = styles[segment.nodeIndex]
          ctx.strokeStyle = style.color
          ctx.fillStyle = style.color
          ctx.lineWidth = visual.flow.lineWidth
          ctx.lineCap = 'round'
          ctx.setLineDash(style.appearance.dashed ? [3, 4] : [])
          ctx.globalAlpha = style.appearance.dashed ? 0.22 : 0.28
          ctx.beginPath()
          ctx.moveTo(segment.from.x, segment.from.y)
          ctx.lineTo(segment.to.x, segment.to.y)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.beginPath()
          ctx.arc(segment.to.x, segment.to.y, 2.2, 0, Math.PI * 2)
          ctx.fill()
          if (visual.flow.showDirection) {
            const length: number = Math.hypot(segment.dx, segment.dy) || 1
            const ux: number = segment.dx / length
            const uy: number = segment.dy / length
            const x: number = segment.from.x + segment.dx * 0.55
            const y: number = segment.from.y + segment.dy * 0.55
            ctx.globalAlpha = 0.45
            ctx.lineWidth = 1.2
            ctx.beginPath()
            ctx.moveTo(x - ux * 3 - uy * 2.5, y - uy * 3 + ux * 2.5)
            ctx.lineTo(x, y)
            ctx.lineTo(x - ux * 3 + uy * 2.5, y - uy * 3 - ux * 2.5)
            ctx.stroke()
          }
        }
        for (let index: number = 0; index < cached.nodes.length; index += 1) {
          const node: FlowNodeGeometry = cached.nodes[index]
          const style: { appearance: FlowStatusVisual; color: Color } = styles[index]
          ctx.strokeStyle = style.color
          if (style.appearance.tone === 'failure') {
            ctx.globalAlpha = 0.7
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(node.x + 12, node.y + 2)
            ctx.lineTo(node.x + 32, node.y + 2)
            ctx.stroke()
          }
        }
      }} />
      <TimelineCanvas opaque={false} paused={!active} schedule={{ minimumInterval: 1 / 30 }} frame={{ maxWidth: 'infinity', minHeight: height, maxHeight: height }} allowsHitTesting={false} accessibilityHidden draw={(ctx: CanvasRenderingContext, size: { width: number; height: number }, time: number): void => {
        const elapsed: number = clock(time)
        if (!visual.flow.animate || !visual.animation.enabled) return
        const cached: FlowGeometry = resolveGeometry(size.width, size.height)
        const current: TransferPlayback = advanceTransferPlayback(playback.current, transfer, elapsed)
        playback.current = current
        const frame: ReturnType<typeof transferFrame> = transferFrame(current.plan, elapsed - current.origin, visual.flow.arrivalStart)
        for (let index: number = 0; index < cached.nodes.length; index += 1) {
          const node: FlowNodeGeometry = cached.nodes[index]
          const style: { appearance: FlowStatusVisual; color: Color } = styles[index]
          node.phase = visual.flow.relayMotion ? frame.index === index ? frame.phase : -1 : flowPhase(elapsed, visual.flow.cycleDuration, node.offset)
          node.opacity = 0
          if (node.phase < 0) continue
          const timing: FlowArrival = flowArrival(node.phase, visual.flow.arrivalStart)
          node.opacity = timing.arrival
          const incoming: FlowSegmentGeometry | undefined = index > 0 ? cached.segments[index - 1] : undefined
          if (style.appearance.motion === 'travel' && timing.arrival > 0) drawNodeEnergy(ctx, node.x, node.y, node.width, nodeHeight, timing.sweep, style.color, timing.arrival, incoming)
          if (style.appearance.motion !== 'none' && timing.arrival > 0 && visual.flow.energyStrength > 0) {
            drawNodeFocus(ctx, node.x, node.y, node.width, nodeHeight, style.color, timing.arrival)
            const x: number = incoming?.to.x ?? node.x + 14
            const y: number = incoming?.to.y ?? node.y + 2
            const pulses: number = style.appearance.motion === 'pulse' && visual.flow.failureEcho ? 2 : 1
            ctx.strokeStyle = style.color
            ctx.lineWidth = style.appearance.motion === 'pulse' ? 1.8 : 1.1
            for (let pulse: number = 0; pulse < pulses; pulse += 1) {
              const opacity: number = pulses === 2 ? arrivalPulse(timing.sweep, pulse === 1) : timing.arrival
              if (opacity <= 0) continue
              const progress: number = pulse === 1 ? Math.max(0, (timing.sweep - 0.36) / 0.64) : timing.sweep
              ctx.globalAlpha = opacity * visual.flow.energyStrength * (pulse === 1 ? 0.65 : 1)
              ctx.beginPath()
              ctx.arc(x, y, 2 + progress * 7, 0, Math.PI * 2)
              ctx.stroke()
            }
          }
        }
        ctx.fillStyle = accent
        ctx.lineCap = 'round'
        const trailCount: number = Math.round(visual.flow.trailLength)
        for (const segment of cached.segments) {
          const node: FlowNodeGeometry = cached.nodes[segment.nodeIndex]
          const style: { appearance: FlowStatusVisual; color: Color } = styles[segment.nodeIndex]
          if (style.appearance.motion === 'none' || node.phase < 0) continue
          const timing: FlowArrival = flowArrival(node.phase, visual.flow.arrivalStart)
          ctx.fillStyle = style.color
          if (timing.travel >= 0) drawSegment(ctx, segment, timing.travel, visual.flow.dockTransfer ? 1 : timing.travel <= 1 ? Math.min(1, timing.travel / 0.2) : Math.max(0, 1 - (timing.travel - 1) / 0.22), trailCount)
        }
      }} />
    </ZStack>
  </VStack>
}

export function ActionFlowMap({ jobs, status, conclusion, playing }: { jobs: Job[]; status: string; conclusion?: string | null; playing: boolean; preview?: boolean }) {
  return <VStack alignment="leading" spacing={visual.flow.nodeSpacing} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
    {jobs.map((job: Job, index: number) => <CompactLane key={job.id} job={job} playing={playing} lane={index} />)}
    <FlowRunSummary jobs={jobs} status={status} conclusion={conclusion} playing={playing} />
  </VStack>
}
