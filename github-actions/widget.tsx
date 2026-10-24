import { VStack, HStack, Text, Image, Button, Spacer, Widget } from "scripting"
import type { Color } from "scripting"
import { surface, liquidGlassAvailable } from './design/AllPatternDesign'
import { visual } from './visual.config'
import { RunWorkflowIntent } from "./app_intents"
import { glassTokens } from './design/glassTokens'
import {
  WidgetTarget, RunLite,
  getStoredAuth, getWidgetTargets, parseTarget, fetchWorkflowInfo, fetchCron, fetchLatestRuns,
  nextCronRun, timeAgo, runStatusText,
} from "./services/widgetGitHub"

interface TargetData {
  target: WidgetTarget
  workflowName?: string
  runs?: RunLite[]
  nextRun?: Date | null
  error?: string
}

interface WidgetData {
  ok: boolean
  error?: string
  items?: TargetData[]
}

async function loadTarget(param: string, token: string): Promise<TargetData> {
  const { owner, repo, workflowRef } = parseTarget(param)
  const base = { target: { owner, repo, branch: '' } as WidgetTarget }
  if (!owner || !repo) return { ...base, error: '格式应为 owner/repo/工作流ID' }
  try {
    const { branch, workflow } = await fetchWorkflowInfo(owner, repo, token, workflowRef)
    if (!workflow) return { ...base, error: '未找到工作流' }
    const [runs, cronExpr] = await Promise.all([
      fetchLatestRuns(owner, repo, workflow.id, token),
      fetchCron(owner, repo, branch, workflow.path, token),
    ])
    const nextRun = cronExpr ? nextCronRun(cronExpr) : null
    return {
      target: { owner, repo, workflowId: workflow.id, branch },
      workflowName: workflow.name,
      runs,
      nextRun,
    }
  } catch (_) {
    return { ...base, error: '请求失败' }
  }
}

async function loadData(): Promise<WidgetData> {
  const auth = getStoredAuth()
  if (!auth) return { ok: false, error: '未登录' }

  const param = Widget.parameter || ''
  let targets: string[]
  if (param) {
    targets = [param]
  } else {
    targets = getWidgetTargets()
  }
  if (targets.length === 0) return { ok: false, error: '未指定仓库' }

  const last = Storage.get<string>('widget_last_target')
  if (last) {
    const idx = targets.indexOf(last)
    if (idx > 0) {
      targets = targets.slice()
      targets.splice(idx, 1)
      targets.unshift(last)
    }
  }

  const items = await Promise.all(targets.slice(0, 8).map(t => loadTarget(t, auth.token)))
  return { ok: true, items }
}

function statusMeta(run: RunLite): { icon: string; color: Color } {
  if (run.status === 'completed') {
    if (run.conclusion === 'success') return { icon: visual.icons['checkmark.circle.fill'], color: visual.colors['#34C759'] }
    return { icon: visual.icons['xmark.circle.fill'], color: visual.colors['#FF3B30'] }
  }
  if (run.status === 'in_progress') return { icon: visual.icons['arrow.triangle.2.circlepath'], color: visual.colors['#0A84FF'] }
  return { icon: visual.icons['clock.fill'], color: visual.colors['#FF9F0A'] }
}

