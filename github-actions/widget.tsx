import { Widget, Button } from 'scripting'
import type { VirtualNode } from 'scripting'
import { visual } from './visual.config'
import { RunWorkflowIntent } from './app_intents'
import { WidgetContent, type WidgetData, type TargetData } from './components/WidgetContent'
import { getActionPreferences } from './services/actionPreferences'
import { resolveWidgetLayout, type WidgetLayoutPlan } from './services/widgetLayout'
import {
  type WidgetTarget,
  getStoredAuth, getWidgetTargets, parseTarget, fetchWorkflowInfo, fetchCron, fetchLatestRuns,
  nextCronRun,
} from './services/widgetGitHub'

async function loadTarget(target: string, token: string): Promise<TargetData> {
  const { owner, repo, workflowRef }: ReturnType<typeof parseTarget> = parseTarget(target)
  const base: { target: WidgetTarget } = { target: { owner, repo, branch: '' } }
  if (!owner || !repo) return { ...base, error: '已保存的工作流无效，请在脚本设置中重新点选' }
  try {
    const { branch, workflow }: Awaited<ReturnType<typeof fetchWorkflowInfo>> = await fetchWorkflowInfo(owner, repo, token, workflowRef)
    if (!workflow) return { ...base, error: '未找到工作流' }
    const [runs, cronExpr]: [Awaited<ReturnType<typeof fetchLatestRuns>>, string | null] = await Promise.all([
      fetchLatestRuns(owner, repo, workflow.id, token),
      fetchCron(owner, repo, branch, workflow.path, token),
    ])
    const nextRun: Date | null = cronExpr ? nextCronRun(cronExpr) : null
    return { target: { owner, repo, workflowId: workflow.id, branch }, workflowName: workflow.name, runs, nextRun }
  } catch (_) {
    return { ...base, error: '请求失败' }
  }
}

async function loadData(): Promise<WidgetData> {
  const auth: ReturnType<typeof getStoredAuth> = getStoredAuth()
  if (!auth) return { ok: false, state: 'signedOut', error: '尚未登录 GitHub' }
  let targets: string[]
  try {
    targets = getWidgetTargets()
  } catch (error: unknown) {
    return { ok: false, error: error instanceof Error ? error.message : '读取小组件设置失败，请稍后重试' }
  }
  if (targets.length === 0) return { ok: false, state: 'empty', error: '尚未选择工作流' }
  const last: string | null = Storage.get<string>('widget_last_target')
  if (getActionPreferences().widgetOrder !== 'selection' && last) {
    const idx: number = targets.indexOf(last)
    if (idx > 0) {
      targets = targets.slice()
      targets.splice(idx, 1)
      targets.unshift(last)
    }
  }
  const items: TargetData[] = await Promise.all(targets.slice(0, 8).map((target: string): Promise<TargetData> => loadTarget(target, auth.token)))
  return { ok: true, items }
}

loadData().then((data: WidgetData): void => {
  const plan: WidgetLayoutPlan = resolveWidgetLayout(Widget.family, data.items?.length ?? 0, visual.widget, Widget.displaySize)
  Widget.present(
    <WidgetContent data={data} plan={plan} renderRunButton={(target: WidgetTarget, content: VirtualNode): VirtualNode => <Button intent={RunWorkflowIntent(JSON.stringify(target))} buttonStyle="plain">{content}</Button>} />,
    { reloadPolicy: { policy: 'after', date: new Date(Date.now() + 1000 * 60 * 10) } },
  )
})
