import { AccentNavigationDestination } from '../components/AccentNavigationDestination'
import { useAccentColor } from '../hooks/useAccentColor'
import type { Color } from 'scripting'
import { visual } from '../visual.config'
import { Button, VStack, Image, NavigationLink, useCallback } from "scripting"
import { GlassList as List, GlassSection as Section } from "../components/GlassList"
import { MotionText as Text, MotionRow, motion, motionTransition } from "../components/Motion"
import { AppBackground } from "../components/AppBackground"
import { glassListRow } from "../components/GlassSurface"
import { GitHubAPI, useLoadList } from "../services/AppModel"

import { RunListPage } from "./RunListPage"

export function WorkflowListPage({
  api,
  owner,
  repo,
  defaultBranch,
}: {
  api: GitHubAPI
  owner: string
  repo: string
  defaultBranch: string
}) {
  const accentColor: Color = useAccentColor()
  const { data: workflows, loading, errorMsg, load } = useLoadList(
    useCallback((force: boolean = true) => api.getWorkflows(owner, repo, force), [api, owner, repo])
  )

  return (
    <List tint={accentColor}
      navigationBarTitleDisplayMode={visual.navigationTitleMode}
      background={<AppBackground />}
      transition={motionTransition}
      animation={{ animation: motion, value: `${loading}|${workflows.length}|${errorMsg}` }}
      navigationTitle={visual.text['工作流']}
      toolbar={{
        topBarTrailing: [
          <Button tint={accentColor} key="refresh" title={visual.text['刷新']} systemImage={visual.icons['arrow.clockwise']} action={load} disabled={loading} />,
        ],
      }}
    >
      {loading ? <Text {...glassListRow}>{visual.text['加载中...']}</Text> : null}
      {errorMsg ? <Text {...glassListRow} style={{ color: visual.colors['red'] }}>{errorMsg}</Text> : null}
      <Section header={<Text style={{ fontWeight: '600', color: visual.colors['label'] }}>{visual.text['工作流']} ({workflows.length})</Text>}>
        {workflows.map(wf => {
          return (
            <NavigationLink {...glassListRow} tint={accentColor} buttonStyle="plain"
              key={wf.id}
              destination={
                <AccentNavigationDestination><RunListPage tint={accentColor}
                  api={api}
                  owner={owner}
                  repo={repo}
                  workflowId={wf.id}
                  defaultBranch={defaultBranch}
                /></AccentNavigationDestination>
              }
            >
              <MotionRow spacing={visual.spacing[8]}>
                <VStack alignment="center" spacing={visual.spacing[0]} frame={{ width: visual.sizes[32], height: visual.sizes[32] }}>
                  <Image systemName={visual.icons['bolt.fill']} frame={{ width: visual.sizes[18], height: visual.sizes[18] }} foregroundStyle={accentColor} />
                </VStack>
                <VStack alignment="leading" spacing={visual.spacing[4]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
                  <Text lineLimit={visual.lineLimits[2]} style={{ fontSize: visual.fontSizes[16], fontWeight: '600', color: visual.colors['label'] }}>{wf.name}</Text>
                  <Text style={{ fontSize: visual.fontSizes[12], color: visual.colors['secondaryLabel'] }}>{wf.path}</Text>
                </VStack>
              </MotionRow>
            </NavigationLink>
          )
        })}
      </Section>
    </List>
  )
}
