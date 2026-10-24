import { VStack, HStack, Text, Image, Spacer } from 'scripting'
import type { Color, VirtualNode } from 'scripting'
import type { WidgetLayoutPlan, WidgetLayout } from '../services/widgetLayout'
import { surface, liquidGlassAvailable } from '../design/AllPatternDesign'
import { visual } from '../visual.config'
import { timeAgo, runStatusText, type WidgetTarget, type RunLite } from '../services/widgetGitHub'

export interface TargetData {
  target: WidgetTarget
  workflowName?: string
  runs?: RunLite[]
  nextRun?: Date | null
  error?: string
}

export interface WidgetData {
  ok: boolean
  state?: 'signedOut' | 'empty'
  error?: string
  items?: TargetData[]
}

export type WidgetContentProps = {
  data: WidgetData
  plan: WidgetLayoutPlan
  preview?: boolean
  renderRunButton?: (target: WidgetTarget, content: VirtualNode) => VirtualNode
}

function statusMeta(run: RunLite): { icon: string; color: Color } {
  if (run.status === 'completed') {
    return run.conclusion === 'success'
      ? { icon: visual.icons['checkmark.circle.fill'], color: visual.colors['#34C759'] }
      : { icon: visual.icons['xmark.circle.fill'], color: visual.colors['#FF3B30'] }
  }
  return run.status === 'in_progress'
    ? { icon: visual.icons['arrow.triangle.2.circlepath'], color: visual.colors['#0A84FF'] }
    : { icon: visual.icons['clock.fill'], color: visual.colors['#FF9F0A'] }
}

function formatNext(date: Date): string {
  const now: Date = new Date()
  const tomorrow: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const time: string = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  const day: string = date.toDateString() === now.toDateString() ? '今天' : date.toDateString() === tomorrow.toDateString() ? '明天' : `${date.getMonth() + 1}月${date.getDate()}日`
  return `${day} ${time}`
}

function RunPill({ layout, preview }: { layout: WidgetLayout; preview: boolean }): VirtualNode {
  return (
    <HStack {...surface(visual.glass.widget, 'capsule', !preview, visual.widget.runColor)}>
      <Image systemName={visual.icons['play.fill']} font={layout.runIcon} tint={liquidGlassAvailable ? visual.colors['#FFFFFF'] : visual.widget.runColor} padding={{ horizontal: layout.runPad.horizontal, vertical: layout.runPad.vertical }} />
    </HStack>
  )
}

function HistoryRow({ run, layout, latest = false }: { run: RunLite; layout: WidgetLayout; latest?: boolean }): VirtualNode {
  const meta: ReturnType<typeof statusMeta> = statusMeta(run)
  return (
    <HStack spacing={layout.rowSpacing}>
      <Image systemName={meta.icon} font={layout.runIcon} tint={meta.color} padding={4} />
      <Text font={latest ? layout.bodyFont : layout.historyFont} lineLimit={1}>{latest ? runStatusText(run) : `#${run.run_number} ${runStatusText(run)}`}</Text>
      <Spacer />
      <Text font="caption2" foregroundStyle={visual.colors.secondaryLabel} lineLimit={1}>{timeAgo(run.created_at)}</Text>
    </HStack>
  )
}

