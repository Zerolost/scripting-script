import { useAccentColor } from '../hooks/useAccentColor'
import type { Color } from 'scripting'
import { visual } from '../visual.config'
import { Button, VStack, Image, NavigationLink, Widget, useState, useCallback } from "scripting"
import { GlassList as List, GlassSection as Section } from "../components/GlassList"
import { AppBackground } from "../components/AppBackground"
import { glassListRow } from "../components/GlassSurface"
import { animateChange, MotionText as Text, MotionRow, motion, motionTransition } from "../components/Motion"
import { getWidgetTargets, setWidgetTargets, Workflow, GitHubAPI, useLoadList } from "../services/AppModel"
import { useActionRepositories } from "../hooks/useActionRepositories"
import { useHost, notifyHost, refreshHostWidgets, type GitHubActionsHost } from "../integration/HostAdapter"

export function WidgetSetupPage({ api }: { api: GitHubAPI }) {
  return <WidgetRepoList api={api} />
}

function WidgetRepoList({ api }: { api: GitHubAPI }) {
  const accentColor: Color = useAccentColor()
  const host: GitHubActionsHost | undefined = useHost()
  const { data: repos, loading, errorMsg, noticeMsg, load } = useActionRepositories(api)
  const [targets, setTargets] = useState<string[]>(() => getWidgetTargets())
  const [cleared, setCleared] = useState<boolean>(false)

  const clear = (): void => {
    setWidgetTargets([])
    notifyHost(host, { type: 'widgetTargetsChanged', targets: [] })
    animateChange(() => {
      setTargets([])
      setCleared(true)
    })
    refreshHostWidgets(host, () => Widget.reloadAll())
  }

  const countFor = (owner: string, repo: string): number =>
    targets.filter((t: string) => t.split('/').filter(Boolean)[0] === owner && t.split('/').filter(Boolean)[1] === repo).length

  return (
    <List
      navigationBarTitleDisplayMode={visual.navigationTitleMode}
      background={<AppBackground />}
      animation={{ animation: motion, value: `${targets.join('|')}:${loading}:${repos.length}:${noticeMsg}` }}
      navigationTitle={visual.text['小组件设置']}
      toolbar={{
        topBarTrailing: <Button tint={accentColor} key="refresh" title={visual.text['刷新']} systemImage={visual.icons['arrow.clockwise']} action={load} disabled={loading} />,
      }}
    >
      {loading ? <Text {...glassListRow}>{visual.text['加载中...']}</Text> : null}
      {errorMsg ? <Text {...glassListRow} style={{ color: visual.colors['red'] }}>{errorMsg}</Text> : null}
      {!loading && noticeMsg ? <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors['secondaryLabel']}>{noticeMsg}</Text> : null}
      {cleared ? <Text {...glassListRow} style={{ color: visual.colors['secondaryLabel'] }}>{visual.text['已清除，桌面小组件显示未指定状态']}</Text> : null}
      {!loading && !errorMsg && repos.length === 0 ? <Text {...glassListRow}>{visual.text['没有可读取的 GitHub Actions 工作流仓库']}</Text> : null}
      <Section header={<Text style={{ fontWeight: '600', color: visual.colors['label'] }}>{visual.text['有工作流的仓库']}</Text>}>
        {repos.map(r => {
          const count: number = countFor(r.owner.login, r.name)
          return (
            <NavigationLink {...glassListRow} tint={accentColor} buttonStyle="plain" key={r.id} destination={<WidgetWorkflowList api={api} owner={r.owner.login} repo={r.name} onTargetsChanged={(next: string[]) => { setTargets(next); setCleared(false) }} />}>
              <MotionRow spacing={visual.spacing[8]}>
                <VStack alignment="center" spacing={visual.spacing[0]} frame={{ width: visual.sizes[32], height: visual.sizes[32] }}>
                  <Image systemName={r.private ? visual.icons['lock.fill'] : visual.icons['globe.americas.fill']} frame={{ width: visual.sizes[18], height: visual.sizes[18] }} foregroundStyle={r.private ? visual.colors['#b54708'] : accentColor} />
                </VStack>
                <VStack alignment="leading" spacing={visual.spacing[4]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
                  <Text lineLimit={visual.lineLimits[2]} style={{ fontSize: visual.fontSizes[16], fontWeight: '600', color: visual.colors['label'] }}>{r.full_name}</Text>
                  <Text style={{ fontSize: visual.fontSizes[12], color: count > 0 ? accentColor : visual.colors['#8e8e93'] }}>
                    {count > 0 ? `${visual.text['已选 ']}${count}${visual.text[' 个工作流']}` : visual.text['默认分支: '] + r.default_branch}
                  </Text>
                </VStack>
                {count > 0 ? (
                  <Image transition={motionTransition} systemName={visual.icons['checkmark.circle.fill']} frame={{ width: visual.sizes[20], height: visual.sizes[20] }} foregroundStyle={accentColor} />
                ) : null}
              </MotionRow>
            </NavigationLink>
          )
        })}
        <Button {...glassListRow} buttonStyle="plain" action={clear}>
          <MotionRow spacing={visual.spacing[8]}>
            <VStack alignment="center" spacing={visual.spacing[0]} frame={{ width: visual.sizes[32], height: visual.sizes[32] }}>
              <Image systemName={visual.icons['trash']} frame={{ width: visual.sizes[18], height: visual.sizes[18] }} foregroundStyle={visual.colors['#ff3b30']} />
            </VStack>
            <VStack alignment="leading" spacing={visual.spacing[4]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
              <Text style={{ fontSize: visual.fontSizes[16], fontWeight: '600', color: visual.colors['#ff3b30'] }}>{visual.text['清除设置']}</Text>
              <Text style={{ fontSize: visual.fontSizes[12], color: visual.colors['secondaryLabel'] }}>{visual.text['不指定工作流，小组件显示默认状态']}</Text>
            </VStack>
          </MotionRow>
        </Button>
      </Section>
    </List>
  )
}

function WidgetWorkflowList({ api, owner, repo, onTargetsChanged }: { api: GitHubAPI; owner: string; repo: string; onTargetsChanged: (targets: string[]) => void }) {
  const accentColor: Color = useAccentColor()
  const host: GitHubActionsHost | undefined = useHost()
  const { data: workflows, loading, errorMsg, load } = useLoadList(
    useCallback((force: boolean = true) => api.getWorkflows(owner, repo, force), [api, owner, repo])
  )
  const [targets, setTargets] = useState<string[]>(() => getWidgetTargets())
  const [saved, setSaved] = useState<boolean>(false)
  const [cleared, setCleared] = useState<boolean>(false)

  const toggle = (wf: Workflow): void => {
    const target: string = `${owner}/${repo}/${wf.id}`
    const next: string[] = targets.includes(target)
      ? targets.filter((t: string) => t !== target)
      : [...targets, target]
    setWidgetTargets(next)
    notifyHost(host, { type: 'widgetTargetsChanged', targets: [...next] })
    onTargetsChanged(next)
    animateChange(() => {
      setTargets(next)
      setSaved(true)
      setCleared(false)
    })
    refreshHostWidgets(host, () => Widget.reloadAll())
  }

  const clear = (): void => {
    setWidgetTargets([])
    notifyHost(host, { type: 'widgetTargetsChanged', targets: [] })
    onTargetsChanged([])
    animateChange(() => {
      setTargets([])
      setSaved(false)
      setCleared(true)
    })
    refreshHostWidgets(host, () => Widget.reloadAll())
  }

  return (
    <List
      navigationBarTitleDisplayMode={visual.navigationTitleMode}
      background={<AppBackground />}
      animation={{ animation: motion, value: targets.join('|') }}
      navigationTitle={repo}
      toolbar={{
        topBarTrailing: <Button tint={accentColor} key="refresh" title={visual.text['刷新']} systemImage={visual.icons['arrow.clockwise']} action={load} disabled={loading} />,
      }}
    >
      {loading ? <Text {...glassListRow}>{visual.text['加载中...']}</Text> : null}
      {errorMsg ? <Text {...glassListRow} style={{ color: visual.colors['red'] }}>{errorMsg}</Text> : null}
      {saved ? <Text {...glassListRow} style={{ color: visual.colors['#34c759'] }}>{visual.text['已更新：小组件将显示 ']}{targets.length}{visual.text[' 个工作流']}</Text> : null}
      {cleared ? <Text {...glassListRow} style={{ color: visual.colors['secondaryLabel'] }}>{visual.text['已清除，桌面小组件显示未指定状态']}</Text> : null}
      <Section header={<Text style={{ fontWeight: '600', color: visual.colors['label'] }}>{visual.text['选择显示在小组件的工作流（可多选）']}</Text>}>
        {workflows.map(wf => {
          const target: string = `${owner}/${repo}/${wf.id}`
          const isSelected: boolean = targets.includes(target)
          return (
            <Button {...glassListRow} tint={accentColor} buttonStyle="plain" key={wf.id} action={() => toggle(wf)}>
              <MotionRow spacing={visual.spacing[8]}>
                <VStack alignment="center" spacing={visual.spacing[0]} frame={{ width: visual.sizes[32], height: visual.sizes[32] }}>
                  <Image systemName={visual.icons['bolt.fill']} frame={{ width: visual.sizes[18], height: visual.sizes[18] }} foregroundStyle={accentColor} />
                </VStack>
                <VStack alignment="leading" spacing={visual.spacing[4]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
                  <Text lineLimit={visual.lineLimits[2]} style={{ fontSize: visual.fontSizes[16], fontWeight: '600', color: isSelected ? accentColor : visual.colors['label'] }}>{wf.name}</Text>
                  <Text style={{ fontSize: visual.fontSizes[12], color: visual.colors['secondaryLabel'] }}>{wf.path}</Text>
                </VStack>
                {isSelected ? (
                  <Image transition={motionTransition} contentTransition="symbolEffect" systemName={visual.icons['checkmark.circle.fill']} frame={{ width: visual.sizes[22], height: visual.sizes[22] }} foregroundStyle={accentColor} />
                ) : null}
              </MotionRow>
            </Button>
          )
        })}
        <Button {...glassListRow} buttonStyle="plain" action={clear}>
          <MotionRow spacing={visual.spacing[8]}>
            <VStack alignment="center" spacing={visual.spacing[0]} frame={{ width: visual.sizes[32], height: visual.sizes[32] }}>
              <Image systemName={visual.icons['trash']} frame={{ width: visual.sizes[18], height: visual.sizes[18] }} foregroundStyle={visual.colors['#ff3b30']} />
            </VStack>
            <VStack alignment="leading" spacing={visual.spacing[4]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
              <Text style={{ fontSize: visual.fontSizes[16], fontWeight: '600', color: visual.colors['#ff3b30'] }}>{visual.text['清除设置']}</Text>
              <Text style={{ fontSize: visual.fontSizes[12], color: visual.colors['secondaryLabel'] }}>{visual.text['不指定工作流，小组件显示默认状态']}</Text>
            </VStack>
          </MotionRow>
        </Button>
      </Section>
    </List>
  )
}
