import { AccentNavigationDestination } from '../components/AccentNavigationDestination'
import { useAccentColor } from '../hooks/useAccentColor'
import type { Color, VirtualNode } from 'scripting'
import { visual } from '../visual.config'
import { Button, Toggle, VStack, Image, NavigationLink, Widget, useState, useCallback } from "scripting"
import { GlassList as List, GlassSection as Section } from "../components/GlassList"
import { AppBackground } from "../components/AppBackground"
import { glassListRow } from "../components/GlassSurface"
import { animateChange, MotionText as Text, MotionRow, motion, motionTransition } from "../components/Motion"
import { getWidgetTargets, setWidgetTargets, Workflow, GitHubAPI, useLoadList } from "../services/AppModel"
import { useActionRepositories } from "../hooks/useActionRepositories"
import { useHost, notifyHost, refreshHostWidgets, type GitHubActionsHost } from "../integration/HostAdapter"

function readInitialTargets(): { targets: string[]; error: string } {
  try {
    return { targets: getWidgetTargets(), error: '' }
  } catch (error: unknown) {
    return { targets: [], error: error instanceof Error ? error.message : '读取小组件设置失败，请重试' }
  }
}

export function WidgetSetupPage({ api }: { api: GitHubAPI }): VirtualNode {
  return <WidgetRepoList api={api} />
}

