import { RunRecordList } from '../components/RunRecordList'
import { useAccentColor } from '../hooks/useAccentColor'
import type { Color } from 'scripting'
import { visual } from '../visual.config'
import { Button, Widget, useCallback, useMemo, useRef, useState } from "scripting"
import { GlassList as List, GlassSection as Section } from "../components/GlassList"
import { MotionText as Text, MotionRow, animateChange, motion, motionTransition } from "../components/Motion"
import { AppBackground } from "../components/AppBackground"
import { glassListRow } from "../components/GlassSurface"
import { recordWidgetTrigger, errorMessage, RERUN_REFRESH_DELAY_MS, GitHubAPI, useLoadList } from "../services/AppModel"

import { getActionPreferences, filterActionRuns, type ActionPreferences } from '../services/actionPreferences'
import { useHost, notifyHost, refreshHostWidgets, type GitHubActionsHost } from "../integration/HostAdapter"

export function RunListPage({
  api,
  owner,
  repo,
  workflowId,
  defaultBranch,
}: {
  api: GitHubAPI
  owner: string
  repo: string
  workflowId: number
  defaultBranch: string
}) {
  const accentColor: Color = useAccentColor()
  const host: GitHubActionsHost | undefined = useHost()
  const { data: runs, loading, errorMsg, setErrorMsg, load } = useLoadList(
    useCallback(() => api.getWorkflowRuns(owner, repo, workflowId), [api, owner, repo, workflowId])
  )

  const [preferences, setPreferences] = useState<ActionPreferences>(() => getActionPreferences())
  const [showAll, setShowAll] = useState<boolean>(false)
  const visibleRuns: typeof runs = useMemo(() => showAll ? runs : filterActionRuns(runs, preferences, defaultBranch), [runs, showAll, preferences, defaultBranch])
  const dispatching = useRef<boolean>(false)
  const [running, setRunning] = useState<boolean>(false)
  const handleRun = useCallback(async () => {
    if (dispatching.current) return
    dispatching.current = true
    animateChange(() => setRunning(true))
    try {
      await api.dispatchWorkflow(owner, repo, workflowId, defaultBranch, {})
      notifyHost(host, { type: 'workflowTriggered', owner, repo, workflowId })
      recordWidgetTrigger(owner, repo, workflowId)
      animateChange(() => setErrorMsg('✅ 已触发运行'))
      setTimeout(load, RERUN_REFRESH_DELAY_MS)
      refreshHostWidgets(host, () => Widget.reloadAll())
    } catch (err: any) {
      animateChange(() => setErrorMsg(`❌ 触发失败: ${errorMessage(err, '未知错误')}`))
    } finally {
      dispatching.current = false
      animateChange(() => setRunning(false))
    }
  }, [api, owner, repo, workflowId, defaultBranch, load, setErrorMsg, host])

  return (
    <List tint={accentColor}
      onAppear={() => {
        const next: ActionPreferences = getActionPreferences()
        setPreferences((previous: ActionPreferences): ActionPreferences => previous.runFilter === next.runFilter && previous.branchScope === next.branchScope && previous.widgetOrder === next.widgetOrder ? previous : next)
      }}
      navigationBarTitleDisplayMode={visual.navigationTitleMode}
      background={<AppBackground />}
      transition={motionTransition}
      animation={{ animation: motion, value: `${loading}|${runs.length}|${errorMsg}` }}
      navigationTitle={visual.text['运行记录']}
      toolbar={{
        topBarTrailing: [
          <Button tint={accentColor} key="run" title={running ? visual.text['提交中'] : visual.text['运行']} systemImage={running ? visual.icons['hourglass'] : visual.icons['play.fill']} action={handleRun} disabled={running} />,
          <Button tint={accentColor} key="refresh" title={visual.text['刷新']} systemImage={visual.icons['arrow.clockwise']} action={load} disabled={loading} />,
        ],
      }}
    >
      {loading ? <Text {...glassListRow}>{visual.text['加载中...']}</Text> : null}
      {errorMsg ? <Text {...glassListRow} style={{ color: visual.colors['red'] }}>{errorMsg}</Text> : null}
      <Button buttonStyle="plain" tint={accentColor} action={() => animateChange(() => setShowAll(!showAll))}><MotionRow><Text>{showAll ? '全部记录 · 点击恢复关注策略' : '当前关注策略 · 点击查看全部'}</Text></MotionRow></Button>
      {!loading && visibleRuns.length === 0 ? <Text foregroundStyle={visual.colors.secondaryLabel}>最近加载的记录没有符合条件的运行，可切换查看全部。</Text> : null}
      <Section header={<Text style={{ fontWeight: '600', color: visual.colors['label'] }}>{visual.text['最近运行 · ']}{visibleRuns.length} / {runs.length}</Text>}>
        <RunRecordList runs={visibleRuns} api={api} owner={owner} repo={repo} accentColor={accentColor} />
      </Section>
    </List>
  )
}