function formatNext(d: Date): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  if (sameDay) return `今天 ${hm}`
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const isTomorrow = d.getFullYear() === tomorrow.getFullYear() && d.getMonth() === tomorrow.getMonth() && d.getDate() === tomorrow.getDate()
  if (isTomorrow) return `明天 ${hm}`
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`
}

function WidgetView({ data }: { data: WidgetData }) {
  const isSmall = Widget.family === 'systemSmall'
  const isLarge = Widget.family === 'systemLarge'
  const layout = isSmall ? visual.widget.small : isLarge ? visual.widget.large : visual.widget.medium
  const {
    outerPad, outerSpacing, itemSpacing, rowSpacing, headerIcon,
    titleFont, bodyFont, historyFont, runIcon, runPad,
  }: typeof layout = layout
  const runColor: Color = visual.widget.runColor
  const totalCount = (data.items || []).length
  const maxItems = isLarge ? totalCount : 1
  const historyCount: number = isLarge
    ? (totalCount <= 2 ? visual.widget.history.largeFew : totalCount === 3 ? visual.widget.history.largeThree : visual.widget.history.largeMany)
    : visual.widget.history.compact

  if (!data.ok) {
    return (
      <VStack alignment="leading" spacing={visual.spacing[6]} padding={visual.spacing[12]}>
        <HStack spacing={visual.spacing[6]}>
          <Image systemName={visual.icons['exclamationmark.triangle.fill']} font={visual.fontSizes[13]} tint={visual.colors['#FF9F0A']} />
          <Text font="caption" fontWeight={visual.typography.bold}>{visual.widget.title}</Text>
        </HStack>
        <Text font="footnote">{data.error || ''}</Text>
        <Text font="caption2" foregroundStyle={visual.colors.secondaryLabel}>长按小组件 → 编辑 → Parameter 填 owner/repo</Text>
      </VStack>
    )
  }

  const items = (data.items || []).slice(0, maxItems)
  const moreCount = (data.items || []).length - items.length
  const showHistory: boolean = visual.widget.showHistory
  const showNext: boolean = visual.widget.showNext && (!isLarge || totalCount <= visual.widget.nextVisibleMaxLargeTargets)

  return (
    <VStack alignment="leading" spacing={outerSpacing} padding={outerPad} {...surface(visual.glass.widget, glassTokens.cardShape)}>
      <HStack spacing={rowSpacing}>
        <Image systemName={visual.icons['bolt.heart.fill']} font={headerIcon} tint={visual.colors['#FF9F0A']} />
        <Text font={titleFont} fontWeight={visual.typography.bold} lineLimit={visual.lineLimits[1]}>{visual.widget.title}</Text>
        <Spacer />
        {!isSmall && moreCount > 0 ? (
          <Text font="caption2" foregroundStyle={visual.colors.secondaryLabel}>+{moreCount} 更多</Text>
        ) : null}
      </HStack>

      {items.map((item, idx) => {
        const target = item.target
        const workflowName = item.workflowName || `${target.owner}/${target.repo}`
        const runs = item.runs || []
        const latest = runs[0]
        const latestMeta = latest ? statusMeta(latest) : null
        return (
          <VStack key={idx} alignment="leading" spacing={itemSpacing}>
            <HStack spacing={rowSpacing}>
              <Text font={titleFont} fontWeight={visual.typography.bold} lineLimit={isLarge ? visual.lineLimits[1] : visual.lineLimits[2]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>{workflowName}</Text>
              {!item.error ? (
                <Button intent={RunWorkflowIntent(JSON.stringify(target))} buttonStyle="plain">
                  <HStack {...surface('regular', glassTokens.pillShape, true, runColor)}>
                    <Image systemName={visual.icons['play.fill']} font={runIcon} tint={liquidGlassAvailable ? visual.colors['#FFFFFF'] : runColor} padding={{ horizontal: visual.spacing[runPad.horizontal], vertical: visual.spacing[runPad.vertical] }} />
                  </HStack>
                </Button>
              ) : null}
            </HStack>

            {item.error ? (
              <Text font="caption2" foregroundStyle={visual.colors.secondaryLabel}>{item.error}</Text>
            ) : (
              <>
                {latest && latestMeta ? (
                  <HStack spacing={rowSpacing}>
                    <Image systemName={latestMeta.icon} font={runIcon} tint={latestMeta.color} padding={visual.spacing[4]} />
                    <Text font={bodyFont} lineLimit={visual.lineLimits[1]}>{runStatusText(latest)}</Text>
                    <Spacer />
                    <Text font="caption2" foregroundStyle={visual.colors.secondaryLabel} lineLimit={visual.lineLimits[1]}>{timeAgo(latest.created_at)}</Text>
                  </HStack>
                ) : (
                  <Text font="caption2" foregroundStyle={visual.colors.secondaryLabel}>暂无运行记录</Text>
                )}
                {item.nextRun && showNext ? (
                  <HStack spacing={rowSpacing}>
                    <Image systemName={visual.icons.calendar} font={runIcon} tint={visual.colors['#0A84FF']} padding={visual.spacing[4]} />
                    <Text font={bodyFont} lineLimit={visual.lineLimits[1]}>下次 {formatNext(item.nextRun)}</Text>
                  </HStack>
                ) : null}
                {showHistory && runs.slice(0, historyCount).map((r) => {
                  const meta = statusMeta(r)
                  return (
                    <HStack key={r.id} spacing={rowSpacing}>
                      <Image systemName={meta.icon} font={runIcon} tint={meta.color} padding={visual.spacing[4]} />
                      <Text font={historyFont} lineLimit={visual.lineLimits[1]}>#{r.run_number} {runStatusText(r)}</Text>
                      <Spacer />
                      <Text font="caption2" foregroundStyle={visual.colors.secondaryLabel} lineLimit={visual.lineLimits[1]}>{timeAgo(r.created_at)}</Text>
                    </HStack>
                  )
                })}
              </>
            )}
            {idx < items.length - 1 ? (
              <HStack frame={{ maxWidth: 'infinity', minHeight: visual.sizes[1], maxHeight: visual.sizes[1] }} background={visual.colors['rgba(120,120,128,0.24)']} />
            ) : null}
          </VStack>
        )
      })}
    </VStack>
  )
}

loadData().then((data) => {
  Widget.present(<WidgetView data={data} />, {
    reloadPolicy: {
      policy: "after",
      date: new Date(Date.now() + 1000 * 60 * 10)
    }
  })
})