function WidgetRepoList({ api }: { api: GitHubAPI }): VirtualNode {
  const accentColor: Color = useAccentColor()
  const host: GitHubActionsHost | undefined = useHost()
  const { data: repos, loading, errorMsg, noticeMsg, load } = useActionRepositories(api)
  const [initial] = useState<{ targets: string[]; error: string }>(readInitialTargets)
  const [targets, setTargets] = useState<string[]>(initial.targets)
  const [storageError, setStorageError] = useState<string>(initial.error)
  const [cleared, setCleared] = useState<boolean>(false)

  const clear = (): void => {
    try {
      setWidgetTargets([])
      setStorageError('')
    } catch (error: unknown) {
      animateChange((): void => {
        setStorageError(error instanceof Error ? error.message : '保存小组件设置失败，请重试')
        setCleared(false)
      })
      return
    }
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
    <List tint={accentColor}
      navigationBarTitleDisplayMode={visual.navigationTitleMode}
      background={<AppBackground />}
      onAppear={() => {
        const snapshot: { targets: string[]; error: string } = readInitialTargets()
        animateChange(() => {
          if (!snapshot.error) setTargets(snapshot.targets)
          setStorageError(snapshot.error)
        })
      }}
      animation={{ animation: motion, value: `${targets.join('|')}:${loading}:${repos.length}:${noticeMsg}` }}
      navigationTitle={visual.text['小组件设置']}
      toolbar={{
        topBarTrailing: <Button tint={accentColor} key="refresh" title={visual.text['刷新']} systemImage={visual.icons['arrow.clockwise']} action={load} disabled={loading} />,
      }}
    >
      <Section header={<Text>免参数，即选即用</Text>}>
        <Text {...glassListRow} foregroundStyle={visual.colors.secondaryLabel}>在仓库中点选工作流即可自动保存，小组件直接读取；跨仓库合计最多 8 个。</Text>
        <Text {...glassListRow} foregroundStyle={accentColor}>{`已选总数：${targets.length} / 8`}</Text>
      </Section>
      {storageError ? <Text {...glassListRow} foregroundStyle={visual.colors['red']}>{storageError}</Text> : null}
      {loading ? <Text {...glassListRow}>{visual.text['加载中...']}</Text> : null}
      {errorMsg ? <Text {...glassListRow} style={{ color: visual.colors['red'] }}>{errorMsg}</Text> : null}
      {!loading && noticeMsg ? <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors['secondaryLabel']}>{noticeMsg}</Text> : null}
      {cleared ? <Text {...glassListRow} style={{ color: visual.colors['secondaryLabel'] }}>已清除并保存；请重新点选工作流，小组件已请求刷新。</Text> : null}
      {!loading && !errorMsg && repos.length === 0 ? <Text {...glassListRow}>{visual.text['没有可读取的 GitHub Actions 工作流仓库']}</Text> : null}
      <Section header={<Text style={{ fontWeight: '600', color: visual.colors['label'] }}>{visual.text['有工作流的仓库']}</Text>}>
        {repos.map(r => {
          const count: number = countFor(r.owner.login, r.name)
          return (
            <NavigationLink {...glassListRow} tint={accentColor} buttonStyle="plain" key={r.id} destination={<AccentNavigationDestination><WidgetWorkflowList tint={accentColor} api={api} owner={r.owner.login} repo={r.name} onTargetsChanged={(next: string[]) => { setTargets(next); setCleared(false) }} /></AccentNavigationDestination>}>
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
              <Text style={{ fontSize: visual.fontSizes[12], color: visual.colors['secondaryLabel'] }}>清空全部已选工作流，小组件显示点选引导</Text>
            </VStack>
          </MotionRow>
        </Button>
      </Section>
    </List>
  )
}

function WidgetWorkflowList({ api, owner, repo, onTargetsChanged }: { api: GitHubAPI; owner: string; repo: string; onTargetsChanged: (targets: string[]) => void }): VirtualNode {
  const accentColor: Color = useAccentColor()
  const host: GitHubActionsHost | undefined = useHost()
  const { data: workflows, loading, errorMsg, load } = useLoadList(
    useCallback((force: boolean = true) => api.getWorkflows(owner, repo, force), [api, owner, repo])
  )
  const [initial] = useState<{ targets: string[]; error: string }>(readInitialTargets)
  const [targets, setTargets] = useState<string[]>(initial.targets)
  const [storageError, setStorageError] = useState<string>(initial.error)
  const [saved, setSaved] = useState<boolean>(false)
  const [cleared, setCleared] = useState<boolean>(false)
  const [limitAttempts, setLimitAttempts] = useState<number>(0)

  const select = (wf: Workflow, enabled: boolean): void => {
    try {
      const target: string = `${owner}/${repo}/${wf.id}`
      const current: string[] = getWidgetTargets()
      const selected: boolean = current.includes(target)
      if (selected === enabled) return
      if (enabled && current.length >= 8) {
        animateChange(() => {
          setTargets(current)
          setSaved(false)
          setCleared(false)
          setLimitAttempts((attempts: number): number => attempts + 1)
        })
        return
      }
      const next: string[] = enabled
        ? [...current, target]
        : current.filter((t: string) => t !== target)
      setWidgetTargets(next)
      setStorageError('')
      notifyHost(host, { type: 'widgetTargetsChanged', targets: [...next] })
      onTargetsChanged(next)
      animateChange(() => {
        setTargets(next)
        setLimitAttempts(0)
        setSaved(true)
        setCleared(false)
      })
      refreshHostWidgets(host, () => Widget.reloadAll())
    } catch (error: unknown) {
      animateChange((): void => {
        setStorageError(error instanceof Error ? error.message : '保存小组件设置失败，请重试')
        setSaved(false)
        setCleared(false)
      })
    }
  }

  const clear = (): void => {
    try {
      setWidgetTargets([])
      setStorageError('')
    } catch (error: unknown) {
      animateChange((): void => {
        setStorageError(error instanceof Error ? error.message : '保存小组件设置失败，请重试')
        setCleared(false)
      })
      return
    }
    notifyHost(host, { type: 'widgetTargetsChanged', targets: [] })
    onTargetsChanged([])
    animateChange(() => {
      setTargets([])
      setLimitAttempts(0)
      setSaved(false)
      setCleared(true)
    })
    refreshHostWidgets(host, () => Widget.reloadAll())
  }

  return (
    <List tint={accentColor}
      navigationBarTitleDisplayMode={visual.navigationTitleMode}
      background={<AppBackground />}
      onAppear={() => {
        const snapshot: { targets: string[]; error: string } = readInitialTargets()
        animateChange(() => {
          if (!snapshot.error) setTargets(snapshot.targets)
          setStorageError(snapshot.error)
        })
      }}
      animation={{ animation: motion, value: `${targets.join('|')}:${limitAttempts}:${saved}:${cleared}` }}
      navigationTitle={repo}
      toolbar={{
        topBarTrailing: <Button tint={accentColor} key="refresh" title={visual.text['刷新']} systemImage={visual.icons['arrow.clockwise']} action={load} disabled={loading} />,
      }}
    >
      <Section header={<Text>免参数，即选即用</Text>}>
        <Text {...glassListRow} foregroundStyle={visual.colors.secondaryLabel}>在仓库中点选工作流即可自动保存，小组件直接读取；跨仓库合计最多 8 个。</Text>
        <Text {...glassListRow} foregroundStyle={accentColor}>{`已选总数：${targets.length} / 8`}</Text>
      </Section>
      {storageError ? <Text {...glassListRow} foregroundStyle={visual.colors['red']}>{storageError}</Text> : null}
      {loading ? <Text {...glassListRow}>{visual.text['加载中...']}</Text> : null}
      {errorMsg ? <Text {...glassListRow} style={{ color: visual.colors['red'] }}>{errorMsg}</Text> : null}
      {limitAttempts > 0 ? <Text key={`limit-${limitAttempts}`} {...glassListRow} foregroundStyle={visual.colors['#ff3b30']}>最多选择 8 个工作流，请先取消一个再添加。</Text> : null}
      {saved ? <Text {...glassListRow} style={{ color: visual.colors['#34c759'] }}>{`已自动保存，共 ${targets.length} 个工作流；小组件已请求刷新。`}</Text> : null}
      {cleared ? <Text {...glassListRow} style={{ color: visual.colors['secondaryLabel'] }}>已清除并保存；请重新点选工作流，小组件已请求刷新。</Text> : null}
      <Section header={<Text style={{ fontWeight: '600', color: visual.colors['label'] }}>{visual.text['选择显示在小组件的工作流（可多选）']}</Text>}>
        {workflows.map(wf => {
          const target: string = `${owner}/${repo}/${wf.id}`
          const isSelected: boolean = targets.includes(target)
          return (
            <Toggle {...glassListRow} tint={accentColor} toggleStyle="switch" key={wf.id} value={isSelected} onChanged={(enabled: boolean) => select(wf, enabled)}>
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
            </Toggle>
          )
        })}
        <Button {...glassListRow} buttonStyle="plain" action={clear}>
          <MotionRow spacing={visual.spacing[8]}>
            <VStack alignment="center" spacing={visual.spacing[0]} frame={{ width: visual.sizes[32], height: visual.sizes[32] }}>
              <Image systemName={visual.icons['trash']} frame={{ width: visual.sizes[18], height: visual.sizes[18] }} foregroundStyle={visual.colors['#ff3b30']} />
            </VStack>
            <VStack alignment="leading" spacing={visual.spacing[4]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
              <Text style={{ fontSize: visual.fontSizes[16], fontWeight: '600', color: visual.colors['#ff3b30'] }}>{visual.text['清除设置']}</Text>
              <Text style={{ fontSize: visual.fontSizes[12], color: visual.colors['secondaryLabel'] }}>清空全部已选工作流，小组件显示点选引导</Text>
            </VStack>
          </MotionRow>
        </Button>
      </Section>
    </List>
  )
}