export function WidgetContent({ data, plan, preview = false, renderRunButton }: WidgetContentProps): VirtualNode {
  const layout: WidgetLayout = plan.layout
  const items: TargetData[] = (data.items ?? []).slice(0, plan.itemCount)
  const moreCount: number = (data.items?.length ?? 0) - items.length
  if (!data.ok || items.length === 0) {
    const signedOut: boolean = data.state === 'signedOut' || data.error === '未登录'
    const message: string = signedOut ? '尚未登录 GitHub' : data.error || '尚未选择工作流'
    const guidance: string = signedOut
      ? '打开脚本登录 GitHub，再到「小组件设置」点选工作流'
      : '打开脚本 →「小组件设置」点选工作流，即选即用'
    return (
      <VStack alignment="leading" spacing={6} padding={12}>
        <HStack spacing={6}>
          <Image systemName={visual.icons['exclamationmark.triangle.fill']} font={13} tint={visual.colors['#FF9F0A']} />
          <Text font="caption" fontWeight={visual.typography.bold}>{visual.widget.title}</Text>
        </HStack>
        <Text font="footnote">{message}</Text>
        <Text font="caption2" foregroundStyle={visual.colors.secondaryLabel}>{guidance}</Text>
      </VStack>
    )
  }
  return (
    <VStack alignment="leading" spacing={layout.outerSpacing} padding={layout.outerPad} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
      <HStack spacing={layout.rowSpacing}>
        <Image systemName={visual.icons['bolt.heart.fill']} font={layout.headerIcon} tint={visual.colors['#FF9F0A']} />
        <Text font={layout.titleFont} fontWeight={visual.typography.bold} lineLimit={1}>{visual.widget.title}</Text>
        <Spacer />
        {!plan.isSmall && moreCount > 0 ? <Text font="caption2" foregroundStyle={visual.colors.secondaryLabel}>+{moreCount} 更多</Text> : null}
      </HStack>
      <HStack alignment="top" spacing={layout.outerSpacing} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
        {Array.from({ length: Math.min(plan.columns, items.length) }, (_: unknown, column: number): VirtualNode => {
          const columnItems: TargetData[] = items.slice(column * plan.rows, (column + 1) * plan.rows)
          return (
            <VStack key={column} alignment="leading" spacing={layout.outerSpacing} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
              {columnItems.map((item: TargetData, index: number): VirtualNode => {
                const runs: RunLite[] = item.runs ?? []
                const latest: RunLite | undefined = runs[0]
                const meta: ReturnType<typeof statusMeta> | null = latest ? statusMeta(latest) : null
                const pill: VirtualNode = <RunPill layout={layout} preview={preview} />
                return (
                  <VStack key={index} alignment="leading" spacing={layout.itemSpacing}>
                    <HStack spacing={layout.rowSpacing}>
                      <Text font={layout.titleFont} fontWeight={visual.typography.bold} lineLimit={plan.isLarge ? 1 : visual.lineLimits[plan.titleLineLimit]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>{item.workflowName || `${item.target.owner}/${item.target.repo}`}</Text>
                      {plan.compact && meta ? <Image systemName={meta.icon} font={layout.runIcon} tint={meta.color} /> : null}
                      {!item.error ? (preview || !renderRunButton ? pill : renderRunButton(item.target, pill)) : null}
                    </HStack>
                    {item.error ? <Text font="caption2" foregroundStyle={visual.colors.secondaryLabel} lineLimit={1}>{item.error}</Text> : (
                      <>
                        {!plan.compact ? (latest ? <HistoryRow run={latest} layout={layout} latest /> : <Text font="caption2" foregroundStyle={visual.colors.secondaryLabel}>暂无运行记录</Text>) : null}
                        {plan.showNext && item.nextRun ? (
                          <HStack spacing={layout.rowSpacing}>
                            <Image systemName={visual.icons.calendar} font={layout.runIcon} tint={visual.colors['#0A84FF']} padding={4} />
                            <Text font={layout.bodyFont} lineLimit={1}>下次 {formatNext(item.nextRun)}</Text>
                          </HStack>
                        ) : null}
                        {runs.slice(0, plan.historyCount).map((run: RunLite): VirtualNode => <HistoryRow key={run.id} run={run} layout={layout} />)}
                      </>
                    )}
                    {index < columnItems.length - 1 ? <HStack frame={{ maxWidth: 'infinity', minHeight: 1, maxHeight: 1 }} background={visual.colors['rgba(120,120,128,0.24)']} /> : null}
                  </VStack>
                )
              })}
            </VStack>
          )
        })}
      </HStack>
    </VStack>
  )
}
