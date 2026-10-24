import { useAccentColor } from '../hooks/useAccentColor'
import type { Color } from 'scripting'
import { visual } from '../visual.config'
import { Button, HStack, VStack, Image, NavigationLink, Widget, useCallback, useRef, useState } from "scripting"
import { GlassList as List, GlassSection as Section } from "../components/GlassList"
import { MotionText as Text, MotionRow, animateChange, motion, motionTransition } from "../components/Motion"
import { AppBackground } from "../components/AppBackground"
import { glassListRow } from "../components/GlassSurface"
import { recordWidgetTrigger, errorMessage, runStatusIcon, formatShortTime, timeAgoText, RERUN_REFRESH_DELAY_MS, GitHubAPI, useLoadList } from "../services/AppModel"

import { RunDetailPage } from "./RunDetailPage"
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
    <List
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
      <Section header={<Text style={{ fontWeight: '600', color: visual.colors['label'] }}>{visual.text['最近运行 · ']}{runs.length}</Text>}>
        {runs.map(run => {
          const icon = runStatusIcon(run)
          return (
            <NavigationLink {...glassListRow} tint={accentColor} buttonStyle="plain"
              key={run.id}
              destination={<RunDetailPage api={api} owner={owner} repo={repo} run={run} />}
            >
              <MotionRow spacing={visual.spacing[8]} alignment="center">
                <VStack alignment="center" spacing={visual.spacing[0]} frame={{ width: visual.sizes[32], height: visual.sizes[32] }} clipShape={{ type: 'rect', cornerRadius: visual.radii[16], style: 'continuous' }}>
                  <Image systemName={icon.systemName} frame={{ width: visual.sizes[19], height: visual.sizes[19] }} foregroundStyle={icon.color} />
                </VStack>
                <VStack spacing={visual.spacing[5]} alignment="leading" frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
                  <HStack spacing={visual.spacing[8]} alignment="center">
                    <Text style={{ fontSize: visual.fontSizes[16], fontWeight: '700', color: visual.colors['label'] }}>#{run.run_number}</Text>
                    <Text lineLimit={visual.lineLimits[2]} style={{ fontSize: visual.fontSizes[13], color: visual.colors['label'] }}>{run.display_title || run.head_branch}</Text>
                  </HStack>
                  <HStack spacing={visual.spacing[7]}>
                    <Text style={{ fontSize: visual.fontSizes[12], color: visual.colors['secondaryLabel'] }}>{run.event}</Text>
                    <Text style={{ fontSize: visual.fontSizes[12], color: visual.colors['secondaryLabel'] }}>· {timeAgoText(run.updated_at) || formatShortTime(run.updated_at)}</Text>
                  </HStack>
                </VStack>
              </MotionRow>
            </NavigationLink>
          )
        })}
      </Section>
    </List>
  )
}
